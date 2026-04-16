import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const blobPath = searchParams.get("path");

  if (!blobPath) {
    return NextResponse.json(
      { error: "Missing blob path parameter" },
      { status: 400 },
    );
  }

  try {
    console.log("Downloading blob from path:", blobPath);

    // 使用list API查找blob文件
    const { blobs } = await list({
      prefix: blobPath,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (blobs.length === 0) {
      return NextResponse.json(
        { error: "Blob file not found" },
        { status: 404 },
      );
    }

    // 获取第一个匹配的blob
    const blob = blobs[0];
    console.log("Found blob:", {
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
    });

    // 下载文件内容
    const response = await fetch(blob.url, {
      headers: {
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    console.log("Blob fetch response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      contentType: response.headers.get("content-type"),
      contentLength: response.headers.get("content-length"),
    });

    if (!response.ok) {
      console.error("Blob download failed:", {
        status: response.status,
        statusText: response.statusText,
        blobPath,
        url: blob.url,
      });

      return NextResponse.json(
        {
          error: `Blob download failed: ${response.status} ${response.statusText}`,
        },
        { status: response.status },
      );
    }

    // 从blob路径中提取文件名
    const pathParts = blob.pathname.split("/");
    let filename = pathParts[pathParts.length - 1];

    // 确保文件名以.osz结尾
    if (!filename.toLowerCase().endsWith(".osz")) {
      filename = `${filename}.osz`;
    }

    // 创建响应，设置适当的头部
    const headers = new Headers();
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    headers.set("Cache-Control", "no-cache");

    // 如果响应有Content-Length，也设置它
    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    console.log("Blob download successful:", {
      path: blob.pathname,
      filename,
      contentLength,
      url: blob.url,
    });

    // 返回响应内容
    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Blob download error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      blobPath,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Internal server error during blob download" },
      { status: 500 },
    );
  }
}
