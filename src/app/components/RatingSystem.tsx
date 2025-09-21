'use client';

import { useState, useEffect } from 'react';
import { showSuccess, showError } from './Notification';

interface RatingProps {
    mapSelectionId: number;
    userId: string | null;
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

export default function RatingSystem({ mapSelectionId, userId, onRatingUpdate }: RatingProps) {
    const [userRating, setUserRating] = useState<UserRating | null>(null);
    const [stats, setStats] = useState<RatingStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [commentInput, setCommentInput] = useState('');

    // 获取用户评分和统计信息
    useEffect(() => {
        fetchRatingData();
    }, [mapSelectionId, userId]);

    const fetchRatingData = async () => {
        if (!userId) return;

        try {
            setIsLoading(true);

            // 获取用户评分
            const ratingResponse = await fetch(`/api/map-ratings?mapSelectionId=${mapSelectionId}`);
            if (ratingResponse.ok) {
                const ratingData = await ratingResponse.json();
                if (ratingData.success) {
                    const userRating = ratingData.ratings.find((r: any) => r.userId === userId);
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

    const handleCommentSubmit = async () => {
        if (!userId || !userRating) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/map-ratings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mapSelectionId,
                    rating: userRating.rating,
                    comment: commentInput,
                    userId
                })
            });

            if (response.ok) {
                setUserRating(prev => ({
                    rating: prev?.rating || 0,
                    comment: commentInput
                }));
                setShowCommentForm(false);
                showSuccess('评论提交成功');
                fetchRatingData();
                onRatingUpdate?.();
            } else {
                const errorData = await response.json();
                showError(errorData.error || '评论提交失败');
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            showError('评论提交失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStars = (rating: number, interactive: boolean = false) => {
        return Array.from({ length: 5 }, (_, i) => i + 1).map(star => (
            <button
                key={star}
                onClick={() => interactive && handleRating(star)}
                disabled={!interactive || isSubmitting}
                className={`text-2xl ${star <= rating
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    } ${interactive ? 'hover:text-yellow-300 cursor-pointer' : 'cursor-default'}`}
            >
                ★
            </button>
        ));
    };

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
            {/* 评分统计 */}
            {stats && (
                <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-semibold text-gray-800 mb-2">评分统计</h4>
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="text-2xl font-bold text-yellow-500">
                            {stats.averageRating.toFixed(1)}
                        </div>
                        <div className="text-gray-600">
                            ({stats.totalRatings} 个评分)
                        </div>
                    </div>
                    <div className="flex items-center space-x-1">
                        {renderStars(Math.round(stats.averageRating))}
                    </div>

                    {/* 评分分布 */}
                    {stats.totalRatings > 0 && (
                        <div className="mt-3 space-y-1">
                            {[5, 4, 3, 2, 1].map(rating => (
                                <div key={rating} className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600 w-4">{rating}★</span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-yellow-400 h-2 rounded-full"
                                            style={{
                                                width: `${(stats.ratingDistribution[rating] / stats.totalRatings) * 100}%`
                                            }}
                                        ></div>
                                    </div>
                                    <span className="text-sm text-gray-600 w-8">
                                        {stats.ratingDistribution[rating]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 用户评分区域 */}
            {userId && (
                <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-semibold text-gray-800 mb-3">我的评分</h4>

                    {/* 评分星星 */}
                    <div className="flex items-center space-x-1 mb-3">
                        {renderStars(userRating?.rating || 0, true)}
                        {userRating?.rating && (
                            <span className="text-sm text-gray-600 ml-2">
                                {userRating.rating}分
                            </span>
                        )}
                    </div>

                    {/* 评论区域 */}
                    {userRating?.rating && (
                        <div>
                            {showCommentForm ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={commentInput}
                                        onChange={(e) => setCommentInput(e.target.value)}
                                        placeholder="写下你的评论..."
                                        className="w-full p-2 border border-gray-300 rounded text-sm text-gray-800"
                                        rows={3}
                                    />
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={handleCommentSubmit}
                                            disabled={isSubmitting}
                                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                                        >
                                            {isSubmitting ? '提交中...' : '提交评论'}
                                        </button>
                                        <button
                                            onClick={() => setShowCommentForm(false)}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                                        >
                                            取消
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {userRating.comment ? (
                                        <div>
                                            <p className="text-gray-800 text-sm mb-2">{userRating.comment}</p>
                                            <button
                                                onClick={() => setShowCommentForm(true)}
                                                className="text-blue-500 hover:text-blue-600 text-sm"
                                            >
                                                编辑评论
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowCommentForm(true)}
                                            className="text-blue-500 hover:text-blue-600 text-sm"
                                        >
                                            添加评论
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
