import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const season = searchParams.get('season') || 's1';
        const category = searchParams.get('category') || 'qualification';

        // 从 Vercel Blob 获取已上传的文件列表
        const { blobs } = await list({
            prefix: `${season}/${category}/`,
            token: process.env.BLOB_READ_WRITE_TOKEN
        });

        // 解析文件名，提取用户ID
        const uploadedUsers: { [key: string]: string[] } = {};

        blobs.forEach(blob => {
            // 文件名格式: season/category/modPosition_userId.osr
            const filename = blob.pathname;
            const parts = filename.split('/');
            if (parts.length >= 3) {
                const filePart = parts[2]; // modPosition_userId.osr
                const modAndUser = filePart.split('_');
                if (modAndUser.length >= 2) {
                    const userId = modAndUser[1].replace('.osr', '');
                    const mapKey = `${season}/${category}/${modAndUser[0]}`;

                    if (!uploadedUsers[mapKey]) {
                        uploadedUsers[mapKey] = [];
                    }
                    if (!uploadedUsers[mapKey].includes(userId)) {
                        uploadedUsers[mapKey].push(userId);
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            uploadedUsers
        });
    } catch (error) {
        console.error('Error fetching uploaded users:', error);
        return NextResponse.json(
            { error: '获取上传状态失败', success: false },
            { status: 500 }
        );
    }
}