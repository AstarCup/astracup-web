import { NextRequest, NextResponse } from 'next/server';
import {
    getMapSelections,
    addMapSelection,
    deleteMapSelection,
    isBeatmapSelected,
    updateMapSelection,
    initMapSelectionDatabase
} from '@/lib/map-selection';
import { getBeatmapInfo, getBeatmapsetInfo, parseBeatmapUrl } from '@/lib/osu-api';
import { get } from '@vercel/edge-config';

// 验证选图权限的辅助函数
async function verifyMapSelectionAuth(osuId: string): Promise<boolean> {
    try {
        let mapSelectionTeam: string[] = [];

        if (process.env.NODE_ENV === 'production' && process.env.EDGE_CONFIG) {
            const teamConfig = await get('mapSelectionTeam');
            if (teamConfig && Array.isArray(teamConfig)) {
                mapSelectionTeam = teamConfig.filter((id): id is string =>
                    typeof id === 'string' && id.trim() !== ''
                );
            }
        } else {
            // 开发环境使用默认配置
            mapSelectionTeam = ['2']; // 示例ID
        }

        return mapSelectionTeam.includes(osuId.toString());
    } catch (error) {
        console.error('Error verifying auth:', error);
        return false;
    }
}

// GET - 获取选图列表
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const season = searchParams.get('season') || 's1';
        const category = searchParams.get('category') || undefined;
        const osuId = searchParams.get('osuId');

        if (!osuId) {
            return NextResponse.json(
                { error: '缺少osu ID' },
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

        // 初始化数据库（如果需要）
        await initMapSelectionDatabase();

        // 获取选图列表
        const selections = await getMapSelections(season, category);

        return NextResponse.json({
            success: true,
            selections,
            count: selections.length
        });

    } catch (error) {
        console.error('Error getting map selections:', error);
        return NextResponse.json(
            { error: '获取选图列表失败' },
            { status: 500 }
        );
    }
}

// POST - 添加新选图
export async function POST(request: NextRequest) {
    try {
        const {
            url,
            selectedMods,
            comment,
            selectedBy,
            season = 's1',
            category = 'qualification'
        } = await request.json();

        if (!url || !selectedBy) {
            return NextResponse.json(
                { error: '缺少必要参数：url 和 selectedBy' },
                { status: 400 }
            );
        }

        // 验证权限
        const isAuthorized = await verifyMapSelectionAuth(selectedBy);
        if (!isAuthorized) {
            return NextResponse.json(
                { error: '您没有权限访问选图系统' },
                { status: 403 }
            );
        }

        // 初始化数据库
        await initMapSelectionDatabase();

        // 解析URL
        const parsedUrl = parseBeatmapUrl(url);
        if (!parsedUrl.beatmapId && !parsedUrl.beatmapsetId) {
            return NextResponse.json(
                { error: '无效的osu! beatmap URL' },
                { status: 400 }
            );
        }

        let beatmapInfo;

        try {
            if (parsedUrl.beatmapId) {
                // 如果有具体的beatmap ID，直接获取
                beatmapInfo = await getBeatmapInfo(parsedUrl.beatmapId);
            } else if (parsedUrl.beatmapsetId) {
                // 如果只有beatmapset ID，获取所有难度并让用户选择第一个
                const beatmaps = await getBeatmapsetInfo(parsedUrl.beatmapsetId);
                if (beatmaps.length === 0) {
                    throw new Error('该beatmapset中没有找到任何beatmap');
                }
                beatmapInfo = beatmaps[0]; // 使用第一个难度
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

        if (!beatmapInfo) {
            return NextResponse.json(
                { error: '无法获取beatmap信息' },
                { status: 400 }
            );
        }

        // 检查是否已经选择过这个beatmap
        const alreadySelected = await isBeatmapSelected(beatmapInfo.id, season, category);
        if (alreadySelected) {
            return NextResponse.json(
                { error: '该beatmap已经在此赛季和类别中被选择过了' },
                { status: 400 }
            );
        }

        // 添加选图
        const success = await addMapSelection({
            beatmapId: beatmapInfo.id,
            beatmapsetId: beatmapInfo.beatmapset_id,
            title: beatmapInfo.title,
            artist: beatmapInfo.artist,
            version: beatmapInfo.version,
            creator: beatmapInfo.creator,
            starRating: beatmapInfo.star_rating,
            bpm: beatmapInfo.bpm,
            totalLength: beatmapInfo.total_length,
            selectedMods: selectedMods || 'NM',
            comment: comment || '',
            selectedBy,
            season,
            category,
            url: beatmapInfo.url
        });

        if (!success) {
            return NextResponse.json(
                { error: '添加选图失败' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: '选图添加成功',
            beatmapInfo
        });

    } catch (error) {
        console.error('Error adding map selection:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '添加选图失败' },
            { status: 500 }
        );
    }
}

// DELETE - 删除选图
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const selectedBy = searchParams.get('selectedBy');

        if (!id || !selectedBy) {
            return NextResponse.json(
                { error: '缺少必要参数：id 和 selectedBy' },
                { status: 400 }
            );
        }

        // 验证权限
        const isAuthorized = await verifyMapSelectionAuth(selectedBy);
        if (!isAuthorized) {
            return NextResponse.json(
                { error: '您没有权限访问选图系统' },
                { status: 403 }
            );
        }

        // 删除选图
        const success = await deleteMapSelection(parseInt(id), selectedBy);

        if (!success) {
            return NextResponse.json(
                { error: '删除选图失败或您没有权限删除此选图' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: '选图删除成功'
        });

    } catch (error) {
        console.error('Error deleting map selection:', error);
        return NextResponse.json(
            { error: '删除选图失败' },
            { status: 500 }
        );
    }
}

// PUT - 更新选图信息
export async function PUT(request: NextRequest) {
    try {
        const {
            id,
            selectedMods,
            comment,
            selectedBy
        } = await request.json();

        if (!id || !selectedBy) {
            return NextResponse.json(
                { error: '缺少必要参数：id 和 selectedBy' },
                { status: 400 }
            );
        }

        // 验证权限
        const isAuthorized = await verifyMapSelectionAuth(selectedBy);
        if (!isAuthorized) {
            return NextResponse.json(
                { error: '您没有权限访问选图系统' },
                { status: 403 }
            );
        }

        // 准备更新数据
        const updates: { selectedMods?: string; comment?: string } = {};
        if (selectedMods !== undefined) updates.selectedMods = selectedMods;
        if (comment !== undefined) updates.comment = comment;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: '没有提供要更新的字段' },
                { status: 400 }
            );
        }

        // 更新选图
        const success = await updateMapSelection(parseInt(id), updates, selectedBy);

        if (!success) {
            return NextResponse.json(
                { error: '更新选图失败或您没有权限更新此选图' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: '选图更新成功'
        });

    } catch (error) {
        console.error('Error updating map selection:', error);
        return NextResponse.json(
            { error: '更新选图失败' },
            { status: 500 }
        );
    }
}
