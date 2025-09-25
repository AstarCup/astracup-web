import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createMatchSchedule } from '@/lib/mysql-registrations';

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
        const {
            round_number,
            match_date,
            match_time,
            match_number,
            player1_osuId,
            player1_username,
            player2_osuId,
            player2_username
        } = body;

        // 验证必填字段
        if (!round_number || !match_date || !match_time || !match_number ||
            !player1_osuId || !player1_username || !player2_osuId || !player2_username) {
            return NextResponse.json({
                success: false,
                error: '缺少必要字段'
            }, { status: 400 });
        }

        // 创建比赛预约
        const scheduleData = {
            round_number: parseInt(round_number),
            match_date,
            match_time,
            match_number: parseInt(match_number),
            player1_osuId,
            player1_username,
            player2_osuId,
            player2_username,
            red_score: 0,
            blue_score: 0,
            status: 'pending' as const,
            created_by: createdBy
        };

        const scheduleId = await createMatchSchedule(scheduleData);

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