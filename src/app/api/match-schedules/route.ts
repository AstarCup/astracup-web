import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserMatchSchedules, getAllMatchSchedules } from '@/lib/mysql-registrations';
import { getUserPermissions } from '@/lib/permissions';

export async function GET(_request: NextRequest) {
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

        // 检查用户权限
        const permissions = await getUserPermissions(osuId);

        let schedules;
        if (permissions.isAdmin) {
            // 管理员可以看到所有比赛预约
            schedules = await getAllMatchSchedules();
        } else {
            // 普通用户只能看到自己的比赛预约
            schedules = await getUserMatchSchedules(osuId);
        }

        return NextResponse.json({
            success: true,
            schedules
        });
    } catch (error) {
        console.error('Error fetching match schedules:', error);
        return NextResponse.json({
            success: false,
            error: '获取比赛预约失败'
        }, { status: 500 });
    }
}