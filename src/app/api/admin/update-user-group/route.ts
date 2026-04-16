import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSessionFromRequest } from "@/lib/session";
import { verifyAdminAuth } from "@/lib/permissions";

export async function POST(request: NextRequest) {
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

    // 解析请求体
    const body = await request.json();
    const { osuId, userGroup } = body;

    if (!osuId || !userGroup) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少必要参数",
        },
        { status: 400 },
      );
    }

    if (userGroup !== "player" && userGroup !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "userGroup必须是player或admin",
        },
        { status: 400 },
      );
    }

    // 检查目标用户是否存在
    const targetUser = await prisma.user.findFirst({
      where: { osuId },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          error: "用户不存在",
        },
        { status: 404 },
      );
    }

    // 更新用户权限组
    await prisma.user.update({
      where: { osuId },
      data: { userGroup },
    });

    return NextResponse.json({
      success: true,
      message: "用户权限组更新成功",
    });
  } catch (error) {
    console.error(
      "[POST /api/admin/update-user-group] 更新用户权限组失败:",
      error,
    );
    return NextResponse.json(
      {
        success: false,
        error: "更新用户权限组失败",
      },
      { status: 500 },
    );
  }
}
