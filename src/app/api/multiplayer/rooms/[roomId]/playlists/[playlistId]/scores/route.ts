import { NextRequest, NextResponse } from "next/server";
import { getValidClientToken } from "@/lib/osu-auth";
import { DisplayScore } from "@/lib/multiplayer-types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; playlistId: string }> },
) {
  try {
    const { roomId, playlistId } = await params;

    if (!roomId || !playlistId) {
      return NextResponse.json(
        { success: false, error: "房间ID和播放列表ID不能为空" },
        { status: 400 },
      );
    }

    // 获取客户端token
    const accessToken = await getValidClientToken();

    // 获取房间信息和playlist信息
    let roomName = "";
    let beatmapId: number | null = null;
    let beatmapsetId: number | null = null;

    try {
      // 获取房间信息
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
        roomName = roomData.name || `Room ${roomId}`;
      }

      // 获取playlist信息
      const playlistResponse = await fetch(
        `https://osu.ppy.sh/api/v2/rooms/${roomId}/playlist/${playlistId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (playlistResponse.ok) {
        const playlistData = await playlistResponse.json();
        beatmapId = playlistData.beatmap_id;
        beatmapsetId = playlistData.beatmap?.beatmapset_id;
      }
    } catch (error) {
      console.warn("Failed to fetch room/playlist info:", error);
    }

    // 获取分数数据
    const scoresResponse = await fetch(
      `https://osu.ppy.sh/api/v2/rooms/${roomId}/playlist/${playlistId}/scores?limit=100&sort=score_desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!scoresResponse.ok) {
      console.error(
        `Failed to fetch scores for room ${roomId}, playlist ${playlistId}:`,
        scoresResponse.status,
        scoresResponse.statusText,
      );
      return NextResponse.json(
        { success: false, error: "获取分数失败" },
        { status: scoresResponse.status },
      );
    }

    const scoresData = await scoresResponse.json();

    // 转换数据格式
    const displayScores: DisplayScore[] =
      scoresData.scores?.map((score: any, index: number) => ({
        user_id: score.user_id,
        username: score.user.username,
        avatar_url: score.user.avatar_url,
        country_code: score.user.country_code,
        total_score: score.total_score,
        accuracy: score.accuracy,
        max_combo: score.max_combo,
        mods: score.mods.map((mod: any) => mod.acronym),
        rank: score.rank,
        passed: score.passed,
        statistics: {
          count_300: score.statistics?.great || 0,
          count_100: score.statistics?.ok || 0,
          count_50: score.statistics?.meh || 0,
          count_miss: score.statistics?.miss || 0,
        },
        pp: score.pp,
        ended_at: score.ended_at,
        position: index + 1,
        beatmap_id: beatmapId,
        beatmapset_id: beatmapsetId,
        roomId: parseInt(roomId),
        roomName: roomName,
        playlistId: parseInt(playlistId),
      })) || [];

    return NextResponse.json({
      success: true,
      scores: displayScores,
      total: displayScores.length,
    });
  } catch (error) {
    console.error("Error fetching playlist scores:", error);
    return NextResponse.json(
      { success: false, error: "获取分数时发生错误" },
      { status: 500 },
    );
  }
}
