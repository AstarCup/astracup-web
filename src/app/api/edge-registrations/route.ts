import { NextRequest, NextResponse } from 'next/server';
import { addTournamentRegistration, getTournamentRegistrations } from '@/lib/mysql-registrations';

// GET /api/edge-registrations - 获取所有报名数据
export async function GET() {
    try {
        const registrations = await getTournamentRegistrations();
        return NextResponse.json({ registrations });
    } catch (error) {
        console.error('Error in GET /api/edge-registrations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch registrations' },
            { status: 500 }
        );
    }
}

// POST /api/edge-registrations - 添加新报名
export async function POST(request: NextRequest) {
    try {
        const registrationData = await request.json();

        const success = await addTournamentRegistration(registrationData);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { error: 'Failed to save registration' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error in POST /api/edge-registrations:', error);
        return NextResponse.json(
            { error: 'Failed to save registration' },
            { status: 500 }
        );
    }
}
