import { NextRequest, NextResponse } from "next/server";
import { getUsers } from "@/lib/prisma-registrations";

export async function GET(_request: NextRequest) {
  try {
    // 获取所有用户信息
    const allUsers = await getUsers();

    // 格式化玩家信息
    const players = allUsers.map((user) => ({
      osuId: user.osuId,
      username: user.username,
      avatar_url: user.avatar_url,
      pp: user.pp,
      global_rank: user.global_rank,
      country_rank: user.country_rank,
      country: user.country,
      approved: user.approved,
    }));

    return NextResponse.json({
      success: true,
      players,
    });
  } catch (error) {
    console.error("Error getting players for obs overlay:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取玩家列表失败",
      },
      { status: 500 },
    );
  }
}
