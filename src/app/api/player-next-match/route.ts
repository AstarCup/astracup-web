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

        // 找到第一个可用的对战（按创建时间排序）
        const availableMatchup = userMatchups
            .filter(matchup => matchup.status === 'available')
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

        return NextResponse.json({
            success: true,
            nextMatch: availableMatchup ? {
                id: availableMatchup.id,
                opponent: availableMatchup.player1_osuId === userOsuId ? {
                    osuId: availableMatchup.player2_osuId,
                    username: availableMatchup.player2_username
                } : {
                    osuId: availableMatchup.player1_osuId,
                    username: availableMatchup.player1_username
                },
                status: availableMatchup.status
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