import { NextRequest, NextResponse } from 'next/server';
import { updateStaffRoomAssignmentStatus, deleteStaffRoomAssignment } from '@/lib/mysql-registrations';
import { getUserPermissions } from '@/lib/permissions';

// PUT /api/staff-room-assignments/[id] - 更新staff房间分配状态 (已禁用，从match_schedules表获取)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return NextResponse.json({ error: 'Staff分配现在从比赛预约表自动获取，不支持手动更新' }, { status: 403 });
}

// DELETE /api/staff-room-assignments/[id] - 删除staff房间分配 (已禁用，从match_schedules表获取)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return NextResponse.json({ error: 'Staff分配现在从比赛预约表自动获取，不支持手动删除' }, { status: 403 });
}