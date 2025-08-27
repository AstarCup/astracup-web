import { NextRequest, NextResponse } from 'next/server';

export interface OsuUser {
    id: number;
    username: string;
    avatar_url: string;
    country_code: string;
    statistics: {
        pp: number;
        global_rank: number | null;
        country_rank: number | null;
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
    const apiKey = process.env.OSU_API_KEY;
    if (!apiKey) {
        return null;
    }

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

        return {
            id: data.id,
            username: data.username,
            avatar_url: data.avatar_url,
            country_code: data.country_code,
            statistics: {
                pp: data.statistics?.pp || 0,
                global_rank: data.statistics?.global_rank || null,
                country_rank: data.statistics?.country_rank || null,
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
            }
        });

        if (!searchResponse.ok) {
            return null;
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

    try {
        // 首先尝试使用官方API
        let userData = await getUserDataFromAPI(username);

        // 如果官方API失败，尝试公开方法
        if (!userData) {
            userData = await getUserDataFromPublic(username);
        }

        if (userData) {
            return NextResponse.json(userData);
        } else {
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
