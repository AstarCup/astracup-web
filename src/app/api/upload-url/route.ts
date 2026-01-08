import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { verifyMapSelectionAuth } from '@/lib/permissions';

export async function POST(request: NextRequest) {
    try {
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

        // 生成上传URL - 使用空字符串作为内容，因为我们只需要URL
        const { url } = await put(safeFilename, '', {
            access: 'public',
            contentType: contentType || 'application/octet-stream',
            token: process.env.BLOB_READ_WRITE_TOKEN
        });

        return NextResponse.json({
            success: true,
            url,
            filename: safeFilename
        });
    } catch (error) {
        console.error('Error generating upload URL:', error);
        return NextResponse.json(
            {
                error: '生成上传URL失败',
                details: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
}