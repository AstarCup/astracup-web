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

    const blob = blobs[0];

    const response = await fetch(blob.url, {
      headers: {
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Blob download failed: ${response.status} ${response.statusText}`,
        },
        { status: response.status },
      );
    }

    const pathParts = blob.pathname.split("/");
    let filename = pathParts[pathParts.length - 1];
    if (!filename.toLowerCase().endsWith(".osz")) {
      filename = `${filename}.osz`;
    }

    const headers = new Headers();
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    headers.set("Cache-Control", "no-cache");

    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Blob download error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Internal server error during blob download" },
      { status: 500 },
    );
  }
}
