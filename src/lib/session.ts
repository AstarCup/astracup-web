// 简单的会话管理（使用cookie）
import { cookies } from 'next/headers';

export interface UserSession {
    osuId: string;
    username: string;
    avatar_url: string;
    pp: number;
    global_rank: number | null;
    country_rank: number | null;
}

// 检查用户是否为管理员（AeCw）
export function isAdminUser(session: UserSession | null): boolean {
    return session?.username === 'AeCw';
}

const SESSION_COOKIE_NAME = 'astra_session';

export async function setUserSession(session: UserSession) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
    });
}

export async function getUserSession(): Promise<UserSession | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
        return null;
    }

    try {
        return JSON.parse(sessionCookie.value);
    } catch {
        return null;
    }
}

export async function clearUserSession() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}
