// Prisma ORM 数据库存储实现
import { prisma } from "./prisma";
import type {
  User,
  MatchRoom,
  MatchSchedule,
  PlayerMatchup,
  Message,
  StaffRoomAssignment,
  MatchScore,
  TournamentSetting,
  MapSelection,
} from "@prisma/client";

// 类型定义
export interface TournamentUser {
  id: number;
  osuId: string;
  username: string;
  registeredAt: Date;
  avatar_url: string | null;
  pp: number | null;
  global_rank: number | null;
  country: string;
  country_rank: number | null;
  userGroup: "player" | "admin";
  registrationStatus: "not_registered" | "registered" | "approved";
  season: string | null;
  accuracy: number | null;
  stamina: number | null;
  firstSight: number | null;
  strategy: number | null;
  experience: number | null;
  customKey: string | null;
  customValue: number | null;
  cover_custom_url: string | null;
  cover_url: string | null;
  cover_id: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentRegistration {
  osuId: string;
  username: string;
  avatar_url: string;
  pp: number;
  global_rank: number | null;
  country_rank: number | null;
  country: string;
  teamName: string;
  seedPosition: number | null;
  agreedToTerms: boolean;
  approvedAt: string | null;
  registeredAt: string;
  accuracy: number | null;
  stamina: number | null;
  firstSight: number | null;
  strategy: number | null;
  experience: number | null;
  customKey: string | null;
  customValue: number | null;
  cover?: {
    custom_url: string | null;
    url: string;
    id: string | null;
  };
  registrationStatus: "not_registered" | "registered" | "approved";
}

// 初始化数据库表（如果需要）
export const initDatabase = async (): Promise<void> => {
  // Prisma 会自动处理表创建，这里可以添加一些初始化逻辑
  console.log("[Prisma] Database initialized");
};

// 获取连接池状态（Prisma 版本）
export const getPoolStatus = (): any => {
  return {
    status: "prisma_initialized",
    provider: "prisma",
    timestamp: new Date().toISOString(),
  };
};

// 用户相关函数
export const getUsers = async (): Promise<TournamentUser[]> => {
  const users = await prisma.user.findMany({
    orderBy: { registeredAt: "desc" },
  });

  return users.map((user) => ({
    ...user,
    userGroup: user.userGroup as "player" | "admin",
    registrationStatus: user.registrationStatus as
      | "not_registered"
      | "registered"
      | "approved",
  }));
};

export const isUserExists = async (osuId: string): Promise<boolean> => {
  const user = await prisma.user.findFirst({
    where: { osuId },
  });
  return !!user;
};

// 检查用户是否已报名当前赛季
export const isUserRegisteredForCurrentSeason = async (
  osuId: string,
  currentSeason: string,
): Promise<boolean> => {
  const user = await prisma.user.findFirst({
    where: { osuId },
  });

  if (!user || !user.season) {
    return false;
  }

  const seasons = user.season.split(",");
  return (
    seasons.includes(currentSeason) && user.registrationStatus === "registered"
  );
};

// 检查用户是否已通过审核
export const isUserApproved = async (osuId: string): Promise<boolean> => {
  const user = await prisma.user.findFirst({
    where: {
      osuId,
      registrationStatus: "approved",
    },
  });
  return !!user;
};

// 检查用户是否已报名（简化版，只检查registrationStatus）
export const isUserRegistered = async (osuId: string): Promise<boolean> => {
  const user = await prisma.user.findFirst({
    where: {
      osuId,
      registrationStatus: "registered",
    },
  });
  return !!user;
};

// 获取当前赛季设置
export const getCurrentSeason = async (): Promise<string> => {
  try {
    const setting = await prisma.tournamentSetting.findFirst({
      where: { setting_key: "current_season" },
    });

    console.log("getCurrentSeason - Found setting:", setting);

    if (setting && setting.setting_value) {
      // 清理值，移除可能的引号和空格
      const cleanedValue = setting.setting_value.replace(/['"]/g, "").trim();
      console.log(
        "getCurrentSeason - Cleaned value:",
        cleanedValue,
        "Original:",
        setting.setting_value,
      );

      if (cleanedValue) {
        console.log("getCurrentSeason - Returning:", cleanedValue);
        return cleanedValue;
      }
    }

    // 如果没有设置或值为空，返回默认值
    console.log(
      "getCurrentSeason - No valid setting found, returning default: s1",
    );
    return "s1";
  } catch (error) {
    console.error("Error getting current season:", error);
    return "s1";
  }
};

export const createOrUpdateUser = async (userData: {
  osuId: string;
  username: string;
  avatar_url?: string;
  pp?: number;
  global_rank?: number | null;
  country_rank?: number | null;
  country: string;
  cover_custom_url?: string;
  cover_url?: string;
  cover_id?: string;
}): Promise<number> => {
  // 检查用户是否已存在
  const existingUser = await prisma.user.findFirst({
    where: { osuId: userData.osuId },
  });

  if (existingUser) {
    // 更新现有用户信息
    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        username: userData.username,
        avatar_url: userData.avatar_url,
        pp: userData.pp,
        global_rank: userData.global_rank,
        country_rank: userData.country_rank,
        country: userData.country,
        cover_custom_url: userData.cover_custom_url,
        cover_url: userData.cover_url,
        cover_id: userData.cover_id,
        updatedAt: new Date(),
      },
    });
    return user.id;
  } else {
    // 创建新用户（注册但不报名）
    const user = await prisma.user.create({
      data: {
        osuId: userData.osuId,
        username: userData.username,
        avatar_url: userData.avatar_url,
        pp: userData.pp,
        global_rank: userData.global_rank,
        country_rank: userData.country_rank,
        country: userData.country,
        cover_custom_url: userData.cover_custom_url,
        cover_url: userData.cover_url,
        cover_id: userData.cover_id,
        registeredAt: new Date(),
        userGroup: "player",
        registrationStatus: "not_registered",
      },
    });
    return user.id;
  }
};

export const addTournamentRegistration = async (registrationData: {
  osuId: string;
  username: string;
  avatar_url?: string;
  pp?: number;
  global_rank?: number | null;
  country_rank?: number | null;
  country: string;
  season: string;
  accuracy?: number;
  stamina?: number;
  firstSight?: number;
  strategy?: number;
  experience?: number;
  customKey?: string;
  customValue?: number;
  cover_custom_url?: string;
  cover_url?: string;
  cover_id?: string;
}): Promise<number> => {
  console.log("addTournamentRegistration - Received data:", {
    osuId: registrationData.osuId,
    season: registrationData.season,
    hasSeason: !!registrationData.season,
  });

  // 检查用户是否已存在
  const existingUser = await prisma.user.findFirst({
    where: { osuId: registrationData.osuId },
  });

  if (existingUser) {
    console.log(
      "addTournamentRegistration - User exists, current season:",
      existingUser.season,
    );

    // 更新现有用户的赛季信息和报名状态
    const currentSeasons = existingUser.season
      ? existingUser.season.split(",")
      : [];
    console.log(
      "addTournamentRegistration - Current seasons array:",
      currentSeasons,
    );
    console.log(
      "addTournamentRegistration - New season to add:",
      registrationData.season,
    );

    if (!currentSeasons.includes(registrationData.season)) {
      currentSeasons.push(registrationData.season);
      console.log(
        "addTournamentRegistration - Added new season, updated array:",
        currentSeasons,
      );
    } else {
      console.log("addTournamentRegistration - Season already exists in array");
    }

    const updatedSeason = currentSeasons.join(",");
    console.log(
      "addTournamentRegistration - Final season string:",
      updatedSeason,
    );

    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        season: updatedSeason,
        registrationStatus: "registered", // 更新报名状态为已报名
        accuracy: registrationData.accuracy,
        stamina: registrationData.stamina,
        firstSight: registrationData.firstSight,
        strategy: registrationData.strategy,
        experience: registrationData.experience,
        customKey: registrationData.customKey,
        customValue: registrationData.customValue,
        cover_custom_url: registrationData.cover_custom_url,
        cover_url: registrationData.cover_url,
        cover_id: registrationData.cover_id,
        updatedAt: new Date(),
      },
    });

    console.log(
      "addTournamentRegistration - User updated successfully, new season:",
      user.season,
    );
    return user.id;
  } else {
    console.log(
      "addTournamentRegistration - Creating new user with season:",
      registrationData.season,
    );

    // 创建新用户并添加赛季信息（直接报名）
    const user = await prisma.user.create({
      data: {
        osuId: registrationData.osuId,
        username: registrationData.username,
        avatar_url: registrationData.avatar_url,
        pp: registrationData.pp,
        global_rank: registrationData.global_rank,
        country_rank: registrationData.country_rank,
        country: registrationData.country,
        cover_custom_url: registrationData.cover_custom_url,
        cover_url: registrationData.cover_url,
        cover_id: registrationData.cover_id,
        registeredAt: new Date(),
        userGroup: "player",
        registrationStatus: "registered",
        season: registrationData.season,
        accuracy: registrationData.accuracy,
        stamina: registrationData.stamina,
        firstSight: registrationData.firstSight,
        strategy: registrationData.strategy,
        experience: registrationData.experience,
        customKey: registrationData.customKey,
        customValue: registrationData.customValue,
      },
    });

    console.log(
      "addTournamentRegistration - New user created with season:",
      user.season,
    );
    return user.id;
  }
};

export const getUser = async (
  osuId: string,
): Promise<TournamentUser | null> => {
  const user = await prisma.user.findFirst({
    where: { osuId },
  });

  if (!user) return null;

  return {
    ...user,
    userGroup: user.userGroup as "player" | "admin",
    registrationStatus: user.registrationStatus as
      | "not_registered"
      | "registered"
      | "approved",
  };
};

export const getUserCount = async (): Promise<number> => {
  return await prisma.user.count();
};

export const deleteUser = async (osuId: string): Promise<boolean> => {
  try {
    await prisma.user.deleteMany({
      where: { osuId },
    });
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
  }
};

export const approveRegistration = async (osuId: string): Promise<boolean> => {
  try {
    await prisma.user.updateMany({
      where: { osuId },
      data: {
        registrationStatus: "approved",
        updatedAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error("Error approving registration:", error);
    return false;
  }
};

// 比赛预约相关函数
export const createMatchSchedule = async (scheduleData: {
  room_id: number;
  player1_osuId: string;
  player1_username: string;
  player2_osuId: string;
  player2_username: string;
  created_by: string;
}): Promise<number> => {
  const schedule = await prisma.matchSchedule.create({
    data: {
      ...scheduleData,
      red_score: 0,
      blue_score: 0,
      status: "pending",
    },
  });
  return schedule.id;
};

export const getUserMatchSchedules = async (
  osuId: string,
): Promise<MatchSchedule[]> => {
  return await prisma.matchSchedule.findMany({
    where: {
      OR: [{ player1_osuId: osuId }, { player2_osuId: osuId }],
    },
    include: {
      room: true,
    },
    orderBy: { created_at: "desc" },
  });
};

export const updateMatchScheduleStatus = async (
  id: number,
  status: "pending" | "confirmed" | "completed" | "cancelled",
): Promise<boolean> => {
  try {
    await prisma.matchSchedule.update({
      where: { id },
      data: { status },
    });
    return true;
  } catch (error) {
    console.error("Error updating match schedule status:", error);
    return false;
  }
};

export const getAllMatchSchedules = async (): Promise<MatchSchedule[]> => {
  return await prisma.matchSchedule.findMany({
    include: {
      room: true,
    },
    orderBy: { created_at: "desc" },
  });
};

// 比赛房间相关函数
export const createMatchRoom = async (roomData: {
  room_name: string;
  round_number: number;
  match_date: Date;
  match_time: Date;
  match_number: number;
  max_participants?: number;
  description?: string;
  created_by: string;
}): Promise<number> => {
  const room = await prisma.matchRoom.create({
    data: {
      ...roomData,
      status: "open",
    },
  });
  return room.id;
};

export const getMatchRooms = async (): Promise<MatchRoom[]> => {
  return await prisma.matchRoom.findMany({
    orderBy: { created_at: "desc" },
  });
};

export const getMatchRoom = async (id: number): Promise<MatchRoom | null> => {
  return await prisma.matchRoom.findUnique({
    where: { id },
  });
};

export const updateMatchRoomStatus = async (
  id: number,
  status: "open" | "full" | "closed",
): Promise<boolean> => {
  try {
    await prisma.matchRoom.update({
      where: { id },
      data: { status },
    });
    return true;
  } catch (error) {
    console.error("Error updating match room status:", error);
    return false;
  }
};

export const deleteMatchRoom = async (id: number): Promise<boolean> => {
  try {
    await prisma.matchRoom.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error("Error deleting match room:", error);
    return false;
  }
};

// 玩家对战列表相关函数
export const createPlayerMatchup = async (matchupData: {
  room_id?: number;
  player1_osuId: string;
  player1_username: string;
  player2_osuId: string;
  player2_username: string;
  created_by: string;
}): Promise<number> => {
  const matchup = await prisma.playerMatchup.create({
    data: {
      ...matchupData,
      status: "available",
    },
  });
  return matchup.id;
};

export const getPlayerMatchups = async (): Promise<PlayerMatchup[]> => {
  return await prisma.playerMatchup.findMany({
    include: {
      room: true,
    },
    orderBy: { created_at: "desc" },
  });
};

export const updatePlayerMatchupStatus = async (
  id: number,
  status: "available" | "scheduled" | "completed",
): Promise<boolean> => {
  try {
    await prisma.playerMatchup.update({
      where: { id },
      data: { status },
    });
    return true;
  } catch (error) {
    console.error("Error updating player matchup status:", error);
    return false;
  }
};

export const deletePlayerMatchup = async (id: number): Promise<boolean> => {
  try {
    await prisma.playerMatchup.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error("Error deleting player matchup:", error);
    return false;
  }
};

// 消息通知相关函数
export const createMessage = async (messageData: {
  sender_osuId: string;
  sender_username: string;
  receiver_osuId: string;
  receiver_username: string;
  type: "match_invitation" | "system_notification" | "admin_message";
  title: string;
  content: string;
  related_matchup_id?: number;
}): Promise<number> => {
  const message = await prisma.message.create({
    data: {
      ...messageData,
      status: "unread",
    },
  });
  return message.id;
};

export const getUserMessages = async (osuId: string): Promise<Message[]> => {
  return await prisma.message.findMany({
    where: { receiver_osuId: osuId },
    orderBy: { created_at: "desc" },
  });
};

export const updateMessageStatus = async (
  id: number,
  status: "unread" | "read" | "archived",
): Promise<boolean> => {
  try {
    await prisma.message.update({
      where: { id },
      data: { status },
    });
    return true;
  } catch (error) {
    console.error("Error updating message status:", error);
    return false;
  }
};

// 获取所有注册用户
export const getRegistrations = async (): Promise<TournamentRegistration[]> => {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { registrationStatus: "registered" },
          { registrationStatus: "approved" }
        ]
      },
      orderBy: {
        registeredAt: "desc",
      },
    });

    return users.map((user) => ({
      osuId: user.osuId,
      username: user.username,
      avatar_url: user.avatar_url || "",
      pp: user.pp || 0,
      global_rank: user.global_rank,
      country_rank: user.country_rank,
      country: user.country,
      teamName: "", // User模型中没有这个字段
      seedPosition: null, // User模型中没有这个字段
      agreedToTerms: false, // User模型中没有这个字段
      approvedAt: null, // User模型中没有这个字段
      registeredAt: user.registeredAt
        ? user.registeredAt.toISOString()
        : new Date().toISOString(),
      accuracy: user.accuracy,
      stamina: user.stamina,
      firstSight: user.firstSight,
      strategy: user.strategy,
      experience: user.experience,
      customKey: user.customKey,
      customValue: user.customValue,
      cover: user.cover_url ? {
        custom_url: user.cover_custom_url || null,
        url: user.cover_url || "",
        id: user.cover_id || null,
      } : undefined,
      registrationStatus: user.registrationStatus as "not_registered" | "registered" | "approved",
    }));
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return [];
  }
};

// 获取锦标赛报名数据
export const getTournamentRegistrations = async (): Promise<
  TournamentRegistration[]
> => {
  return await getRegistrations();
};

export const isTournamentUserRegistered = async (
  osuId: string,
): Promise<boolean> => {
  return await isUserRegistered(osuId);
};

// 获取单个用户的注册信息
export const getUserRegistration = async (
  osuId: string,
): Promise<TournamentRegistration | null> => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        osuId: osuId,
        OR: [
          { registrationStatus: "registered" },
          { registrationStatus: "approved" }
        ]
      },
    });

    if (!user) {
      return null;
    }

    return {
      osuId: user.osuId,
      username: user.username,
      avatar_url: user.avatar_url || "",
      pp: user.pp || 0,
      global_rank: user.global_rank,
      country_rank: user.country_rank,
      country: user.country,
      teamName: "", // User模型中没有这个字段
      seedPosition: null,
      agreedToTerms: false,
      approvedAt: null,
      registeredAt: user.registeredAt
        ? user.registeredAt.toISOString()
        : new Date().toISOString(),
      accuracy: user.accuracy,
      stamina: user.stamina,
      firstSight: user.firstSight,
      strategy: user.strategy,
      experience: user.experience,
      customKey: user.customKey,
      customValue: user.customValue,
      cover: user.cover_url ? {
        custom_url: user.cover_custom_url || null,
        url: user.cover_url || "",
        id: user.cover_id || null,
      } : undefined,
      registrationStatus: user.registrationStatus as "not_registered" | "registered" | "approved",
    };
  } catch (error) {
    console.error("Error fetching user registration:", error);
    return null;
  }
};

export const getTournamentUserRegistration = async (
  osuId: string,
): Promise<TournamentRegistration | null> => {
  return await getUserRegistration(osuId);
};

// 获取注册用户数量
export const getRegistrationCount = async (): Promise<number> => {
  try {
    const count = await prisma.user.count({
      where: {
        OR: [
          { registrationStatus: "registered" },
          { registrationStatus: "approved" }
        ]
      },
    });
    return count;
  } catch (error) {
    console.error("Error fetching registration count:", error);
    return 0;
  }
};

export const getTournamentRegistrationCount = async (): Promise<number> => {
  return await getRegistrationCount();
};

// Staff房间分配相关函数
export const getStaffRoomAssignments = async (): Promise<
  StaffRoomAssignment[]
> => {
  return await prisma.staffRoomAssignment.findMany({
    include: {
      room: true,
    },
    orderBy: { created_at: "desc" },
  });
};

export const getAvailableRoomsForStaff = async (): Promise<MatchRoom[]> => {
  return await prisma.matchRoom.findMany({
    where: { status: "open" },
    orderBy: { created_at: "desc" },
  });
};

export const createStaffRoomAssignment = async (assignmentData: {
  room_id: number;
  staff_osuId: string;
  staff_username: string;
  role: "referee" | "commentator" | "streamer";
}): Promise<number> => {
  const assignment = await prisma.staffRoomAssignment.create({
    data: assignmentData,
  });
  return assignment.id;
};

export const updateStaffRoomAssignmentStatus = async (
  id: number,
  data: Partial<StaffRoomAssignment>,
): Promise<boolean> => {
  try {
    await prisma.staffRoomAssignment.update({
      where: { id },
      data,
    });
    return true;
  } catch (error) {
    console.error("Error updating staff room assignment:", error);
    return false;
  }
};

export const deleteStaffRoomAssignment = async (
  id: number,
): Promise<boolean> => {
  try {
    await prisma.staffRoomAssignment.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error("Error deleting staff room assignment:", error);
    return false;
  }
};

export const getRoomStaffAssignments = async (
  roomId: number,
): Promise<StaffRoomAssignment[]> => {
  return await prisma.staffRoomAssignment.findMany({
    where: { room_id: roomId },
    include: {
      room: true,
    },
  });
};

export const getMatchRoomsWithSchedules = async (): Promise<
  (MatchRoom & { schedules: MatchSchedule[] })[]
> => {
  return await prisma.matchRoom.findMany({
    include: {
      schedules: true,
    },
    orderBy: { created_at: "desc" },
  });
};

// 比赛设置相关函数
export const getTournamentSettings = async (): Promise<TournamentSetting[]> => {
  return await prisma.tournamentSetting.findMany();
};

export const updateTournamentSettings = async (
  settings: Record<string, string>,
): Promise<boolean> => {
  try {
    const operations = Object.entries(settings).map(([key, value]) =>
      prisma.tournamentSetting.upsert({
        where: { setting_key: key },
        update: { setting_value: value },
        create: { setting_key: key, setting_value: value },
      }),
    );

    await prisma.$transaction(operations);
    return true;
  } catch (error) {
    console.error("Error updating tournament settings:", error);
    return false;
  }
};

// 比赛分数相关函数
export const saveMatchScores = async (
  scores: {
    schedule_id: number;
    player_osuId: string;
    player_username: string;
    score: number;
  }[],
): Promise<boolean> => {
  try {
    await prisma.matchScore.createMany({
      data: scores,
    });
    return true;
  } catch (error) {
    console.error("Error saving match scores:", error);
    return false;
  }
};

export const updateMatchScores = async (
  scheduleId: number,
  redScore: number,
  blueScore: number,
): Promise<boolean> => {
  try {
    await prisma.matchSchedule.update({
      where: { id: scheduleId },
      data: {
        red_score: redScore,
        blue_score: blueScore,
      },
    });
    return true;
  } catch (error) {
    console.error("Error updating match scores:", error);
    return false;
  }
};

export const getSavedRooms = async (): Promise<MatchRoom[]> => {
  return await prisma.matchRoom.findMany({
    where: {
      schedules: {
        some: {},
      },
    },
    include: {
      schedules: {
        include: {
          matchScores: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });
};

export const getRoomScores = async (roomId: number): Promise<MatchScore[]> => {
  const schedules = await prisma.matchSchedule.findMany({
    where: { room_id: roomId },
    select: { id: true },
  });

  const scheduleIds = schedules.map((s) => s.id);

  return await prisma.matchScore.findMany({
    where: {
      schedule_id: {
        in: scheduleIds,
      },
    },
  });
};
