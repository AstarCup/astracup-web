// 使用 Vercel Edge Config 的会话管理
import { get } from '@vercel/edge-config';

export interface UserSession {
    osuId: string;
    username: string;
    avatar_url: string;
    pp: number;
    global_rank: number | null;
    country_rank: number | null;
}

// 生成唯一的会话ID
function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 设置用户会话（使用Edge Config）
export async function setUserSession(session: UserSession): Promise<string> {
    const sessionId = generateSessionId();

    // 在实际项目中，这里应该调用Edge Config API来存储会话
    // 由于Edge Config需要特定的Vercel配置，这里使用模拟实现
    console.log('Setting session in Edge Config:', { sessionId, session });

    // 在实际部署中，应该使用：
    // await fetch('/api/session/set', {
    //   method: 'POST',
    //   body: JSON.stringify({ sessionId, session })
    // });

    return sessionId;
}

// 获取用户会话（使用Edge Config）
export async function getUserSession(sessionId: string): Promise<UserSession | null> {
    if (!sessionId) return null;

    // 在实际项目中，这里应该调用Edge Config API来获取会话
    // 由于Edge Config需要特定的Vercel配置，这里使用模拟实现
    console.log('Getting session from Edge Config:', sessionId);

    // 在实际部署中，应该使用：
    // const response = await fetch(`/api/session/get?sessionId=${sessionId}`);
    // const data = await response.json();
    // return data.session;

    return null;
}

// 清除用户会话（使用Edge Config）
export async function clearUserSession(sessionId: string): Promise<void> {
    if (!sessionId) return;

    // 在实际项目中，这里应该调用Edge Config API来清除会话
    console.log('Clearing session from Edge Config:', sessionId);

    // 在实际部署中，应该使用：
    // await fetch('/api/session/clear', {
    //   method: 'POST',
    //   body: JSON.stringify({ sessionId })
    // });
}
