import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
    try {
        // 创建响应并删除session cookie
        const response = NextResponse.json({
            success: true,
            message: 'Session cleared successfully'
        });

        // 删除session cookie - 需要匹配设置时的配置
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions: Record<string, string | number | boolean | Date> = {
            httpOnly: false, // 匹配设置时的配置
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax', // 匹配设置时的配置
            path: '/',
            expires: new Date(0)
        };

        // 在生产环境匹配域名配置
        if (isProduction) {
            cookieOptions.domain = '.rino.ink';
        }

        response.cookies.set('astra_session', '', cookieOptions);

        return response;
    } catch (error) {
        console.error('Error clearing session:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to clear session'
        }, { status: 500 });
    }
}
