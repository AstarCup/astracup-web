export interface OsuUser {
    id: number;
    username: string;
    avatar_url: string;
    country_code: string;
    statistics: {
        pp: number;
        global_rank: number | null;
        country_rank: number | null;
        country: string;
        ranked_score: number;
        hit_accuracy: number;
        play_count: number;
        play_time: number;
        level: {
            current: number;
            progress: number;
        };
        grade_counts: {
            ss: number;
            ssh: number;
            s: number;
            sh: number;
            a: number;
        };
    };
}

// 带超时和错误处理的fetch包装器
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

export async function getUserData(username: string): Promise<OsuUser | null> {
    try {
        // 检查是否有API密钥
        const apiKey = process.env.OSU_API_KEY;
        if (!apiKey) {
            // console.log('No OSU_API_KEY found, using public method');
            return getUserDataPublic(username);
        }

        const response = await fetchWithTimeout(`https://osu.ppy.sh/api/v2/users/${username}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('玩家不存在');
            }
            if (response.status === 401) {
                // console.log('API密钥无效，使用公开方法');
                return getUserDataPublic(username);
            }
            throw new Error(`获取玩家数据失败 (状态码: ${response.status})`);
        }

        const data = await response.json();

        return {
            id: data.id,
            username: data.username,
            avatar_url: data.avatar_url,
            country_code: data.country_code,
            statistics: {
                pp: data.statistics?.pp || 0,
                global_rank: data.statistics?.global_rank || null,
                country_rank: data.statistics?.country_rank || null,
                country: data.country_code || '',
                ranked_score: data.statistics?.ranked_score || 0,
                hit_accuracy: data.statistics?.hit_accuracy || 0,
                play_count: data.statistics?.play_count || 0,
                play_time: data.statistics?.play_time || 0,
                level: {
                    current: data.statistics?.level?.current || 0,
                    progress: data.statistics?.level?.progress || 0,
                },
                grade_counts: {
                    ss: data.statistics?.grade_counts?.ss || 0,
                    ssh: data.statistics?.grade_counts?.ssh || 0,
                    s: data.statistics?.grade_counts?.s || 0,
                    sh: data.statistics?.grade_counts?.sh || 0,
                    a: data.statistics?.grade_counts?.a || 0,
                },
            },
        };
    } catch (error) {
        console.error('Error fetching osu! user data:', error);

        // 如果是网络错误，尝试使用公开方法
        if (error instanceof Error && (
            error.name === 'AbortError' ||
            error.message.includes('NetworkError') ||
            error.message.includes('Failed to fetch')
        )) {
            // console.log('网络错误，尝试使用公开方法');
            return getUserDataPublic(username);
        }

        throw error;
    }
}

// 备用方案：使用公开API（不需要API密钥）
export async function getUserDataPublic(username: string): Promise<OsuUser | null> {
    try {
        // 使用代理或直接访问，避免CORS问题
        const searchResponse = await fetchWithTimeout(`https://osu.ppy.sh/users/${username}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!searchResponse.ok) {
            if (searchResponse.status === 404) {
                throw new Error('玩家不存在');
            }
            throw new Error(`无法访问玩家页面 (状态码: ${searchResponse.status})`);
        }

        const html = await searchResponse.text();

        // 尝试从页面中提取JSON数据
        const jsonMatch = html.match(/<script id="json-user" type="application\/json">(.+?)<\/script>/);

        if (jsonMatch && jsonMatch[1]) {
            try {
                const userData = JSON.parse(jsonMatch[1]);

                return {
                    id: userData.id,
                    username: userData.username,
                    avatar_url: userData.avatar_url,
                    country_code: userData.country_code,
                    statistics: userData.statistics || {
                        pp: 0,
                        global_rank: null,
                        country_rank: null,
                        country: userData.country_code || '',
                        ranked_score: 0,
                        hit_accuracy: 0,
                        play_count: 0,
                        play_time: 0,
                        level: { current: 0, progress: 0 },
                        grade_counts: { ss: 0, ssh: 0, s: 0, sh: 0, a: 0 },
                    },
                };
            } catch (parseError) {
                console.error('Error parsing user data:', parseError);
                throw new Error('解析玩家数据失败');
            }
        }

        // 如果无法解析JSON，尝试从HTML中提取基本信息
        const usernameMatch = html.match(/<title>(.+?)<\/title>/);
        if (usernameMatch && usernameMatch[1].includes(username)) {
            // 返回基本用户信息（没有详细统计数据）
            return {
                id: 0, // 未知ID
                username: username,
                avatar_url: '',
                country_code: '',
                statistics: {
                    pp: 0,
                    global_rank: null,
                    country_rank: null,
                    country: '',
                    ranked_score: 0,
                    hit_accuracy: 0,
                    play_count: 0,
                    play_time: 0,
                    level: { current: 0, progress: 0 },
                    grade_counts: { ss: 0, ssh: 0, s: 0, sh: 0, a: 0 },
                },
            };
        }

        throw new Error('无法获取玩家数据');
    } catch (error) {
        console.error('Error fetching public osu! user data:', error);

        // 如果是网络错误，提供更友好的错误信息
        if (error instanceof Error && (
            error.name === 'AbortError' ||
            error.message.includes('NetworkError') ||
            error.message.includes('Failed to fetch')
        )) {
            throw new Error('网络连接失败，请检查网络连接后重试');
        }

        throw error;
    }
}
