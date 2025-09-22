// edgeconfig.ts
// 用户权限列表配置，从EDGE_CONFIG获取osu!id列表

// 由于这是客户端代码，我们需要通过API获取数据
// 这里定义一个函数来异步获取权限列表
export async function getReplayAccessUsers(): Promise<string[]> {
    try {
        const edgeConfigUrl = process.env.EDGE_CONFIG;
        if (!edgeConfigUrl) {
            console.warn('EDGE_CONFIG environment variable not set');
            return [];
        }

        const response = await fetch(edgeConfigUrl);
        if (!response.ok) {
            console.warn('Failed to fetch EDGE_CONFIG');
            return [];
        }

        const config = await response.json();
        return config.replayAccessUsers || [];
    } catch (error) {
        console.warn('Error fetching replay access users:', error);
        return [];
    }
}

// 为了向后兼容，提供同步版本（返回空数组，需要异步调用）
export const replayAccessUsers: string[] = [];

export async function hasReplayAccess(osuId: string): Promise<boolean> {
    const users = await getReplayAccessUsers();
    return users.includes(osuId);
}
