'use client';

import { useState } from 'react';
import { showSuccess, showError } from './Notification';

interface CommentComponentProps {
    mapSelectionId: number;
    userId: string | null;
    initialComment: string;
    initialRating: number; // 用户之前的评分（如果有）
    onCommentUpdate: () => void;
}

export default function CommentComponent({
    mapSelectionId,
    userId,
    initialComment,
    initialRating,
    onCommentUpdate
}: CommentComponentProps) {
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [commentInput, setCommentInput] = useState(initialComment);
    const [ratingInput, setRatingInput] = useState(initialRating);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCommentSubmit = async () => {
        if (!userId) {
            showError('请先登录');
            return;
        }

        if (ratingInput === 0) {
            showError('请选择评分');
            return;
        }

        if (!commentInput.trim()) {
            showError('请输入评论内容');
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
                    rating: ratingInput,
                    comment: commentInput.trim(),
                    userId
                })
            });

            if (response.ok) {
                setShowCommentForm(false);
                showSuccess('评论提交成功');
                onCommentUpdate();
                // 调用刷新回调（如果存在）
                if (typeof (window as any).refreshRatings === 'function') {
                    (window as any).refreshRatings();
                }
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

    if (!showCommentForm) {
        return (
            <div className="text-center">
                {initialComment ? (
                    <div>
                        <p className="text-gray-800 text-sm mb-2">{initialComment}</p>
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
        );
    }

    return (
        <div className="space-y-3">
            {/* 评分选择器 */}
            <div className="flex items-center justify-center space-x-2">
                <span className="text-sm text-gray-600">评分：</span>
                <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRatingInput(star)}
                            className={`w-8 h-8 text-lg ${star <= ratingInput
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                } hover:text-yellow-400 transition-colors`}
                        >
                            ★
                        </button>
                    ))}
                </div>
                <span className="text-sm text-gray-500 ml-2">
                    {ratingInput > 0 && `${ratingInput} 星`}
                </span>
            </div>

            {/* 评论输入框 */}
            <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="写下你的评论..."
                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-800"
                rows={3}
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
                    onClick={() => {
                        setShowCommentForm(false);
                        setCommentInput(initialComment);
                        setRatingInput(initialRating);
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                >
                    取消
                </button>
            </div>
        </div>
    );
}
