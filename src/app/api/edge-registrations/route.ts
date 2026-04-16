import { NextRequest } from "next/server";
import {
  addTournamentRegistration,
  getTournamentRegistrations,
  getCurrentSeason,
} from "@/lib/prisma-registrations";
import { createSuccessResponse, createErrorResponse } from "@/lib/session";

// GET /api/edge-registrations - 获取所有报名数据
export async function GET() {
  try {
    const registrations = await getTournamentRegistrations();
    return createSuccessResponse(
      { registrations },
      "Tournament registrations retrieved",
    );
  } catch (error) {
    console.error("Error in GET /api/edge-registrations:", error);
    return createErrorResponse("Failed to fetch registrations", 500);
  }
}

// POST /api/edge-registrations - 添加新报名
export async function POST(request: NextRequest) {
  try {
    const registrationData = await request.json();

    // 验证必要字段
    if (
      !registrationData.osuId ||
      !registrationData.username ||
      !registrationData.country
    ) {
      return createErrorResponse(
        "Missing required fields (osuId, username, country)",
        400,
      );
    }

    // 获取当前赛季
    const currentSeason = await getCurrentSeason();
    console.log("edge-registrations - Current season:", currentSeason);

    // 添加赛季信息到注册数据
    const registrationDataWithSeason = {
      ...registrationData,
      season: currentSeason,
    };

    console.log(
      "edge-registrations - Registration data with season:",
      registrationDataWithSeason,
    );

    const success = await addTournamentRegistration(registrationDataWithSeason);

    if (success) {
      return createSuccessResponse(null, "Tournament registration successful");
    } else {
      return createErrorResponse("Failed to save registration", 500);
    }
  } catch (error) {
    console.error("Error in POST /api/edge-registrations:", error);
    return createErrorResponse("Failed to save registration", 500);
  }
}
