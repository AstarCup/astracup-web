import { getTournamentSettings } from '@/lib/mysql-registrations';

// 会话管理接口定义
export interface UserSession {
    osuId: string;
    username: string;
    avatar_url: string;
    pp: number;
    global_rank: number | null;
    country_rank: number | null;
    country: string;
    cover?: {
        custom_url: string | null;
        url: string;
        id: string | null;
    };
}

export interface UserPermissions {
    isMapSelector: boolean;
    isReplayTester: boolean;
    isAdmin: boolean;
    isStreamer: boolean;
    isReferee: boolean;
}

export async function getUserPermissions(osuId: string): Promise<UserPermissions> {
    try {

        // 在客户端环境中，通过API路由获取权限数据
        if (typeof window !== 'undefined') {
            try {
                // 获取完整的用户权限
                const permissionsResponse = await fetch('/api/user-permissions');

                if (permissionsResponse.ok) {
                    const data = await permissionsResponse.json();
                    if (data.success && data.permissions) {
                        return data.permissions;
                    }
                }
            } catch (apiError) {
                console.warn('Failed to fetch permissions via API:', apiError);
            }
        }

        // 从 MySQL 获取比赛设置中的权限组信息
        const tournamentSettings = await getTournamentSettings();

        // 检查是否为管理员
        const isAdmin = await verifyAdminAuth(osuId);

        // 检查是否为选图组成员
        let isMapSelector = false;
        if (tournamentSettings?.map_selection_group) {
            const mapSelectionTeam = tournamentSettings.map_selection_group;
            const userIdStr = osuId.toString();
            const userIdNum = parseInt(osuId);

            isMapSelector = mapSelectionTeam.some((teamId: string | number) => {
                const teamIdStr = teamId.toString();
                const teamIdNum = typeof teamId === 'string' ? parseInt(teamId) : teamId;
                return userIdStr === teamIdStr || userIdNum === teamIdNum;
            });
        }

        // 检查是否为测图组成员（上传replay权限）
        let isReplayTester = false;
        if (tournamentSettings?.map_testing_group) {
            const replayAccessUsers = tournamentSettings.map_testing_group;
            const userIdStr = osuId.toString();
            const userIdNum = parseInt(osuId);

            isReplayTester = replayAccessUsers.some((userId: string | number) => {
                const userIdStr2 = userId.toString();
                const userIdNum2 = typeof userId === 'string' ? parseInt(userId) : userId;
                return userIdStr === userIdStr2 || userIdNum === userIdNum2;
            });
        }

        // 检查是否为直播员
        let isStreamer = false;
        if (tournamentSettings?.streamer_group) {
            const streamerGroup = tournamentSettings.streamer_group;
            const userIdStr = osuId.toString();
            const userIdNum = parseInt(osuId);

            isStreamer = streamerGroup.some((userId: string | number) => {
                const userIdStr2 = userId.toString();
                const userIdNum2 = typeof userId === 'string' ? parseInt(userId) : userId;
                return userIdStr === userIdStr2 || userIdNum === userIdNum2;
            });
        }

        // 检查是否为裁判员
        let isReferee = false;
        if (tournamentSettings?.referee_group) {
            const refereeGroup = tournamentSettings.referee_group;
            const userIdStr = osuId.toString();
            const userIdNum = parseInt(osuId);

            isReferee = refereeGroup.some((userId: string | number) => {
                const userIdStr2 = userId.toString();
                const userIdNum2 = typeof userId === 'string' ? parseInt(userId) : userId;
                return userIdStr === userIdStr2 || userIdNum === userIdNum2;
            });
        }

        const result = {
            isMapSelector,
            isReplayTester,
            isAdmin,
            isStreamer,
            isReferee
        };
        return result;
    } catch (error) {
        console.error('Error getting user permissions:', error);
        return {
            isMapSelector: false,
            isReplayTester: false,
            isAdmin: false,
            isStreamer: false,
            isReferee: false
        };
    }
}

/**
 * 检查用户是否有选图权限
 */
export async function verifyMapSelectionAuth(osuId: string): Promise<boolean> {
    const permissions = await getUserPermissions(osuId);
    return permissions.isMapSelector || permissions.isAdmin;
}

/**
 * 检查用户是否有上传replay权限
 */
export async function verifyReplayAuth(osuId: string): Promise<boolean> {
    const permissions = await getUserPermissions(osuId);
    return permissions.isReplayTester || permissions.isAdmin;
}

/**
 * 检查用户是否有管理员权限
 */
export async function verifyAdminAuth(osuId: string): Promise<boolean> {
    try {

        // 在客户端环境中，通过API路由获取权限数据
        if (typeof window !== 'undefined') {
            try {
                const response = await fetch('/api/admin-check', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ osuId }),
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.isAdmin || false;
                }
            } catch (apiError) {
                console.warn('Failed to fetch admin status via API:', apiError);
            }
        }

        // 服务端环境或API调用失败时的fallback
        let adminList: string[] = [];

        // 从 MySQL 获取比赛设置中的管理员组信息
        const tournamentSettings = await getTournamentSettings();
        if (tournamentSettings?.admin_group) {
            adminList = tournamentSettings.admin_group;
        }

        // 如果MySQL没有数据，尝试从环境变量获取
        if (adminList.length === 0 && process.env.ADMIN_IDS) {
            adminList = process.env.ADMIN_IDS
                .split(',')
                .map(id => id.trim())
                .filter(id => id !== '');
        }

        console.log('adminList after env var:', adminList);


        // 检查osu ID是否在管理员列表中
        const userIdStr = osuId.toString();
        const userIdNum = parseInt(osuId);

        const isAdmin = adminList.some(adminId => {
            const adminIdStr = adminId.toString();
            const adminIdNum = parseInt(adminId);
            return adminIdStr === userIdStr || adminIdNum === userIdNum;
        });


        return isAdmin;
    } finally {
    }
}

/**
 * 检查用户是否有特定权限
 */
export async function hasPermission(osuId: string, permission: keyof UserPermissions): Promise<boolean> {
    const permissions = await getUserPermissions(osuId);
    return permissions[permission];
}