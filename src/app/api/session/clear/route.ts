import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { sessionId } = await request.json();

        if (!sessionId) {
            return NextResponse.json({
                success: false,
                error: 'Session ID is required'
            }, { status: 400 });
        }

        // 这里应该调用 Vercel Edge Config API 来清除会话
        // 实际部署时需要配置 Edge Config Store

        // console.log('Clearing session from Edge Config:', sessionId);

        return NextResponse.json({
            success: true,
            message: 'Session cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing session:', error);

        return NextResponse.json({
            success: false,
            error: 'Failed to clear session'
        }, { status: 500 });
    }
}
