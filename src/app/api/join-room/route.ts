import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createMatchSchedule,
  getUser,
  getMatchRoom,
} from "@/lib/prisma-registrations";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("astra_session");

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, error: "未登录" },
        { status: 401 },
      );
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json(
        { success: false, error: "会话无效" },
        { status: 401 },
      );
    }

    const osuId = session.osuId;
    const username = session.username;
    if (!osuId || !username) {
      return NextResponse.json(
        { success: false, error: "用户信息无效" },
        { status: 400 },
      );
    }

    const user = await getUser(osuId);
    if (!user || user.registrationStatus !== "approved") {
      return NextResponse.json(
        { success: false, error: "只有已通过审核的玩家才能加入房间" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { room_id } = body;

    if (!room_id) {
      return NextResponse.json(
        { success: false, error: "缺少房间ID" },
        { status: 400 },
      );
    }

    const roomId = parseInt(room_id);

    // 检查房间是否存在且状态为 open
    const room = await getMatchRoom(roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, error: "房间不存在" },
        { status: 404 },
      );
    }
    if (room.status !== "open") {
      return NextResponse.json(
        { success: false, error: "房间已关闭或已满" },
        { status: 400 },
      );
    }

    // 检查是否已加入
    const existingCount = await prisma.matchSchedule.count({
      where: { room_id: roomId, player1_osuId: osuId },
    });
    if (existingCount > 0) {
      return NextResponse.json(
        { success: false, error: "你已经加入了这个房间" },
        { status: 409 },
      );
    }

    // 检查是否已满
    const participantCount = await prisma.matchSchedule.count({
      where: { room_id: roomId },
    });
    if (participantCount >= room.max_participants) {
      return NextResponse.json(
        { success: false, error: "房间已满" },
        { status: 400 },
      );
    }

    const scheduleId = await createMatchSchedule({
      room_id: roomId,
      player1_osuId: osuId,
      player1_username: username,
      player2_osuId: "TBD",
      player2_username: "待定",
      created_by: osuId,
    });

    return NextResponse.json({
      success: true,
      scheduleId,
      message: "成功加入房间",
    });
  } catch (error) {
    console.error("Error joining room:", error);
    return NextResponse.json(
      { success: false, error: "加入房间失败" },
      { status: 500 },
    );
  }
}
