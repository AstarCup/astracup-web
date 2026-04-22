import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  updateMatchScheduleStatus,
  getUserMatchSchedules,
} from "@/lib/prisma-registrations";
import { getUserPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // 获取用户session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("astra_session");

    if (!sessionCookie?.value) {
      return NextResponse.json(
        {
          success: false,
          error: "未登录",
        },
        { status: 401 },
      );
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "会话无效",
        },
        { status: 401 },
      );
    }

    const userOsuId = session.osuId;
    if (!userOsuId) {
      return NextResponse.json(
        {
          success: false,
          error: "用户ID无效",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { id, status, ...additionalData } = body;

    if (!id || !status) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少必要字段",
        },
        { status: 400 },
      );
    }

    // 检查用户权限
    const permissions = await getUserPermissions(userOsuId);
    const isAdmin = permissions.isadmin;

    // 如果不是管理员，检查用户是否是比赛的参与者
    if (!isAdmin) {
      const userSchedules = await getUserMatchSchedules(userOsuId);
      const schedule = userSchedules.find((s) => s.id === parseInt(id));

      if (!schedule) {
        return NextResponse.json(
          {
            success: false,
            error: "无权限修改此比赛预约",
          },
          { status: 403 },
        );
      }

      // 普通用户只能接受或拒绝pending状态的预约
      if (status !== "confirmed" && status !== "cancelled") {
        return NextResponse.json(
          {
            success: false,
            error: "无权限执行此操作",
          },
          { status: 403 },
        );
      }

      if (schedule.status !== "pending") {
        return NextResponse.json(
          {
            success: false,
            error: "只能修改待确认状态的预约",
          },
          { status: 400 },
        );
      }

      // 检查用户是否是比赛的创建者，如果是创建者则不能确认比赛
      if (status === "confirmed") {
        // 获取比赛详情，检查created_by字段
        const scheduleData = await prisma.matchSchedule.findUnique({
          where: { id: parseInt(id) },
          select: { created_by: true },
        });

        if (scheduleData && scheduleData.created_by === userOsuId) {
          return NextResponse.json(
            {
              success: false,
              error: "您不能确认自己创建的比赛预约",
            },
            { status: 403 },
          );
        }
      }
    }

    // 更新比赛预约状态
    const success = await updateMatchScheduleStatus(parseInt(id), status);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "更新失败",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "比赛预约更新成功",
    });
  } catch (error) {
    console.error("Error updating match schedule:", error);
    return NextResponse.json(
      {
        success: false,
        error: "更新比赛预约失败",
      },
      { status: 500 },
    );
  }
}
