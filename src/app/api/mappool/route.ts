import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const season = searchParams.get("season") || "s1";

    // 构建图池文件路径
    const mapPoolPath = path.join(
      process.cwd(),
      "public",
      "mappools",
      season,
      "mappool.json",
    );

    try {
      const fileContent = await fs.readFile(mapPoolPath, "utf8");
      const mapPoolData = JSON.parse(fileContent);

      return NextResponse.json(mapPoolData);
    } catch (fileError) {
      // 如果文件不存在，返回空的图池数据
      if ((fileError as NodeJS.ErrnoException).code === "ENOENT") {
        return NextResponse.json({});
      }
      throw fileError;
    }
  } catch (error) {
    console.error("获取图池数据失败:", error);
    return NextResponse.json({ error: "获取图池数据失败" }, { status: 500 });
  }
}
