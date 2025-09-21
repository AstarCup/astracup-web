'use client';

import { useState, useEffect } from 'react';
import { showSuccess, showError } from './Notification';
import RatingDisplay from './RatingDisplay';
import CommentComponent from './CommentComponent';
import CurrentRating from './CurrentRating';

interface RatingProps {
    mapSelectionId: number;
    userId: string | null;
    selectedBy: string; // 提名者的osu ID
    onRatingUpdate?: () => void;
}

interface RatingStats {
    averageRating: number;
    totalRatings: number;
    ratingDistribution: {
        [key: number]: number;
    };
}

interface UserRating {
    rating: number;
    comment: string;
}

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

export default function RatingSystem({ mapSelectionId, userId, selectedBy, onRatingUpdate }: RatingProps) {
    const [userRating, setUserRating] = useState<UserRating | null>(null);
    const [allRatings, setAllRatings] = useState<MapRating[]>([]);
    const [stats, setStats] = useState<RatingStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [commentInput, setCommentInput] = useState('');

    // 获取用户评分和统计信息
    useEffect(() => {
        fetchRatingData();
    }, [mapSelectionId, userId]);

    const fetchRatingData = async () => {
        if (!userId) return;

        try {
            setIsLoading(true);

            // 获取所有评分
            const ratingResponse = await fetch(`/api/map-ratings?mapSelectionId=${mapSelectionId}`);
            if (ratingResponse.ok) {
                const ratingData = await ratingResponse.json();
                if (ratingData.success) {
                    setAllRatings(ratingData.ratings);

                    const userRating = ratingData.ratings.find((r: MapRating) => r.userId === userId);
                    if (userRating) {
                        setUserRating({
                            rating: userRating.rating,
                            comment: userRating.comment
                        });
                        setCommentInput(userRating.comment);
                    } else {
                        setUserRating(null);
                    }
                }
            }

            // 获取评分统计
            const statsResponse = await fetch(`/api/map-ratings?mapSelectionId=${mapSelectionId}&statsOnly=true`);
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                if (statsData.success) {
                    setStats(statsData.stats);
                }
            }
        } catch (error) {
            console.error('Error fetching rating data:', error);
            showError('获取评分信息失败');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRating = async (rating: number) => {
        if (!userId) {
            showError('请先登录');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/map-ratings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mapSelectionId,
                    rating,
                    comment: userRating?.comment || '',
                    userId
                })
            });

            if (response.ok) {
                setUserRating(prev => ({
                    rating,
                    comment: prev?.comment || ''
                }));
                showSuccess('评分成功');
                fetchRatingData();
                onRatingUpdate?.();
            } else {
                const errorData = await response.json();
                showError(errorData.error || '评分失败');
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            showError('评分失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 获取提名者的评分
    const nominatorRating = allRatings.find(rating => rating.userId === selectedBy);

    // 获取其他用户的评分（排除当前用户和提名者）
    const otherRatings = allRatings.filter(rating =>
        rating.userId !== userId && rating.userId !== selectedBy
    );

    if (isLoading) {
        return (
            <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 左右布局 */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* 左侧：其他用户评分 */}
                <div className="flex-1">
                    <RatingDisplay
                        ratings={allRatings}
                        selectedBy={selectedBy}
                        currentUserId={userId}
                    />
                </div>

                {/* 右侧：当前用户评分区域 */}
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">我的评分</h4>

                    <div className="bg-white rounded-lg p-4 border">
                        {/* 评分星星 */}
                        <CurrentRating
                            rating={userRating?.rating || 0}
                            onRatingChange={handleRating}
                            isSubmitting={isSubmitting}
                            userId={userId}
                        />

                        {/* 评论区域 */}
                        {userRating?.rating && (
                            <CommentComponent
                                mapSelectionId={mapSelectionId}
                                userId={userId}
                                initialComment={userRating.comment}
                                initialRating={userRating.rating}
                                onCommentUpdate={fetchRatingData}
                            />
                        )}
                    </div>

                    {/* 评分统计 */}
                    {stats && stats.totalRatings > 0 && (
                        <div className="mt-4 bg-white rounded-lg p-3 border text-center">
                            <div className="text-2xl font-bold text-yellow-500">
                                {stats.averageRating.toFixed(1)}
                            </div>
                            <div className="text-gray-600 text-xs">
                                ({stats.totalRatings} 个评分)
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
