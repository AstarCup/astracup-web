import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMatchRooms, createMatchRoom, getMatchRoomsWithSchedules } from '@/lib/mysql-registrations';
import { getUserPermissions } from '@/lib/permissions';

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

        const osuId = session.osuId;
        if (!osuId) {
            return NextResponse.json({
                success: false,
                error: '用户ID无效'
            }, { status: 400 });
        }

        // 检查是否请求包含比赛预约信息的房间数据
        const { searchParams } = new URL(request.url);
        const withSchedules = searchParams.get('withSchedules') === 'true';

        let rooms;
        if (withSchedules) {
            // 获取包含比赛预约信息的房间数据
            rooms = await getMatchRoomsWithSchedules();
        } else {
            // 获取基本房间信息
            rooms = await getMatchRooms();
        }

        return NextResponse.json({
            success: true,
            rooms
        });
    } catch (error) {
        console.error('Error getting match rooms:', error);
        return NextResponse.json({
            success: false,
            error: '获取比赛房间失败'
        }, { status: 500 });
    }
}

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

        // 检查用户权限（只有管理员可以创建比赛房间）
        const permissions = await getUserPermissions(createdBy);
        if (!permissions.isAdmin) {
            return NextResponse.json({
                success: false,
                error: '权限不足，只有管理员可以创建比赛房间'
            }, { status: 403 });
        }

        const body = await request.json();
        const {
            room_name,
            round_number,
            match_date,
            match_time,
            match_number,
            max_participants,
            description
        } = body;

        // 验证必填字段
        if (!room_name || !round_number || !match_date || !match_time || !match_number) {
            return NextResponse.json({
                success: false,
                error: '缺少必要字段'
            }, { status: 400 });
        }

        // 创建比赛房间
        const roomData = {
            room_name,
            round_number: parseInt(round_number),
            match_date,
            match_time,
            match_number: parseInt(match_number),
            max_participants: max_participants ? parseInt(max_participants) : 2,
            status: 'open' as const,
            description: description || '',
            created_by: createdBy
        };

        const roomId = await createMatchRoom(roomData);

        return NextResponse.json({
            success: true,
            roomId,
            message: '比赛房间创建成功'
        });
    } catch (error) {
        console.error('Error creating match room:', error);
        return NextResponse.json({
            success: false,
            error: '创建比赛房间失败'
        }, { status: 500 });
    }
}