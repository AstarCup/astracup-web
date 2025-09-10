import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // 创建响应并删除session cookie
        const response = NextResponse.json({
            success: true,
            message: 'Session cleared successfully'
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
        console.error('Error clearing session:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to clear session'
        }, { status: 500 });
    }
}
