import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sid = searchParams.get("sid");
  const source = searchParams.get("source") || "sayobot";

  if (!sid) {
    return NextResponse.json(
      { error: "Missing sid parameter" },
      { status: 400 },
    );
  }

  try {
    let downloadUrl: string;

    if (source === "osu") {
      downloadUrl = `https://osu.ppy.sh/beatmapsets/${sid}/download`;
    } else if (source === "nerinyan") {
      downloadUrl = `https://api.nerinyan.moe/d/${sid}`;
    } else if (source === "sayobot") {
      downloadUrl = `https://dl.sayobot.cn/beatmaps/download/full/${sid}`;
    } else {
      downloadUrl = `https://api.nerinyan.moe/d/${sid}`;
    }

    const referer = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rino.ink/";
    const userAgent =
      request.headers.get("user-agent") ||
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    const response = await fetch(downloadUrl, {
      headers: {
        Referer: referer,
        "User-Agent": userAgent,
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (!response.ok) {
      if (response.status === 302 || response.status === 301) {
        const redirectUrl = response.headers.get("location");
        if (redirectUrl) {
          const redirectResponse = await fetch(redirectUrl, {
            headers: {
              Referer: referer,
              "User-Agent": userAgent,
            },
          });

          if (redirectResponse.ok) {
            const contentDisposition = redirectResponse.headers.get(
              "content-disposition",
            );
            let filename = `beatmap_${sid}.osz`;
            if (contentDisposition) {
              const filenameMatch = contentDisposition.match(
                /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
              );
              if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/['"]/g, "");
              }
            }

            const headers = new Headers();
            headers.set("Content-Type", "application/octet-stream");
            headers.set(
              "Content-Disposition",
              `attachment; filename="${filename}"`,
            );
            headers.set("Cache-Control", "no-cache");

            return new NextResponse(redirectResponse.body, {
              status: 200,
              headers,
            });
          }
        }
      }

      return NextResponse.json(
        { error: `Download failed: ${response.status} ${response.statusText}` },
        { status: response.status },
      );
    }

    const contentDisposition = response.headers.get("content-disposition");
    let filename = `beatmap_${sid}.osz`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
      );
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
      }
    }

    const headers = new Headers();
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    headers.set("Cache-Control", "no-cache");

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Download proxy error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      sid,
    });
    return NextResponse.json(
      { error: "Internal server error during download" },
      { status: 500 },
    );
  }
}
