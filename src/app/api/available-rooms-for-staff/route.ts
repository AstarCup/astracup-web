import { NextRequest, NextResponse } from 'next/server';
import { getAvailableRoomsForStaff } from '@/lib/mysql-registrations';

// GET /api/available-rooms-for-staff - 获取可供staff选择的房间列表
export async function GET(_request: NextRequest) {
    try {
        const rooms = await getAvailableRoomsForStaff();
        return NextResponse.json({ rooms });
    } catch (error) {
        console.error('Error fetching available rooms for staff:', error);
        return NextResponse.json({ error: '获取可用房间失败' }, { status: 500 });
    }
}