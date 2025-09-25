import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createMatchSchedule, getPlayerMatchups, updatePlayerMatchupStatus } from '@/lib/mysql-registrations';

export async function POST(request: NextRequest) {
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

        const createdBy = session.osuId;
        if (!createdBy) {
            return NextResponse.json({
                success: false,
                error: '用户ID无效'
            }, { status: 400 });
        }

        const body = await request.json();
        const { matchup_id } = body;

        // 验证必填字段
        if (!matchup_id) {
            return NextResponse.json({
                success: false,
                error: '缺少对战ID'
            }, { status: 400 });
        }

        // 获取对战信息
        const matchups = await getPlayerMatchups();
        const matchup = matchups.find(m => m.id === parseInt(matchup_id));

        if (!matchup) {
            return NextResponse.json({
                success: false,
                error: '对战信息不存在'
            }, { status: 404 });
        }

        if (matchup.status !== 'available') {
            return NextResponse.json({
                success: false,
                error: '该对战已被预约或已完成'
            }, { status: 400 });
        }

        // 检查用户是否是参赛选手之一
        if (createdBy !== matchup.player1_osuId && createdBy !== matchup.player2_osuId) {
            return NextResponse.json({
                success: false,
                error: '您不是该对战的参赛选手'
            }, { status: 403 });
        }

        // 创建比赛预约
        const scheduleData = {
            room_id: matchup.room_id,
            player1_osuId: matchup.player1_osuId,
            player1_username: matchup.player1_username,
            player2_osuId: matchup.player2_osuId,
            player2_username: matchup.player2_username,
            red_score: 0,
            blue_score: 0,
            status: 'pending' as const,
            created_by: createdBy
        };

        const scheduleId = await createMatchSchedule(scheduleData);

        // 更新对战状态为已预约
        await updatePlayerMatchupStatus(parseInt(matchup_id), 'scheduled');

        return NextResponse.json({
            success: true,
            scheduleId,
            message: '比赛预约创建成功'
        });
    } catch (error) {
        console.error('Error creating match schedule:', error);
        return NextResponse.json({
            success: false,
            error: '创建比赛预约失败'
        }, { status: 500 });
    }
}