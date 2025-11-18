import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserMatchSchedules, getAllMatchSchedules } from '@/lib/mysql-registrations';
import { getUserPermissions } from '@/lib/permissions';

export async function GET(_request: NextRequest) {
    try {
        // 获取用户session
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('astra_session');

        let isLoggedIn = false;
        let osuId: string | null = null;
        let permissions = null;

        if (sessionCookie?.value) {
            try {
                const session = JSON.parse(sessionCookie.value);
                osuId = session.osuId;
                if (osuId) {
                    isLoggedIn = true;
                    permissions = await getUserPermissions(osuId);
                }
            } catch {
                // 会话无效，继续作为未登录用户处理
            }
        }

        let schedules;
        if (isLoggedIn && permissions?.isAdmin) {
            // 管理员可以看到所有比赛预约
            schedules = await getAllMatchSchedules();
        } else if (isLoggedIn && osuId) {
            // 登录用户可以看到自己的比赛预约
            schedules = await getUserMatchSchedules(osuId);
        } else {
            // 未登录用户可以看到所有公开的比赛预约（不包含私人信息）
            schedules = await getAllMatchSchedules();
        }

        // 调试日志：检查返回的status字段
        console.log('[DEBUG API] Returning schedules:', schedules);
        if (schedules && schedules.length > 0) {
            schedules.forEach((schedule: any, index: number) => {
                console.log(`[DEBUG API] Schedule ${index}: id=${schedule.id}, status=${schedule.status}, type=${typeof schedule.status}`);
            });
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
