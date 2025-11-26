'use client';


import { useState, useEffect } from 'react';
import Image from 'next/image';
import { showSuccess, showError } from '../../ui/Notification';

interface CommentComponentProps {
    mapSelectionId: number;
    userId: string | null;
    onCommentUpdate?: () => void;
    compactMode?: boolean; // 新增：紧凑模式，用于横向显示
    ratings?: Array<{ id: number; userId: string; username: string; avatar_url: string; comment: string; createdAt: string }>; // 新增：从父组件传递的评论数据
}

export default function CommentComponent({ mapSelectionId, userId, onCommentUpdate, compactMode = false, ratings = [] }: CommentComponentProps) {

    const [commentInput, setCommentInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCommentBox, setShowCommentBox] = useState(false); // 新增：控制评论框显示
    const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null); // 新增：正在删除的评论ID

    // 从ratings中提取评论数据
    const comments = (ratings || []).map((r: any) => ({
        id: r.id,
        userId: r.userId,
        username: r.username,
        avatar_url: r.avatar_url,
        comment: r.comment,
        createdAt: r.createdAt
    })).filter((r: any) => r.comment && r.comment.trim() !== '');

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
        if (!mapSelectionId) {
            showError('无效的选图ID');
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
        } catch (_error) {
            showError('评论提交失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 删除评论
    const handleDeleteComment = async (id: number) => {
        if (!window.confirm('确定要删除这条评论吗？')) return;
        setDeletingCommentId(id);
        try {
            const response = await fetch(`/api/map-ratings?id=${id}&userId=${userId}`, { method: 'DELETE' });
            if (response.ok) {
                showSuccess('评论已删除');
                setCommentInput(''); // 清空输入框（如果有的话）
                setIsSubmitting(true); // 触发重新获取评论
                if (onCommentUpdate) onCommentUpdate();
            } else {
                const errorData = await response.json();
                showError(errorData.error || '删除失败');
            }
        } catch (_e) {
            showError('删除失败');
        } finally {
            setDeletingCommentId(null);
            setIsSubmitting(false); // 确保isSubmitting被重置
        }
    };

    return (
        <div className="space-y-3">
            {compactMode ? (
                // 紧凑模式：横向显示评论
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800 text-sm">评论区</h4>
                        <button
                            onClick={() => setShowCommentBox(!showCommentBox)}
                            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                        >
                            {showCommentBox ? '收起' : '+ 添加评论'}
                        </button>
                    </div>
                    {comments.length === 0 ? (
                        <div className="text-gray-400 text-sm">暂无评论</div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {comments.map((c) => (
                                <div key={c.id} className="rounded-full relative group inline-flex items-center gap-2 p-4 bg-gray-50  max-w-xs hover:bg-gray-100 transition-colors">
                                    {/* 头像 */}
                                    <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-300 flex-shrink-0 relative">
                                        <Image
                                            src={c.avatar_url}
                                            alt={c.username}
                                            width={80}
                                            height={80}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // 隐藏Image，显示fallback
                                                e.currentTarget.style.display = 'none';
                                                const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback') as HTMLElement;
                                                if (fallback) fallback.style.display = 'flex';
                                            }}
                                        />
                                        <div className="avatar-fallback w-full h-full bg-gray-300 rounded-full flex items-center justify-center absolute inset-0" style={{ display: 'none' }}>
                                            <span className="text-xs text-gray-600">
                                                {c.username?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                    </div>
                                    {/* 评论内容 */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-2xl text-gray-800 break-words line-clamp-2">{c.comment}</p>
                                        {userId === c.userId && (
                                            <button
                                                className="absolute top-1 right-1 text-red-500 hover:text-red-600 text-xl opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                                title={deletingCommentId === c.id ? "删除中..." : "删除评论"}
                                                onClick={() => handleDeleteComment(c.id)}
                                                disabled={deletingCommentId === c.id}
                                            >
                                                {deletingCommentId === c.id ? "..." : "×"}
                                            </button>
                                        )}
                                    </div>
                                    {/* Hover弹窗 */}
                                    <div className="absolute top-full left-0 mt-1 bg-gray-900 text-white text-xs rounded shadow-lg p-2 z-20 min-w-[150px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <div className="font-semibold mb-1">{c.username}</div>
                                        <div className="text-gray-300 text-xs mb-1">{new Date(c.createdAt).toLocaleString()}</div>
                                        <div className="text-gray-100">{c.comment}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {/* 评论框 */}
                    {showCommentBox && (
                        <div className="flex flex-col gap-2 mt-3 p-3 bg-gray-50 rounded">
                            <textarea
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                placeholder="写下你的评论..."
                                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-800"
                                rows={2}
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setShowCommentBox(false)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleCommentSubmit}
                                    disabled={isSubmitting}
                                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                                >
                                    {isSubmitting ? '提交中...' : '提交'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // 原有模式：头像网格 + 评论框
                <>
                    {/* 评论列表 - 显示为头像网格 */}
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2 text-sm">评论</h4>
                        {comments.length === 0 ? (
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
                </>
            )}
        </div>
    );
}
