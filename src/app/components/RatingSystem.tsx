'use client';

import { useState, useEffect } from 'react';
import { showSuccess, showError } from './Notification';

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
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [hoveredUser, setHoveredUser] = useState<string | null>(null);

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

    const renderStars = (rating: number, interactive: boolean = false, size: string = 'text-2xl') => {
        return Array.from({ length: 5 }, (_, i) => i + 1).map(star => (
            <button
                key={star}
                onClick={() => interactive && handleRating(star)}
                disabled={!interactive || isSubmitting}
                className={`${size} ${star <= rating
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                    } ${interactive ? 'hover:text-yellow-300 cursor-pointer' : 'cursor-default'}`}
            >
                ★
            </button>
        ));
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
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">其他评分</h4>

                    {/* 提名者评分 */}
                    {nominatorRating && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
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
                                                    {renderStars(nominatorRating.rating, false, 'text-sm')}
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
                                                        {renderStars(rating.rating, false, 'text-sm')}
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
                                        <span className="text-xs text-gray-600 truncate max-w-[80px]">
                                            {rating.username}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        {renderStars(rating.rating, false, 'text-lg')}
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

                {/* 右侧：当前用户评分区域 */}
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">我的评分</h4>

                    <div className="bg-white rounded-lg p-4 border">
                        {/* 评分星星 */}
                        <div className="flex items-center space-x-1 mb-3 justify-center">
                            {renderStars(userRating?.rating || 0, true)}
                            {userRating?.rating && (
                                <span className="text-sm text-gray-600 ml-2">
                                    {userRating.rating}分
                                </span>
                            )}
                        </div>

                        {/* 评论区域 */}
                        {userRating?.rating && (
                            <div className="text-center">
                                {showCommentForm ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={commentInput}
                                            onChange={(e) => setCommentInput(e.target.value)}
                                            placeholder="写下你的评论..."
                                            className="w-full p-2 border border-gray-300 rounded text-sm text-gray-800"
                                            rows={2}
                                        />
                                        <div className="flex space-x-2 justify-center">
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
