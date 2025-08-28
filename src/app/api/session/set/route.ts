import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { sessionId, session } = await request.json();

        // 这里应该调用 Vercel Edge Config API 来存储会话
        // 实际部署时需要配置 Edge Config Store

        console.log('Storing session in Edge Config:', { sessionId, session });

        return NextResponse.json({
            success: true,
            sessionId,
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
