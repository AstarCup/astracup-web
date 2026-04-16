import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // 读取构建时生成的版本文件
    const versionFile = path.join(process.cwd(), "public", "version.json");
    const versionData = fs.readFileSync(versionFile, "utf8");
    const { version } = JSON.parse(versionData);

    return NextResponse.json({ version });
  } catch (error) {
    console.warn("Failed to read version file:", error);
    // 如果读取失败，返回一个默认版本
    return NextResponse.json({ version: "unknown" });
  }
}
