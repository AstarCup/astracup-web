import { getTournamentSettings } from '@/lib/mysql-registrations';
import type { TournamentSettings } from '@/app/components/ConfigProvider';

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
    isCommentator: boolean;
}

export async function getUserPermissions(osuId: string, tournamentSettings?: TournamentSettings): Promise<UserPermissions> {
    try {
        console.log('[Permissions] 开始获取用户权限，osuId:', osuId, '类型:', typeof osuId);

        // 如果没有提供配置，则从数据库获取
        let settings = tournamentSettings;
        if (!settings) {
            console.log('[Permissions] 从数据库获取tournament settings');
            settings = await getTournamentSettings();
            console.log('[Permissions] 数据库返回的settings:', settings);
        }

        if (!settings) {
            console.log('[Permissions] 未找到tournament settings，返回默认权限');
            return {
                isAdmin: false,
                isMapSelector: false,
                isReplayTester: false,
                isStreamer: false,
                isReferee: false,
                isCommentator: false
            };
        }

        console.log('[Permissions] Tournament settings获取成功');
        console.log('[Permissions] admin_group类型:', typeof settings.admin_group, '值:', settings.admin_group);
        console.log('[Permissions] admin_group包含检查:', settings.admin_group?.includes(osuId), 'osuId:', osuId);

        // 检查是否为管理员
        const isAdmin = settings.admin_group?.includes(osuId) || false;
        console.log('[Permissions] 管理员检查结果:', isAdmin, 'admin_group:', settings.admin_group);

        // 检查是否为图池选择者
        const isMapSelector = settings.map_selection_group?.includes(osuId) || false;

        // 检查是否为回放测试员
        const isReplayTester = settings.map_testing_group?.includes(osuId) || false;

        // 检查是否为直播员
        const isStreamer = settings.streamer_group?.includes(osuId) || false;

        // 检查是否为裁判
        const isReferee = settings.referee_group?.includes(osuId) || false;

        // 检查是否为解说员
        const isCommentator = settings.commentator_group?.includes(osuId) || false;

        const result = {
            isAdmin,
            isMapSelector,
            isReplayTester,
            isStreamer,
            isReferee,
            isCommentator
        };

        console.log('[Permissions] 权限检查完成:', result);

        return result;

    } catch (error) {
        console.error('[Permissions] 获取用户权限时发生错误:', error);
        return {
            isAdmin: false,
            isMapSelector: false,
            isReplayTester: false,
            isStreamer: false,
            isReferee: false,
            isCommentator: false
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
        const tournamentSettings = await getTournamentSettings();
        if (tournamentSettings?.admin_group) {
            return tournamentSettings.admin_group.includes(osuId);
        }

        // 如果MySQL没有数据，尝试从环境变量获取
        if (process.env.ADMIN_IDS) {
            const adminList = process.env.ADMIN_IDS
                .split(',')
                .map(id => id.trim())
                .filter(id => id !== '');
            return adminList.includes(osuId);
        }

        return false;
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