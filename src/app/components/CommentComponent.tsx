'use client';


import { useState, useEffect } from 'react';
import { showSuccess, showError } from './Notification';

interface CommentComponentProps {
    mapSelectionId: number;
    userId: string | null;
    onCommentUpdate?: () => void;
    showRating?: boolean; // 是否显示评分功能
}

export default function CommentComponent({ mapSelectionId, userId, onCommentUpdate, showRating = false }: CommentComponentProps) {

    const [comments, setComments] = useState<Array<{ id: number; userId: string; username: string; comment: string; createdAt: string }>>([]);
    const [commentInput, setCommentInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [score, setScore] = useState<number>(0);

    // 获取评论列表
    useEffect(() => {
        const fetchComments = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/map-ratings?mapSelectionId=${mapSelectionId}`);
                if (res.ok) {
                    const data = await res.json();
                    // 只保留评论部分
                    setComments((data.ratings || []).map((r: any) => ({
                        id: r.id,
                        userId: r.userId,
                        username: r.username,
                        comment: r.comment,
                        createdAt: r.createdAt
                    })).filter((r: any) => r.comment));
                    // 获取分数（如果有）
                    const myScore = (data.ratings || []).find((r: any) => r.userId === userId)?.rating || 0;
                    setScore(myScore);
                }
            } catch (e) {
                setComments([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchComments();
    }, [mapSelectionId, isSubmitting, userId]);

    // 添加评论
    const handleCommentSubmit = async () => {
        if (!userId) {
            showError('请先登录');
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mapSelectionId, comment: commentInput.trim(), userId })
            });
            if (response.ok) {
                showSuccess('评论提交成功');
                setCommentInput('');
                if (onCommentUpdate) onCommentUpdate();
            } else {
                const errorData = await response.json();
                showError(errorData.error || '评论提交失败');
            }
        } catch (error) {
            showError('评论提交失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 删除评论
    const handleDeleteComment = async (id: number) => {
        if (!window.confirm('确定要删除这条评论吗？')) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/map-ratings?id=${id}`, { method: 'DELETE' });
            if (response.ok) {
                showSuccess('评论已删除');
                if (onCommentUpdate) onCommentUpdate();
            } else {
                showError('删除失败');
            }
        } catch (e) {
            showError('删除失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-3">
            {/* 打分器 - 可选显示 */}
            {showRating && (
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600">我的评分：</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={async () => {
                                if (!userId) {
                                    showError('请先登录');
                                    return;
                                }
                                setScore(star);
                                setIsSubmitting(true);
                                try {
                                    const response = await fetch('/api/map-ratings', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ mapSelectionId, rating: star, userId })
                                    });
                                    if (response.ok) {
                                        showSuccess('评分成功');
                                        if (onCommentUpdate) onCommentUpdate();
                                    } else {
                                        showError('评分失败');
                                    }
                                } catch (e) {
                                    showError('评分失败');
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}
                            className={`w-6 h-6 text-lg ${star <= score ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                        >★</button>
                    ))}
                    <span className="text-sm text-gray-500 ml-2">{score > 0 && `${score}分`}</span>
                </div>
            )}
            {/* 评论列表 - 显示为头像网格 */}
            <div>
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">评论</h4>
                {isLoading ? (
                    <div className="text-gray-400 text-sm">加载中...</div>
                ) : comments.length === 0 ? (
                    <div className="text-gray-400 text-sm">暂无评论</div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {comments.map((c) => (
                            <div
                                key={c.id}
                                className="relative group"
                                title={`${c.username}: ${c.comment} (${new Date(c.createdAt).toLocaleString()})`}
                            >
                                {/* 头像 */}
                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600 border-2 border-gray-400">
                                    {c.username?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                {/* 删除按钮 - 仅自己评论可见 */}
                                {userId === c.userId && (
                                    <button
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="删除评论"
                                        onClick={() => handleDeleteComment(c.id)}
                                    >×</button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* 添加评论 */}
            <div className="flex flex-col gap-2">
                <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="写下你的评论..."
                    className="w-full p-2 border border-gray-300 rounded text-sm text-gray-800"
                    rows={2}
                />
                <button
                    onClick={handleCommentSubmit}
                    disabled={isSubmitting}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm self-end"
                >{isSubmitting ? '提交中...' : '添加评论'}</button>
            </div>
        </div>
    );
}
