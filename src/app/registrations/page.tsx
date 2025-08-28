"use client";

import { useState, useEffect } from "react";
import { TournamentRegistration } from "@/lib/edge-registrations";

export default function RegistrationsPage() {
    const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const fetchRegistrations = async () => {
        try {
            setIsLoading(true);
            // 通过 API 获取注册数据，避免客户端环境变量问题
            const response = await fetch('/api/edge-registrations');

            if (!response.ok) {
                throw new Error('Failed to fetch registrations');
            }

            const data = await response.json();
            setRegistrations(data.registrations || []);
        } catch (error) {
            console.error('Error fetching registrations:', error);
            setError('获取报名数据失败');
        } finally {
            setIsLoading(false);
        }
    };

    const formatRank = (rank: number | null) => {
        if (rank === null) return "未排名";
        return `#${rank.toLocaleString()}`;
    };

    const formatPP = (pp: number) => {
        return Math.round(pp).toLocaleString();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F38181] mx-auto"></div>
                        <p className="mt-4 text-gray-600">正在加载报名数据...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
                        <p className="text-red-600">{error}</p>
                        <button
                            onClick={fetchRegistrations}
                            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            重试
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">已报名玩家</h1>
                    <p className="mt-2 text-lg text-gray-600">
                        当前共有 {registrations.length} 名玩家报名参赛
                    </p>
                </div>

                {registrations.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <div className="text-gray-400 text-6xl mb-4">🎮</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无报名玩家</h3>
                            <p className="text-gray-600">还没有玩家报名参加比赛</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {registrations.map((player) => (
                            <div key={player.osuId} className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <img
                                            src={player.avatar_url}
                                            alt={player.username}
                                            width={64}
                                            height={64}
                                            className="rounded-full"
                                            onError={(e) => {
                                                e.currentTarget.src = '/default-avatar.png';
                                            }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                {player.username}
                                            </h3>
                                            <p className="text-sm text-gray-500">ID: {player.osuId}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-600">PP: </span>
                                            <span className="font-semibold">{formatPP(player.pp)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">全球排名: </span>
                                            <span className="font-semibold">{formatRank(player.global_rank)}</span>
                                        </div>
                                        {player.country_rank && (
                                            <div className="col-span-2">
                                                <span className="text-gray-600">国家排名: </span>
                                                <span className="font-semibold">{formatRank(player.country_rank)}</span>
                                            </div>
                                        )}
                                        {player.teamName && (
                                            <div className="col-span-2">
                                                <span className="text-gray-600">队伍: </span>
                                                <span className="font-semibold">{player.teamName}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <p className="text-xs text-gray-500">
                                            报名时间: {new Date(player.registeredAt).toLocaleString('zh-CN')}
                                        </p>
                                        {player.agreedToTerms && (
                                            <p className="text-xs text-green-600 mt-1">✓ 已同意比赛条款</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8 text-center">
                    <button
                        onClick={fetchRegistrations}
                        className="px-6 py-2 bg-[#F38181] text-white rounded-md hover:bg-[#95E1D3] transition-colors"
                    >
                        刷新数据
                    </button>
                </div>
            </div>
        </div>
    );
}
