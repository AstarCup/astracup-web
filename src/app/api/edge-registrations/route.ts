import { NextRequest, NextResponse } from 'next/server';

export interface TournamentRegistration {
    osuId: string;
    username: string;
    avatar_url: string;
    pp: number;
    global_rank: number | null;
    country_rank: number | null;
    teamName: string;
    seedPosition: number | null;
    agreedToTerms: boolean;
    registeredAt: string;
}

// 临时内存存储（实际部署时应使用Edge Config）
let memoryRegistrations: TournamentRegistration[] = [];

// 获取所有报名数据
function getRegistrations(): TournamentRegistration[] {
    return memoryRegistrations;
}

// 保存报名数据
function saveRegistration(registration: TournamentRegistration): void {
    const existingIndex = memoryRegistrations.findIndex(reg => reg.osuId === registration.osuId);

    if (existingIndex >= 0) {
        memoryRegistrations[existingIndex] = registration;
    } else {
        memoryRegistrations.push(registration);
    }
}

export async function GET() {
    try {
        const registrations = getRegistrations();
        return NextResponse.json({ registrations });
    } catch (error) {
        console.error('Error in GET /api/edge-registrations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch registrations' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // 验证必要字段
        if (!body.osuId || !body.username || !body.avatar_url || body.pp === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const newRegistration: TournamentRegistration = {
            osuId: body.osuId,
            username: body.username,
            avatar_url: body.avatar_url,
            pp: body.pp,
            global_rank: body.global_rank || null,
            country_rank: body.country_rank || null,
            teamName: body.teamName || '',
            seedPosition: body.seedPosition || null,
            agreedToTerms: body.agreedToTerms || false,
            registeredAt: new Date().toISOString()
        };

        saveRegistration(newRegistration);

        return NextResponse.json({
            success: true,
            message: 'Registration saved successfully'
        });

    } catch (error) {
        console.error('Error in POST /api/edge-registrations:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
