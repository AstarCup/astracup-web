'use client';

import { useState, useEffect } from 'react';

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
}

export default function RatingDisplay({ ratings, selectedBy, currentUserId, onRefresh }: RatingDisplayProps) {
    const [hoveredUser, setHoveredUser] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState(Date.now());

    // 当ratings变化时更新显示
    useEffect(() => {
        setLastUpdated(Date.now());
    }, [ratings]);

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

    // 获取所有评分
    const allRatings = ratings;

    return (
        <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm">所有评分</h4>

            {allRatings.length > 0 ? (
                <div className="space-y-2">
                    {allRatings.map((rating) => (
                        <div
                            key={rating.id}
                            className="flex items-center justify-between p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors group"
                            onMouseEnter={() => setHoveredUser(rating.userId)}
                            onMouseLeave={() => setHoveredUser(null)}
                        >
                            <div className="flex items-center space-x-2">
                                {/* 用户头像 */}
                                <div className="w-6 h-6 rounded-full relative">
                                    <img
                                        src={rating.avatar_url}
                                        alt={rating.username}
                                        className="w-6 h-6 rounded-full object-cover"
                                        onError={(e) => {
                                            // 如果头像加载失败，显示首字母
                                            e.currentTarget.style.display = 'none';
                                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                            if (fallback) fallback.style.display = 'flex';
                                        }}
                                    />
                                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center absolute inset-0" style={{ display: 'none' }}>
                                        <span className="text-xs text-gray-600">
                                            {rating.username?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>

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

                                <div className="flex flex-col">
                                    <span className="text-sm text-gray-700">
                                        {rating.username}
                                        {rating.userId === selectedBy && (
                                            <span className="ml-1 text-blue-500 text-xs">(提名者)</span>
                                        )}
                                    </span>
                                    {rating.comment && (
                                        <span className="text-xs text-gray-500 mt-1">
                                            {rating.comment}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                {renderStars(rating.rating, 'text-sm')}
                                <span className="text-xs text-gray-600">
                                    {rating.rating}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 text-sm">暂无评分</p>
            )}
        </div>
    );
}
