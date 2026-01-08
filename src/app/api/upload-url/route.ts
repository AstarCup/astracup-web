import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';
import { verifyMapSelectionAuth } from '@/lib/permissions';

// 处理OPTIONS预检请求
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        },
    });
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as HandleUploadBody;

        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (
                pathname,
                clientPayload
            ) => {
                // 解析客户端负载
                let userId = '';
                let season = 's1';
                let category = 'qualification';
                let selectedMods = 'NM';
                let modPosition = '1';
                let customBeatmapId = '';

                try {
                    if (clientPayload) {
                        const payload = JSON.parse(clientPayload);
                        userId = payload.userId || '';
                        season = payload.season || season;
                        category = payload.category || category;
                        selectedMods = payload.selectedMods || selectedMods;
                        modPosition = payload.modPosition || modPosition;
                        customBeatmapId = payload.customBeatmapId || '';
                    }
                } catch (error) {
                    console.error('Error parsing client payload:', error);
                }

                // 验证权限
                if (!userId) {
                    throw new Error('缺少用户ID');
                }

                const isAuthorized = await verifyMapSelectionAuth(userId);
                if (!isAuthorized) {
                    throw new Error('您没有权限访问选图系统');
                }

                // 验证文件类型
                if (!pathname.toLowerCase().endsWith('.osz')) {
                    throw new Error('只支持.osz文件格式');
                }

                // 生成存储路径
                let finalBeatmapId: number | undefined = undefined;
                if (customBeatmapId) {
                    const customId = parseInt(customBeatmapId);
                    if (customId < 0) { // 确保是负数
                        finalBeatmapId = customId;
                    }
                }

                // 格式: 赛季_阶段_mod_mod位_bid.osz
                const bidStr = finalBeatmapId ? (finalBeatmapId < 0 ? `-${Math.abs(finalBeatmapId)}` : finalBeatmapId.toString()) : 'unknown';
                const blobPath = `/custom/${season}_${category}_${selectedMods}${modPosition}_${bidStr}.osz`;

                return {
                    allowedContentTypes: ['application/octet-stream'],
                    addRandomSuffix: false, // 不使用随机后缀，保持文件名一致
                    tokenPayload: JSON.stringify({
                        userId,
                        season,
                        category,
                        selectedMods,
                        modPosition,
                        customBeatmapId,
                        blobPath,
                        originalFilename: pathname
                    }),
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                // 文件上传完成后调用
                console.log('Blob上传完成:', blob);

                try {
                    if (tokenPayload) {
                        const payload = JSON.parse(tokenPayload);
                        console.log('上传完成，文件信息:', {
                            userId: payload.userId,
                            blobPath: payload.blobPath,
                            originalFilename: payload.originalFilename,
                            blobUrl: blob.url
                        });


                    }
                } catch (error) {
                    console.error('Error processing upload completion:', error);
                }
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        console.error('Error in upload-url API:', error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }
        );
    }
}

