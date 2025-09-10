import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // 允许无 body 情况
        let sessionId = null;
        try {
            const body = await request.json();
            sessionId = body.sessionId;
        } catch {
            // 没有 body 也不报错
        }

        if (!sessionId) {
            return NextResponse.json({
                success: false,
                error: 'Session ID is required'
            }, { status: 400 });
        }


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
