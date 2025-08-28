import { NextRequest, NextResponse } from 'next/server';
import { getOsuToken, getOsuUserInfo } from '@/lib/osu-auth';
import { addRegistration, isUserRegistered } from '@/lib/registrations';
import { setUserSession } from '@/lib/session';

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
            return NextResponse.redirect(new URL('/register?error=already_registered', request.url));
        }

        // 存储注册信息到 Blob Store
        await addRegistration({
            osuId: userInfo.id.toString(),
            username: userInfo.username,
            inGameName: userInfo.username,
            discord: "",
            timezone: "UTC+8",
            availability: "",
            avatar_url: userInfo.avatar_url,
            pp: userInfo.statistics?.pp || 0,
            global_rank: userInfo.statistics?.global_rank || null,
            country_rank: userInfo.statistics?.country_rank || null,
        });

        // 设置用户会话
        await setUserSession({
            osuId: userInfo.id.toString(),
            username: userInfo.username,
            avatar_url: userInfo.avatar_url,
            pp: userInfo.statistics?.pp || 0,
            global_rank: userInfo.statistics?.global_rank || null,
            country_rank: userInfo.statistics?.country_rank || null,
        });

        // 重定向到首页（已登录状态）
        return NextResponse.redirect(new URL('/', request.url));

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
