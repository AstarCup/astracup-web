import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const season = searchParams.get('season') || 's1';
        const category = searchParams.get('category') || 'qualification';

        console.log('Fetching uploaded users for:', { season, category });

        // 从 Vercel Blob 获取已上传的文件列表
        const { blobs } = await list({
            prefix: `${season}/${category}/`,
            token: process.env.BLOB_READ_WRITE_TOKEN
        });

        console.log('Blobs found:', blobs.length);
        console.log('First few blobs:', blobs.slice(0, 3).map(b => b.pathname));

        // 解析文件名，提取用户ID和用户名
        const uploadedUsers: { [key: string]: string[] } = {};

        blobs.forEach(blob => {
            // 文件名格式: season/category/modPosition_userId_username.osr
            const filename = blob.pathname;
            console.log('Processing blob:', filename);
            const parts = filename.split('/');
            if (parts.length >= 3) {
                const filePart = parts[2]; // modPosition_userId_username.osr
                const modAndUser = filePart.split('_');
                if (modAndUser.length >= 3) {
                    const userId = modAndUser[1];
                    const username = modAndUser[2].replace('.osr', '');
                    const mapKey = `${season}/${category}/${modAndUser[0]}`;

                    if (!uploadedUsers[mapKey]) {
                        uploadedUsers[mapKey] = [];
                    }
                    // 存储用户名而不是用户ID
                    if (!uploadedUsers[mapKey].includes(username)) {
                        uploadedUsers[mapKey].push(username);
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