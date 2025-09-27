import { NextRequest, NextResponse } from 'next/server';
import { getStaffRoomAssignments, createStaffRoomAssignment, deleteStaffRoomAssignment, getRoomStaffAssignments } from '@/lib/mysql-registrations';
import { getUserPermissions } from '@/lib/permissions';

// GET /api/staff-room-assignments - 获取所有staff房间分配
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const roomId = searchParams.get('roomId');

        if (roomId) {
            // 获取指定房间的staff分配
            const assignments = await getRoomStaffAssignments(parseInt(roomId));
            return NextResponse.json({ assignments });
        } else {
            // 获取所有staff房间分配
            const assignments = await getStaffRoomAssignments();
            return NextResponse.json({ assignments });
        }
    } catch (error) {
        console.error('Error fetching staff room assignments:', error);
        return NextResponse.json({ error: '获取staff房间分配失败' }, { status: 500 });
    }
}

// POST /api/staff-room-assignments - 创建staff房间分配申请
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { room_id, staff_osuId, staff_username, staff_role, assigned_by } = body;

        if (!room_id || !staff_osuId || !staff_username || !staff_role) {
            return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
        }

        // 检查用户权限
        const userPermissions = await getUserPermissions(staff_osuId.toString());
        if (!userPermissions.isReferee && !userPermissions.isStreamer && !userPermissions.isAdmin) {
            return NextResponse.json({ error: '没有权限申请staff角色' }, { status: 403 });
        }

        // 检查是否已经申请过这个房间的这个角色
        const existingAssignments = await getRoomStaffAssignments(room_id);
        const existingApplication = existingAssignments.find(a =>
            a.staff_osuId === staff_osuId && a.staff_role === staff_role
        );

        if (existingApplication) {
            return NextResponse.json({ error: '已经申请过这个角色的分配了' }, { status: 400 });
        }

        // 创建分配申请
        const assignmentId = await createStaffRoomAssignment({
            room_id,
            staff_osuId,
            staff_username,
            staff_role,
            assigned_by: assigned_by || staff_osuId,
            status: 'confirmed'
        });

        return NextResponse.json({
            success: true,
            assignmentId,
            message: '已成功加入房间'
        });
    } catch (error) {
        console.error('Error creating staff room assignment:', error);
        return NextResponse.json({ error: '创建staff房间分配失败' }, { status: 500 });
    }
}

// DELETE /api/staff-room-assignments - 撤销staff房间分配
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const assignmentId = searchParams.get('assignmentId');

        if (!assignmentId) {
            return NextResponse.json({ error: '缺少分配ID参数' }, { status: 400 });
        }

        // 删除分配记录
        const success = await deleteStaffRoomAssignment(parseInt(assignmentId));

        if (success) {
            return NextResponse.json({
                success: true,
                message: '已撤销房间分配'
            });
        } else {
            return NextResponse.json({ error: '撤销失败，分配记录不存在' }, { status: 404 });
        }
    } catch (error) {
        console.error('Error deleting staff room assignment:', error);
        return NextResponse.json({ error: '撤销staff房间分配失败' }, { status: 500 });
    }
}