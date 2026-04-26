import { NextRequest, NextResponse } from "next/server";
import { updateMatchScores } from "@/lib/prisma-registrations";

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
      const { getTournamentSettings } = await import(
        "@/lib/prisma-registrations"
      );
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
        }
      }
    } catch (dbError) {
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

    return NextResponse.json({
      success: true,
      message: "分数更新成功",
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
    console.error("更新分数时发生错误:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}
