import { NextRequest, NextResponse } from 'next/server';
import { getOsuToken, getOsuUserInfo } from '@/lib/osu-auth';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
            (process.env.NODE_ENV === 'production' ? 'https://asc.rino.ink' : 'http://localhost:3000');
        const fullBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
        return NextResponse.redirect(new URL('/register?error=auth_failed', fullBaseUrl));
    }

    if (!code) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
            (process.env.NODE_ENV === 'production' ? 'https://asc.rino.ink' : 'http://localhost:3000');
        const fullBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
        return NextResponse.redirect(new URL('/register?error=no_code', fullBaseUrl));
    }

    try {
        // 获取访问令牌
        const tokenData = await getOsuToken(code);
        const { access_token } = tokenData;

        // 获取用户信息
        const userInfo = await getOsuUserInfo(access_token);


        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
            (process.env.NODE_ENV === 'production' ? 'https://asc.rino.ink' : 'http://localhost:3000');

        const fullBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
        const redirectResponse = NextResponse.redirect(new URL('/', fullBaseUrl));

        // 设置会话cookie
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions: Record<string, string | number | boolean> = {
            httpOnly: false,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        };

        if (isProduction) {
            cookieOptions.domain = '.rino.ink';
        }

        redirectResponse.cookies.set('astra_session', JSON.stringify({
            osuId: userInfo.id.toString(),
            username: userInfo.username,
            avatar_url: userInfo.avatar_url,
            pp: userInfo.statistics?.pp || 0,
            global_rank: userInfo.statistics?.global_rank || null,
            country_rank: userInfo.statistics?.country_rank || null,
            country: userInfo.country_code || '',
            cover: userInfo.cover ? {
                custom_url: userInfo.cover.custom_url || null,
                url: userInfo.cover.url || '',
                id: userInfo.cover.id || null,
            } : undefined,
            access_token: access_token, // 保存访问令牌用于API调用
        }), cookieOptions);

        return redirectResponse;

    } catch (error) {
        console.error('OAuth callback error details:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

        // 添加更详细的错误信息用于调试
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
            (process.env.NODE_ENV === 'production' ? 'https://asc.rino.ink' : 'http://localhost:3000');
        const fullBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
        return NextResponse.redirect(new URL('/register?error=token_failed', fullBaseUrl));
    }
}
