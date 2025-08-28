import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const session = await request.json();
        const cookieStore = await cookies();

        // 设置会话cookie，有效期30天 - 动态配置域名
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions: any = {
            httpOnly: false, // 允许JavaScript访问
            secure: isProduction, // 生产环境使用HTTPS
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        };

        // 只在生产环境设置域名
        if (isProduction) {
            cookieOptions.domain = '.rino.ink'; // 允许所有子域名访问
        }

        cookieStore.set('astra_session', JSON.stringify(session), cookieOptions);

        console.log('Session stored in cookie');

        return NextResponse.json({
            success: true,
            message: 'Session stored successfully'
        });
    } catch (error) {
        console.error('Error storing session:', error);

        return NextResponse.json({
            success: false,
            error: 'Failed to store session'
        }, { status: 500 });
    }
}
