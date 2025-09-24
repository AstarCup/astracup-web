import { NextRequest, NextResponse } from 'next/server';
import { getBeatmapInfo, getBeatmapsetInfo, parseBeatmapUrl } from '@/lib/osu-api';
import { get } from '@vercel/edge-config';
import { cookies } from 'next/headers';
import { verifyMapSelectionAuth } from '@/lib/permissions';

// POST - 解析beatmap URL并返回beatmap信息
export async function POST(request: NextRequest) {
    try {
        const { url, osuId } = await request.json();

        if (!url || !osuId) {
            return NextResponse.json(
                { error: '缺少必要参数：url 和 osuId' },
                { status: 400 }
            );
        }

        // 验证权限
        const isAuthorized = await verifyMapSelectionAuth(osuId);
        if (!isAuthorized) {
            return NextResponse.json(
                { error: '您没有权限访问选图系统' },
                { status: 403 }
            );
        }

        // 获取用户的access token
        let accessToken: string | undefined;
        try {
            const cookieStore = await cookies();
            const sessionCookie = cookieStore.get('astra_session');

            if (sessionCookie?.value) {
                const session = JSON.parse(sessionCookie.value);
                accessToken = session.access_token;
                console.log('Using user access token for beatmap API');
            }
        } catch (error) {
            console.error('Error getting user session for access token:', error);
            // 继续执行，不使用token
        }

        // 解析URL
        const parsedUrl = parseBeatmapUrl(url);
        if (!parsedUrl.beatmapId && !parsedUrl.beatmapsetId) {
            return NextResponse.json(
                { error: '无效的osu! beatmap URL' },
                { status: 400 }
            );
        }

        let result;

        try {
            if (parsedUrl.beatmapId) {
                // 如果有具体的beatmap ID，直接获取
                const beatmapInfo = await getBeatmapInfo(parsedUrl.beatmapId, accessToken);
                result = {
                    type: 'single',
                    beatmap: beatmapInfo
                };
            } else if (parsedUrl.beatmapsetId) {
                // 如果只有beatmapset ID，获取所有难度
                const beatmaps = await getBeatmapsetInfo(parsedUrl.beatmapsetId, accessToken);
                if (beatmaps.length === 0) {
                    throw new Error('该beatmapset中没有找到任何beatmap');
                }
                result = {
                    type: 'multiple',
                    beatmaps: beatmaps
                };
            } else {
                throw new Error('无法解析beatmap信息');
            }
        } catch (apiError) {
            console.error('Error fetching beatmap info:', apiError);
            return NextResponse.json(
                { error: `获取beatmap信息失败: ${apiError instanceof Error ? apiError.message : '未知错误'}` },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            parsed: parsedUrl,
            data: result
        });

    } catch (error) {
        console.error('Error parsing beatmap URL:', error);
        return NextResponse.json(
            { error: '解析beatmap URL失败' },
            { status: 500 }
        );
    }
}
