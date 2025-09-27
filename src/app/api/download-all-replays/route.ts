import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import JSZip from 'jszip';

interface ReplayFile {
    filename: string;
    content: ArrayBuffer;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const season = searchParams.get('season') || 's1';
        const category = searchParams.get('category') || 'qualification';

        console.log('Downloading all replays for:', { season, category });

        // 从 Vercel Blob 获取已上传的文件列表
        const { blobs } = await list({
            prefix: `${season}/${category}/`,
            token: process.env.BLOB_READ_WRITE_TOKEN
        });

        console.log('Blobs found:', blobs.length);

        if (blobs.length === 0) {
            return NextResponse.json(
                { error: '该赛季和类别下没有已上传的回放文件', success: false },
                { status: 404 }
            );
        }

        // 创建ZIP文件
        const zip = new JSZip();

        // 按mod位组织文件
        const filesByMod: { [key: string]: ReplayFile[] } = {};

        for (const blob of blobs) {
            try {
                // 文件名格式: season/category/modPosition_bid_userId_username.osr
                const filename = blob.pathname;
                const parts = filename.split('/');
                if (parts.length >= 3) {
                    const filePart = parts[2]; // modPosition_bid_userId_username.osr
                    const modAndUser = filePart.split('_');
                    if (modAndUser.length >= 4) {
                        const modPosition = modAndUser[0]; // mod位 (如 NM1, HD2)
                        const bid = modAndUser[1]; // beatmap ID
                        const userId = modAndUser[2]; // 用户ID
                        const username = modAndUser[3].replace('.osr', ''); // 用户名

                        // 下载文件内容
                        const fileResponse = await fetch(blob.url);

                        if (fileResponse.ok) {
                            const fileBuffer = await fileResponse.arrayBuffer();

                            // 按mod位分组
                            if (!filesByMod[modPosition]) {
                                filesByMod[modPosition] = [];
                            }

                            // 新文件名格式: mod位_用户名_bid.osr
                            const newFilename = `${modPosition}_${username}_${bid}.osr`;
                            filesByMod[modPosition].push({
                                filename: newFilename,
                                content: fileBuffer
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Error processing blob:', blob.pathname, error);
                // 继续处理其他文件
            }
        }

        // 将文件添加到ZIP中，按mod位创建文件夹
        Object.entries(filesByMod).forEach(([modPosition, files]) => {
            files.forEach(file => {
                zip.file(`${modPosition}/${file.filename}`, file.content);
            });
        });

        // 生成ZIP文件
        const zipContent = await zip.generateAsync({ type: 'arraybuffer' });

        // 返回ZIP文件
        return new NextResponse(zipContent, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${season}_${category}_replays.zip"`,
            },
        });

    } catch (error) {
        console.error('Error downloading all replays:', error);
        return NextResponse.json(
            { error: '下载失败', success: false },
            { status: 500 }
        );
    }
}