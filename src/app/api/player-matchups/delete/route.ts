import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  deletePlayerMatchup,
  getPlayerMatchups,
} from "@/lib/prisma-registrations";
import { getUserPermissions } from "@/lib/permissions";

export async function DELETE(request: NextRequest) {
  try {
    // 获取用户session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("astra_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: "会话无效" }, { status: 401 });
    }

    const userOsuId = session.osuId;
    if (!userOsuId) {
      return NextResponse.json({ error: "用户ID无效" }, { status: 401 });
    }

    // 检查管理员权限
    const permissions = await getUserPermissions(userOsuId);
    if (!permissions.isadmin) {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "无效的对战ID" }, { status: 400 });
    }

    // 检查对战是否存在
    const allMatchups = await getPlayerMatchups();
    const matchup = allMatchups.find((m) => m.id === id);

    if (!matchup) {
      return NextResponse.json({ error: "对战不存在" }, { status: 404 });
    }

    // 删除对战
    await deletePlayerMatchup(id);

    return NextResponse.json({
      success: true,
      message: `对战 "${matchup.player1_username} vs ${matchup.player2_username}" 已删除`,
    });
  } catch (error) {
    console.error("Error deleting player matchup:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
