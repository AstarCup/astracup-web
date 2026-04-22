import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAvailableRoomsForStaff } from "@/lib/prisma-registrations";
import { getUserPermissions } from "@/lib/permissions";

// GET /api/available-rooms-for-staff - 获取可供staff选择的房间列表
export async function GET(_request: NextRequest) {
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
    if (!userOsuId) {
      return NextResponse.json(
        {
          success: false,
          error: "用户ID无效",
        },
        { status: 400 },
      );
    }

    // 检查用户权限（裁判员、直播员或管理员可以查看可用房间）
    const permissions = await getUserPermissions(userOsuId);
    if (
      !permissions.isadmin
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "权限不足，只有裁判员、直播员或管理员可以查看可用房间",
        },
        { status: 403 },
      );
    }

    const rooms = await getAvailableRoomsForStaff();
    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("Error fetching available rooms for staff:", error);
    return NextResponse.json({ error: "获取可用房间失败" }, { status: 500 });
  }
}
