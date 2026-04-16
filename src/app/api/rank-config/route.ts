import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/edge-config";

export async function GET(_request: NextRequest) {
  try {
    // 检查是否在生产环境且有Edge Config连接字符串
    if (process.env.NODE_ENV === "production" && process.env.EDGE_CONFIG) {
      // 从Edge Config获取rank配置
      const rankConfig = await get("rankConfig");

      if (rankConfig) {
        return NextResponse.json(rankConfig);
      }
    }

    // 开发环境或没有Edge Config时使用默认配置
    const defaultConfig = {
      maxPpForRegistration: 7000,
      minPpForRegistration: 0,
      rankRestrictionEnabled: false,
    };

    return NextResponse.json(defaultConfig);
  } catch (error) {
    console.error("Error fetching rank config:", error);

    // 出错时返回默认配置
    return NextResponse.json({
      maxPpForRegistration: 7000,
      minPpForRegistration: 0,
      rankRestrictionEnabled: false,
    });
  }
}
