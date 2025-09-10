import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // 创建响应并删除session cookie
        const response = NextResponse.json({
            success: true,
            message: 'Logged out successfully'
        });

        // 删除session cookie
        response.cookies.set('astra_session', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            expires: new Date(0)
        });

        return response;
    } catch (error) {
        console.error('Logout error:', error);

        return NextResponse.json({
            success: false,
            error: 'Failed to logout'
        }, { status: 500 });
    }
}
