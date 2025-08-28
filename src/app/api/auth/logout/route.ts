import { NextResponse } from 'next/server';
import { clearUserSession } from '@/lib/session';

export async function POST() {
    try {
        await clearUserSession();

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
