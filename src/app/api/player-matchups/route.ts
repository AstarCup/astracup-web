import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPlayerMatchups, createPlayerMatchup, updatePlayerMatchupStatus, deletePlayerMatchup } from '@/lib/mysql-registrations';
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

        const userOsuId = session.osuId;
        if (!userOsuId) {
            return NextResponse.json({
                success: false,
                error: '用户ID无效'
            }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const roomId = searchParams.get('roomId');

        if (!roomId) {
            return NextResponse.json({
                success: false,
                error: '缺少房间ID'
            }, { status: 400 });
        }

        const matchups = await getPlayerMatchups(parseInt(roomId));

        return NextResponse.json({
            success: true,
            matchups
        });
    } catch (error) {
        console.error('Error getting player matchups:', error);
        return NextResponse.json({
            success: false,
            error: '获取玩家对战列表失败'
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

        // 检查用户权限（只有管理员可以创建对战列表）
        const permissions = await getUserPermissions(createdBy);
        if (!permissions.isAdmin) {
            return NextResponse.json({
                success: false,
                error: '权限不足'
            }, { status: 403 });
        }

        const body = await request.json();
        const {
            room_id,
            player1_osuId,
            player1_username,
            player2_osuId,
            player2_username
        } = body;

        // 验证必填字段
        if (!room_id || !player1_osuId || !player1_username || !player2_osuId || !player2_username) {
            return NextResponse.json({
                success: false,
                error: '缺少必要字段'
            }, { status: 400 });
        }

        // 创建玩家对战
        const matchupData = {
            room_id: parseInt(room_id),
            player1_osuId,
            player1_username,
            player2_osuId,
            player2_username,
            status: 'available' as const,
            created_by: createdBy
        };

        const matchupId = await createPlayerMatchup(matchupData);

        return NextResponse.json({
            success: true,
            matchupId,
            message: '玩家对战创建成功'
        });
    } catch (error) {
        console.error('Error creating player matchup:', error);
        return NextResponse.json({
            success: false,
            error: '创建玩家对战失败'
        }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
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

        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({
                success: false,
                error: '缺少必要字段'
            }, { status: 400 });
        }

        // 检查用户权限
        const permissions = await getUserPermissions(userOsuId);
        const isAdmin = permissions.isAdmin;

        // 只有管理员可以更新状态
        if (!isAdmin) {
            return NextResponse.json({
                success: false,
                error: '权限不足'
            }, { status: 403 });
        }

        const success = await updatePlayerMatchupStatus(id, status);

        if (!success) {
            return NextResponse.json({
                success: false,
                error: '更新失败'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: '状态更新成功'
        });
    } catch (error) {
        console.error('Error updating player matchup status:', error);
        return NextResponse.json({
            success: false,
            error: '更新状态失败'
        }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({
                success: false,
                error: '缺少对战ID'
            }, { status: 400 });
        }

        // 检查用户权限
        const permissions = await getUserPermissions(userOsuId);
        const isAdmin = permissions.isAdmin;

        // 只有管理员可以删除对战
        if (!isAdmin) {
            return NextResponse.json({
                success: false,
                error: '权限不足'
            }, { status: 403 });
        }

        const success = await deletePlayerMatchup(parseInt(id));

        if (!success) {
            return NextResponse.json({
                success: false,
                error: '删除失败'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: '删除成功'
        });
    } catch (error) {
        console.error('Error deleting player matchup:', error);
        return NextResponse.json({
            success: false,
            error: '删除失败'
        }, { status: 500 });
    }
}