import { NextRequest } from "next/server";
import { createOrUpdateUser } from "@/lib/prisma-registrations";
import { createSuccessResponse, createErrorResponse } from "@/lib/session";

export interface UserRegistrationData {
  osuId: string;
  username: string;
  avatar_url?: string;
  pp?: number;
  global_rank?: number;
  country_rank?: number;
  country: string;
  cover_custom_url?: string;
  cover_url?: string;
  cover_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证必要字段
    if (!body.osuId || !body.username || !body.country) {
      return createErrorResponse(
        "Missing required fields (osuId, username, country)",
        400,
      );
    }

    // 创建或更新用户（注册但不报名）
    const userId = await createOrUpdateUser({
      osuId: body.osuId,
      username: body.username,
      avatar_url: body.avatar_url,
      pp: body.pp,
      global_rank: body.global_rank,
      country_rank: body.country_rank,
      country: body.country,
      cover_custom_url: body.cover_custom_url,
      cover_url: body.cover_url,
      cover_id: body.cover_id,
    });

    return createSuccessResponse(
      { userId },
      "User registered successfully (not yet signed up for tournament)",
    );
  } catch (error) {
    console.error("User registration API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
