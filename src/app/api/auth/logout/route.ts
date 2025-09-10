import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        await fetch(`${origin}/api/session/clear`, {
            method: 'POST',
            headers: { cookie: request.headers.get('cookie') || '' }
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
