import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserPermissions, verifySessionCookie } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const osuIdParam = searchParams.get("osuId");

    // 如果提供了URL参数，直接使用（用于管理功能）
    if (osuIdParam) {
      const permissions = await getUserPermissions(osuIdParam);
      return NextResponse.json({
        success: true,
        permissions,
      });
    }

    // 从cookie获取session
    const cookieStore = await cookies();
    const astraSessionCookie = cookieStore.get("astra_session");
    const sessionCookie = cookieStore.get("session");

    let sessionCookieValue = null;

    // 优先使用astra_session cookie
    if (astraSessionCookie?.value) {
      sessionCookieValue = astraSessionCookie.value;
    } else if (sessionCookie?.value) {
      sessionCookieValue = sessionCookie.value;
    }

    if (!sessionCookieValue) {
      return NextResponse.json({
        success: true,
        permissions: {
          isplayer: false,
          isadmin: false,
        },
      });
    }

    let session;
    try {
      session = JSON.parse(sessionCookieValue);
    } catch {
      return NextResponse.json({
        success: true,
        permissions: {
          isplayer: false,
          isadmin: false,
        },
      });
    }

    const osuId = session.osuId;
    const cookieHash = session.cookieHash;

    if (!osuId) {
      return NextResponse.json({
        success: true,
        permissions: {
          isplayer: false,
          isadmin: false,
        },
      });
    }

    // 验证会话cookie（二次确认）
    let cookieValid = false;
    if (cookieHash) {
      const userAgent = request.headers.get("user-agent") || undefined;
      const ipAddress =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined;

      cookieValid = await verifySessionCookie(
        osuId,
        cookieHash,
        userAgent,
        ipAddress,
      );
    }

    // 如果cookie验证失败，返回无权限
    if (cookieHash && !cookieValid) {
      return NextResponse.json({
        success: true,
        permissions: {
          isplayer: false,
          isadmin: false,
        },
      });
    }

    const permissions = await getUserPermissions(osuId);
    return NextResponse.json({
      success: true,
      permissions,
      cookieValid: cookieHash ? cookieValid : undefined,
    });
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user permissions",
      },
      { status: 500 },
    );
  }
}
