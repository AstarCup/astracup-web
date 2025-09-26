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

// POST /api/staff-room-assignments - 创建staff房间分配 (已禁用，从match_schedules表获取)
export async function POST(request: NextRequest) {
    return NextResponse.json({ error: 'Staff分配现在从比赛预约表自动获取，不支持手动创建' }, { status: 403 });
}