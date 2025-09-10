"use client";

import { UserSession } from "@/lib/session";
import { useState, useEffect } from "react";

interface UserProfileProps {
    user: UserSession | null;
}

export default function UserProfile({ user }: UserProfileProps) {
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center space-x-4">
                <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-16 h-16 rounded-full"
                />
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{user.username}</h2>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                        <div>
                            <span className="text-gray-600">PP: </span>
                            <span className="font-semibold">{Math.round(user.pp)}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">全球排名: </span>
                            <span className="font-semibold">{formatRank(user.global_rank)}</span>
                        </div>
                        {user.country_rank && (
                            <div className="col-span-2">
                                <span className="text-gray-600">地区排名: </span>
                                <span className="font-semibold">{formatRank(user.country_rank)}</span>
                            </div>
                        )}
                        <div>
                            <span className="text-gray-600">所在地区: </span>
                            <span className="font-semibold">{user.country || "未知"}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                    onClick={() => {
                        // 这里可以添加登出逻辑
                        fetch('/api/auth/logout', { method: 'POST' })
                            .then(() => window.location.reload());
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                >
                    退出登录
                </button>
            </div>
        </div>
    );
}
