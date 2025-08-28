import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('astra_session');

        if (!sessionCookie?.value) {
            console.log('No session cookie found');
            return NextResponse.json({
                success: true,
                session: null
            });
        }

        console.log('Session cookie found:', sessionCookie.value);

        try {
            const session = JSON.parse(sessionCookie.value);
            console.log('Retrieved session from cookie:', session);
            return NextResponse.json({
                success: true,
                session: session
            });
        } catch (parseError) {
            console.error('Error parsing session cookie:', parseError, 'Cookie value:', sessionCookie.value);
            return NextResponse.json({
                success: true,
                session: null
            });
        }
    } catch (error) {
        console.error('Error retrieving session:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to retrieve session'
        }, { status: 500 });
    }
}
