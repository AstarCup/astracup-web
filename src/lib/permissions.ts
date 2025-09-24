import { get } from '@vercel/edge-config';


export interface UserPermissions {
    isMapSelector: boolean;
    isReplayTester: boolean;
    isAdmin: boolean;
}

/**
 * 统一的权限验证函数
 * 从Edge Config获取用户的权限信息
 */
export async function getUserPermissions(osuId: string): Promise<UserPermissions> {
    try {
        console.log('=== PERMISSION CHECK DEBUG ===');
        console.log('Checking permissions for osuId:', osuId);

        // 检查是否为管理员
        const isAdmin = await verifyAdminAuth(osuId);
        console.log('isAdmin result:', isAdmin);

        // 检查是否为选图组成员
        let isMapSelector = false;
        try {
            let mapSelectionTeam: string[] = [];

            if (process.env.EDGE_CONFIG) {
                const teamConfig = await get('mapSelectionTeam');
                console.log('mapSelectionTeam from Edge Config:', teamConfig);
                if (teamConfig && Array.isArray(teamConfig)) {
                    mapSelectionTeam = teamConfig.filter((id): id is string =>
                        typeof id === 'string' && id.trim() !== ''
                    );
                }
            }

            if (mapSelectionTeam.length === 0 && process.env.MAP_SELECTION_TEAM_IDS) {
                mapSelectionTeam = process.env.MAP_SELECTION_TEAM_IDS
                    .split(',')
                    .map(id => id.trim())
                    .filter(id => id !== '');
                console.log('mapSelectionTeam from env var:', mapSelectionTeam);
            }

            console.log('Final mapSelectionTeam:', mapSelectionTeam);

            const userIdStr = osuId.toString();
            const userIdNum = parseInt(osuId);

            isMapSelector = mapSelectionTeam.some(teamId => {
                const teamIdStr = teamId.toString();
                const teamIdNum = parseInt(teamId);
                return userIdStr === teamIdStr || userIdNum === teamIdNum;
            });
            console.log('isMapSelector result:', isMapSelector);
        } catch (error) {
            console.warn('Error checking map selector permissions:', error);
        }

        // 检查是否为测图组成员（上传replay权限）
        let isReplayTester = false;
        try {
            let replayAccessUsers: string[] = [];

            if (process.env.EDGE_CONFIG) {
                const replayConfig = await get('replayAccessUsers');
                console.log('replayAccessUsers from Edge Config:', replayConfig);
                if (replayConfig && Array.isArray(replayConfig)) {
                    replayAccessUsers = replayConfig.filter((id): id is string =>
                        typeof id === 'string' && id.trim() !== ''
                    );
                }
            }

            if (replayAccessUsers.length === 0 && process.env.REPLAY_ACCESS_USER_IDS) {
                replayAccessUsers = process.env.REPLAY_ACCESS_USER_IDS
                    .split(',')
                    .map(id => id.trim())
                    .filter(id => id !== '');
                console.log('replayAccessUsers from env var:', replayAccessUsers);
            }

            console.log('Final replayAccessUsers:', replayAccessUsers);

            const userIdStr = osuId.toString();
            const userIdNum = parseInt(osuId);

            isReplayTester = replayAccessUsers.some(userId => {
                const userIdStr2 = userId.toString();
                const userIdNum2 = parseInt(userId);
                return userIdStr === userIdStr2 || userIdNum === userIdNum2;
            });
            console.log('isReplayTester result:', isReplayTester);
        } catch (error) {
            console.warn('Error checking replay tester permissions:', error);
        }

        const result = {
            isMapSelector,
            isReplayTester,
            isAdmin
        };
        console.log('Final permissions result:', result);
        console.log('=== END PERMISSION CHECK DEBUG ===');

        return result;
    } catch (error) {
        console.error('Error getting user permissions:', error);
        return {
            isMapSelector: false,
            isReplayTester: false,
            isAdmin: false
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
        console.log('verifyAdminAuth called for osuId:', osuId);

        let adminList: string[] = [];

        // 优先尝试从Edge Config获取管理员列表
        if (process.env.EDGE_CONFIG) {
            console.log('EDGE_CONFIG found, trying to get admin config');
            const adminConfig = await get('admin');
            console.log('admin config from Edge Config:', adminConfig);
            if (adminConfig && Array.isArray(adminConfig)) {
                adminList = adminConfig.filter((id): id is string =>
                    typeof id === 'string' && id.trim() !== ''
                );
            }
        }

        console.log('adminList after Edge Config:', adminList);

        // 如果Edge Config没有数据，尝试从环境变量获取
        if (adminList.length === 0 && process.env.ADMIN_IDS) {
            console.log('ADMIN_IDS env var found:', process.env.ADMIN_IDS);
            adminList = process.env.ADMIN_IDS
                .split(',')
                .map(id => id.trim())
                .filter(id => id !== '');
        }

        console.log('adminList after env var:', adminList);

        // 如果都没有数据，使用默认测试ID（开发环境）
        if (adminList.length === 0) {
            if (process.env.NODE_ENV === 'development') {
                console.log('Using default admin ID for development');
                adminList = ['2']; // peppy的ID作为示例
            } else {
                // 在生产环境中，如果没有配置，不允许任何用户作为管理员
                console.log('No admin config found in production, denying all admin access');
                return false;
            }
        }

        console.log('final adminList:', adminList);

        // 检查osu ID是否在管理员列表中
        const userIdStr = osuId.toString();
        const userIdNum = parseInt(osuId);

        const isAdmin = adminList.some(adminId => {
            const adminIdStr = adminId.toString();
            const adminIdNum = parseInt(adminId);
            return adminIdStr === userIdStr || adminIdNum === userIdNum;
        });

        console.log('verifyAdminAuth result for', osuId, ':', isAdmin);
        return isAdmin;
    } catch (error) {
        console.error('Error verifying admin auth:', error);
        return false;
    }
}

/**
 * 检查用户是否有特定权限
 */
export async function hasPermission(osuId: string, permission: keyof UserPermissions): Promise<boolean> {
    const permissions = await getUserPermissions(osuId);
    return permissions[permission];
}