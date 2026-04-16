import { NextRequest } from "next/server";
import {
  getAllMatchSchedules,
  createMatchSchedule,
  getPlayerMatchups,
  updatePlayerMatchupStatus,
  getMatchRooms,
  createMessage,
} from "@/lib/prisma-registrations";
import {
  validateRequestAndGetSession,
  createSuccessResponse,
  createErrorResponse,
  createForbiddenResponse,
  parseSessionFromRequest,
} from "@/lib/session";
import { getUserPermissions } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    // 获取用户session
    const session = await parseSessionFromRequest(request);
    let permissions = null;

    if (session?.osuId) {
      permissions = await getUserPermissions(session.osuId);
    }

    const schedules = await getAllMatchSchedules();

    return createSuccessResponse(
      { schedules, permissions },
      "Match schedules retrieved",
    );
  } catch (error) {
    console.error("Error fetching match schedules:", error);
    return createErrorResponse("获取比赛预约失败", 500);
  }
}

// 统一的比赛预约创建 API
// 支持三种模式：
// 1. 普通用户创建（基于现有对战）
// 2. 管理员创建（可以创建任意比赛）
// 3. 请求比赛（创建并发送消息通知）
export async function POST(request: NextRequest) {
  try {
    // 验证请求并获取用户session
    const { session, response } = await validateRequestAndGetSession(request);
    if (response) return response;

    const userOsuId = session.osuId;
    const userUsername = session.username;

    // 获取用户权限
    const permissions = await getUserPermissions(userOsuId);
    const isAdmin = permissions?.isAdmin || false;

    // 解析请求体
    const body = await request.json();
    const {
      // 通用字段
      matchup_id,
      room_id,
      // 管理员专用字段
      player1_osuId,
      player1_username,
      player2_osuId,
      player2_username,
      red_player_osuId,
      blue_player_osuId,
      red_score = 0,
      blue_score = 0,
      status = "pending",
      replay_link,
      match_link,
      referee_osuId,
      referee_username,
      commentator_osuId,
      commentator_username,
      // 功能标志
      send_notification = false, // 是否发送消息通知
      is_admin_create = false, // 是否管理员创建模式
    } = body;

    // 模式1：管理员创建比赛（不需要对战ID）
    if (is_admin_create) {
      if (!isAdmin) {
        return createForbiddenResponse("需要管理员权限");
      }

      // 验证必填字段
      if (
        !room_id ||
        !player1_osuId ||
        !player1_username ||
        !player2_osuId ||
        !player2_username
      ) {
        return createErrorResponse(
          "缺少必填字段：房间ID、选手1信息、选手2信息",
          400,
        );
      }

      // 创建比赛预约
      const scheduleData = {
        room_id: parseInt(room_id),
        player1_osuId,
        player1_username,
        player2_osuId,
        player2_username,
        created_by: userOsuId,
      };

      const scheduleId = await createMatchSchedule(scheduleData);

      // 注意：Prisma 版本不支持额外的字段，这些字段将在后续更新中处理
      // 如果需要这些字段，需要创建额外的更新函数

      return createSuccessResponse(
        { scheduleId },
        "比赛预约创建成功（管理员模式）",
      );
    }

    // 模式2和3：普通用户创建（基于对战）
    // 验证必填字段
    if (!matchup_id || !room_id) {
      return createErrorResponse("缺少对战ID或房间ID", 400);
    }

    // 获取对战信息
    const matchups = await getPlayerMatchups();
    const matchup = matchups.find((m) => m.id === parseInt(matchup_id));

    if (!matchup) {
      return createErrorResponse("对战信息不存在", 404);
    }

    if (matchup.status !== "available") {
      return createErrorResponse("该对战已被预约或已完成", 400);
    }

    // 检查用户是否是参赛选手之一（除非是管理员）
    if (!isAdmin) {
      if (
        userOsuId !== matchup.player1_osuId &&
        userOsuId !== matchup.player2_osuId
      ) {
        return createForbiddenResponse("您不是该对战的参赛选手");
      }
    }

    // 验证房间是否存在且可用
    const rooms = await getMatchRooms();
    const room = rooms.find((r) => r.id === parseInt(room_id));

    if (!room) {
      return createErrorResponse("房间不存在", 404);
    }

    if (room.status !== "open") {
      return createErrorResponse("房间不可用", 400);
    }

    // 创建比赛预约记录
    const scheduleId = await createMatchSchedule({
      room_id: parseInt(room_id),
      player1_osuId: matchup.player1_osuId,
      player1_username: matchup.player1_username,
      player2_osuId: matchup.player2_osuId,
      player2_username: matchup.player2_username,
      created_by: userOsuId,
    });

    // 模式3：发送消息通知
    if (send_notification) {
      // 确定对手信息
      const opponent =
        matchup.player1_osuId === userOsuId
          ? { osuId: matchup.player2_osuId, username: matchup.player2_username }
          : {
              osuId: matchup.player1_osuId,
              username: matchup.player1_username,
            };

      // 创建预约确认消息给对手
      const messageId = await createMessage({
        sender_osuId: userOsuId,
        sender_username: userUsername,
        receiver_osuId: opponent.osuId,
        receiver_username: opponent.username,
        type: "match_invitation",
        title: "对战预约确认",
        content: `${userUsername} 已预约与你在 ${room.room_name} 的对战。请确认是否接受。`,
        related_matchup_id: matchup.id,
      });

      // 更新对战状态为已预约
      await updatePlayerMatchupStatus(matchup.id, "scheduled");

      return createSuccessResponse(
        { scheduleId, messageId },
        "预约成功，已发送确认请求给对手",
      );
    }

    // 模式2：普通创建（不发送消息）
    // 更新对战状态为已预约
    await updatePlayerMatchupStatus(matchup.id, "scheduled");

    return createSuccessResponse({ scheduleId }, "比赛预约创建成功");
  } catch (error) {
    console.error("Error creating match schedule:", error);
    return createErrorResponse("创建比赛预约失败", 500);
  }
}
