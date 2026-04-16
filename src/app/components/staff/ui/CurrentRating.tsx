"use client";

import { useState } from "react";

interface CurrentRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  isSubmitting: boolean;
  userId: string | null;
}

export default function CurrentRating({
  rating,
  onRatingChange,
  isSubmitting,
  userId,
}: CurrentRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="space-y-2">
      {/* 评分器 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">我的评分：</span>
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onRatingChange(star)}
              onMouseEnter={() => setHoverRating(star)}
              disabled={isSubmitting || !userId}
              className={`w-6 h-6 text-lg transition-colors disabled:opacity-50 ${
                star <= (hoverRating || rating)
                  ? "text-yellow-400"
                  : "text-gray-300"
              } hover:text-yellow-400`}
            >
              ★
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500 ml-2">
          {rating > 0 && `${rating}分`}
        </span>
      </div>
    </div>
  );
}
