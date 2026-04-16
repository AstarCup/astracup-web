import { NextRequest } from "next/server";
import {
  isUserExists,
  isUserRegistered,
  isUserApproved,
} from "@/lib/prisma-registrations";
import { createSuccessResponse, createErrorResponse } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const osuId = searchParams.get("osuId");

    if (!osuId) {
      return createErrorResponse("osuId parameter is required", 400);
    }

    const userExists = await isUserExists(osuId);
    const registered = userExists ? await isUserRegistered(osuId) : false;
    const approved = userExists ? await isUserApproved(osuId) : false;

    return createSuccessResponse(
      {
        osuId,
        userExists,
        registered,
        approved,
      },
      "Registration status checked",
    );
  } catch (error) {
    console.error("Error checking registration status:", error);
    return createErrorResponse("Failed to check registration status", 500);
  }
}
