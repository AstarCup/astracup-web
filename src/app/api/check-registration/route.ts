import { NextRequest } from "next/server";
import {
  isUserExists,
  isUserRegistered,
} from "@/lib/prisma-registrations";
import { createSuccessResponse, createErrorResponse } from "@/lib/session";
import { getUser } from "@/lib/prisma-registrations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const osuId = searchParams.get("osuId");

    if (!osuId) {
      return createErrorResponse("osuId parameter is required", 400);
    }

    const userExists = await isUserExists(osuId);
    const registered = userExists ? await isUserRegistered(osuId) : false;
    const user = userExists ? await getUser(osuId) : null;
    const registrationStatus = user?.registrationStatus || 'not_registered';

    return createSuccessResponse(
      {
        osuId,
        userExists,
        registered,
        approved: registrationStatus === 'approved',
        registrationStatus,
      },
      "Registration status checked",
    );
  } catch (error) {
    console.error("Error checking registration status:", error);
    return createErrorResponse("Failed to check registration status", 500);
  }
}
