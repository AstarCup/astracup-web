import { NextRequest, NextResponse } from 'next/server';
import { getStaffRoomAssignments, createStaffRoomAssignment, updateStaffRoomAssignmentStatus, deleteStaffRoomAssignment, getRoomStaffAssignments } from '@/lib/mysql-registrations';
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

// POST /api/staff-room-assignments - 创建staff房间分配
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { room_id, staff_osuId, staff_username, staff_role, assigned_by } = body;

        if (!room_id || !staff_osuId || !staff_username || !staff_role || !assigned_by) {
            return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
        }

        // 验证用户权限 - 允许管理员分配他人，或staff为自己申请
        const permissions = await getUserPermissions(assigned_by);
        const isSelfAssignment = assigned_by === staff_osuId;

        if (!permissions.isAdmin && !isSelfAssignment) {
            return NextResponse.json({ error: '权限不足' }, { status: 403 });
        }

        // 如果是staff自己申请，检查是否有staff权限
        if (isSelfAssignment && !permissions.isStreamer && !permissions.isReferee && !permissions.isAdmin) {
            return NextResponse.json({ error: '您没有staff权限，无法申请参加房间' }, { status: 403 });
        }

        const assignmentId = await createStaffRoomAssignment({
            room_id,
            staff_osuId,
            staff_username,
            staff_role,
            status: 'pending',
            assigned_by
        });

        return NextResponse.json({ assignmentId }, { status: 201 });
    } catch (error) {
        console.error('Error creating staff room assignment:', error);
        return NextResponse.json({ error: '创建staff房间分配失败' }, { status: 500 });
    }
}