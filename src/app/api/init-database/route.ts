import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initDatabase } from '@/lib/mysql-registrations';
import { getUserPermissions } from '@/lib/permissions';

export async function POST(request: NextRequest) {
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

        // 检查用户权限（只有管理员可以初始化数据库）
        const permissions = await getUserPermissions(userOsuId);
        if (!permissions.isAdmin) {
            return NextResponse.json({
                success: false,
                error: '权限不足，只有管理员可以初始化数据库'
            }, { status: 403 });
        }

        // 初始化数据库
        await initDatabase();

        return NextResponse.json({
            success: true,
            message: '数据库初始化完成'
        });
    } catch (error) {
        console.error('Error initializing database:', error);
        return NextResponse.json({
            success: false,
            error: '数据库初始化失败: ' + (error as Error).message
        }, { status: 500 });
    }
}