// edgeconfig.ts
// 用户权限列表配置，存储osu!id
export const replayAccessUsers: string[] = [
    // 示例 osu!id
    '1234567',
    '2345678',
    // ...更多id
];

export function hasReplayAccess(osuId: string): boolean {
    return replayAccessUsers.includes(osuId);
}
