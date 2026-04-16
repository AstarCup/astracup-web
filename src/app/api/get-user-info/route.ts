import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/osu-api";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json(
        {
          success: false,
          error: "无效的用户ID",
        },
        { status: 400 },
      );
    }

    const userData = await getUserById(Number(userId));

    if (!userData) {
      return NextResponse.json(
        {
          success: false,
          error: "玩家不存在",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        username: userData.username,
        avatar_url: userData.avatar_url,
        country_code: userData.country_code,
        pp: userData.statistics.pp,
        global_rank: userData.statistics.global_rank,
        cover: userData.cover,
      },
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "获取玩家信息失败",
      },
      { status: 500 },
    );
  }
}
