import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { replayAccessUsers } from '../../replay-collection/edgeconfig';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const filename = formData.get('filename');
    const userId = formData.get('userId');

    if (!file || !filename || !userId) {
        return NextResponse.json({ error: '参数缺失' }, { status: 400 });
    }

    // 权限校验
    if (!replayAccessUsers.includes(userId.toString())) {
        return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    try {
        // 上传到 Vercel Blob
        const blob = await put(filename.toString(), file as File, {
            access: 'public',
            contentType: 'application/octet-stream',
        });
        return NextResponse.json({ success: true, url: blob.url });
    } catch (e) {
        return NextResponse.json({ error: '上传失败' }, { status: 500 });
    }
}
