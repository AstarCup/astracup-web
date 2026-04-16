import { NextResponse } from "next/server";
import { getOsuAuthUrl } from "@/lib/osu-auth";

export async function GET() {
  try {
    const authUrl = getOsuAuthUrl();

    return NextResponse.json({
      success: true,
      authUrl: authUrl,
    });
  } catch (error) {
    console.error("Error generating auth URL:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate authentication URL",
      },
      { status: 500 },
    );
  }
}
