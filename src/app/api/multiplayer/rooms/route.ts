import { NextRequest, NextResponse } from "next/server";
import { getValidClientToken } from "@/lib/osu-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomIds = searchParams.get("roomIds");

    if (!roomIds) {
      return NextResponse.json(
        { success: false, error: "房间ID列表不能为空" },
        { status: 400 },
      );
    }

    const roomIdArray = roomIds
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id);

    if (roomIdArray.length === 0) {
      return NextResponse.json(
        { success: false, error: "没有有效的房间ID" },
        { status: 400 },
      );
    }

    // 获取客户端token
    const accessToken = await getValidClientToken();
    const rooms = [];

    // 批量获取房间信息
    for (const roomId of roomIdArray) {
      try {
        const roomResponse = await fetch(
          `https://osu.ppy.sh/api/v2/rooms/${roomId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (roomResponse.ok) {
          const roomData = await roomResponse.json();
          rooms.push({
            id: parseInt(roomId),
            name: roomData.name,
            category: roomData.category,
            type: roomData.type,
            starts_at: roomData.starts_at,
            ends_at: roomData.ends_at,
            participant_count: roomData.participant_count,
            host: roomData.host,
            playlist_count: roomData.playlist?.length || 0,
          });
        } else {
          console.warn(`Failed to fetch room ${roomId}:`, roomResponse.status);
        }
      } catch (error) {
        console.error(`Error fetching room ${roomId}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      rooms: rooms,
      total: rooms.length,
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { success: false, error: "获取房间信息时发生错误" },
      { status: 500 },
    );
  }
}
