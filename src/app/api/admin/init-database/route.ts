import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initDatabase, getTournamentSettings } from '@/lib/mysql-registrations';


// 验证用户权限的辅助函数 - 与项目中其他API保持一致
async function verifyUserAuth(): Promise<{ authorized: boolean; osuId?: string; username?: string }> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('astra_session');

        if (sessionCookie?.value) {
            try {
                const session = JSON.parse(sessionCookie.value);
                if (session.osuId) {
                    return {
                        authorized: true,
                        osuId: session.osuId,
                        username: session.username || `User_${session.osuId}`
                    };
                }
            } catch (parseError) {
                console.error('Error parsing session cookie:', parseError);
            }
        }

        // 如果没有有效的session，则拒绝
        return { authorized: false };
    } catch (error) {
        console.error('Error verifying user auth:', error);
        return { authorized: false };
    }
}

// 验证管理员权限 - 与项目中其他API保持一致
async function verifyAdminAuth(osuId: string): Promise<boolean> {
    if (!osuId) {
        return false;
    }

    let adminList: string[] = [];

    // 优先尝试从数据库获取管理员列表
    try {
        const tournamentSettings = await getTournamentSettings();
        if (tournamentSettings?.admin_group && Array.isArray(tournamentSettings.admin_group)) {
            adminList = tournamentSettings.admin_group.filter((id: any): id is string =>
                typeof id === 'string' && id.trim() !== ''
            );
        }
    } catch (dbError) {
        console.warn('Failed to fetch admin list from database:', dbError);
    }

    // 检查osu ID是否在管理员列表中
    const userIdStr = osuId.toString();
    const userIdNum = parseInt(osuId);

    return adminList.some(adminId => {
        const adminIdStr = adminId.toString();
        const adminIdNum = parseInt(adminId);
        return adminIdStr === userIdStr || adminIdNum === userIdNum;
    });
}

export async function POST(request: NextRequest) {
    try {
        // 验证用户权限 - 使用标准的session验证
        const authResult = await verifyUserAuth();
        if (!authResult.authorized || !authResult.osuId) {
            return NextResponse.json(
                { success: false, error: '请先登录' },
                { status: 401 }
            );
        }

        // 验证管理员权限
        const isAdmin = await verifyAdminAuth(authResult.osuId);
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: '权限不足，只有管理员可以执行此操作' },
                { status: 403 }
            );
        }

        // 初始化数据库
        await initDatabase();

        return NextResponse.json({
            success: true,
            message: '数据库初始化成功'
        });

    } catch (error) {
        console.error('数据库初始化错误:', error);
        return NextResponse.json(
            { success: false, error: '数据库初始化失败' },
            { status: 500 }
        );
    }
}
