import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPlayerMatchups } from '@/lib/mysql-registrations';

export async function GET(request: NextRequest) {
    try {
        // 获取用户session
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('astra_session');

        if (!sessionCookie?.value) {
            return NextResponse.json({
                success: false,
                error: '未登录'
            }, { status: 401 });
        }

        let session;
        try {
            session = JSON.parse(sessionCookie.value);
        } catch {
            return NextResponse.json({
                success: false,
                error: '会话无效'
            }, { status: 401 });
        }

        const userOsuId = session.osuId;
        if (!userOsuId) {
            return NextResponse.json({
                success: false,
                error: '用户ID无效'
            }, { status: 400 });
        }

        // 获取所有玩家对战信息
        const allMatchups = await getPlayerMatchups();

        // 找到用户参与的对战
        const userMatchups = allMatchups.filter(matchup =>
            matchup.player1_osuId === userOsuId || matchup.player2_osuId === userOsuId
        );

        if (userMatchups.length === 0) {
            return NextResponse.json({
                success: true,
                nextMatch: null
            });
        }

        // 按房间轮次排序，找到下一轮的对战
        // 这里简化逻辑：假设轮次越小越早，取第一个可用的对战
        const sortedMatchups = userMatchups
            .filter(matchup => matchup.room && matchup.status === 'available')
            .sort((a, b) => {
                if (!a.room || !b.room) return 0;
                return a.room.round_number - b.room.round_number;
            });

        const nextMatch = sortedMatchups.length > 0 ? sortedMatchups[0] : null;

        return NextResponse.json({
            success: true,
            nextMatch: nextMatch ? {
                id: nextMatch.id,
                room: nextMatch.room,
                opponent: nextMatch.player1_osuId === userOsuId ? {
                    osuId: nextMatch.player2_osuId,
                    username: nextMatch.player2_username
                } : {
                    osuId: nextMatch.player1_osuId,
                    username: nextMatch.player1_username
                },
                status: nextMatch.status
            } : null
        });
    } catch (error) {
        console.error('Error getting player next match:', error);
        return NextResponse.json({
            success: false,
            error: '获取下一轮对战信息失败'
        }, { status: 500 });
    }
}