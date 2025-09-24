import { get } from '@vercel/edge-config';
import { isAdminUser } from './session';

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
        // 检查是否为管理员
        const isAdmin = await verifyAdminAuth(osuId);

        // 检查是否为选图组成员
        let isMapSelector = false;
        try {
            let mapSelectionTeam: string[] = [];

            if (process.env.EDGE_CONFIG) {
                const teamConfig = await get('mapSelectionTeam');
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
            }

            if (mapSelectionTeam.length === 0) {
                mapSelectionTeam = ['2']; // 默认测试ID
            }

            const userIdStr = osuId.toString();
            const userIdNum = parseInt(osuId);

            isMapSelector = mapSelectionTeam.some(teamId => {
                const teamIdStr = teamId.toString();
                const teamIdNum = parseInt(teamId);
                return userIdStr === teamIdStr || userIdNum === teamIdNum;
            });
        } catch (error) {
            console.warn('Error checking map selector permissions:', error);
        }

        // 检查是否为测图组成员（上传replay权限）
        let isReplayTester = false;
        try {
            const replayAccessUsers = await get('replayAccessUsers');
            if (replayAccessUsers && Array.isArray(replayAccessUsers)) {
                const userIdStr = osuId.toString();
                isReplayTester = replayAccessUsers.some((id: any) => {
                    const idStr = id.toString();
                    return userIdStr === idStr;
                });
            }
        } catch (error) {
            console.warn('Error checking replay tester permissions:', error);
        }

        return {
            isMapSelector,
            isReplayTester,
            isAdmin
        };
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
        let adminList: string[] = [];

        // 优先尝试从Edge Config获取管理员列表
        if (process.env.EDGE_CONFIG) {
            const adminConfig = await get('admin');
            if (adminConfig && Array.isArray(adminConfig)) {
                adminList = adminConfig.filter((id): id is string =>
                    typeof id === 'string' && id.trim() !== ''
                );
            }
        }

        // 如果Edge Config没有数据，尝试从环境变量获取
        if (adminList.length === 0 && process.env.ADMIN_IDS) {
            adminList = process.env.ADMIN_IDS
                .split(',')
                .map(id => id.trim())
                .filter(id => id !== '');
        }

        // 如果都没有数据，使用默认测试ID（开发环境）
        if (adminList.length === 0 && process.env.NODE_ENV === 'development') {
            adminList = ['2']; // peppy的ID作为示例
        }

        // 检查osu ID是否在管理员列表中
        const userIdStr = osuId.toString();
        const userIdNum = parseInt(osuId);

        return adminList.some(adminId => {
            const adminIdStr = adminId.toString();
            const adminIdNum = parseInt(adminId);
            return adminIdStr === userIdStr || adminIdNum === userIdNum;
        });
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