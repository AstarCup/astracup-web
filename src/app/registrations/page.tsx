"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { TournamentRegistration } from "@/lib/prisma-registrations";
import localFont from "next/font/local";
import { usePageTitle } from "@/lib/usePageTitle";
import InfiniteScrollCanvas from "../components/ui/InfiniteScrollCanvas";
import PlayerDetailModal from "../components/ui/PlayerDetailModal";

const audiowide = localFont({
    src: "../font/Audiowide-Regular.ttf",
    display: "auto",
});

export default function RegistrationsPage() {
    usePageTitle("/registrations");

    const [registrations, setRegistrations] = useState<TournamentRegistration[]>(
        [],
    );
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all"); // 'all', 'approved', 'unapproved'
    const [selectedPlayer, setSelectedPlayer] =
        useState<TournamentRegistration | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const fetchRegistrations = async () => {
        try {
            setIsLoading(true);
            // 通过 API 获取注册数据，避免客户端环境变量问题
            const response = await fetch("/api/edge-registrations");

            if (!response.ok) {
                throw new Error("Failed to fetch registrations");
            }

            const data = await response.json();
            console.log("Received registrations data:", data.data?.registrations);
            setRegistrations(data.data?.registrations || []);
        } catch (error) {
            console.error("Error fetching registrations:", error);
            setError("获取报名数据失败");
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

    const filteredRegistrations = registrations
        .filter((player) => {
            if (filter === "approved") return player.approved;
            if (filter === "unapproved") return !player.approved;
            return true;
        })
        .sort((a, b) => {
            if (a.approved && !b.approved) return -1;
            if (!a.approved && b.approved) return 1;
            return 0;
        });

    const handlePlayerClick = (player: TournamentRegistration) => {
        setSelectedPlayer(player);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPlayer(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen py-12">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center">
                        <Image
                            src="/icons/loading.svg"
                            alt="loading"
                            width={120}
                            height={120}
                            className="animate-spin"
                        />{" "}
                        <p className="mt-4 text-white">正在加载报名数据...</p>
                        <p className="mt-4 text-white">正在加载报名数据...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen py-12">
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
        <div className="min-h-screen py-12 mt-52">
            <div className="max-w mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white text-shadow-md">
                        已报名玩家
                    </h1>
                    <p className="mt-2 text-lg text-gray-100 text-shadow-md">
                        当前共有 {registrations.length} 名玩家报名参赛，已通过审核{" "}
                        {registrations.filter((r) => r.approved).length} 名
                    </p>
                </div>

                <div className="flex justify-center mb-6">
                    <div className="flex">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === "all" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-600 hover:text-white"}`}
                        >
                            全部
                        </button>
                        <button
                            onClick={() => setFilter("approved")}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === "approved" ? "bg-green-500 text-white" : "text-gray-600 hover:bg-gray-600 hover:text-white"}`}
                        >
                            已审核
                        </button>
                        <button
                            onClick={() => setFilter("unapproved")}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === "unapproved" ? "bg-yellow-500 text-white" : "text-gray-600 hover:bg-gray-600 hover:text-white"}`}
                        >
                            未审核/未通过审核
                        </button>
                    </div>
                </div>

                {filteredRegistrations.length === 0 ? (
                    <div className="text-center py-12 bg-[#3d3d3d] border-b-4 border-[#E93B66]">
                        <div className="p-8">
                            <h3 className="text-xl font-semibold text-white mb-2">
                                暂无符合条件的玩家
                            </h3>
                            <p className="text-gray-400">请尝试更改筛选条件</p>
                        </div>
                    </div>
                ) : (
                    <div className="h-[1200px]">
                        <InfiniteScrollCanvas
                            registrations={filteredRegistrations}
                            onPlayerClick={handlePlayerClick}
                        />
                    </div>
                )}

                <div className="mt-8 text-center">
                    <button
                        onClick={fetchRegistrations}
                        className="px-6 py-2 bg-[#E93B66] text-white rounded-md hover:bg-[#95E1D3] transition-colors"
                    >
                        刷新数据
                    </button>
                </div>
            </div>

            <PlayerDetailModal
                player={selectedPlayer}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </div>
    );
}
