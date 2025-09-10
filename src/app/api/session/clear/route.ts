import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // 无论是否有 sessionId，直接返回成功
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
