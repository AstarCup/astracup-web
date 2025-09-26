import { NextRequest, NextResponse } from 'next/server';
import { getUserRegistration } from '@/lib/mysql-registrations';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const osuId = searchParams.get('osuId');

        if (!osuId) {
            return NextResponse.json({
                success: false,
                error: 'Missing osuId parameter'
            }, { status: 400 });
        }

        const registration = await getUserRegistration(osuId);

        return NextResponse.json({
            success: true,
            registration
        });
    } catch (error) {
        console.error('Error fetching user registration:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch registration'
        }, { status: 500 });
    }
}