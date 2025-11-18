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
        // 获取客户端token
        const { getValidClientToken } = await import('@/lib/osu-auth');
        const accessToken = await getValidClientToken();

        const response = await fetchWithTimeout(`https://osu.ppy.sh/api/v2/users/${username}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('玩家不存在');
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
        throw error;
    }
}

// 备用方案：使用公开API（不需要API密钥）
// 通过用户ID获取用户信息
export async function getUserById(userId: number): Promise<OsuUser | null> {
    try {
        // 获取客户端token
        const { getValidClientToken } = await import('@/lib/osu-auth');
        const accessToken = await getValidClientToken();

        const response = await fetchWithTimeout(`https://osu.ppy.sh/api/v2/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('玩家不存在');
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
        console.error('Error fetching user by ID:', error);
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
    max_combo: number;      // 最大连击数
    ar: number;             // Approach Rate
    cs: number;             // Circle Size
    od: number;             // Overall Difficulty
    hp: number;             // Health Points (HP Drain Rate)
    url: string;
    cover_url: string;
}

// 从URL解析beatmap ID和beatmapset ID
export function parseBeatmapUrl(url: string): { beatmapId?: number; beatmapsetId?: number } {
    // 首先检查是否直接输入了数字ID
    const trimmedUrl = url.trim();

    // 检查是否是纯数字（直接的beatmap ID）
    if (/^\d+$/.test(trimmedUrl)) {
        const beatmapId = parseInt(trimmedUrl);
        return { beatmapId };
    }

    const patterns = [
        /osu\.ppy\.sh\/b\/(\d+)/,              // /b/{beatmap_id}
        /osu\.ppy\.sh\/beatmaps\/(\d+)/,       // /beatmaps/{beatmap_id}
        /osu\.ppy\.sh\/beatmapsets\/(\d+)#[^\/]*\/(\d+)/, // /beatmapsets/{beatmapset_id}#{mode}/{beatmap_id} - 优先处理有具体beatmap ID的情况
        /osu\.ppy\.sh\/s\/(\d+)/,              // /s/{beatmapset_id}
        /osu\.ppy\.sh\/beatmapsets\/(\d+)/,    // /beatmapsets/{beatmapset_id}
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            if (url.includes('/b/') || url.includes('/beatmaps/')) {
                // 直接的beatmap URL
                const beatmapId = parseInt(match[1]);
                return { beatmapId };
            } else if (match[2]) {
                // beatmapsets URL with specific beatmap ID - 优先使用beatmap ID
                const beatmapsetId = parseInt(match[1]);
                const beatmapId = parseInt(match[2]);
                return { beatmapId };
            } else {
                // 只有beatmapset ID
                const beatmapsetId = parseInt(match[1]);
                return { beatmapsetId };
            }
        }
    }

    return {};
}

// 获取单个beatmap信息
export async function getBeatmapInfo(beatmapId: number): Promise<BeatmapInfo | null> {
    try {
        console.log('Getting client token for beatmap info...');
        // 获取客户端token
        const { getValidClientToken } = await import('@/lib/osu-auth');
        const accessToken = await getValidClientToken();
        console.log('Client token obtained:', !!accessToken);

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        };

        console.log('Fetching beatmap info for ID:', beatmapId);
        const response = await fetchWithTimeout(`https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}`, {
            headers,
        });

        console.log('Beatmap API response status:', response.status);

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
            max_combo: data.max_combo || 0,
            ar: data.ar || 0,
            cs: data.cs || 0,
            od: data.accuracy || 0,  // accuracy 对应 OD
            hp: data.drain || 0,     // drain 对应 HP
            url: data.url || `https://osu.ppy.sh/beatmaps/${data.id}`,
            cover_url: data.beatmapset?.covers?.cover || data.beatmapset?.covers?.card || ''
        };
    } catch (error) {
        console.error('Error fetching beatmap info:', error);
        throw error;
    }
}

// 获取用户头像（带fallback机制）
export async function getUserAvatarWithFallback(osuId: string, username: string): Promise<string> {
    try {
        // 1. 首先尝试从数据库获取
        const { getUserRegistration } = await import('@/lib/mysql-registrations');
        const registration = await getUserRegistration(osuId);

        if (registration?.avatar_url) {
            return registration.avatar_url;
        }

        // 2. 如果数据库中没有，从osu! API获取
        try {
            const userData = await getUserById(parseInt(osuId));
            if (userData?.avatar_url) {
                return userData.avatar_url;
            }
        } catch (apiError) {
            console.warn(`Failed to get avatar from osu! API for user ${username} (${osuId}):`, apiError);
        }

        // 3. 如果API也失败，返回默认头像
        return '/unknow.svg';
    } catch (error) {
        console.error(`Error getting avatar for user ${username} (${osuId}):`, error);
        return '/unknow.svg';
    }
}

// 获取beatmapset中的所有beatmap
export async function getBeatmapsetInfo(beatmapsetId: number): Promise<BeatmapInfo[]> {
    try {
        // 获取客户端token
        const { getValidClientToken } = await import('@/lib/osu-auth');
        const accessToken = await getValidClientToken();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        };

        const response = await fetchWithTimeout(`https://osu.ppy.sh/api/v2/beatmapsets/${beatmapsetId}`, {
            headers,
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
            max_combo: beatmap.max_combo || 0,
            ar: beatmap.ar || 0,
            cs: beatmap.cs || 0,
            od: beatmap.accuracy || 0,
            hp: beatmap.drain || 0,
            url: beatmap.url || `https://osu.ppy.sh/beatmaps/${beatmap.id}`,
            cover_url: data.covers?.cover || data.covers?.card || ''
        })) || [];
    } catch (error) {
        console.error('Error fetching beatmapset info:', error);
        throw error;
    }
}
