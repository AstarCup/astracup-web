import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const sid = searchParams.get('sid');
    const source = searchParams.get('source') || 'nerinyan'; // 'nerinyan', 'sayobot' or 'osu'

    if (!sid) {
        return NextResponse.json({ error: 'Missing sid parameter' }, { status: 400 });
    }

    try {
        let downloadUrl: string;
        let sourceName: string;

        if (source === 'osu') {
            downloadUrl = `https://osu.ppy.sh/beatmapsets/${sid}/download`;
            sourceName = 'osu官方';
        } else if (source === 'nerinyan') {
            downloadUrl = `https://api.nerinyan.moe/d/${sid}`;
            sourceName = 'Nerinyan';
        } else if (source === 'sayobot') {
            downloadUrl = `https://dl.sayobot.cn/beatmaps/download/full/${sid}`;
            sourceName = 'Sayobot';
        } else {
            // Fallback to nerinyan if sayobot is requested but deprecated
            downloadUrl = `https://api.nerinyan.moe/d/${sid}`;
            sourceName = 'Nerinyan';
        }

        console.log(`Proxying download request from ${sourceName}:`, { sid, downloadUrl, source });

        // 从环境变量获取 Referer，如果没有则使用默认值
        const referer = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.rino.ink/';
        // 从请求中获取User-Agent，如果没有则使用默认值
        const userAgent = request.headers.get('user-agent') ||
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        console.log('Request headers:', { referer, userAgent, source });

        const response = await fetch(downloadUrl, {
            headers: {
                'Referer': referer,
                'User-Agent': userAgent,
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            },
        });

        console.log(`${sourceName} response:`, {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length'),
        });

        if (!response.ok) {
            console.error('Download failed:', {
                status: response.status,
                statusText: response.statusText,
                sid,
                downloadUrl
            });

            // 如果是重定向，尝试跟随
            if (response.status === 302 || response.status === 301) {
                const redirectUrl = response.headers.get('location');
                console.log('Following redirect to:', redirectUrl);
                if (redirectUrl) {
                    const redirectResponse = await fetch(redirectUrl, {
                        headers: {
                            'Referer': referer,
                            'User-Agent': userAgent,
                        },
                    });
                    console.log('Redirect response:', {
                        status: redirectResponse.status,
                        statusText: redirectResponse.statusText,
                        contentLength: redirectResponse.headers.get('content-length'),
                    });

                    if (redirectResponse.ok) {
                        const contentDisposition = redirectResponse.headers.get('content-disposition');
                        let filename = `beatmap_${sid}.osz`;

                        if (contentDisposition) {
                            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                            if (filenameMatch && filenameMatch[1]) {
                                filename = filenameMatch[1].replace(/['"]/g, '');
                            }
                        }

                        const headers = new Headers();
                        headers.set('Content-Type', 'application/octet-stream');
                        headers.set('Content-Disposition', `attachment; filename="${filename}"`);
                        headers.set('Cache-Control', 'no-cache');

                        console.log('Download successful after redirect:', { sid, filename, contentLength: redirectResponse.headers.get('content-length') });

                        return new NextResponse(redirectResponse.body, {
                            status: 200,
                            headers,
                        });
                    }
                }
            }

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
