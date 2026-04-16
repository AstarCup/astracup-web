"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface MapRating {
  id: number;
  mapSelectionId: number;
  userId: string;
  username: string;
  avatar_url: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

interface RatingDisplayProps {
  ratings: MapRating[];
  selectedBy: string;
  currentUserId: string | null;
  onRefresh?: () => void;
  compact?: boolean; // 新增：紧凑模式，用于右上角显示
  isAdmin?: boolean; // 新增：管理员权限
}

export default function RatingDisplay({
  ratings,
  selectedBy,
  currentUserId,
  onRefresh,
  compact = false,
  isAdmin = false,
}: RatingDisplayProps) {
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  // 当ratings变化时更新显示
  useEffect(() => {
    setLastUpdated(Date.now());
  }, [ratings]);

  const renderStars = (rating: number, size: string = "text-lg") => {
    return Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
      <span
        key={star}
        className={`${size} ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
      >
        ★
      </span>
    ));
  };

  // 获取所有评分
  const allRatings = ratings;

  // 计算平均分
  const averageRating =
    allRatings.length > 0
      ? allRatings.reduce((sum, rating) => sum + rating.rating, 0) /
        allRatings.length
      : 0;

  // 删除评论
  const handleDeleteComment = async (id: number) => {
    if (!currentUserId) {
      alert("请先登录");
      return;
    }
    if (!id) {
      alert("无效的评论ID");
      return;
    }
    if (!window.confirm("确定要删除这条评论吗？")) return;
    try {
      const response = await fetch(
        `/api/map-ratings?id=${id}&userId=${currentUserId}`,
        { method: "DELETE" },
      );
      if (response.ok) {
        if (onRefresh) onRefresh();
      } else {
        let errorMessage = "未知错误";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `HTTP ${response.status}`;
        } catch (_parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error("删除评论失败:", errorMessage);
        alert(`删除失败: ${errorMessage}`);
      }
    } catch (e) {
      console.error("删除评论失败:", e);
      alert("删除评论失败，请稍后重试");
    }
  };

  return (
    <div className={compact ? "flex items-center gap-1" : "space-y-3"}>
      {compact ? (
        // 紧凑模式：只显示平均分和评分
        <div className="flex items-center gap-2 text-sm">
          {/* <span className="font-medium text-gray-700"></span> */}
          <div className="flex items-center gap-1">
            {/* {renderStars(averageRating, 'text-sm')} */}
            <span className="text-orange-500 ml-1 text-2xl font-bold">
              {averageRating.toFixed(2)}
            </span>
          </div>
        </div>
      ) : (
        // 原有模式：完整显示
        <>
          <h4 className="font-semibold text-gray-800 mb-2 text-sm">所有评分</h4>
          {allRatings.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {allRatings.map((rating) => (
                <div
                  key={rating.id}
                  className="relative group flex flex-col items-center w-16"
                  onMouseEnter={() => setHoveredUser(rating.userId)}
                  onMouseLeave={() => setHoveredUser(null)}
                >
                  {/* 头像 */}
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 bg-gray-200 flex items-center justify-center">
                    <Image
                      src={rating.avatar_url}
                      alt={rating.username}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      onError={() => {}}
                    />
                    <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center absolute inset-0">
                      <span className="text-base text-gray-600">
                        {rating.username?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                  </div>
                  {/* 简短评论 */}
                  <div className="flex items-center justify-center w-full">
                    {rating.comment && (
                      <span className="mt-1 text-xs text-gray-700 text-center max-w-[56px] truncate">
                        {rating.comment}
                      </span>
                    )}
                    {/* 删除按钮，仅自己评论或管理员可见 */}
                    {(currentUserId === rating.userId || isAdmin) && (
                      <button
                        className="ml-1 text-red-500 hover:text-red-700 text-xs font-bold"
                        title={
                          isAdmin && currentUserId !== rating.userId
                            ? "管理员删除评论"
                            : "删除评论"
                        }
                        onClick={() => handleDeleteComment(rating.id)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {/* Hover弹窗 */}
                  {hoveredUser === rating.userId && (
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded shadow-lg p-3 z-20 min-w-[180px] max-w-xs break-words animate-fadein">
                      <div className="font-semibold mb-1">
                        {rating.username}
                      </div>
                      <div className="text-gray-300 mb-1">
                        osu!ID: {rating.userId}
                      </div>
                      {rating.comment && (
                        <div className="mt-1 border-t border-gray-700 pt-2 text-gray-100">
                          {rating.comment}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">暂无评分</p>
          )}
        </>
      )}
    </div>
  );
}
