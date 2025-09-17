import { NextRequest, NextResponse } from 'next/server';

export interface OsuUser {
    id: number;
    username: string;
    avatar_url: string;
    country_code: string;
    cover?: {
        custom_url: string | null;
        url: string;
        id: string | null;
    };
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

async function getUserDataFromAPI(username: string): Promise<OsuUser | null> {
    console.log('getUserDataFromAPI called for:', username);
    const apiKey = process.env.OSU_CLIENT_SECRET;
    console.log('API Key in function:', apiKey ? 'EXISTS' : 'NOT_FOUND');

    if (!apiKey) {
        console.log('No API key, returning null');
        return null;
    }

    console.log('Making API request to osu!');

    try {
        const response = await fetchWithTimeout(`https://osu.ppy.sh/api/v2/users/${username}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        // 添加调试日志
        console.log('API Response Keys:', Object.keys(data));
        console.log('Cover field exists:', 'cover' in data);
        console.log('Cover field value:', data.cover);
        console.log('Cover_url field exists:', 'cover_url' in data);
        console.log('Cover_url field value:', data.cover_url);

        return {
            id: data.id,
            username: data.username,
            avatar_url: data.avatar_url,
            country_code: data.country_code,
            cover: data.cover ? {
                custom_url: data.cover.custom_url || null,
                url: data.cover.url || '',
                id: data.cover.id || null,
            } : undefined,
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
        console.error('Error fetching from osu! API:', error);
        return null;
    }
}

async function getUserDataFromPublic(username: string): Promise<OsuUser | null> {
    try {
        const searchResponse = await fetchWithTimeout(`https://osu.ppy.sh/users/${username}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            redirect: 'follow' // 跟随重定向
        });

        if (!searchResponse.ok) {
            // console.log(`Public method failed with status: ${searchResponse.status}`);
            return null;
        }

        const finalUrl = searchResponse.url;
        // console.log(`Public method final URL: ${finalUrl}`);

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
                    cover: userData.cover ? {
                        custom_url: userData.cover.custom_url || null,
                        url: userData.cover.url || '',
                        id: userData.cover.id || null,
                    } : undefined,
                    statistics: userData.statistics || {
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
            } catch (parseError) {
                console.error('Error parsing user data:', parseError);
            }
        }

        // 如果无法解析JSON，尝试从URL中提取用户ID
        const userIdMatch = finalUrl.match(/\/users\/(\d+)/);
        if (userIdMatch && userIdMatch[1]) {
            // console.log(`Found user ID from URL: ${userIdMatch[1]}`);
            // 返回基本用户信息
            return {
                id: parseInt(userIdMatch[1]),
                username: username,
                avatar_url: '',
                country_code: '',
                cover: undefined,
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

        return null;
    } catch (error) {
        console.error('Error fetching public osu! user data:', error);
        return null;
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
        return NextResponse.json(
            { error: '用户名不能为空' },
            { status: 400 }
        );
    }

    // console.log(`Fetching osu! user data for: ${username}`);

    try {
        // 检查环境变量
        console.log('OSU_CLIENT_SECRET exists:', !!process.env.OSU_CLIENT_SECRET);

        // 首先尝试使用官方API
        console.log('Trying official API...');
        let userData = await getUserDataFromAPI(username);
        console.log('Official API result:', userData ? 'Success' : 'Failed');

        // 如果官方API失败，尝试公开方法
        if (!userData) {
            console.log('Trying public method...');
            userData = await getUserDataFromPublic(username);
            console.log('Public method result:', userData ? 'Success' : 'Failed');
        }

        if (userData) {
            // console.log(`Successfully fetched data for ${username}`);
            return NextResponse.json(userData);
        } else {
            // console.log(`Failed to fetch data for ${username} using both methods`);
            return NextResponse.json(
                { error: '无法获取玩家数据，请检查用户名是否正确' },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error('Error in osu-user API:', error);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
}
