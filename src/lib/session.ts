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

// 这些函数现在通过API端点实现，避免在lib目录中使用next/headers
// 实际的会话管理在 /app/api/session/ 下的API端点中处理
