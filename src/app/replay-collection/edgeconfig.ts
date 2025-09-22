// edgeconfig.ts
// 用户权限列表配置，从API获取osu!id列表

// 为了向后兼容，提供同步版本（返回空数组，需要异步调用）
export const replayAccessUsers: string[] = [];

export async function hasReplayAccess(osuId: string): Promise<boolean> {
    try {
        const response = await fetch('/api/replay-access');
        if (!response.ok) {
            console.warn('Failed to fetch replay access config');
            return false;
        }

        const data = await response.json();
        if (!data.success) {
            console.warn('API returned error:', data.error);
            return false;
        }

        const replayAccessUsers = data.replayAccessUsers || [];
        return replayAccessUsers.includes(osuId);
    } catch (error) {
        console.warn('Error fetching replay access users:', error);
        return false;
    }
}
