"use client";

import { useState, useEffect } from "react";
import Image from 'next/image';
import { TournamentRegistration } from "@/lib/mysql-registrations";
import localFont from "next/font/local";
import { usePageTitle } from '@/lib/usePageTitle';

const audiowide = localFont({
    src: "../font/Audiowide-Regular.ttf",
    display: "auto",
});

export default function RegistrationsPage() {
    usePageTitle('/registrations');

    const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState('all'); // 'all', 'approved', 'unapproved'

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
            console.log('Received registrations data:', data.registrations);
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

    const filteredRegistrations = registrations
        .filter(player => {
            if (filter === 'approved') return player.approved;
            if (filter === 'unapproved') return !player.approved;
            return true;
        })
        .sort((a, b) => {
            if (a.approved && !b.approved) return -1;
            if (!a.approved && b.approved) return 1;
            return 0;
        });

    if (isLoading) {
        return (
            <div className="min-h-screen py-12">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center">
                        <Image src='/icons/loading.svg' alt='loading' width={120} height={120} className='animate-spin' />                        <p className="mt-4 text-white">正在加载报名数据...</p>
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
        <div className="min-h-screen py-12">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white">已报名玩家</h1>
                    <p className="mt-2 text-lg text-gray-400">
                        当前共有 {registrations.length} 名玩家报名参赛，已通过审核 {registrations.filter(r => r.approved).length} 名
                    </p>
                </div>

                <div className="flex justify-center mb-6">
                    <div className="flex bg-black-200 border-b-2 border-gray-500">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                        >
                            全部
                        </button>
                        <button
                            onClick={() => setFilter('approved')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === 'approved' ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                        >
                            已审核
                        </button>
                        <button
                            onClick={() => setFilter('unapproved')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === 'unapproved' ? 'bg-yellow-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                        >
                            未审核/未通过审核
                        </button>
                    </div>
                </div>

                {filteredRegistrations.length === 0 ? (
                    <div className="text-center py-12 bg-[#3d3d3d] border-b-4 border-[#E93B66]">
                        <div className="p-8">
                            <h3 className="text-xl font-semibold text-white mb-2">暂无符合条件的玩家</h3>
                            <p className="text-gray-400">请尝试更改筛选条件</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRegistrations.map((player) => (
                            <div key={player.osuId} className={`bg-white shadow-md overflow-hidden ${player.approved ? 'border-b-8 border-green-500' : 'border-b-8 border-gray-500'}`}>
                                <div className="p-6">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <Image
                                            src={player.avatar_url}
                                            alt={player.username}
                                            width={64}
                                            height={64}
                                            className="outline outline-2 outline-[#E93B66]"
                                            onError={(e) => {
                                                e.currentTarget.src = '/default-avatar.png';
                                            }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-2xl font-semibold text-gray-900 truncate">
                                                <a href={`https://osu.ppy.sh/users/${player.osuId}`}>{player.username}</a>

                                            </h3>
                                            <p className="text-sm text-gray-500">ID: {player.osuId}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex flex-col items-start">
                                            <span className="text-gray-600 mb-1">PP</span>
                                            <span className={`${audiowide.className} text-3xl`}>{formatPP(player.pp)}</span>
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-gray-600 mb-1">全球排名</span>
                                            <span className={`${audiowide.className} text-3xl`}>{formatRank(player.global_rank)}</span>
                                        </div>
                                        {player.country_rank && (
                                            <div className="col-span-2 flex flex-col items-start mt-2">
                                                <span className="text-gray-600 mb-1">地区排名</span>
                                                <span className={`${audiowide.className} text-3xl`}>{formatRank(player.country_rank)} <a className="text-xl">{player.country}</a> </span>
                                            </div>
                                        )}

                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <p className="text-xs text-gray-500">
                                            报名时间: {new Date(player.registeredAt).toLocaleString('zh-CN')}
                                        </p>
                                        {player.approved && (
                                            <p className="text-xs text-green-600 mt-1">✓ 审核通过，可以参赛</p>
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
                        className="px-6 py-2 bg-[#E93B66] text-white rounded-md hover:bg-[#95E1D3] transition-colors"
                    >
                        刷新数据
                    </button>
                </div>
            </div>
        </div>
    );
}
