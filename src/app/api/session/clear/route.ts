import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookie,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/session";

export async function POST(_request: NextRequest) {
  try {
    // 创建响应
    const response = createSuccessResponse(
      null,
      "Session cleared successfully",
    );

    // 清除 session cookie
    return clearSessionCookie(response);
  } catch (error) {
    console.error("Error clearing session:", error);
    return createErrorResponse("Failed to clear session", 500);
  }
}
