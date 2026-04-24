import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getCommentsForMap,
  addComment,
  deleteComment,
  deleteCommentById,
  mapCommentsStorage,
} from "@/lib/map-ratings";
import { verifyAdminAuth } from "@/lib/permissions";

// 验证用户权限的辅助函数
async function verifyUserAuth(
  osuId: string,
): Promise<{ authorized: boolean; username?: string }> {
  try {
    // 对于评论功能，允许所有用户（只要有有效的session）
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("astra_session");

      if (sessionCookie?.value) {
        const session = JSON.parse(sessionCookie.value);
        return {
          authorized: true,
          username: session.username || `User_${osuId}`,
        };
      }
    } catch (sessionError) {
      console.error("Error getting session for username:", sessionError);
    }

    // 如果没有有效的session，则拒绝
    return { authorized: false };
  } catch (error) {
    console.error("Error verifying user auth:", error);
    return { authorized: false };
  }
}

// GET - 获取指定选图的评论
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mapSelectionId = searchParams.get("mapSelectionId");
    const id = searchParams.get("id"); // 直接查询单个评论

    if (!mapSelectionId && !id) {
      return NextResponse.json(
        { error: "缺少必要参数：mapSelectionId" },
        { status: 400 },
      );
    }

    // 获取所有评论
    const comments = await getCommentsForMap(parseInt(id || mapSelectionId!));
    return NextResponse.json({
      success: true,
      ratings: comments,
      count: comments.length,
    });
  } catch (error) {
    console.error("Error getting map comments:", error);
    return NextResponse.json({ error: "获取评论信息失败" }, { status: 500 });
  }
}

// POST - 添加评论
export async function POST(request: NextRequest) {
  try {
    const {
      mapSelectionId,
      rating,
      comment = "",
      userId,
    } = await request.json();

    if (!mapSelectionId || !userId) {
      return NextResponse.json(
        { error: "缺少必要参数：mapSelectionId, userId" },
        { status: 400 },
      );
    }

    // 验证用户权限
    const authResult = await verifyUserAuth(userId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: "您没有权限添加评论" },
        { status: 403 },
      );
    }

    // 获取用户头像URL
    let avatarUrl = "";
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("astra_session");

      if (sessionCookie?.value) {
        const session = JSON.parse(sessionCookie.value);
        avatarUrl = session.avatar_url || "";
      }
    } catch (sessionError) {
      console.error("Error getting session for avatar:", sessionError);
    }

    // 添加评论（不再接受rating参数）
    const success = await addComment(
      parseInt(mapSelectionId),
      userId,
      authResult.username || `User_${userId}`,
      comment,
      avatarUrl,
    );

    if (!success) {
      return NextResponse.json({ error: "添加评论失败" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "评论添加成功",
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json({ error: "添加评论失败" }, { status: 500 });
  }
}

// DELETE - 删除评论
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id"); // 记录ID
    const mapSelectionId = searchParams.get("mapSelectionId");
    const userId = searchParams.get("userId");

    if (!id && (!mapSelectionId || !userId)) {
      return NextResponse.json(
        { error: "缺少必要参数：id 或 (mapSelectionId, userId)" },
        { status: 400 },
      );
    }

    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    // 验证用户权限 - 管理员可以删除任何评论
    const isAdmin = await verifyAdminAuth(userId);
    const authResult = await verifyUserAuth(userId);

    if (!isAdmin && !authResult.authorized) {
      return NextResponse.json(
        { error: "您没有权限删除评论" },
        { status: 403 },
      );
    }

    let success = false;
    if (id) {
      // 按记录ID删除 - 管理员可以删除任何人的评论
      if (isAdmin) {
        success = await deleteCommentById(parseInt(id));
      } else {
        success = await deleteCommentById(parseInt(id), userId);
      }
    } else {
      // 按用户和选图删除（向后兼容）
      success = await mapCommentsStorage.deleteCommentByMapAndUser(
        parseInt(mapSelectionId!),
        userId,
      );
    }

    if (!success) {
      return NextResponse.json({ error: "删除评论失败" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "评论删除成功",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "删除评论失败" }, { status: 500 });
  }
}