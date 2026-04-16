import { NextRequest } from "next/server";
import {
  parseSessionFromRequest,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await parseSessionFromRequest(request);

    return createSuccessResponse(
      { session },
      session ? "Session retrieved successfully" : "No active session",
    );
  } catch (error) {
    console.error("[Session Get API] Error retrieving session:", error);
    return createErrorResponse("Failed to retrieve session", 500);
  }
}
