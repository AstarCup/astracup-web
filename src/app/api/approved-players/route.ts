import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRegistrations } from '@/lib/mysql-registrations';
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

        // 检查用户权限（只有管理员可以查看已审核玩家列表）
        const permissions = await getUserPermissions(userOsuId);
        if (!permissions.isAdmin) {
            return NextResponse.json({
                success: false,
                error: '权限不足'
            }, { status: 403 });
        }

        // 获取所有注册信息
        const allRegistrations = await getRegistrations();

        // 过滤出已审核通过的玩家
        const approvedPlayers = allRegistrations
            .filter(registration => registration.approved)
            .map(registration => ({
                osuId: registration.osuId,
                username: registration.username,
                inGameName: registration.inGameName || registration.username,
                avatar_url: registration.avatar_url,
                pp: registration.pp,
                global_rank: registration.global_rank,
                country_rank: registration.country_rank,
                country: registration.country
            }));

        return NextResponse.json({
            success: true,
            players: approvedPlayers
        });
    } catch (error) {
        console.error('Error getting approved players:', error);
        return NextResponse.json({
            success: false,
            error: '获取已审核玩家列表失败'
        }, { status: 500 });
    }
}