import { put } from '@vercel/blob';
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
        // 支持两种方式：FormData上传文件或JSON请求体
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            // 方式1：直接上传osz文件
            const formData = await request.formData();
            const file = formData.get('file') as File;
            const userId = formData.get('userId') as string;
            const season = formData.get('season') as string || 's1';
            const category = formData.get('category') as string || 'qualification';
            const selectedMods = formData.get('selectedMods') as string || 'NM';
            const modPosition = formData.get('modPosition') as string || '1';
            const customBeatmapId = formData.get('customBeatmapId') as string;

            if (!file || !userId) {
                return NextResponse.json(
                    { error: '缺少必要参数：file 和 userId' },
                    { status: 400 }
                );
            }

            // 验证权限
            const isAuthorized = await verifyMapSelectionAuth(userId);
            if (!isAuthorized) {
                return NextResponse.json(
                    { error: '您没有权限访问选图系统' },
                    { status: 403 }
                );
            }

            // 验证文件类型
            if (!file.name.toLowerCase().endsWith('.osz')) {
                return NextResponse.json(
                    { error: '只支持.osz文件格式' },
                    { status: 400 }
                );
            }

            // 验证文件大小（限制为50MB）
            if (file.size > 50 * 1024 * 1024) {
                return NextResponse.json(
                    { error: '文件大小不能超过50MB' },
                    { status: 400 }
                );
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

            // 直接上传到Vercel Blob
            const { url } = await put(blobPath, file, {
                access: 'public',
                contentType: 'application/octet-stream',
                token: process.env.BLOB_READ_WRITE_TOKEN,
                allowOverwrite: true
            });

            return NextResponse.json({
                success: true,
                url,
                filename: file.name,
                blobPath,
                message: 'osz文件上传成功'
            });
        } else {
            // 方式2：JSON请求体（向后兼容）
            const { filename, contentType, userId } = await request.json();

            if (!filename || !userId) {
                return NextResponse.json(
                    { error: '缺少必要参数：filename 和 userId' },
                    { status: 400 }
                );
            }

            // 验证权限
            const isAuthorized = await verifyMapSelectionAuth(userId);
            if (!isAuthorized) {
                return NextResponse.json(
                    { error: '您没有权限访问选图系统' },
                    { status: 403 }
                );
            }

            // 生成安全的文件名（防止路径遍历攻击）
            const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

            // 生成上传URL - 使用一个小的占位符内容，允许覆盖
            const { url } = await put(safeFilename, new Blob(['placeholder'], { type: contentType || 'application/octet-stream' }), {
                access: 'public',
                contentType: contentType || 'application/octet-stream',
                token: process.env.BLOB_READ_WRITE_TOKEN,
                allowOverwrite: true
            });

            return NextResponse.json({
                success: true,
                url,
                filename: safeFilename
            });
        }
    } catch (error) {
        console.error('Error in upload-url API:', error);
        return NextResponse.json(
            {
                error: '上传失败',
                details: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
}
