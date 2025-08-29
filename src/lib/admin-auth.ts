// 管理员权限验证工具
import { NextRequest } from 'next/server';
import { isAdminUser, UserSession } from './session';

// 从请求中获取会话信息
async function getSessionFromRequest(request: NextRequest): Promise<UserSession | null> {
    try {
        // 从cookie获取会话信息
        const sessionCookie = request.cookies.get('astra_session');
        if (!sessionCookie) {
            return null;
        }

        const session = JSON.parse(sessionCookie.value);
        return session;
    } catch (error) {
        console.error('Error parsing session cookie:', error);
        return null;
    }
}

// 验证管理员权限
export async function requireAdminAuth(request: NextRequest): Promise<{
    success: boolean;
    session?: UserSession;
    error?: string
}> {
    try {
        const session = await getSessionFromRequest(request);

        if (!session) {
            return {
                success: false,
                error: '未登录，请先登录'
            };
        }

        if (!isAdminUser(session)) {
            return {
                success: false,
                error: '权限不足，需要管理员权限'
            };
        }

        return {
            success: true,
            session
        };
    } catch (error) {
        console.error('Admin auth error:', error);
        return {
            success: false,
            error: '权限验证失败'
        };
    }
}
