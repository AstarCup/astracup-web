import { NextRequest, NextResponse } from 'next/server';
import { getBatchRatingStats } from '@/lib/map-ratings';

// GET - 批量获取评分统计
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const mapSelectionIdsParam = searchParams.get('mapSelectionIds');

        if (!mapSelectionIdsParam) {
            return NextResponse.json(
                { error: '缺少必要参数：mapSelectionIds' },
                { status: 400 }
            );
        }

        // 解析mapSelectionIds参数
        const mapSelectionIds = mapSelectionIdsParam
            .split(',')
            .map(id => parseInt(id.trim()))
            .filter(id => !isNaN(id) && id > 0);

        if (mapSelectionIds.length === 0) {
            return NextResponse.json(
                { error: '无效的mapSelectionIds参数' },
                { status: 400 }
            );
        }

        // 限制批量请求的数量，防止过大的查询
        const MAX_BATCH_SIZE = 100;
        if (mapSelectionIds.length > MAX_BATCH_SIZE) {
            return NextResponse.json(
                { error: `批量请求数量超过限制，最多支持 ${MAX_BATCH_SIZE} 个选图` },
                { status: 400 }
            );
        }

        // 批量获取评分统计
        const batchStats = await getBatchRatingStats(mapSelectionIds);

        return NextResponse.json({
            success: true,
            stats: batchStats,
            count: Object.keys(batchStats).length
        });

    } catch (error) {
        console.error('Error getting batch map ratings:', error);
        return NextResponse.json(
            { error: '批量获取评分信息失败' },
            { status: 500 }
        );
    }
}