import { NextRequest, NextResponse } from "next/server";
import {
  setSessionCookie,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const sessionData = await request.json();

    // 验证必要的 session 数据
    if (!sessionData.osuId || !sessionData.username) {
      return createErrorResponse(
        "Missing required session data (osuId, username)",
        400,
      );
    }

    // 创建响应
    const response = createSuccessResponse(null, "Session stored successfully");

    // 设置 session cookie
    return setSessionCookie(response, sessionData);
  } catch (error) {
    console.error("Error storing session:", error);
    return createErrorResponse("Failed to store session", 500);
  }
}
