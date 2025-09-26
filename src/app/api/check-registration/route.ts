import { NextRequest, NextResponse } from 'next/server';
import { isUserRegistered } from '@/lib/mysql-registrations';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const osuId = searchParams.get('osuId');

        if (!osuId) {
            return NextResponse.json(
                { error: 'osuId parameter is required' },
                { status: 400 }
            );
        }

        const registered = await isUserRegistered(osuId);

        return NextResponse.json({
            osuId,
            registered
        });

    } catch (error) {
        console.error('Error checking registration status:', error);
        return NextResponse.json(
            { error: 'Failed to check registration status' },
            { status: 500 }
        );
    }
}
