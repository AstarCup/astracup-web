// 会话管理接口定义
export interface UserSession {
    osuId: string;
    username: string;
    avatar_url: string;
    pp: number;
    global_rank: number | null;
    country_rank: number | null;
    country: string;
}

// 检查用户是否为管理员（AeCw）
export function isAdminUser(session: UserSession | null): boolean {
    return session?.username === 'AeCw';
}
