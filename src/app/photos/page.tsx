'use client';

import React, { useState } from 'react';
import WinnerCard from '@/app/components/WinnerCard';
import winnersData from '@/config/winners.json';

interface Winner {
    rank: number;
    playerName: string;
    osuId: string;
    country: string;
    avatarUrl: string;
    teamName: string;
    achievement: string;
    resultImage: string;
}

interface Season {
    seasonId: string;
    seasonName: string;
    year: string;
    description: string;
    winners: {
        first: Winner;
        second: Winner;
        third: Winner;
    };
    matchDate: string;
    totalParticipants: number;
    status?: string;
}

export default function Photos() {
    const [selectedSeason, setSelectedSeason] = useState<string>('all');
    const seasons = winnersData.seasons as Season[];

    const filteredSeasons = selectedSeason === 'all'
        ? seasons
        : seasons.filter(season => season.seasonId === selectedSeason);

    return (
        <div className="min-h-screen pb-20">
            {/* 页面标题 */}
            <div className="py-16 mb-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center">
                        <h1 className="text-5xl font-bold text-white mb-4">荣誉榜</h1>
                        <p className="text-xl text-white/90 max-w-3xl mx-auto">
                            记录每一届 AstaraCup 的冠亚季军得主，见证传奇的诞生
                        </p>
                        <div className="mt-6 flex justify-center items-center space-x-6">
                            <div className="flex items-center space-x-2">
                                <span className="text-white/80">总赛季数</span>
                                <span className="bg-white/20 text-white font-bold px-3 py-1">
                                    {seasons.length}
                                </span>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                {/* 赛季筛选器 */}
                <div className="mb-12">
                    <div className="bg-[#1A1A1A] p-6 border border-gray-700">
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setSelectedSeason('all')}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${selectedSeason === 'all'
                                    ? 'bg-[#E93B66] text-white'
                                    : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#3A3A3A]'
                                    }`}
                            >
                                全部赛季
                            </button>
                            {seasons.map(season => (
                                <button
                                    key={season.seasonId}
                                    onClick={() => setSelectedSeason(season.seasonId)}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${selectedSeason === season.seasonId
                                        ? 'bg-[#E93B66] text-white'
                                        : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#3A3A3A]'
                                        } ${season.status === 'ongoing' ? 'relative' : ''}`}
                                >
                                    {season.seasonName}
                                    {season.status === 'ongoing' && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 赛季展示 */}
                {filteredSeasons.map(season => (
                    <div key={season.seasonId} className="mb-16">
                        {/* 赛季信息头部 */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <h2 className="text-4xl font-bold text-white mr-4">
                                        {season.seasonName}
                                    </h2>
                                    <span className="text-2xl text-gray-400">({season.year})</span>
                                    {season.status === 'ongoing' && (
                                        <span className="ml-4 bg-green-500 text-white text-sm px-3 py-1 rounded-full animate-pulse">
                                            进行中
                                        </span>
                                    )}
                                </div>
                                <div className="text-right text-gray-400">
                                    <div>比赛日期: {season.matchDate}</div>
                                    <div>参赛人数: {season.totalParticipants} 人</div>
                                </div>
                            </div>

                            <p className="text-gray-300 text-lg mb-6">{season.description}</p>
                        </div>

                        {/* 获奖者卡片 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <WinnerCard
                                winner={season.winners.first}
                                seasonName={season.seasonName}
                            />
                            <WinnerCard
                                winner={season.winners.second}
                                seasonName={season.seasonName}
                            />
                            <WinnerCard
                                winner={season.winners.third}
                                seasonName={season.seasonName}
                            />
                        </div>

                        {/* 分隔线 */}
                        {filteredSeasons.indexOf(season) < filteredSeasons.length - 1 && (
                            <div className="mt-16 border-t border-gray-700"></div>
                        )}
                    </div>
                ))}

                {/* 页面底部信息 */}
                <div className="mt-20 text-center">
                    <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2A2A2A] p-8 border border-gray-700">
                        <h3 className="text-3xl font-bold text-white mb-4">成为传说的一部分</h3>
                        <p className="text-gray-400 mb-6 max-w-3xl mx-auto text-lg">
                            每一位获奖者都是 AstaraCup 历史的见证者。他们的名字将永远刻在荣誉榜上，
                            激励着更多选手追求卓越，成就自己的传奇故事。（包括女装）
                        </p>
                        <div className="flex justify-center space-x-8">
                            <div className="text-center">
                                <div className="text-3xl text-yellow-400 mb-2"><img src="/icons/1.svg" alt="1" width={48} height={48} /></div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl text-gray-400 mb-2"><img src="/icons/2.svg" alt="2" width={48} height={48} /></div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl text-amber-600 mb-2"><img src="/icons/3.svg" alt="3" width={48} height={48} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}