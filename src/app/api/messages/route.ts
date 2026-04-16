import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getUserMessages,
  updateMessageStatus,
  updatePlayerMatchupStatus,
} from "@/lib/prisma-registrations";

export async function GET(_request: NextRequest) {
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

    // 获取用户消息
    const messages = await getUserMessages(userOsuId);

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Error getting user messages:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取消息失败",
      },
      { status: 500 },
    );
  }
}

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

    // 获取请求体
    const body = await request.json();
    const { messageId, action } = body; // action: 'read', 'accept', 'decline'

    if (!messageId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少必要参数",
        },
        { status: 400 },
      );
    }

    let status: "read" | "responded" = "read";
    let response_action: string | undefined;

    if (action === "accept" || action === "decline") {
      status = "responded";
      response_action = action;
    }

    // 更新消息状态
    const success = await updateMessageStatus(messageId, status);

    if (success) {
      // 如果是预约邀请的响应，需要更新对战状态
      if (action === "accept" || action === "decline") {
        // 获取消息详情以找到相关对战ID
        const messages = await getUserMessages(userOsuId);
        const message = messages.find((m) => m.id === messageId);

        if (message && message.related_matchup_id) {
          // 根据响应更新对战状态
          const newMatchupStatus =
            action === "accept" ? "scheduled" : "available";
          await updatePlayerMatchupStatus(
            message.related_matchup_id,
            newMatchupStatus,
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: "消息状态更新成功",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "消息不存在或更新失败",
        },
        { status: 404 },
      );
    }
  } catch (error) {
    console.error("Error updating message status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "更新消息状态失败",
      },
      { status: 500 },
    );
  }
}
