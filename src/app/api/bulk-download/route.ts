import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

export async function POST(request: NextRequest) {
    try {
        const { sids }: { sids: string[] } = await request.json();

        if (!sids || !Array.isArray(sids) || sids.length === 0) {
            return NextResponse.json({ error: 'Missing or invalid sids parameter' }, { status: 400 });
        }

        if (sids.length > 50) {
            return NextResponse.json({ error: 'Too many beatmaps requested (max 50)' }, { status: 400 });
        }

        console.log('Starting bulk download:', { count: sids.length, sids });

        const zip = new JSZip();
        const referer = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.rino.ink/';
        const userAgent = request.headers.get('user-agent') || 'Mozilla/5.0 (compatible; Astracup-Web/1.0)';

        let successCount = 0;
        let failCount = 0;

        // 逐个下载谱面
        for (const sid of sids) {
            try {
                const downloadUrl = `https://dl.sayobot.cn/beatmaps/download/full/${sid}`;
                console.log(`Downloading beatmap ${sid}...`);

                const response = await fetch(downloadUrl, {
                    headers: {
                        'Referer': referer,
                        'User-Agent': userAgent,
                    },
                    // 设置超时
                    signal: AbortSignal.timeout(30000), // 30秒超时
                });

                if (!response.ok) {
                    console.error(`Failed to download ${sid}:`, response.status, response.statusText);
                    failCount++;
                    continue;
                }

                const arrayBuffer = await response.arrayBuffer();

                // 获取文件名
                const contentDisposition = response.headers.get('content-disposition');
                let filename = `beatmap_${sid}.osz`;

                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (filenameMatch && filenameMatch[1]) {
                        filename = filenameMatch[1].replace(/['"]/g, '');
                    }
                }

                // 添加到ZIP
                zip.file(filename, arrayBuffer);
                successCount++;

                console.log(`Successfully added ${filename} to ZIP`);

            } catch (error) {
                console.error(`Error downloading ${sid}:`, error);
                failCount++;
            }
        }

        if (successCount === 0) {
            return NextResponse.json(
                { error: 'Failed to download any beatmaps' },
                { status: 500 }
            );
        }

        console.log(`Bulk download completed: ${successCount} success, ${failCount} failed`);

        // 生成ZIP文件
        const zipBuffer = await zip.generateAsync({
            type: 'uint8array',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        // 设置响应头
        const headers = new Headers();
        headers.set('Content-Type', 'application/zip');
        headers.set('Content-Disposition', `attachment; filename="beatmaps_${Date.now()}.zip"`);
        headers.set('Cache-Control', 'no-cache');

        console.log('ZIP file generated, size:', zipBuffer.length, 'bytes');

        // 转换为ArrayBuffer
        const arrayBuffer = zipBuffer.buffer.slice(
            zipBuffer.byteOffset,
            zipBuffer.byteOffset + zipBuffer.byteLength
        );

        return new NextResponse(arrayBuffer as any, {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error('Bulk download error:', error);
        return NextResponse.json(
            { error: 'Internal server error during bulk download' },
            { status: 500 }
        );
    }
}