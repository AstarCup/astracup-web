import { NextRequest, NextResponse } from 'next/server';
import { getBeatmapInfo, getBeatmapsetInfo, parseBeatmapUrl } from '@/lib/osu-api';
import { get } from '@vercel/edge-config';

// 验证选图权限的辅助函数
async function verifyMapSelectionAuth(osuId: string): Promise<boolean> {
    try {
        let mapSelectionTeam: string[] = [];

        // 优先尝试从Edge Config获取（无论开发还是生产环境）
        if (process.env.EDGE_CONFIG) {
            const teamConfig = await get('mapSelectionTeam');
            if (teamConfig && Array.isArray(teamConfig)) {
                mapSelectionTeam = teamConfig.filter((id): id is string =>
                    typeof id === 'string' && id.trim() !== ''
                );
            }
        }

        // 如果Edge Config没有数据，尝试从环境变量获取
        if (mapSelectionTeam.length === 0 && process.env.MAP_SELECTION_TEAM_IDS) {
            mapSelectionTeam = process.env.MAP_SELECTION_TEAM_IDS
                .split(',')
                .map(id => id.trim())
                .filter(id => id !== '');
        }

        // 如果都没有数据，使用默认测试ID
        if (mapSelectionTeam.length === 0) {
            mapSelectionTeam = ['2']; // 示例ID
        }

        // 检查osu ID是否在授权列表中 - 支持数字和字符串比较
        const userIdStr = osuId.toString();
        const userIdNum = parseInt(osuId);

        return mapSelectionTeam.some(teamId => {
            const teamIdStr = teamId.toString();
            const teamIdNum = parseInt(teamId);

            // 比较字符串和数字形式
            return teamIdStr === userIdStr || teamIdNum === userIdNum;
        });
    } catch (error) {
        console.error('Error verifying auth:', error);
        return false;
    }
}

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
                const beatmapInfo = await getBeatmapInfo(parsedUrl.beatmapId);
                result = {
                    type: 'single',
                    beatmap: beatmapInfo
                };
            } else if (parsedUrl.beatmapsetId) {
                // 如果只有beatmapset ID，获取所有难度
                const beatmaps = await getBeatmapsetInfo(parsedUrl.beatmapsetId);
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
