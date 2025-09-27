import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { verifyReplayAuth } from '@/lib/permissions';

export async function POST(request: NextRequest) {
    const formData = await request.formData();
    const file = formData.get('file');
    const filename = formData.get('filename');
    const userId = formData.get('userId');

    if (!file || !filename || !userId) {
        return NextResponse.json({ error: '参数缺失' }, { status: 400 });
    }

    // 权限校验 - 使用统一的权限验证函数
    const hasAccess = await verifyReplayAuth(userId.toString());
    if (!hasAccess) {
        return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    try {
        // 上传到 Vercel Blob
        const blob = await put(filename.toString(), file as File, {
            access: 'public',
            contentType: 'application/octet-stream',
            token: process.env.BLOB_READ_WRITE_TOKEN
        });
        return NextResponse.json({ success: true, url: blob.url });
    } catch (_e) {
        return NextResponse.json({ error: '上传失败' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { filename, userId } = await request.json();

        if (!filename || !userId) {
            return NextResponse.json({ error: '参数缺失' }, { status: 400 });
        }

        // 权限校验 - 使用统一的权限验证函数
        const hasAccess = await verifyReplayAuth(userId.toString());
        if (!hasAccess) {
            return NextResponse.json({ error: '无权限' }, { status: 403 });
        }

        // 从 Vercel Blob 删除文件
        // 使用文件名直接删除
        await del([filename], {
            token: process.env.BLOB_READ_WRITE_TOKEN
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('删除文件失败:', e);
        return NextResponse.json({ error: '删除失败' }, { status: 500 });
    }
}