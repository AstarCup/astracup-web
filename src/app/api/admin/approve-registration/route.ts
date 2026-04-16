import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { approveRegistration } from "@/lib/prisma-registrations";
import { getUserPermissions, verifySessionCookie } from "@/lib/permissions";

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
    const cookieHash = session.cookieHash;

    if (!userOsuId) {
      return NextResponse.json(
        {
          success: false,
          error: "用户ID无效",
        },
        { status: 400 },
      );
    }

    // 验证会话cookie（二次确认）
    if (cookieHash) {
      const userAgent = request.headers.get("user-agent") || undefined;
      const ipAddress =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined;

      const cookieValid = await verifySessionCookie(
        userOsuId,
        cookieHash,
        userAgent,
        ipAddress,
      );
      if (!cookieValid) {
        return NextResponse.json(
          {
            success: false,
            error: "会话验证失败，请重新登录",
          },
          { status: 401 },
        );
      }
    }

    // 检查用户权限（只有管理员可以审核注册）
    const permissions = await getUserPermissions(userOsuId);
    if (!permissions.isadmin) {
      return NextResponse.json(
        {
          success: false,
          error: "权限不足，只有管理员可以审核注册",
        },
        { status: 403 },
      );
    }

    // 获取请求体
    const body = await request.json();
    const { osuId } = body;

    if (!osuId) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少用户ID参数",
        },
        { status: 400 },
      );
    }

    // 审核通过注册
    const success = await approveRegistration(osuId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: "用户注册审核通过成功",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "审核失败，可能用户不存在",
        },
        { status: 404 },
      );
    }
  } catch (error) {
    console.error("Error approving registration:", error);
    return NextResponse.json(
      {
        success: false,
        error: "审核用户注册时发生错误",
      },
      { status: 500 },
    );
  }
}
