import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteMatchRoom, getMatchRoom } from "@/lib/prisma-registrations";
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
      return NextResponse.json({ error: "无效的房间ID" }, { status: 400 });
    }

    // 检查房间是否存在
    const room = await getMatchRoom(id);
    if (!room) {
      return NextResponse.json({ error: "房间不存在" }, { status: 404 });
    }

    // 删除房间（会自动删除相关预约）
    await deleteMatchRoom(id);

    return NextResponse.json({
      success: true,
      message: `房间 "${room.room_name}" 及其所有预约已删除`,
    });
  } catch (error) {
    console.error("Error deleting match room:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
