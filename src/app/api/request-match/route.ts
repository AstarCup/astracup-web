import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createMessage,
  getPlayerMatchups,
  updatePlayerMatchupStatus,
  createMatchSchedule,
  getMatchRooms,
} from "@/lib/prisma-registrations";

export async function POST(request: NextRequest) {
  try {
    // 获取用户session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("astra_session");

    if (!sessionCookie?.value) {
      return NextResponse.json(
        {
          success: false,
          error: "未登录",
        },
        { status: 401 },
      );
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "会话无效",
        },
        { status: 401 },
      );
    }

    const userOsuId = session.osuId;
    const userUsername = session.username;
    if (!userOsuId || !userUsername) {
      return NextResponse.json(
        {
          success: false,
          error: "用户ID或用户名无效",
        },
        { status: 400 },
      );
    }

    // 获取请求体
    const body = await request.json();
    const { matchupId, roomId } = body;

    if (!matchupId || !roomId) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少对战ID或房间ID参数",
        },
        { status: 400 },
      );
    }

    // 获取对战信息
    const matchups = await getPlayerMatchups();
    const matchup = matchups.find((m) => m.id === parseInt(matchupId));

    if (!matchup) {
      return NextResponse.json(
        {
          success: false,
          error: "对战不存在",
        },
        { status: 404 },
      );
    }

    if (matchup.status !== "available") {
      return NextResponse.json(
        {
          success: false,
          error: "对战不可预约",
        },
        { status: 400 },
      );
    }

    // 验证房间是否存在且可用
    const rooms = await getMatchRooms();
    const room = rooms.find((r) => r.id === parseInt(roomId));

    if (!room) {
      return NextResponse.json(
        {
          success: false,
          error: "房间不存在",
        },
        { status: 404 },
      );
    }

    if (room.status !== "open") {
      return NextResponse.json(
        {
          success: false,
          error: "房间不可用",
        },
        { status: 400 },
      );
    }

    // 确定对手信息
    const opponent =
      matchup.player1_osuId === userOsuId
        ? { osuId: matchup.player2_osuId, username: matchup.player2_username }
        : { osuId: matchup.player1_osuId, username: matchup.player1_username };

    // 创建比赛预约记录
    const scheduleId = await createMatchSchedule({
      room_id: parseInt(roomId),
      player1_osuId: matchup.player1_osuId,
      player1_username: matchup.player1_username,
      player2_osuId: matchup.player2_osuId,
      player2_username: matchup.player2_username,
      created_by: userOsuId,
    });

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

    // 将对战状态改为已预约
    await updatePlayerMatchupStatus(matchup.id, "scheduled");

    return NextResponse.json({
      success: true,
      message: "预约成功，已发送确认请求给对手",
      messageId,
      scheduleId,
    });
  } catch (error) {
    console.error("Error requesting match:", error);
    return NextResponse.json(
      {
        success: false,
        error: "预约对战失败",
      },
      { status: 500 },
    );
  }
}
