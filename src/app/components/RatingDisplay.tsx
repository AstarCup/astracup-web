'use client';

import { useState } from 'react';

interface MapRating {
    id: number;
    mapSelectionId: number;
    userId: string;
    username: string;
    rating: number;
    comment: string;
    createdAt: string;
    updatedAt: string;
}

interface RatingDisplayProps {
    ratings: MapRating[];
    selectedBy: string;
    currentUserId: string | null;
}

export default function RatingDisplay({ ratings, selectedBy, currentUserId }: RatingDisplayProps) {
    const [hoveredUser, setHoveredUser] = useState<string | null>(null);

    const renderStars = (rating: number, size: string = 'text-lg') => {
        return Array.from({ length: 5 }, (_, i) => i + 1).map(star => (
            <span
                key={star}
                className={`${size} ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            >
                ★
            </span>
        ));
    };

    // 获取提名者的评分
    const nominatorRating = ratings.find(rating => rating.userId === selectedBy);

    // 获取其他用户的评分（排除当前用户和提名者）
    const otherRatings = ratings.filter(rating =>
        rating.userId !== currentUserId && rating.userId !== selectedBy
    );

    return (
        <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm">其他评分</h4>

            {/* 提名者评分 */}
            {nominatorRating && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            {/* 提名者头像 */}
                            <div
                                className="w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center relative group"
                                onMouseEnter={() => setHoveredUser(selectedBy)}
                                onMouseLeave={() => setHoveredUser(null)}
                            >
                                <span className="text-xs text-blue-800 font-medium">
                                    {nominatorRating.username?.charAt(0).toUpperCase() || 'N'}
                                </span>

                                {/* Hover提示 */}
                                {hoveredUser === selectedBy && (
                                    <div className="absolute top-full left-0 mt-2 bg-gray-800 text-white text-xs rounded p-2 z-10 min-w-[120px]">
                                        <div className="font-medium">{nominatorRating.username}</div>
                                        <div className="text-gray-300">osu!ID: {selectedBy}</div>
                                        <div className="flex items-center mt-1">
                                            {renderStars(nominatorRating.rating, 'text-sm')}
                                            <span className="ml-1 text-yellow-400">{nominatorRating.rating}</span>
                                        </div>
                                        {nominatorRating.comment && (
                                            <div className="mt-1 border-t border-gray-600 pt-1">
                                                {nominatorRating.comment}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <span className="text-sm text-gray-700">提名者</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            {renderStars(nominatorRating.rating)}
                            <span className="text-sm text-gray-600">
                                {nominatorRating.rating}分
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* 其他用户评分 */}
            {otherRatings.length > 0 && (
                <div className="space-y-2">
                    {otherRatings.map((rating) => (
                        <div
                            key={rating.id}
                            className="flex items-center justify-between p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors group"
                            onMouseEnter={() => setHoveredUser(rating.userId)}
                            onMouseLeave={() => setHoveredUser(null)}
                        >
                            <div className="flex items-center space-x-2">
                                {/* 用户头像 */}
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center relative">
                                    <span className="text-xs text-gray-600">
                                        {rating.username?.charAt(0).toUpperCase() || 'U'}
                                    </span>

                                    {/* Hover提示 */}
                                    {hoveredUser === rating.userId && (
                                        <div className="absolute top-full left-0 mt-1 bg-gray-800 text-white text-xs rounded p-2 z-10 min-w-[120px]">
                                            <div className="font-medium">{rating.username}</div>
                                            <div className="text-gray-300">osu!ID: {rating.userId}</div>
                                            <div className="flex items-center mt-1">
                                                {renderStars(rating.rating, 'text-sm')}
                                                <span className="ml-1 text-yellow-400">{rating.rating}</span>
                                            </div>
                                            {rating.comment && (
                                                <div className="mt-1 border-t border-gray-600 pt-1">
                                                    {rating.comment}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                            </div>
                            <div className="flex items-center space-x-1">
                                {renderStars(rating.rating)}
                                <span className="text-xs text-gray-600">
                                    {rating.rating}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {otherRatings.length === 0 && !nominatorRating && (
                <p className="text-gray-500 text-sm">暂无其他评分</p>
            )}
        </div>
    );
}
