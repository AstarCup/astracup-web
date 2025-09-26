import { NextRequest, NextResponse } from 'next/server';
import { updateStaffRoomAssignmentStatus, deleteStaffRoomAssignment } from '@/lib/mysql-registrations';
import { getUserPermissions } from '@/lib/permissions';

// PUT /api/staff-room-assignments/[id] - 更新staff房间分配状态
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await request.json();
        const { status, staff_osuId } = body;

        if (!status || !['pending', 'confirmed', 'declined'].includes(status)) {
            return NextResponse.json({ error: '无效的状态' }, { status: 400 });
        }

        // 验证用户权限 - 允许管理员更新任何分配，或staff只更新自己的分配
        if (staff_osuId) {
            const permissions = await getUserPermissions(staff_osuId);

            // 如果不是管理员，检查是否是staff自己更新自己的分配
            if (!permissions.isAdmin) {
                // 需要先获取分配信息来验证所有者
                const assignments = await import('@/lib/mysql-registrations').then(m => m.getStaffRoomAssignments());
                const assignment = assignments.find(a => a.id === parseInt(id));

                if (!assignment || assignment.staff_osuId !== staff_osuId) {
                    return NextResponse.json({ error: '只能更新自己的分配' }, { status: 403 });
                }

                // Staff只能将状态改为declined（取消参加）
                if (status !== 'declined') {
                    return NextResponse.json({ error: '您只能取消参加申请' }, { status: 403 });
                }
            }
        }

        const success = await updateStaffRoomAssignmentStatus(parseInt(id), status);

        if (!success) {
            return NextResponse.json({ error: '更新失败，分配不存在' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating staff room assignment:', error);
        return NextResponse.json({ error: '更新staff房间分配失败' }, { status: 500 });
    }
}

// DELETE /api/staff-room-assignments/[id] - 删除staff房间分配
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        // 这里可以添加权限验证，暂时允许管理员删除
        const success = await deleteStaffRoomAssignment(parseInt(id));

        if (!success) {
            return NextResponse.json({ error: '删除失败，分配不存在' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting staff room assignment:', error);
        return NextResponse.json({ error: '删除staff房间分配失败' }, { status: 500 });
    }
}