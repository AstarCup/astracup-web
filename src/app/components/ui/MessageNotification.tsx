"use client";

import { useState, useEffect } from 'react';
import { Message } from '@/lib/mysql-registrations';
import Image from 'next/image';
import { Mail } from 'lucide-react';
import { Check, X } from 'lucide-react';

interface MessageNotificationProps {
    onNewMessage?: (count: number) => void;
}

export default function MessageNotification({ onNewMessage }: MessageNotificationProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showMessages, setShowMessages] = useState(false);
    const [loading, setLoading] = useState(false);

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
        <div className="">
            {/* 消息按钮 */}
            <button
                onClick={() => setShowMessages(!showMessages)}
                className="relative hover:scale-110 px-4 py-2 transition-all duration-200 font-medium hover:bg-gray-200 rounded-lg hover:border-b-4 border-pink-200"
            >
                <Mail size={24} color='pink' />
                {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        <span className="absolute top-0 right-0 animate-ping bg-pink-500 text-white text-xs font-bold animate-ping rounded-full w-5 h-5 flex items-center justify-center" />
                        {unreadCount}
                    </span>

                )}
            </button>

            {/* 消息下拉列表 */}
            {showMessages && (
                <button className="fixed inset-0 bg-black/30 flex justify-center z-50" onClick={() => setShowMessages(false)}>
                    <div className='mt-25 mr-10 w-full justify-end flex'>
                        <div className="max-w-[calc(100vw-2rem)] rounded-lg sm:w-96 bg-white border-yellow-400 border-b-4 z-50 max-h-120 overflow-y-auto">
                            <div className="p-4">
                                <h3 className="text-gray-600 font-bold mb-3">消息通知</h3>
                                {messages.length === 0 ? (
                                    <p className="text-gray-400 text-center">暂无消息</p>
                                ) : (
                                    <div className="space-y-3">
                                        {messages.map((message) => (
                                            <div key={message.id} className="bg-gray-100 border-b-4 group rounded-lg border-yellow-400 hover:border-gray-600 hover:bg-gray-200 active:scale-[0.99] hover:scale-[1.01] transition-all duration-200 p-3">
                                                <div className="flex justify-between items-start mb-2 text-gray-600">
                                                    <h4 className="font-bold text-2xl">{message.title}</h4>
                                                    <span className={`text-xs px-2 py-1 ${message.status === 'unread' ? 'text-red-400' :
                                                        message.status === 'read' ? 'text-blue-60' :
                                                            'text-green-600'
                                                        }`}>
                                                        {message.status === 'unread' ? '未读' :
                                                            message.status === 'read' ? '已读' : '已回复'}
                                                    </span>
                                                </div>

                                                <p className="text-gray-300 group-hover:text-gray-600 text-left text-sm mb-2">{message.content}</p>

                                                <div className="text-xs text-gray-400 mb-3 text-left">
                                                    发送者: {message.sender_username} | {new Date(message.created_at).toLocaleString('zh-CN')}
                                                </div>

                                                {/* 响应按钮 */}
                                                {message.type === 'match_invitation' && message.status === 'unread' && (
                                                    <div className="flex flex-col sm:flex-row gap-2 justify-end">
                                                        <button
                                                            onClick={() => updateMessageStatus(message.id, 'accept')}
                                                            disabled={loading}
                                                            className="bg-green-200 flex gap-2 flex-cow items-center justify-center hover:bg-green-500 border-b-4 border-green-400 hover:border-green-600 hover:scale-105 active:scale-95 text-gray-800 text-xs px-3 py-2 rounded-lg transition-all disabled:opacity-50 w-full sm:w-auto"
                                                        >
                                                            <Check />接受
                                                        </button>
                                                        <button
                                                            onClick={() => updateMessageStatus(message.id, 'decline')}
                                                            disabled={loading}
                                                            className="bg-red-200 flex gap-2 flex-cow items-center justify-center hover:bg-red-500 border-b-4 border-red-400 hover:border-red-600 hover:scale-105 active:scale-95 text-gray-800 text-xs px-3 py-2 rounded-lg transition-all disabled:opacity-50 w-full sm:w-auto"
                                                        >
                                                            <X />拒绝
                                                        </button>
                                                    </div>
                                                )}

                                                {message.status === 'unread' && message.type !== 'match_invitation' && (
                                                    <button
                                                        onClick={() => updateMessageStatus(message.id, 'read')}
                                                        disabled={loading}
                                                        className="bg-blue-400 hover:bg-blue-500 text-white text-xs px-2 py-2 rounded-lg transition-all disabled:opacity-50 w-full sm:w-auto"
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
                    </div>
                </button>
            )}
        </div>
    );
}