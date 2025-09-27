import { NextRequest, NextResponse } from 'next/server';
import {
    getMapSelections,
    addMapSelection,
    deleteMapSelection,
    updateMapSelection,
    verifyAdminAuth,
    getPool
} from '@/lib/map-selection';
import { getBeatmapInfo, getBeatmapsetInfo, parseBeatmapUrl } from '@/lib/osu-api';
import { verifyMapSelectionAuth, verifyReplayAuth } from '@/lib/permissions';

// GET - 获取选图列表
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const season = searchParams.get('season') || 's1';
        const category = searchParams.get('category') || undefined;
        const osuId = searchParams.get('osuId');
        const approved = searchParams.get('approved'); // 新增approved参数
        const paddingParam = searchParams.get('padding');
        const padding = paddingParam === null ? undefined : paddingParam === 'true';

        // 如果只是获取已过审的图，则不需要权限验证（公开访问）
        if (approved === 'true') {
            // 初始化数据库（如果需要）
            // 数据库已初始化，跳过此步骤

            // 获取选图列表
            const selections = await getMapSelections(season, category, padding);

            // 只返回已过审的图
            const approvedSelections = selections.filter(selection => selection.approved);

            return NextResponse.json({
                success: true,
                selections: approvedSelections,
                count: approvedSelections.length
            });
        }

        // 对于非公开访问，需要权限验证
        if (!osuId) {
            return NextResponse.json(
                { error: '缺少osu ID' },
                { status: 400 }
            );
        }

        // 验证权限 - 如果是获取padding数据，允许有replay access或map selection access的用户
        let isAuthorized = false;
        if (padding) {
            // 对于padding数据，同时检查replay access和map selection access
            const hasReplayAccess = await verifyReplayAuth(osuId);
            const hasMapSelectionAccess = await verifyMapSelectionAuth(osuId);
            isAuthorized = hasReplayAccess || hasMapSelectionAccess;
        } else {
            // 对于非padding数据，只需要map selection access
            isAuthorized = await verifyMapSelectionAuth(osuId);
        }

        if (!isAuthorized) {
            return NextResponse.json(
                { error: '您没有权限访问选图系统' },
                { status: 403 }
            );
        }

        // 初始化数据库（如果需要）
        // 数据库已初始化，跳过此步骤

        // 获取选图列表
        const selections = await getMapSelections(season, category, padding);

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
            modPosition = 1,
            customDTRate,
            customModName,
            comment,
            approved = false,
            selectedBy,
            selectedByUsername,
            selectedByAvatar,
            season = 's1',
            category = 'qualification',
            moddedStats
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
        // 数据库已初始化，跳过此步骤

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

        // 使用mod计算后的参数（如果提供）或原参数
        const finalStats = moddedStats || {
            ar: beatmapInfo.ar,
            cs: beatmapInfo.cs,
            od: beatmapInfo.od,
            hp: beatmapInfo.hp,
            star_rating: beatmapInfo.star_rating,
            bpm: beatmapInfo.bpm
        };

        // 添加选图（允许重复添加）
        const success = await addMapSelection({
            beatmapId: beatmapInfo.id,
            beatmapsetId: beatmapInfo.beatmapset_id,
            title: beatmapInfo.title,
            artist: beatmapInfo.artist,
            version: beatmapInfo.version,
            creator: beatmapInfo.creator,
            starRating: finalStats.star_rating,
            bpm: finalStats.bpm,
            totalLength: beatmapInfo.total_length,
            ar: finalStats.ar,
            cs: finalStats.cs,
            od: finalStats.od,
            hp: finalStats.hp,
            selectedMods: selectedMods || 'NM',
            modPosition: modPosition || 1,
            customDTRate: customDTRate || undefined,
            customModName: customModName || undefined,
            comment: comment || '',
            selectedBy,
            selectedByUsername: selectedByUsername, // 传递用户名
            selectedByAvatar: selectedByAvatar,     // 传递头像
            season,
            category,
            url: beatmapInfo.url,
            coverUrl: beatmapInfo.cover_url || '',
            approved: approved || false
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

        // 验证权限 - 管理员可以删除任何地图
        const isAdmin = await verifyAdminAuth(selectedBy);
        const isAuthorized = await verifyMapSelectionAuth(selectedBy);

        if (!isAdmin && !isAuthorized) {
            return NextResponse.json(
                { error: '您没有权限访问选图系统' },
                { status: 403 }
            );
        }

        // 删除选图 - 管理员可以删除任何人的地图
        let success = false;
        if (isAdmin) {
            success = await deleteMapSelection(parseInt(id));
        } else {
            success = await deleteMapSelection(parseInt(id), selectedBy);
        }

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
            approved,
            padding,
            selectedBy
        } = await request.json();

        if (!id || !selectedBy) {
            return NextResponse.json(
                { error: '缺少必要参数：id 和 selectedBy' },
                { status: 400 }
            );
        }

        // 准备更新数据
        const updates: { selectedMods?: string; comment?: string; approved?: boolean; padding?: boolean } = {};
        if (selectedMods !== undefined) updates.selectedMods = selectedMods;
        if (comment !== undefined) updates.comment = comment;
        if (approved !== undefined) updates.approved = approved;
        if (padding !== undefined) updates.padding = padding;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: '没有提供要更新的字段' },
                { status: 400 }
            );
        }

        // 权限检查逻辑：
        // 1. 如果更新approved字段，允许管理员或图池选择者
        // 2. 如果只更新padding字段，允许选图者本人或选图团队成员
        // 3. 如果更新其他字段，只允许选图团队成员
        let isAuthorized = false;

        if (updates.approved !== undefined) {
            // 更新approved字段：允许管理员或图池选择者
            const isAdmin = await verifyAdminAuth(selectedBy);
            const isMapSelector = await verifyMapSelectionAuth(selectedBy);
            isAuthorized = isAdmin || isMapSelector;
        } else if (Object.keys(updates).length === 1 && updates.padding !== undefined) {
            // 只更新padding字段：检查是否为选图者本人或选图团队成员
            const isMapSelector = await verifyMapSelectionAuth(selectedBy);

            // 检查是否为选图者本人（需要查询数据库）
            let isOwner = false;
            try {
                const connection = await getPool().getConnection();
                const [rows] = await connection.execute(
                    'SELECT selectedBy FROM map_selections WHERE id = ?',
                    [id]
                ) as [Array<{ selectedBy: string }>, import('mysql2').FieldPacket[]];

                if (rows && rows.length > 0) {
                    const selection = rows[0];
                    isOwner = selection.selectedBy === selectedBy;
                    console.log('Ownership check:', { selectionSelectedBy: selection.selectedBy, requestSelectedBy: selectedBy, isOwner });
                }
                connection.release();
            } catch (error) {
                console.error('Error checking selection ownership:', error);
            }

            isAuthorized = isMapSelector || isOwner;
            console.log('Padding update authorization:', { isMapSelector, isOwner, isAuthorized });
        } else {
            // 更新其他字段：只允许选图团队成员
            isAuthorized = await verifyMapSelectionAuth(selectedBy);
        } if (!isAuthorized) {
            return NextResponse.json(
                { error: '您没有权限更新此选图' },
                { status: 403 }
            );
        }

        // 更新选图
        console.log('Calling updateMapSelection with:', { id: parseInt(id), updates, selectedBy });
        const success = await updateMapSelection(parseInt(id), updates, selectedBy);
        console.log('updateMapSelection result:', success);

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
