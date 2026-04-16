import { NextRequest } from "next/server";
import { getUser } from "@/lib/prisma-registrations";
import { createSuccessResponse, createErrorResponse } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const osuId = searchParams.get("osuId");

    if (!osuId) {
      return createErrorResponse("Missing osuId parameter", 400);
    }

    const user = await getUser(osuId);

    return createSuccessResponse({ user }, "User registration retrieved");
  } catch (error) {
    console.error("Error fetching user registration:", error);
    return createErrorResponse("Failed to fetch registration", 500);
  }
}
