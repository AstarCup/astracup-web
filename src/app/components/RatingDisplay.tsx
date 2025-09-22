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

    // 删除评论
    const handleDeleteComment = async (id: number) => {
        if (!window.confirm('确定要删除这条评论吗？')) return;
        try {
            const response = await fetch(`/api/map-ratings?id=${id}`, { method: 'DELETE' });
            if (response.ok) {
                if (onRefresh) onRefresh();
            }
        } catch (e) { }
    };

    return (
        <div className="space-y-3">
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
                                <img
                                    src={rating.avatar_url}
                                    alt={rating.username}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (fallback) fallback.style.display = 'flex';
                                    }}
                                />
                                <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center absolute inset-0" style={{ display: 'none' }}>
                                    <span className="text-base text-gray-600">
                                        {rating.username?.charAt(0).toUpperCase() || 'U'}
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
                                {/* 删除按钮，仅自己评论可见 */}
                                {currentUserId === rating.userId && (
                                    <button
                                        className="ml-1 text-red-500 hover:text-red-700 text-xs font-bold"
                                        title="删除评论"
                                        onClick={() => handleDeleteComment(rating.id)}
                                    >×</button>
                                )}
                            </div>
                            {/* Hover弹窗 */}
                            {hoveredUser === rating.userId && (
                                <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded shadow-lg p-3 z-20 min-w-[180px] max-w-xs break-words animate-fadein">
                                    <div className="font-semibold mb-1">{rating.username}</div>
                                    <div className="text-gray-300 mb-1">osu!ID: {rating.userId}</div>
                                    <div className="flex items-center mb-1">
                                        {renderStars(rating.rating, 'text-base')}
                                        <span className="ml-2 text-yellow-400 font-bold">{rating.rating}</span>
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
        </div>
    );
}
