import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/session";

export async function POST(_request: Request) {
  try {
    // 创建响应
    const response = createSuccessResponse(null, "Logged out successfully");

    // 清除 session cookie
    return clearSessionCookie(response);
  } catch (error) {
    console.error("Logout error:", error);
    return createErrorResponse("Failed to logout", 500);
  }
}
