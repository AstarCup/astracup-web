import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createMatchSchedule } from "@/lib/prisma-registrations";
import { getUserPermissions } from "@/lib/permissions";

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

    const createdBy = session.osuId;
    if (!createdBy) {
      return NextResponse.json(
        {
          success: false,
          error: "用户ID无效",
        },
        { status: 400 },
      );
    }

    // 检查用户权限
    const permissions = await getUserPermissions(createdBy);
    if (!permissions?.isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "需要管理员权限",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      room_id,
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
    } = body;

    // 验证必填字段
    if (
      !room_id ||
      !player1_osuId ||
      !player1_username ||
      !player2_osuId ||
      !player2_username
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少必填字段：房间ID、选手1信息、选手2信息",
        },
        { status: 400 },
      );
    }

    // 创建比赛预约
    const scheduleData = {
      room_id: parseInt(room_id),
      player1_osuId,
      player1_username,
      player2_osuId,
      player2_username,
      red_player_osuId: red_player_osuId || null,
      blue_player_osuId: blue_player_osuId || null,
      red_score: parseInt(red_score),
      blue_score: parseInt(blue_score),
      status: status as "pending" | "confirmed" | "completed" | "cancelled",
      replay_link: replay_link || null,
      match_link: match_link || null,
      referee_osuId: referee_osuId || null,
      referee_username: referee_username || null,
      commentator_osuId: commentator_osuId || null,
      commentator_username: commentator_username || null,
      created_by: createdBy,
    };

    const scheduleId = await createMatchSchedule(scheduleData);

    return NextResponse.json({
      success: true,
      scheduleId,
      message: "比赛预约创建成功",
    });
  } catch (error) {
    console.error("Error creating match schedule (admin):", error);
    return NextResponse.json(
      {
        success: false,
        error: "创建比赛预约失败",
      },
      { status: 500 },
    );
  }
}
