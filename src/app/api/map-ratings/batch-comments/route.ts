import { NextRequest, NextResponse } from "next/server";
import { getBatchComments } from "@/lib/map-ratings";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mapSelectionIdsParam = searchParams.get("mapSelectionIds");

    if (!mapSelectionIdsParam) {
      return NextResponse.json(
        { error: "缺少必要参数：mapSelectionIds" },
        { status: 400 },
      );
    }

    const mapSelectionIds = mapSelectionIdsParam
      .split(",")
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id) && id > 0);

    if (mapSelectionIds.length === 0) {
      return NextResponse.json(
        { error: "无效的mapSelectionIds参数" },
        { status: 400 },
      );
    }

    const batchComments = await getBatchComments(mapSelectionIds);

    return NextResponse.json({
      success: true,
      comments: batchComments,
      count: Object.keys(batchComments).length,
    });
  } catch (error) {
    console.error("Error getting batch comments:", error);
    return NextResponse.json(
      { error: "批量获取评论信息失败" },
      { status: 500 },
    );
  }
}
