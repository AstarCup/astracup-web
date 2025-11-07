import { NextRequest, NextResponse } from 'next/server';
import { getRegistrations } from '@/lib/mysql-registrations';

export async function GET(_request: NextRequest) {
    try {
        // 获取所有注册信息
        const allRegistrations = await getRegistrations();

        // 格式化玩家信息
        const players = allRegistrations.map(registration => ({
            osuId: registration.osuId,
            username: registration.username,
            inGameName: registration.inGameName || registration.username,
            avatar_url: registration.avatar_url,
            pp: registration.pp,
            global_rank: registration.global_rank,
            country_rank: registration.country_rank,
            country: registration.country,
            approved: registration.approved
        }));

        return NextResponse.json({
            success: true,
            players
        });
    } catch (error) {
        console.error('Error getting players for obs overlay:', error);
        return NextResponse.json({
            success: false,
            error: '获取玩家列表失败'
        }, { status: 500 });
    }
}
