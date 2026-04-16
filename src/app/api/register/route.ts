import { NextRequest } from "next/server";
import {
  addTournamentRegistration,
  isUserExists,
  isUserRegistered,
  createOrUpdateUser,
  getRegistrations,
  getCurrentSeason,
} from "@/lib/prisma-registrations";
import { createSuccessResponse, createErrorResponse } from "@/lib/session";

export interface Registration {
  osuId: string;
  username: string;
  inGameName: string;
  discord: string;
  timezone: string;
  availability: string;
  registeredAt: string;
  avatar_url: string;
  pp: number;
  global_rank: number | null;
  country_rank: number | null;
  country: string;
  accuracy?: number;
  stamina?: number;
  firstSight?: number;
  strategy?: number;
  experience?: number;
  customKey?: string;
  customValue?: number;
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

    // 获取当前赛季设置
    const currentSeason = await getCurrentSeason();

    // 检查用户是否已存在
    const userExists = await isUserExists(body.osuId);

    if (userExists) {
      // 检查用户是否已报名（简化版，只检查registrationStatus）
      const alreadyRegistered = await isUserRegistered(body.osuId);
      if (alreadyRegistered) {
        return createErrorResponse("User already registered", 409);
      }

      // 用户存在但未报名当前赛季，更新用户信息并报名
      // 先更新用户基本信息
      await createOrUpdateUser({
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

      // 然后报名当前赛季
      await addTournamentRegistration({
        ...body,
        season: currentSeason,
        accuracy: body.accuracy,
        stamina: body.stamina,
        firstSight: body.firstSight,
        strategy: body.strategy,
        experience: body.experience,
        customKey: body.customKey,
        customValue: body.customValue,
      });
    } else {
      // 用户不存在，直接创建并报名
      await addTournamentRegistration({
        ...body,
        season: currentSeason,
        accuracy: body.accuracy,
        stamina: body.stamina,
        firstSight: body.firstSight,
        strategy: body.strategy,
        experience: body.experience,
        customKey: body.customKey,
        customValue: body.customValue,
      });
    }

    return createSuccessResponse(null, "Tournament registration successful");
  } catch (error) {
    console.error("Registration API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

export async function GET() {
  try {
    const registrations = await getRegistrations();
    return createSuccessResponse(
      { registrations },
      "Registration list retrieved",
    );
  } catch (error) {
    console.error("Get registrations error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
