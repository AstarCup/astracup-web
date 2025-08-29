import { NextRequest, NextResponse } from 'next/server';
import { addRegistration } from '@/lib/registrations';

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

// 临时内存存储（开发环境使用，生产环境应使用Edge Config）
let memoryRegistrations: TournamentRegistration[] = [];

// 获取所有报名数据
async function getRegistrations(): Promise<TournamentRegistration[]> {
    try {
        // 优先从数据库获取数据
        const { getRegistrations: getDBRegistrations } = await import('@/lib/registrations');
        const dbRegistrations = await getDBRegistrations();

        if (dbRegistrations.length > 0) {
            // 转换数据库数据格式
            return dbRegistrations.map(reg => ({
                osuId: reg.osuId,
                username: reg.username,
                avatar_url: reg.avatar_url,
                pp: reg.pp,
                global_rank: reg.global_rank,
                country_rank: reg.country_rank,
                teamName: reg.inGameName || reg.username,
                seedPosition: null,
                agreedToTerms: true,
                registeredAt: reg.registeredAt
            }));
        }

        // 如果没有数据库数据，使用内存存储
        return memoryRegistrations;
    } catch (error) {
        console.error('Error getting registrations from database:', error);
        // 出错时使用内存存储
        return memoryRegistrations;
    }
}

// 保存报名数据
async function saveRegistration(registration: TournamentRegistration): Promise<boolean> {
    try {
        const registrations = await getRegistrations();

        // 检查是否已存在
        const existingIndex = registrations.findIndex(reg => reg.osuId === registration.osuId);

        if (existingIndex >= 0) {
            // 更新现有报名
            registrations[existingIndex] = registration;
        } else {
            // 添加新报名
            registrations.push(registration);
        }

        // 更新内存存储
        memoryRegistrations = registrations;

        // console.log('Registration saved:', registration);
        // console.log('Total registrations:', memoryRegistrations.length);

        return true;
    } catch (error) {
        console.error('Error saving registration:', error);
        return false;
    }
}

export async function GET() {
    try {
        const registrations = await getRegistrations();
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

        const success = await saveRegistration(newRegistration);

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to save registration to Edge Config' },
                { status: 500 }
            );
        }

        // 同时保存到数据库
        try {
            await addRegistration({
                osuId: newRegistration.osuId,
                username: newRegistration.username,
                inGameName: newRegistration.username,
                timezone: "UTC+8",
                availability: "",
                avatar_url: newRegistration.avatar_url,
                pp: newRegistration.pp,
                global_rank: newRegistration.global_rank,
                country_rank: newRegistration.country_rank,
                approved: false,
                approvedAt: null,
            });
            // console.log('Registration also saved to database');
        } catch (dbError) {
            console.error('Error saving to database:', dbError);
            // 不中断主流程，仅记录错误
        }

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
