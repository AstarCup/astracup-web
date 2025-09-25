"use client";

import { UserSession } from "@/lib/session";
import { UserPermissions } from "@/lib/permissions";
import { useState, useEffect } from "react";
import localFont from "next/font/local";
import MatchScheduleSystem from "./MatchScheduleSystem";

const audiowide = localFont({
    src: "./font/Audiowide-Regular.ttf",
    display: "auto",
});

interface Registration {
    osuId: string;
    username: string;
    inGameName: string;
    timezone: string;
    availability: string;
    registeredAt: string;
    avatar_url: string;
    pp: number;
    global_rank: number;
    country_rank: number;
    country: string;
    approved: boolean;
    approvedAt: string | null;
}

interface PlayerInfoPanelProps {
    user: UserSession | null;
    permissions: UserPermissions;
    onLogout?: () => void;
}

export default function PlayerInfoPanel({ user, permissions, onLogout }: PlayerInfoPanelProps) {
    const [registration, setRegistration] = useState<Registration | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRegistration = async () => {
            if (!user?.osuId) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/user-registration?osuId=${user.osuId}`);
                if (response.ok) {
                    const data = await response.json();
                    setRegistration(data.registration);
                }
            } catch (error) {
                console.error('Failed to fetch registration:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRegistration();
    }, [user?.osuId]);

    if (!user) {
        return (
            <div className="p-4 text-center">
                <p className="text-gray-400">未登录</p>
            </div>
        );
    }

    const formatRank = (rank: number | null) => {
        if (rank === null) return "未排名";
        return `#${rank.toLocaleString()}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('zh-CN');
    };

    return (
        <div className={`${audiowide.className} p-4 w-full max-w-md`}>
            {/* 用户基本信息 */}
            <div className="flex items-center mb-4">
                <img
                    src={user.avatar_url}
                    alt={user.username}
                    width={64}
                    height={64}
                    className="rounded-full outline outline-2 outline-[#E93B66]"
                    onError={(e) => {
                        e.currentTarget.src = '/default-avatar.png';
                    }}
                />
                <div className="ml-4 flex-1">
                    <h3 className="text-xl font-bold text-white">{user.username}</h3>
                    <p className="text-gray-300">PP: {user.pp?.toFixed(0) || 'N/A'}</p>
                    <p className="text-gray-300">Global Rank: {formatRank(user.global_rank)}</p>
                    <p className="text-gray-300">Country Rank: {formatRank(user.country_rank)}</p>
                </div>
            </div>

            {/* 权限信息 */}
            {(permissions.isMapSelector || permissions.isReplayTester || permissions.isAdmin) && (
                <div className="mb-4">
                    <h4 className="text-lg font-bold text-white mb-2">权限组</h4>
                    <div className="flex flex-wrap gap-2">
                        {permissions.isAdmin && (
                            <span className="px-3 py-1 bg-red-600 text-white text-sm rounded">
                                管理员
                            </span>
                        )}
                        {permissions.isMapSelector && (
                            <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded">
                                选图组
                            </span>
                        )}
                        {permissions.isReplayTester && (
                            <span className="px-3 py-1 bg-green-600 text-white text-sm rounded">
                                测图组
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* 注册信息 */}
            <div className="mb-4">
                <h4 className="text-lg font-bold text-white mb-2">注册信息</h4>
                {loading ? (
                    <p className="text-gray-400">加载中...</p>
                ) : registration ? (
                    <div className="space-y-2 text-sm">
                        <p className="text-gray-300">
                            <span className="font-medium">游戏内名称:</span> {registration.inGameName}
                        </p>
                        <p className="text-gray-300">
                            <span className="font-medium">时区:</span> {registration.timezone || '未设置'}
                        </p>
                        <p className="text-gray-300">
                            <span className="font-medium">注册时间:</span> {formatDate(registration.registeredAt)}
                        </p>
                        <p className="text-gray-300">
                            <span className="font-medium">审核状态:</span>
                            <span className={registration.approved ? 'text-green-400' : 'text-yellow-400'}>
                                {registration.approved ? '已通过' : '待审核'}
                            </span>
                        </p>
                        {registration.approved && registration.approvedAt && (
                            <p className="text-gray-300">
                                <span className="font-medium">审核时间:</span> {formatDate(registration.approvedAt)}
                            </p>
                        )}
                        {registration.availability && (
                            <p className="text-gray-300">
                                <span className="font-medium">可用时间:</span> {registration.availability}
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-gray-400">未找到注册信息</p>
                )}
            </div>

            {/* 比赛预约系统 */}
            <div className="border-t border-gray-600 pt-4">
                <MatchScheduleSystem userOsuId={user.osuId} isAdmin={permissions.isAdmin} />
            </div>

            {/* 登出按钮 */}
            <div className="border-t border-gray-600 pt-4">
                <button
                    onClick={onLogout}
                    className="w-full bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-4 py-2 rounded-md transition-colors duration-200 font-medium"
                >
                    登出
                </button>
            </div>
        </div>
    );
}