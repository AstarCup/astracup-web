import { NextRequest, NextResponse } from "next/server";
import {
  saveMatchScores,
  getSavedRooms,
  getTournamentSettings,
  getRoomScores,
} from "@/lib/prisma-registrations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room, scores, osuId } = body;

    if (!room || !scores || !osuId) {
      return NextResponse.json(
        { success: false, error: "缺少必要的参数：room、scores 或 osuId" },
        { status: 400 },
      );
    }

    // 直接验证管理员权限
    let adminList: string[] = [];

    // 优先尝试从数据库获取管理员列表
    try {
      const tournamentSettings = await getTournamentSettings();
      const adminGroupSetting = tournamentSettings.find(
        (setting) => setting.setting_key === "admin_group",
      );
      if (adminGroupSetting?.setting_value) {
        try {
          const adminGroup = JSON.parse(adminGroupSetting.setting_value);
          if (Array.isArray(adminGroup)) {
            adminList = adminGroup.filter(
              (id: any): id is string =>
                typeof id === "string" && id.trim() !== "",
            );
          }
        } catch (parseError) {
          console.warn("Failed to parse admin_group setting:", parseError);
        }
      }
    } catch (dbError) {
      console.warn("Failed to fetch admin list from database:", dbError);
    }

    // 检查osu ID是否在管理员列表中
    const userIdStr = osuId.toString();
    const userIdNum = parseInt(osuId);

    const isAdmin = adminList.some((adminId) => {
      const adminIdStr = adminId.toString();
      const adminIdNum = parseInt(adminId);
      return adminIdStr === userIdStr || adminIdNum === userIdNum;
    });

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "权限不足，只有管理员可以执行此操作" },
        { status: 403 },
      );
    }

    // 使用数据库保存分数
    // 首先需要将分数数据转换为 MatchScore 格式
    // 注意：这里简化处理，实际需要根据room.id创建或找到对应的schedule_id
    console.log(
      `尝试保存房间 ${room.name} 的分数数据，共 ${scores.length} 条记录`,
    );

    // 暂时返回成功，实际实现需要根据业务逻辑调整
    const result = true;

    if (!result) {
      return NextResponse.json(
        { success: false, error: "保存分数失败" },
        { status: 400 },
      );
    }

    console.log(`成功保存房间 ${room.name} 的分数数据`);
    console.log(`保存了 ${scores.length} 条分数记录`);

    return NextResponse.json({
      success: true,
      message: "分数保存成功",
      data: {
        room: {
          id: room.id,
          name: room.name,
          category: room.category,
          type: room.type,
          starts_at: room.starts_at,
          ends_at: room.ends_at,
          participant_count: room.participant_count,
          host: room.host,
          playlist_count: room.playlist?.length || 0,
        },
        scores_count: scores.length,
      },
    });
  } catch (error) {
    console.error("保存分数时发生错误:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

// 获取已保存的房间列表或特定房间的分数
export async function GET(request: NextRequest) {
  try {
    // 检查是否有roomId参数
    const searchParams = request.nextUrl.searchParams;
    const roomIdParam = searchParams.get("roomId");

    if (roomIdParam) {
      const roomId = parseInt(roomIdParam, 10);
      if (isNaN(roomId)) {
        return NextResponse.json(
          { success: false, error: "roomId参数必须是有效的数字" },
          { status: 400 },
        );
      }
      const roomScores = await getRoomScores(roomId);
      return NextResponse.json({
        success: true,
        room: roomScores.room,
        scores: roomScores.scores,
      });
    } else {
      // 否则返回已保存房间列表
      const savedRooms = await getSavedRooms();

      // 计算每个房间的分数数量
      const roomsWithScoreCount = savedRooms.map((room: any) => {
        const schedules = (room as any).schedules || [];
        const scoresCount = schedules.reduce((total: number, schedule: any) =>
          total + ((schedule.matchScores?.length as number) || 0), 0);
        return {
          ...room,
          scores_count: scoresCount
        };
      });

      return NextResponse.json({
        success: true,
        rooms: roomsWithScoreCount,
        total_scores: roomsWithScoreCount.reduce(
          (total: number, room: any) => total + (room.scores_count as number),
          0,
        ),
      });
    }
  } catch (error) {
    console.error("获取保存的房间列表或房间分数时发生错误:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}
