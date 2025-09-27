import { NextRequest, NextResponse } from 'next/server';
import { getUserPermissions } from '@/lib/permissions';
import { getTournamentSettings, updateTournamentSettings } from '@/lib/mysql-registrations';

export async function GET(_request: NextRequest) {
    try {
        const settings = await getTournamentSettings();

        if (!settings) {
            return NextResponse.json({
                success: false,
                error: '未找到比赛设置'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            settings
        });

    } catch (error) {
        console.error('Error getting tournament settings:', error);
        return NextResponse.json({
            success: false,
            error: '获取比赛设置失败'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // 获取用户session
        const cookieStore = await request.cookies;
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

        // 检查用户权限（只有管理员可以修改设置）
        const permissions = await getUserPermissions(osuId);
        if (!permissions.isAdmin) {
            return NextResponse.json({
                success: false,
                error: '权限不足'
            }, { status: 403 });
        }

        // 获取请求数据
        const settingsData = await request.json();

        // 验证必填字段
        if (!settingsData.tournament_name) {
            return NextResponse.json({
                success: false,
                error: '比赛名称不能为空'
            }, { status: 400 });
        }

        // 更新设置
        const success = await updateTournamentSettings(settingsData);

        if (!success) {
            return NextResponse.json({
                success: false,
                error: '更新比赛设置失败'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: '比赛设置更新成功'
        });

    } catch (error) {
        console.error('Error updating tournament settings:', error);
        return NextResponse.json({
            success: false,
            error: '更新比赛设置失败'
        }, { status: 500 });
    }
}