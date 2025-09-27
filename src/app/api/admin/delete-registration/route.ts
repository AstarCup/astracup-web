import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteRegistration } from '@/lib/mysql-registrations';
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

        // 检查用户权限（只有管理员可以删除注册）
        const permissions = await getUserPermissions(userOsuId);
        if (!permissions.isAdmin) {
            return NextResponse.json({
                success: false,
                error: '权限不足，只有管理员可以删除注册'
            }, { status: 403 });
        }

        // 获取请求体
        const body = await request.json();
        const { osuId } = body;

        if (!osuId) {
            return NextResponse.json({
                success: false,
                error: '缺少用户ID参数'
            }, { status: 400 });
        }

        // 删除用户注册
        const success = await deleteRegistration(osuId);

        if (success) {
            return NextResponse.json({
                success: true,
                message: '用户注册删除成功'
            });
        } else {
            return NextResponse.json({
                success: false,
                error: '删除失败，可能用户不存在'
            }, { status: 404 });
        }
    } catch (error) {
        console.error('Error deleting registration:', error);
        return NextResponse.json({
            success: false,
            error: '删除用户注册时发生错误'
        }, { status: 500 });
    }
}