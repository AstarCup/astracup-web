"use client";

import { UserSession } from "@/lib/session";
import { useState, useEffect } from "react";
import localFont from "next/font/local";

const audiowide = localFont({
    src: "./font/Audiowide-Regular.ttf",
    display: "auto",
});

interface UserProfileProps {
    user: UserSession | null;
    onLogout?: () => void;
}

export default function UserProfile({ user, onLogout }: UserProfileProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient || !user) {
        return (
            <div className="">
                <p className="text-gray-600">未登录</p>
            </div>
        );
    }

    const formatRank = (rank: number | null) => {
        if (rank === null) return "未排名";
        return `#${rank.toLocaleString()}`;
    };

    return (
        <div className="p-2 mb-2 w-full">
            <div className="flex flex-col items-left space-y-4">
                <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-16 h-16"
                />
                <div className="w-full text-left">
                    <h2 className="text-xl font-bold text-gray-900 mb-3">{user.username}</h2>
                    <div className="flex flex-col space-y-2 text-sm">
                        <div>
                            <span className="text-gray-600">PP</span>
                            <span className={`${audiowide.className} text-3xl`}>{Math.round(user.pp)}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">全球排名 </span>
                            <span className={`${audiowide.className} font-semibold`}>{formatRank(user.global_rank)}</span>
                        </div>
                        {user.country_rank && (
                            <div>
                                <span className="text-gray-600">地区排名 </span>
                                <span className={`${audiowide.className} font-semibold`}>{formatRank(user.country_rank)}</span>
                            </div>
                        )}
                        <div>
                            <span className="text-gray-600">所在地区 </span>
                            <span className={`${audiowide.className} font-semibold`}>{user.country || "未知"}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                    onClick={() => {
                        // 这里可以添加登出逻辑
                        fetch('/api/auth/logout', { method: 'POST' })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    // 调用父组件的回调函数来更新状态
                                    if (onLogout) {
                                        onLogout();
                                    } else {
                                        // 如果没有回调函数，则刷新页面
                                        window.location.reload();
                                    }
                                }
                            })
                            .catch(error => {
                                console.error('Logout error:', error);
                            });
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                >
                    退出登录
                </button>
            </div>
        </div>
    );
}
