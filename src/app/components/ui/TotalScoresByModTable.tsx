"use client";

import { useState } from "react";
import Image from "next/image";
import { DisplayScore } from "@/lib/multiplayer-types";
import { MapSelection } from "@/lib/map-selection";

interface TotalScoresByModTableProps {
    scores: DisplayScore[];
    mapSelections: MapSelection[];
    approvedPlayers: Set<string>;
    currentBeatmapId?: number;
    loading?: boolean;
    selectedRoom?: any; // 添加房间信息用于匹配
}

interface PlayerModScores {
    userId: string;
    username: string;
    avatarUrl: string;
    countryCode: string;
    scores: { [modPosition: string]: number | null }; // mod位 -> 分数
    totalScore: number;
}

export default function TotalScoresByModTable({
    scores,
    mapSelections,
    approvedPlayers,
    currentBeatmapId,
    loading = false,
    selectedRoom
}: TotalScoresByModTableProps) {
    const [sortBy, setSortBy] = useState<'username' | 'totalScore' | string>('totalScore');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // 获取唯一的mod位列表，按mod类型和位置排序
    const modPositions = Array.from(new Set(
        mapSelections.map(selection => `${selection.selectedMods}${selection.modPosition}`)
    )).sort((a, b) => {
        // 先按mod类型排序，再按位置排序
        const modA = a.replace(/\d+$/, '');
        const modB = b.replace(/\d+$/, '');
        const posA = parseInt(a.replace(/\D/g, '')) || 0;
        const posB = parseInt(b.replace(/\D/g, '')) || 0;

        if (modA !== modB) {
            return modA.localeCompare(modB);
        }
        return posA - posB;
    });

    // 处理数据：按玩家分组，计算总分
    const processPlayerScores = (): PlayerModScores[] => {
        const playerMap = new Map<string, PlayerModScores>();

        // 初始化所有已过审玩家
        approvedPlayers.forEach(osuId => {
            // 从分数数据中查找玩家信息（使用第一个找到的分数来获取玩家信息）
            const playerScore = scores.find(score => score.user_id.toString() === osuId);
            if (playerScore) {
                playerMap.set(osuId, {
                    userId: osuId,
                    username: playerScore.username,
                    avatarUrl: playerScore.avatar_url,
                    countryCode: playerScore.country_code,
                    scores: {},
                    totalScore: 0
                });
            }
        });

        // 填充每个玩家的所有mod位分数
        scores.forEach(score => {
            if (!approvedPlayers.has(score.user_id.toString())) return;

            const player = playerMap.get(score.user_id.toString());
            if (!player) return;

            // 通过playlistId找到对应的map selection
            const playlistId = (score as any).playlistId;
            const beatmapId = (score as any).beatmapId;

            if (playlistId && selectedRoom) {
                // 找到对应的playlist item
                const playlistItem = selectedRoom.playlist.find((item: any) => item.id === playlistId);
                if (playlistItem) {
                    // 找到这个playlist对应的map selection
                    const mapSelection = mapSelections.find(selection =>
                        selection.beatmapId === playlistItem.beatmap.id
                    );

                    if (mapSelection) {
                        const modPosition = `${mapSelection.selectedMods}${mapSelection.modPosition}`;

                        // 如果这个mod位已经有分数了，取最高分
                        const existingScore = player.scores[modPosition];
                        if (!existingScore || score.total_score > existingScore) {
                            // 更新总分：减去旧的分数（如果有），加上新的分数
                            if (existingScore) {
                                player.totalScore = player.totalScore - existingScore + score.total_score;
                            } else {
                                player.totalScore += score.total_score;
                            }
                            player.scores[modPosition] = score.total_score;
                        }
                    }
                }
            }
        });

        return Array.from(playerMap.values());
    };

    const playerScores = processPlayerScores();

    // 排序玩家数据
    const sortedPlayers = [...playerScores].sort((a, b) => {
        if (sortBy === 'totalScore') {
            return sortOrder === 'asc' ? a.totalScore - b.totalScore : b.totalScore - a.totalScore;
        } else if (sortBy === 'username') {
            return sortOrder === 'asc'
                ? a.username.localeCompare(b.username)
                : b.username.localeCompare(a.username);
        } else {
            // mod位排序
            const scoreA = a.scores[sortBy] || 0;
            const scoreB = b.scores[sortBy] || 0;
            return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
        }
    });

    const handleSort = (column: 'username' | 'totalScore' | string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const SortIcon = ({ column }: { column: 'username' | 'totalScore' | string }) => {
        if (sortBy !== column) return null;
        return (
            <span className="ml-1 text-blue-400">
                {sortOrder === 'asc' ? '↑' : '↓'}
            </span>
        );
    };

    // 获取mod颜色class
    const getModColorClass = (mod: string): string => {
        const modType = mod.replace(/\d+$/, '');
        switch (modType) {
            case 'NM': return 'bg-blue-500 text-white';
            case 'HD': return 'bg-yellow-500 text-black';
            case 'HR': return 'bg-red-500 text-white';
            case 'DT': return 'bg-purple-500 text-white';
            case 'FM': return 'bg-green-500 text-white';
            case 'LZ': return 'bg-pink-500 text-white';
            case 'TB': return 'bg-gray-800 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    // 获取mod显示名称
    const getModDisplayName = (modPosition: string): string => {
        const modType = modPosition.replace(/\d+$/, '');
        const position = modPosition.replace(/\D/g, '');
        return `${modType}${position}`;
    };

    if (loading) {
        return (
            <div className="text-center py-8 text-white">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <p className="mt-2">加载总分数据中...</p>
            </div>
        );
    }

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">按总分</h2>
            </div>

            {sortedPlayers.length === 0 ? (
                <div className="text-center py-8 text-white bg-[#3D3D3D] rounded-lg border border-gray-600">
                    <p className="text-lg">暂无总分数据</p>
                    <p className="text-sm text-gray-400 mt-2">等待玩家完成比赛后数据将显示在这里</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-600">
                    <table className="w-full bg-[#3D3D3D] text-white">
                        <thead>
                            <tr className="border-b border-gray-600 bg-[#2D2D2D]">
                                <th
                                    className="px-4 py-3 text-left cursor-pointer hover:bg-gray-700 transition sticky left-0 bg-[#2D2D2D] z-10 border-r border-gray-600"
                                    onClick={() => handleSort('username')}
                                >
                                    <div className="flex items-center">
                                        <span>玩家</span>
                                        <SortIcon column="username" />
                                    </div>
                                </th>
                                {modPositions.map(modPosition => (
                                    <th
                                        key={modPosition}
                                        className="px-3 py-2 text-center cursor-pointer hover:bg-gray-700 transition border-r border-gray-600 last:border-r-0"
                                        onClick={() => handleSort(modPosition)}
                                    >
                                        <div className="flex flex-col items-center">
                                            <span className={`px-2 py-1 text-xs rounded font-bold ${getModColorClass(modPosition)}`}>
                                                {getModDisplayName(modPosition)}
                                            </span>
                                            <SortIcon column={modPosition} />
                                        </div>
                                    </th>
                                ))}
                                <th
                                    className="px-4 py-3 text-left cursor-pointer hover:bg-gray-700 transition bg-[#2D2D2D]"
                                    onClick={() => handleSort('totalScore')}
                                >
                                    <div className="flex items-center">
                                        <span>总分</span>
                                        <SortIcon column="totalScore" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-black">
                            {sortedPlayers.map((player, index) => (
                                <tr
                                    key={player.userId}
                                    className="border-b border-gray-700 hover:bg-gray-600 transition"
                                >
                                    <td className="px-4 py-3 sticky left-0 bg-[#3D3D3D] z-10 border-r border-gray-600">
                                        <div className="flex items-center space-x-3">
                                            <Image
                                                src={player.avatarUrl}
                                                alt={player.username}
                                                width={40}
                                                height={40}
                                                className="rounded"
                                                unoptimized
                                            />
                                            <div>
                                                <div className="font-medium text-white">{player.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    {modPositions.map(modPosition => {
                                        const score = player.scores[modPosition];
                                        return (
                                            <td
                                                key={modPosition}
                                                className="px-4 py-3 text-center font-mono border-r border-gray-600 last:border-r-0"
                                            >
                                                {score ? (
                                                    <span className="text-white">
                                                        {score.toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500">-</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="px-4 py-3 font-mono text-black font-bold">
                                        {player.totalScore.toLocaleString()}
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
