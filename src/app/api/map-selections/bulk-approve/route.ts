import { NextRequest, NextResponse } from "next/server";
import { updateMapSelection } from "@/lib/map-selection";
import { verifyAdminAuth, verifyMapSelectionAuth } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { selectionIds, approved, selectedBy } = requestBody;

    if (
      !selectionIds ||
      !Array.isArray(selectionIds) ||
      selectionIds.length === 0
    ) {
      return NextResponse.json(
        { error: "缺少必要参数：selectionIds" },
        { status: 400 },
      );
    }

    if (approved === undefined) {
      return NextResponse.json(
        { error: "缺少必要参数：approved" },
        { status: 400 },
      );
    }

    if (!selectedBy) {
      return NextResponse.json({ error: "缺少用户信息" }, { status: 400 });
    }

    // 验证权限 - 只有管理员或图池选择者可以批量过审
    const isAdmin = await verifyAdminAuth(selectedBy);
    const isMapSelector = await verifyMapSelectionAuth(selectedBy);

    if (!isAdmin && !isMapSelector) {
      return NextResponse.json(
        { error: "您没有权限进行批量过审操作" },
        { status: 403 },
      );
    }

    // 批量更新选图状态
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const selectionId of selectionIds) {
      try {
        const success = await updateMapSelection(
          parseInt(selectionId),
          { approved },
          selectedBy,
        );

        if (success) {
          successCount++;
          results.push({
            selectionId,
            success: true,
            message: "更新成功",
          });
        } else {
          failCount++;
          results.push({
            selectionId,
            success: false,
            message: "更新失败或没有权限",
          });
        }
      } catch (error) {
        failCount++;
        results.push({
          selectionId,
          success: false,
          message: `更新错误: ${error instanceof Error ? error.message : "未知错误"}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `批量过审完成，成功: ${successCount}，失败: ${failCount}`,
      results,
      summary: {
        total: selectionIds.length,
        success: successCount,
        failed: failCount,
      },
    });
  } catch (error) {
    console.error("Error in bulk approval:", error);
    return NextResponse.json({ error: "批量过审失败" }, { status: 500 });
  }
}
