import { NextRequest, NextResponse } from 'next/server';
import { getOsuToken, getOsuUserInfo } from '@/lib/osu-auth';
import { addRegistration, isUserRegistered } from '@/lib/registrations';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/register?error=auth_failed', request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/register?error=no_code', request.url));
    }

    try {
        // 获取访问令牌
        const tokenData = await getOsuToken(code);
        const { access_token } = tokenData;

        // 获取用户信息
        const userInfo = await getOsuUserInfo(access_token);

        // 检查是否已注册
        const isRegistered = await isUserRegistered(userInfo.id.toString());

        if (isRegistered) {
            // 已注册用户，设置会话并重定向到首页
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
            const sessionResponse = await fetch(`${baseUrl}/api/session/set`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    osuId: userInfo.id.toString(),
                    username: userInfo.username,
                    avatar_url: userInfo.avatar_url,
                    pp: userInfo.statistics?.pp || 0,
                    global_rank: userInfo.statistics?.global_rank || null,
                    country_rank: userInfo.statistics?.country_rank || null,
                })
            });

            // 获取会话设置的cookie并设置到重定向响应中
            const sessionCookie = sessionResponse.headers.get('set-cookie');
            const redirectResponse = NextResponse.redirect(new URL('/', request.url));

            if (sessionCookie) {
                redirectResponse.headers.set('Set-Cookie', sessionCookie);
            }

            return redirectResponse;
        }

        // 存储注册信息到数据库
        await addRegistration({
            osuId: userInfo.id.toString(),
            username: userInfo.username,
            inGameName: userInfo.username,
            timezone: "UTC+8",
            availability: "",
            avatar_url: userInfo.avatar_url,
            pp: userInfo.statistics?.pp || 0,
            global_rank: userInfo.statistics?.global_rank || null,
            country_rank: userInfo.statistics?.country_rank || null,
        });

        // 设置用户会话
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
        const sessionResponse = await fetch(`${baseUrl}/api/session/set`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                osuId: userInfo.id.toString(),
                username: userInfo.username,
                avatar_url: userInfo.avatar_url,
                pp: userInfo.statistics?.pp || 0,
                global_rank: userInfo.statistics?.global_rank || null,
                country_rank: userInfo.statistics?.country_rank || null,
            })
        });

        // 获取会话设置的cookie并设置到重定向响应中
        const sessionCookie = sessionResponse.headers.get('set-cookie');
        const redirectResponse = NextResponse.redirect(new URL('/', request.url));

        if (sessionCookie) {
            redirectResponse.headers.set('Set-Cookie', sessionCookie);
        }

        return redirectResponse;

    } catch (error) {
        console.error('OAuth callback error details:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

        // 添加更详细的错误信息用于调试
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
        }

        return NextResponse.redirect(new URL('/register?error=token_failed', request.url));
    }
}
