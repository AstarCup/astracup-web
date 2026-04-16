import { NextRequest } from "next/server";
import {
  createMatchSchedule,
  getPlayerMatchups,
  updatePlayerMatchupStatus,
} from "@/lib/prisma-registrations";
import {
  validateRequestAndGetSession,
  createSuccessResponse,
  createErrorResponse,
  createUnauthorizedResponse,
  createForbiddenResponse,
} from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    // 验证请求并获取用户session
    const { session, response } = await validateRequestAndGetSession(request);
    if (response) return response;

    const createdBy = session.osuId;
    const body = await request.json();
    const { matchup_id, room_id } = body;

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

    // 检查用户是否是参赛选手之一
    if (
      createdBy !== matchup.player1_osuId &&
      createdBy !== matchup.player2_osuId
    ) {
      return createForbiddenResponse("您不是该对战的参赛选手");
    }

    // 创建比赛预约
    const scheduleData = {
      room_id: parseInt(room_id),
      player1_osuId: matchup.player1_osuId,
      player1_username: matchup.player1_username,
      player2_osuId: matchup.player2_osuId,
      player2_username: matchup.player2_username,
      created_by: createdBy,
    };

    const scheduleId = await createMatchSchedule(scheduleData);

    // 更新对战状态为已预约
    await updatePlayerMatchupStatus(parseInt(matchup_id), "scheduled");

    return createSuccessResponse({ scheduleId }, "比赛预约创建成功");
  } catch (error) {
    console.error("Error creating match schedule:", error);
    return createErrorResponse("创建比赛预约失败", 500);
  }
}
