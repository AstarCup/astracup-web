import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/edge-config";

export async function POST(request: NextRequest) {
  try {
    const { osuId } = await request.json();

    if (!osuId) {
      return NextResponse.json({ error: "缺少osu ID" }, { status: 400 });
    }

    let replayAccessUsers: string[] = [];

    // 优先尝试从Edge Config获取测图用户列表
    if (process.env.EDGE_CONFIG) {
      const replayConfig = await get("replayAccessUsers");
      if (replayConfig && Array.isArray(replayConfig)) {
        replayAccessUsers = replayConfig.filter(
          (id): id is string => typeof id === "string" && id.trim() !== "",
        );
      }
    }

    // 如果Edge Config没有数据，尝试从环境变量获取
    if (replayAccessUsers.length === 0 && process.env.REPLAY_ACCESS_USER_IDS) {
      replayAccessUsers = process.env.REPLAY_ACCESS_USER_IDS.split(",")
        .map((id) => id.trim())
        .filter((id) => id !== "");
    }

    // 检查osu ID是否在测图用户列表中
    const userIdStr = osuId.toString();
    const userIdNum = parseInt(osuId);

    const isReplayTester = replayAccessUsers.some((userId) => {
      const userIdStr2 = userId.toString();
      const userIdNum2 = parseInt(userId);
      return userIdStr === userIdStr2 || userIdNum === userIdNum2;
    });

    return NextResponse.json({
      success: true,
      isReplayTester,
    });
  } catch (error) {
    console.error("Error checking replay permissions:", error);
    return NextResponse.json({ error: "检查测图权限失败" }, { status: 500 });
  }
}
