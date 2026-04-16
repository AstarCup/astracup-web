import { getTournamentSettings } from "@/lib/prisma-registrations";
import type { TournamentSettings } from "@/app/components/ConfigProvider";
import { prisma } from "./prisma";

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
  isplayer: boolean;
  isadmin: boolean;
}

// 从设置数组中获取特定键的值
function getSettingValue(settings: TournamentSetting[], key: string): any[] {
  const setting = settings.find((s) => s.setting_key === key);
  if (!setting?.setting_value) return [];

  try {
    const value = JSON.parse(setting.setting_value);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export async function getUserPermissions(
  osuId: string,
  tournamentSettings?: TournamentSettings,
): Promise<UserPermissions> {
  try {
    // 首先从user表获取用户的userGroup
    let userGroup: "player" | "admin" = "player";
    try {
      const user = await prisma.user.findFirst({
        where: { osuId },
        select: { userGroup: true },
      });
      if (user?.userGroup) {
        userGroup = user.userGroup;
      }
    } catch (userError) {
      console.warn("[Permissions] 无法从user表获取用户组信息:", userError);
    }

    // 如果没有提供配置，则从数据库获取
    let settingsArray: TournamentSetting[] = [];
    if (!tournamentSettings) {
      settingsArray = await getTournamentSettings();
    } else {
      // 如果提供了 TournamentSettings 对象，需要转换为 TournamentSetting[] 格式
      // 这里简化处理，直接使用空数组
      settingsArray = [];
    }

    // 检查是否为管理员（完全使用userGroup字段）
    const isAdmin = userGroup === "admin";

    // 检查是否为图池选择者
    let isMapSelector = false;
    if (settingsArray && settingsArray.length > 0) {
      const mapSelectionGroup = getSettingValue(
        settingsArray,
        "map_selection_group",
      );
      isMapSelector = mapSelectionGroup.includes(osuId);
    }

    // 检查是否为回放测试员
    let isReplayTester = false;
    if (settingsArray && settingsArray.length > 0) {
      const mapTestingGroup = getSettingValue(
        settingsArray,
        "map_testing_group",
      );
      isReplayTester = mapTestingGroup.includes(osuId);
    }

    // 检查是否为直播员
    let isStreamer = false;
    if (settingsArray && settingsArray.length > 0) {
      const streamerGroup = getSettingValue(settingsArray, "streamer_group");
      isStreamer = streamerGroup.includes(osuId);
    }

    // 检查是否为裁判
    let isReferee = false;
    if (settingsArray && settingsArray.length > 0) {
      const refereeGroup = getSettingValue(settingsArray, "referee_group");
      isReferee = refereeGroup.includes(osuId);
    }

    // 检查是否为解说员
    let isCommentator = false;
    if (settingsArray && settingsArray.length > 0) {
      const commentatorGroup = getSettingValue(
        settingsArray,
        "commentator_group",
      );
      isCommentator = commentatorGroup.includes(osuId);
    }

    // 检查用户是否已报名
    let isRegistered = false;
    try {
      const user = await prisma.user.findFirst({
        where: { osuId },
        select: { registrationStatus: true },
      });
      isRegistered =
        user?.registrationStatus === "registered" ||
        user?.registrationStatus === "approved";
    } catch (userError) {
      console.warn("[Permissions] 无法获取用户报名状态:", userError);
    }

    const result = {
      isplayer: !isAdmin && isRegistered, // 只有已报名的非管理员用户才是玩家
      isadmin: isAdmin, // 管理员不需要报名就可以有管理权限
    };

    return result;
  } catch (error) {
    console.error("[Permissions] 获取用户权限时发生错误:", error);
    return {
      isplayer: false,
      isadmin: false,
    };
  }
}

/**
 * 检查用户是否有选图权限
 */
export async function verifyMapSelectionAuth(osuId: string): Promise<boolean> {
  const permissions = await getUserPermissions(osuId);
  return permissions.isadmin;
}

/**
 * 检查用户是否有上传replay权限
 */
export async function verifyReplayAuth(osuId: string): Promise<boolean> {
  const permissions = await getUserPermissions(osuId);
  return permissions.isadmin;
}

/**
 * 检查用户是否有管理员权限
 */
export async function verifyAdminAuth(osuId: string): Promise<boolean> {
  try {
    // 从user表获取用户的userGroup
    const user = await prisma.user.findFirst({
      where: { osuId },
      select: { userGroup: true },
    });

    // 管理员不需要报名就可以访问管理功能
    return user?.userGroup === "admin";
  } catch (error) {
    console.error("[verifyAdminAuth] 验证管理员权限时发生错误:", error);
    return false;
  }
}

/**
 * 检查用户是否有特定权限
 */
export async function hasPermission(
  osuId: string,
  permission: keyof UserPermissions,
): Promise<boolean> {
  const permissions = await getUserPermissions(osuId);
  return permissions[permission];
}

/**
 * 检查用户是否已报名当前赛季
 */
export async function isUserRegisteredForTournament(
  osuId: string,
): Promise<boolean> {
  try {
    const user = await prisma.user.findFirst({
      where: { osuId },
      select: { registrationStatus: true },
    });

    // 用户已报名或已通过审核
    return (
      user?.registrationStatus === "registered" ||
      user?.registrationStatus === "approved"
    );
  } catch (error) {
    console.error(
      "[isUserRegisteredForTournament] 检查用户报名状态时发生错误:",
      error,
    );
    return false;
  }
}

/**
 * 检查用户是否已通过审核
 */
export async function isUserApprovedForTournament(
  osuId: string,
): Promise<boolean> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        osuId,
        registrationStatus: "approved",
      },
    });
    return !!user;
  } catch (error) {
    console.error(
      "[isUserApprovedForTournament] 检查用户审核状态时发生错误:",
      error,
    );
    return false;
  }
}

/**
 * 验证会话cookie
 */
export async function verifySessionCookie(
  osuId: string,
  cookieHash: string,
  userAgent?: string,
  ipAddress?: string,
): Promise<boolean> {
  try {
    // 查找有效的会话cookie
    const sessionCookie = await prisma.sessionCookie.findFirst({
      where: {
        osuId,
        cookieHash,
        expiresAt: {
          gt: new Date(), // 未过期
        },
      },
    });

    if (!sessionCookie) {
      return false;
    }

    // 可选：更新用户代理和IP地址
    if (userAgent || ipAddress) {
      await prisma.sessionCookie.update({
        where: { id: sessionCookie.id },
        data: {
          userAgent: userAgent || sessionCookie.userAgent,
          ipAddress: ipAddress || sessionCookie.ipAddress,
          updatedAt: new Date(),
        },
      });
    }

    return true;
  } catch (error) {
    console.error("[verifySessionCookie] 验证会话cookie时发生错误:", error);
    return false;
  }
}

/**
 * 创建会话cookie
 */
export async function createSessionCookie(
  osuId: string,
  cookieHash: string,
  expiresInHours: number = 24,
  userAgent?: string,
  ipAddress?: string,
): Promise<boolean> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    await prisma.sessionCookie.create({
      data: {
        osuId,
        cookieHash,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    return true;
  } catch (error) {
    console.error("[createSessionCookie] 创建会话cookie时发生错误:", error);
    return false;
  }
}

/**
 * 删除会话cookie
 */
export async function deleteSessionCookie(
  cookieHash: string,
): Promise<boolean> {
  try {
    await prisma.sessionCookie.deleteMany({
      where: { cookieHash },
    });
    return true;
  } catch (error) {
    console.error("[deleteSessionCookie] 删除会话cookie时发生错误:", error);
    return false;
  }
}

/**
 * 清理过期的会话cookie
 */
export async function cleanupExpiredSessionCookies(): Promise<number> {
  try {
    const result = await prisma.sessionCookie.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(), // 已过期
        },
      },
    });
    return result.count;
  } catch (error) {
    console.error(
      "[cleanupExpiredSessionCookies] 清理过期会话cookie时发生错误:",
      error,
    );
    return 0;
  }
}
