import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const sid = searchParams.get('sid');

    if (!sid) {
        return NextResponse.json({ error: 'Missing sid parameter' }, { status: 400 });
    }

    try {
        const downloadUrl = `https://dl.sayobot.cn/beatmaps/download/full/${sid}`;
        console.log('Proxying download request:', { sid, downloadUrl });

        // 从环境变量获取 Referer，如果没有则使用默认值
        const referer = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.rino.ink/';
        // 获取客户端的 User-Agent
        const userAgent = request.headers.get('user-agent') || 'Mozilla/5.0 (compatible; Astracup-Web/1.0)';

        const response = await fetch(downloadUrl, {
            headers: {
                'Referer': referer,
                'User-Agent': userAgent,
            },
        });

        if (!response.ok) {
            console.error('Download failed:', {
                status: response.status,
                statusText: response.statusText,
                sid,
                downloadUrl
            });
            return NextResponse.json(
                { error: `Download failed: ${response.status} ${response.statusText}` },
                { status: response.status }
            );
        }

        // 获取文件名，如果没有则使用默认名称
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `beatmap_${sid}.osz`;

        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/['"]/g, '');
            }
        }

        // 创建响应，设置适当的头部
        const headers = new Headers();
        headers.set('Content-Type', 'application/octet-stream');
        headers.set('Content-Disposition', `attachment; filename="${filename}"`);
        headers.set('Cache-Control', 'no-cache');

        console.log('Download successful:', { sid, filename, contentLength: response.headers.get('content-length') });

        return new NextResponse(response.body, {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error('Download proxy error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            sid,
            stack: error instanceof Error ? error.stack : undefined
        });

        return NextResponse.json(
            { error: 'Internal server error during download' },
            { status: 500 }
        );
    }
}