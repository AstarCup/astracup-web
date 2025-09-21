'use client';

import { useState } from 'react';
import { showSuccess, showError } from './Notification';

interface CommentComponentProps {
    mapSelectionId: number;
    userId: string | null;
    initialComment: string;
    currentRating: number; // 改为currentRating，实时获取当前评分
    onCommentUpdate: () => void;
}

export default function CommentComponent({
    mapSelectionId,
    userId,
    initialComment,
    currentRating,
    onCommentUpdate
}: CommentComponentProps) {
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [commentInput, setCommentInput] = useState(initialComment);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCommentSubmit = async () => {
        if (!userId || currentRating === 0) {
            showError('请先评分');
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
                    rating: currentRating,
                    comment: commentInput,
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
        <div className="space-y-2">
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
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                >
                    取消
                </button>
            </div>
        </div>
    );
}
