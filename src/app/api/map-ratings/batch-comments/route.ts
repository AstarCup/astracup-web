import { NextRequest, NextResponse } from 'next/server';
import { getBatchComments } from '@/lib/map-ratings';

// GET - 批量获取评论数据
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const mapSelectionIdsParam = searchParams.get('mapSelectionIds');

        console.log('Batch comments API called with mapSelectionIds:', mapSelectionIdsParam);

        if (!mapSelectionIdsParam) {
            console.log('Missing mapSelectionIds parameter');
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

        console.log('Parsed mapSelectionIds:', mapSelectionIds);

        if (mapSelectionIds.length === 0) {
            console.log('No valid mapSelectionIds found');
            return NextResponse.json(
                { error: '无效的mapSelectionIds参数' },
                { status: 400 }
            );
        }

        // 不限制批量请求的数量，支持获取所有评论
        console.log(`Processing batch request for ${mapSelectionIds.length} map selections`);

        // 批量获取评论数据
        console.log('Calling getBatchComments with IDs:', mapSelectionIds);
        const batchComments = await getBatchComments(mapSelectionIds);
        console.log('Batch comments result count:', Object.keys(batchComments).length);

        const response = {
            success: true,
            comments: batchComments,
            count: Object.keys(batchComments).length
        };

        console.log('Returning response with comments for', Object.keys(batchComments).length, 'map selections');
        return NextResponse.json(response);

    } catch (error) {
        console.error('Error getting batch comments:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return NextResponse.json(
            { error: '批量获取评论信息失败' },
            { status: 500 }
        );
    }
}
