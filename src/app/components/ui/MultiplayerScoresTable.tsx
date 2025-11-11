"use client";

import { useState } from "react";
import Image from "next/image";
import { DisplayScore } from "@/lib/multiplayer-types";

interface MultiplayerScoresTableProps {
    scores: DisplayScore[];
    title: string;
    loading?: boolean;
    onRefresh?: () => void;
}

export default function MultiplayerScoresTable({
    scores,
    title,
    loading = false,
    onRefresh
}: MultiplayerScoresTableProps) {
    const [sortBy, setSortBy] = useState<keyof DisplayScore>('position');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // 格式化准确率为百分比
    const formatAccuracy = (accuracy: number): string => {
        return (accuracy * 100).toFixed(2) + '%';
    };

    // 格式化时间
    const formatTime = (timeString: string | null): string => {
        if (!timeString) return '-';
        try {
            return new Date(timeString).toLocaleString('zh-CN');
        } catch {
            return '-';
        }
    };

    // 获取mod颜色class
    const getModColorClass = (mod: string): string => {
        switch (mod) {
            case 'HD': return 'bg-yellow-500 text-black';
            case 'HR': return 'bg-red-500 text-white';
            case 'DT': return 'bg-purple-500 text-white';
            case 'NC': return 'bg-purple-400 text-white';
            case 'FL': return 'bg-blue-500 text-white';
            case 'EZ': return 'bg-green-500 text-white';
            case 'HT': return 'bg-orange-500 text-white';
            case 'SO': return 'bg-gray-600 text-white';
            case 'NF': return 'bg-gray-700 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    // 获取排名颜色class
    const getRankColorClass = (rank: string): string => {
        switch (rank) {
            case 'XH': return 'text-purple-400';
            case 'X': return 'text-purple-500';
            case 'SH': return 'text-blue-400';
            case 'S': return 'text-blue-500';
            case 'A': return 'text-green-500';
            case 'B': return 'text-yellow-500';
            case 'C': return 'text-orange-500';
            case 'D': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    // 排序函数
    const sortedScores = [...scores].sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        if (sortBy === 'accuracy') {
            aValue = a.accuracy;
            bValue = b.accuracy;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortOrder === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }

        return 0;
    });

    const handleSort = (column: keyof DisplayScore) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const SortIcon = ({ column }: { column: keyof DisplayScore }) => {
        if (sortBy !== column) return null;
        return (
            <span className="ml-1">
                {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
        );
    };

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">{title}</h2>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className="px-4 py-2 bg-[#E93B66] text-white hover:bg-[#3BE9D8] transition font-bold disabled:opacity-50 text-sm"
                    >
                        {loading ? '刷新中...' : '刷新数据'}
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-8 text-white">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <p className="mt-2">加载分数数据中...</p>
                </div>
            ) : scores.length === 0 ? (
                <div className="text-center py-8 text-white bg-[#3D3D3D] rounded">
                    <p>暂无分数数据</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full bg-[#3D3D3D] text-white">
                        <thead>
                            <tr className="border-b border-gray-600">
                                <th
                                    className="px-4 py-3 text-left cursor-pointer hover:bg-gray-700 transition"
                                    onClick={() => handleSort('position')}
                                >
                                    排名 <SortIcon column="position" />
                                </th>
                                <th className="px-4 py-3 text-left">玩家</th>
                                <th
                                    className="px-4 py-3 text-left cursor-pointer hover:bg-gray-700 transition"
                                    onClick={() => handleSort('total_score')}
                                >
                                    分数 <SortIcon column="total_score" />
                                </th>
                                <th
                                    className="px-4 py-3 text-left cursor-pointer hover:bg-gray-700 transition"
                                    onClick={() => handleSort('accuracy')}
                                >
                                    准确率 <SortIcon column="accuracy" />
                                </th>
                                <th
                                    className="px-4 py-3 text-left cursor-pointer hover:bg-gray-700 transition"
                                    onClick={() => handleSort('max_combo')}
                                >
                                    最大连击 <SortIcon column="max_combo" />
                                </th>
                                <th className="px-4 py-3 text-left">评级</th>
                                <th className="px-4 py-3 text-left">判定</th>
                                <th
                                    className="px-4 py-3 text-left cursor-pointer hover:bg-gray-700 transition"
                                    onClick={() => handleSort('ended_at')}
                                >
                                    完成时间 <SortIcon column="ended_at" />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-black">
                            {sortedScores.map((score, index) => (
                                <tr
                                    key={`${score.user_id}-${score.ended_at}`}
                                    className={`border-b border-gray-700 hover:bg-gray-600 transition ${!score.passed ? 'opacity-60' : ''
                                        }`}
                                >
                                    <td className="px-4 py-3 font-bold">
                                        #{score.position}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center space-x-3">
                                            <Image
                                                src={score.avatar_url}
                                                alt={score.username}
                                                width={40}
                                                height={40}
                                                className="rounded-full"
                                                unoptimized
                                            />
                                            <div>
                                                <div className="font-medium">{score.username}</div>
                                                <div className="text-sm text-gray-300 flex items-center">
                                                    <span className={`fi fi-${score.country_code.toLowerCase()} mr-1`}></span>
                                                    {score.country_code}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono">
                                        {score.total_score.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        {formatAccuracy(score.accuracy)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {score.max_combo.toLocaleString()}x
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`font-bold ${getRankColorClass(score.rank)}`}>
                                            {score.rank}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-green-400">300:</span>
                                                <span>{score.statistics?.count_300 || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-blue-400">100:</span>
                                                <span>{score.statistics?.count_100 || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-yellow-400">50:</span>
                                                <span>{score.statistics?.count_50 || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-red-400">Miss:</span>
                                                <span>{score.statistics?.count_miss || 0}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {formatTime(score.ended_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
