import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { verifyReplayAuth } from '../map-selections/route';

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
    } catch (e) {
        return NextResponse.json({ error: '上传失败' }, { status: 500 });
    }
}