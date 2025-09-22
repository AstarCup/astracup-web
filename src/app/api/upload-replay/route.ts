import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

async function getReplayAccessUsers(): Promise<string[]> {
    try {
        const edgeConfigUrl = process.env.EDGE_CONFIG;
        if (!edgeConfigUrl) {
            console.warn('EDGE_CONFIG environment variable not set');
            return [];
        }

        const response = await fetch(edgeConfigUrl);
        if (!response.ok) {
            console.warn('Failed to fetch EDGE_CONFIG');
            return [];
        }

        const config = await response.json();
        return config.replayAccessUsers || [];
    } catch (error) {
        console.warn('Error fetching replay access users:', error);
        return [];
    }
}

export async function POST(request: NextRequest) {
    const formData = await request.formData();
    const file = formData.get('file');
    const filename = formData.get('filename');
    const userId = formData.get('userId');

    if (!file || !filename || !userId) {
        return NextResponse.json({ error: '参数缺失' }, { status: 400 });
    }

    // 权限校验 - 从EDGE_CONFIG获取用户列表
    const accessUsers = await getReplayAccessUsers();
    if (!accessUsers.includes(userId.toString())) {
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