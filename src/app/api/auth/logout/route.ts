import { NextResponse } from 'next/server';

export async function POST() {
    try {
        // 清除会话通过API调用
        await fetch('/api/session/clear', {
            method: 'POST'
        });

        return NextResponse.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);

        return NextResponse.json({
            success: false,
            error: 'Failed to logout'
        }, { status: 500 });
    }
}
