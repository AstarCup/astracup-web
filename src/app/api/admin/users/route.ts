import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSessionFromRequest } from "@/lib/session";
import { verifyAdminAuth } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    // 验证用户会话
    const session = await parseSessionFromRequest(request);
    if (!session?.osuId) {
      return NextResponse.json(
        {
          success: false,
          error: "未登录",
        },
        { status: 401 },
      );
    }

    // 验证管理员权限
    const isAdmin = await verifyAdminAuth(session.osuId);
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "权限不足，需要管理员权限",
        },
        { status: 403 },
      );
    }

    // 获取所有用户
    const users = await prisma.user.findMany({
      select: {
        osuId: true,
        username: true,
        userGroup: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      users: users.map((user) => ({
        osuId: user.osuId,
        username: user.username || "未知用户",
        userGroup: user.userGroup || "player",
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error("[GET /api/admin/users] 获取用户列表失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取用户列表失败",
      },
      { status: 500 },
    );
  }
}
