"use client";

import { useState, useEffect } from 'react';
import { Message } from '@/lib/mysql-registrations';
import Image from 'next/image';

interface MessageNotificationProps {
    onNewMessage?: (count: number) => void;
}

export default function MessageNotification({ onNewMessage }: MessageNotificationProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showMessages, setShowMessages] = useState(false);
    const [loading, setLoading] = useState(false);

    const formatDateTime = (dateString: string | Date) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return '无效日期';
        }
        // 转换为东八区时间
        const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
        const cstTime = new Date(utcTime + (8 * 3600000));
        const year = cstTime.getFullYear();
        const month = String(cstTime.getMonth() + 1).padStart(2, '0');
        const day = String(cstTime.getDate()).padStart(2, '0');
        const hours = String(cstTime.getHours()).padStart(2, '0');
        const minutes = String(cstTime.getMinutes()).padStart(2, '0');
        return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    };

    // 获取用户消息
    const fetchMessages = async () => {
        try {
            const response = await fetch('/api/messages');
            const data = await response.json();

            if (data.success) {
                setMessages(data.messages);
                const unread = data.messages.filter((msg: Message) => msg.status === 'unread').length;
                setUnreadCount(unread);
                onNewMessage?.(unread);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    useEffect(() => {
        fetchMessages();
        // 定期检查新消息
        const interval = setInterval(fetchMessages, 30000); // 每30秒检查一次
        return () => clearInterval(interval);
    }, []);

    // 更新消息状态
    const updateMessageStatus = async (messageId: number, action: 'read' | 'accept' | 'decline') => {
        setLoading(true);
        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messageId,
                    action
                }),
            });

            const data = await response.json();

            if (data.success) {
                // 重新获取消息
                await fetchMessages();
                alert(data.message);
            } else {
                alert(`操作失败: ${data.error}`);
            }
        } catch (error) {
            console.error('Error updating message:', error);
            alert('操作失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            {/* 消息按钮 */}
            <button
                onClick={() => setShowMessages(!showMessages)}
                className="relative hover:scale-110 text-white px-4 py-2 transition-all duration-200 font-medium"
            >
                <Image src="/icons/message.svg" alt="消息" width={24} height={24} />
                {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* 消息下拉列表 */}
            {showMessages && (
                <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] sm:w-96 bg-[#3d3d3d] border-[#E93B66] border-b-4  shadow-xl z-50 max-h-96 overflow-y-auto">
                    <div className="p-4">
                        <h3 className="text-white font-bold mb-3">消息通知</h3>

                        {messages.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">暂无消息</p>
                        ) : (
                            <div className="space-y-3">
                                {messages.map((message) => (
                                    <div key={message.id} className="bg-gray-700  p-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-white font-medium text-sm">{message.title}</h4>
                                            <span className={`text-xs px-2 py-1 rounded ${message.status === 'unread' ? 'bg-red-600 text-white' :
                                                message.status === 'read' ? 'bg-blue-600 text-white' :
                                                    'bg-green-600 text-white'
                                                }`}>
                                                {message.status === 'unread' ? '未读' :
                                                    message.status === 'read' ? '已读' : '已回复'}
                                            </span>
                                        </div>

                                        <p className="text-gray-300 text-sm mb-2">{message.content}</p>

                                        <div className="text-xs text-gray-400 mb-3">
                                            发送者: {message.sender_username} | {formatDateTime(message.created_at)}
                                        </div>

                                        {/* 响应按钮 */}
                                        {message.type === 'match_invitation' && message.status === 'unread' && (
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <button
                                                    onClick={() => updateMessageStatus(message.id, 'accept')}
                                                    disabled={loading}
                                                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded transition-colors disabled:opacity-50 w-full sm:w-auto"
                                                >
                                                    接受
                                                </button>
                                                <button
                                                    onClick={() => updateMessageStatus(message.id, 'decline')}
                                                    disabled={loading}
                                                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 rounded transition-colors disabled:opacity-50 w-full sm:w-auto"
                                                >
                                                    拒绝
                                                </button>
                                            </div>
                                        )}

                                        {message.status === 'unread' && message.type !== 'match_invitation' && (
                                            <button
                                                onClick={() => updateMessageStatus(message.id, 'read')}
                                                disabled={loading}
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-2 rounded transition-colors disabled:opacity-50 w-full sm:w-auto"
                                            >
                                                标记已读
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}