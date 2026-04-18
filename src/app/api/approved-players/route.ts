import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUsers } from "@/lib/prisma-registrations";
import { getUserPermissions } from "@/lib/permissions";

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

    // 检查用户权限（只有管理员可以查看已审核玩家列表）
    const permissions = await getUserPermissions(userOsuId);
    if (!permissions.isadmin) {
      return NextResponse.json(
        {
          success: false,
          error: "权限不足",
        },
        { status: 403 },
      );
    }

    // 获取所有用户信息
    const allUsers = await getUsers();

    // 过滤出已审核通过的玩家
    const approvedPlayers = allUsers
      .filter((user) => user.registrationStatus === 'approved')
      .map((user) => ({
        osuId: user.osuId,
        username: user.username,
        avatar_url: user.avatar_url,
        pp: user.pp,
        global_rank: user.global_rank,
        country_rank: user.country_rank,
        country: user.country,
      }));

    return NextResponse.json({
      success: true,
      players: approvedPlayers,
    });
  } catch (error) {
    console.error("Error getting approved players:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取已审核玩家列表失败",
      },
      { status: 500 },
    );
  }
}
