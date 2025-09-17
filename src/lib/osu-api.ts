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

export async function getUserData(username: string): Promise<OsuUser | null> {
    try {
        // 检查是否有API密钥
        const apiKey = process.env.OSU_CLIENT_SECRET;
        if (!apiKey) {
            // console.log('No OSU_CLIENT_SECRET found, using public method');
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

// osu! Match 相关类型定义
export interface MatchScore {
    slot: number;
    team: number;
    user_id: number;
    username?: string;
    score: number;
    accuracy: number;
    max_combo: number;
    perfect: boolean;
    statistics: {
        count_50: number;
        count_100: number;
        count_300: number;
        count_miss: number;
    };
    pass: boolean;
    mods: string[];
}

export interface MatchBeatmap {
    id: number;
    beatmapset_id: number;
    difficulty_name: string;
    version: string;
    title: string;
    artist: string;
    creator: string;
    star_rating: number;
    bpm: number;
    total_length: number;
    url: string;
}

export interface MatchGame {
    id: number;
    start_time: string;
    end_time: string;
    mode: string;
    scoring_type: string;
    team_type: string;
    mods: string[];
    beatmap: MatchBeatmap;
    scores: MatchScore[];
}

export interface MatchUser {
    id: number;
    username: string;
    avatar_url: string;
    country_code: string;
}

export interface MatchData {
    match: {
        id: number;
        name: string;
        start_time: string;
        end_time: string | null;
    };
    events: any[];
    users: MatchUser[];
    first_event_id: number;
    latest_event_id: number;
    current_game_id: number | null;
    games: MatchGame[];
}

// 获取比赛数据的函数（不需要认证，使用公开方法）
export async function getMatchDataPublic(matchId: string): Promise<MatchData | null> {
    try {
        // 尝试通过代理或直接访问获取比赛数据
        const matchUrl = `https://osu.ppy.sh/community/matches/${matchId}`;
        const response = await fetchWithTimeout(matchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('比赛不存在');
            }
            throw new Error(`无法访问比赛页面 (状态码: ${response.status})`);
        }

        const html = await response.text();

        // 尝试从页面中提取JSON数据
        const jsonMatch = html.match(/<script id="json-match" type="application\/json">(.+?)<\/script>/);

        if (jsonMatch && jsonMatch[1]) {
            try {
                const matchData = JSON.parse(jsonMatch[1]);

                // 标准化数据结构
                return {
                    match: {
                        id: matchData.match?.id || parseInt(matchId),
                        name: matchData.match?.name || '',
                        start_time: matchData.match?.start_time || new Date().toISOString(),
                        end_time: matchData.match?.end_time || null,
                    },
                    events: matchData.events || [],
                    users: matchData.users || [],
                    first_event_id: matchData.first_event_id || 0,
                    latest_event_id: matchData.latest_event_id || 0,
                    current_game_id: matchData.current_game_id || null,
                    games: (matchData.games || []).map((game: any) => ({
                        id: game.id,
                        start_time: game.start_time,
                        end_time: game.end_time,
                        mode: game.mode || 'osu',
                        scoring_type: game.scoring_type || 'score',
                        team_type: game.team_type || 'head-to-head',
                        mods: game.mods || [],
                        beatmap: {
                            id: game.beatmap?.id || 0,
                            beatmapset_id: game.beatmap?.beatmapset_id || 0,
                            difficulty_name: game.beatmap?.difficulty_name || game.beatmap?.version || '',
                            version: game.beatmap?.version || '',
                            title: game.beatmap?.title || '',
                            artist: game.beatmap?.artist || '',
                            creator: game.beatmap?.creator || '',
                            star_rating: game.beatmap?.star_rating || 0,
                            bpm: game.beatmap?.bpm || 0,
                            total_length: game.beatmap?.total_length || 0,
                            url: game.beatmap?.url || `https://osu.ppy.sh/b/${game.beatmap?.id}`,
                        },
                        scores: (game.scores || []).map((score: any) => ({
                            slot: score.slot || 0,
                            team: score.team || 0,
                            user_id: score.user_id,
                            score: score.score || 0,
                            accuracy: score.accuracy || 0,
                            max_combo: score.max_combo || 0,
                            perfect: score.perfect || false,
                            statistics: {
                                count_50: score.statistics?.count_50 || 0,
                                count_100: score.statistics?.count_100 || 0,
                                count_300: score.statistics?.count_300 || 0,
                                count_miss: score.statistics?.count_miss || 0,
                            },
                            pass: score.pass !== false, // 默认为通过，除非明确标记为失败
                            mods: score.mods || [],
                        })),
                    })),
                };
            } catch (parseError) {
                console.error('解析比赛数据失败:', parseError);
                throw new Error('解析比赛数据失败');
            }
        }

        throw new Error('无法获取比赛数据');
    } catch (error) {
        console.error('获取比赛数据失败:', error);

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

// 图池数据类型定义
export interface MapPoolItem {
    mod: string;
    index: number;
    beatmapId: number;
    title: string;
    artist: string;
    difficulty: string;
    mapper: string;
    sr: number;
    bpm: number;
    length: string;
}

export interface MapPool {
    [category: string]: MapPoolItem[];
}

// 获取图池数据的函数
export async function getMapPoolData(season: string = 's1'): Promise<MapPool> {
    try {
        const response = await fetch(`/api/mappool?season=${season}`);
        if (!response.ok) {
            throw new Error(`获取图池数据失败: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('获取图池数据失败:', error);
        throw error;
    }
}

// Beatmap 信息类型定义
export interface BeatmapInfo {
    id: number;
    beatmapset_id: number;
    title: string;
    artist: string;
    version: string;
    creator: string;
    star_rating: number;
    bpm: number;
    total_length: number;
    url: string;
    cover_url: string;
}

// 从URL解析beatmap ID和beatmapset ID
export function parseBeatmapUrl(url: string): { beatmapId?: number; beatmapsetId?: number } {
    const patterns = [
        /osu\.ppy\.sh\/b\/(\d+)/,              // /b/{beatmap_id}
        /osu\.ppy\.sh\/beatmaps\/(\d+)/,       // /beatmaps/{beatmap_id}
        /osu\.ppy\.sh\/s\/(\d+)/,              // /s/{beatmapset_id}
        /osu\.ppy\.sh\/beatmapsets\/(\d+)/,    // /beatmapsets/{beatmapset_id}
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            const id = parseInt(match[1]);
            if (url.includes('/b/') || url.includes('/beatmaps/')) {
                return { beatmapId: id };
            } else {
                return { beatmapsetId: id };
            }
        }
    }

    return {};
}

// 获取单个beatmap信息
export async function getBeatmapInfo(beatmapId: number): Promise<BeatmapInfo | null> {
    try {
        const response = await fetchWithTimeout(`https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Beatmap不存在');
            }
            throw new Error(`获取Beatmap信息失败 (状态码: ${response.status})`);
        }

        const data = await response.json();

        return {
            id: data.id,
            beatmapset_id: data.beatmapset_id,
            title: data.beatmapset?.title || '',
            artist: data.beatmapset?.artist || '',
            version: data.version || '',
            creator: data.beatmapset?.creator || '',
            star_rating: data.difficulty_rating || 0,
            bpm: data.bpm || 0,
            total_length: data.total_length || 0,
            url: data.url || `https://osu.ppy.sh/beatmaps/${data.id}`,
            cover_url: data.beatmapset?.covers?.cover || data.beatmapset?.covers?.card || ''
        };
    } catch (error) {
        console.error('Error fetching beatmap info:', error);
        throw error;
    }
}

// 获取beatmapset中的所有beatmap
export async function getBeatmapsetInfo(beatmapsetId: number): Promise<BeatmapInfo[]> {
    try {
        const response = await fetchWithTimeout(`https://osu.ppy.sh/api/v2/beatmapsets/${beatmapsetId}`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Beatmapset不存在');
            }
            throw new Error(`获取Beatmapset信息失败 (状态码: ${response.status})`);
        }

        const data = await response.json();

        return data.beatmaps?.map((beatmap: any) => ({
            id: beatmap.id,
            beatmapset_id: beatmap.beatmapset_id,
            title: data.title || '',
            artist: data.artist || '',
            version: beatmap.version || '',
            creator: data.creator || '',
            star_rating: beatmap.difficulty_rating || 0,
            bpm: beatmap.bpm || 0,
            total_length: beatmap.total_length || 0,
            url: beatmap.url || `https://osu.ppy.sh/beatmaps/${beatmap.id}`,
            cover_url: data.covers?.cover || data.covers?.card || ''
        })) || [];
    } catch (error) {
        console.error('Error fetching beatmapset info:', error);
        throw error;
    }
}
