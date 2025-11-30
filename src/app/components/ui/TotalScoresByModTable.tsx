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
    registrations?: any[]; // 添加已报名数据用于获取玩家信息
}

interface PlayerModScores {
    userId: string;
    username: string;
    avatarUrl: string;
    countryCode: string;
    scores: { [modPosition: string]: number | null }; // mod位 -> 分数
    ranks: { [modPosition: string]: number | null }; // mod位 -> 排名
    totalScore: number;
    totalRank: number | null; // 总分排名
    zScores: { [modPosition: string]: number | null }; // mod位 -> zscore
    zSum: number; // zscore总和
    rating: number; // zscore平均值
    averageScore: number; // 图池平均分
    playedMaps: number; // 已玩图池数量
}

export default function TotalScoresByModTable({
    scores,
    mapSelections,
    approvedPlayers,
    currentBeatmapId,
    loading = false,
    selectedRoom,
    registrations = []
}: TotalScoresByModTableProps) {
    const [sortBy, setSortBy] = useState<'username' | 'totalScore' | string>('totalScore');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [refreshKey, setRefreshKey] = useState(0); // 用于强制重新计算

    // 获取唯一的mod位列表，按mod类型和位置排序
    const modOrder = ['NM', 'HD', 'HR', 'DT', 'FM', 'LZ', 'TB'];
    const modPositions = Array.from(new Set(
        mapSelections.map(selection => `${selection.selectedMods}${selection.modPosition}`)
    )).sort((a, b) => {
        // 先按mod类型排序（按指定顺序），再按位置排序
        const modA = a.replace(/\d+$/, '');
        const modB = b.replace(/\d+$/, '');
        const posA = parseInt(a.replace(/\D/g, '')) || 0;
        const posB = parseInt(b.replace(/\D/g, '')) || 0;

        const indexA = modOrder.indexOf(modA);
        const indexB = modOrder.indexOf(modB);

        if (indexA !== indexB) {
            return indexA - indexB;
        }
        return posA - posB;
    });

    // 处理数据：按玩家分组，计算总分
    const processPlayerScores = (): PlayerModScores[] => {
        // console.log('开始处理总分数据...');
        // console.log('输入分数数量:', scores.length);
        // console.log('已过审玩家数量:', approvedPlayers.size);
        // console.log('地图选择数据数量:', mapSelections.length);
        // console.log('已报名数据数量:', registrations.length);

        const playerMap = new Map<string, PlayerModScores>();

        console.log(`Total scores received: ${scores.length}`);
        console.log(`Number of approved players: ${approvedPlayers.size}`);
        console.log(`Number of registrations: ${registrations.length}`);

        // 初始化所有已过审玩家
        approvedPlayers.forEach(osuId => {
            // 初始化玩家对象
            let playerInfo = {
                userId: osuId,
                username: `玩家 ${osuId}`,
                avatarUrl: `https://a.ppy.sh/${osuId}`,
                countryCode: '',
                scores: {},
                ranks: {},
                totalScore: 0,
                totalRank: null,
                zScores: {},
                zSum: 0,
                rating: 0,
                averageScore: 0,
                playedMaps: 0
            };

            // 从所有分数数据中查找该玩家的信息
            const playerScores = scores.filter(score => score.user_id.toString() === osuId);
            if (playerScores.length > 0) {
                // 使用第一个分数的玩家信息
                const firstScore = playerScores[0];
                playerInfo = {
                    userId: osuId,
                    username: firstScore.username,
                    avatarUrl: firstScore.avatar_url || `https://a.ppy.sh/${osuId}`,
                    countryCode: firstScore.country_code,
                    scores: {},
                    ranks: {},
                    totalScore: 0,
                    totalRank: null,
                    zScores: {},
                    zSum: 0,
                    rating: 0,
                    averageScore: 0,
                    playedMaps: 0
                };
            } else {
                // 如果玩家没有分数数据，从已报名数据中查找玩家信息
                const registration = registrations.find(reg => reg.osuId === osuId);
                if (registration) {
                    console.log(`玩家 ${osuId} 没有分数数据，但从已报名数据中获取信息`);
                    playerInfo = {
                        userId: osuId,
                        username: registration.username,
                        avatarUrl: registration.avatar_url || `https://a.ppy.sh/${osuId}`,
                        countryCode: registration.country || '',
                        scores: {},
                        ranks: {},
                        totalScore: 0,
                        totalRank: null,
                        zScores: {},
                        zSum: 0,
                        rating: 0,
                        averageScore: 0,
                        playedMaps: 0
                    };
                }
            }

            playerMap.set(osuId, playerInfo);
        });

        console.log(`Initialized ${playerMap.size} players from approvedPlayers`);

        console.log(`Initialized ${playerMap.size} players`);

        // console.log('初始化的玩家数量:', playerMap.size);

        // 填充每个玩家的所有mod位分数
        scores.forEach(score => {
            if (!approvedPlayers.has(score.user_id.toString())) return;

            const player = playerMap.get(score.user_id.toString());
            if (!player) return;

            // 只使用beatmap_id去匹配map_selections的beatmapId图池数据
            const scoreBeatmapId = (score as any).beatmap_id || (score as any).beatmapId || (score as any).beatmap?.id;
            const scoreRoomId = (score as any).roomId;

            console.log(`处理玩家 ${score.username} 的分数:`, {
                userId: score.user_id,
                roomId: scoreRoomId,
                beatmapId: scoreBeatmapId,
                totalScore: score.total_score
            });

            let mapSelection = null;

            // 直接通过beatmapId找到对应的map selection
            if (scoreBeatmapId) {
                // 尝试通过beatmapId匹配（分数数据中的beatmap_id对应map-selections中的beatmapId）
                console.log(`正在查找beatmapId: ${scoreBeatmapId} 的map selection`);
                console.log(`可用的map selections数量: ${mapSelections.length}`);

                // 打印所有map selections的beatmapId用于调试
                mapSelections.forEach((selection, index) => {
                    console.log(`Map selection ${index}: beatmapId=${selection.beatmapId}, beatmapsetId=${selection.beatmapsetId}, mods=${selection.selectedMods}${selection.modPosition}`);
                });

                mapSelection = mapSelections.find(selection =>
                    selection.beatmapId.toString() === scoreBeatmapId.toString()
                );

                if (mapSelection) {
                    console.log(`Found map selection for beatmapId: ${scoreBeatmapId}`, mapSelection);
                } else {
                    console.log(`No map selection found for beatmapId: ${scoreBeatmapId}`);
                    console.log(`所有可用的beatmapIds: ${mapSelections.map(s => s.beatmapId).join(', ')}`);
                }
            }

            if (mapSelection) {
                const modPosition = `${mapSelection.selectedMods}${mapSelection.modPosition}`;
                console.log(`Found mod position: ${modPosition} for beatmapId: ${scoreBeatmapId}`);

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
                    console.log(`为玩家 ${score.username} 设置 ${modPosition} 分数: ${score.total_score}`);
                }
            } else {
                console.log(`No map selection found for score:`, {
                    userId: score.user_id,
                    username: score.username,
                    roomId: scoreRoomId,
                    scoreBeatmapId
                });
            }
        });

        const result = Array.from(playerMap.values());

        // 计算每个mod位的玩家排名
        modPositions.forEach(modPosition => {
            // 获取该mod位所有有分数的玩家
            const playersWithScores = result.filter(player => player.scores[modPosition] !== null);

            // 按分数降序排序
            playersWithScores.sort((a, b) => (b.scores[modPosition] || 0) - (a.scores[modPosition] || 0));

            // 分配排名（处理并列情况）
            let currentRank = 1;
            let currentScore = playersWithScores[0]?.scores[modPosition] || 0;

            playersWithScores.forEach((player, index) => {
                if (player.scores[modPosition] !== currentScore) {
                    currentRank = index + 1;
                    currentScore = player.scores[modPosition] || 0;
                }
                player.ranks[modPosition] = currentRank;
            });
        });

        // 计算每个mod位的zscore
        modPositions.forEach(modPosition => {
            // 获取该mod位所有有分数的玩家
            const playersWithScores = result.filter(player => player.scores[modPosition] !== null);

            if (playersWithScores.length < 2) {
                // 如果少于2个玩家有分数，无法计算标准差，跳过
                playersWithScores.forEach(player => {
                    player.zScores[modPosition] = null;
                });
                return;
            }

            // 提取所有分数
            const scores = playersWithScores.map(player => player.scores[modPosition] || 0);

            // 计算平均值
            const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;

            // 计算标准差
            const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
            const stdDev = Math.sqrt(variance);

            // 如果标准差为0，所有分数相同，zscore都为0
            if (stdDev === 0) {
                playersWithScores.forEach(player => {
                    player.zScores[modPosition] = 0;
                });
                return;
            }

            // 计算每个玩家的zscore
            playersWithScores.forEach(player => {
                const score = player.scores[modPosition] || 0;
                const zScore = (score - mean) / stdDev;
                player.zScores[modPosition] = zScore;
            });
        });

        // 计算每个玩家的zSum和rating
        result.forEach(player => {
            // 计算zSum（所有有zscore的mod位之和）
            const validZScores = Object.values(player.zScores).filter(z => z !== null) as number[];
            player.zSum = validZScores.reduce((sum, z) => sum + z, 0);

            // 计算rating（zscore平均值）
            player.rating = validZScores.length > 0 ? player.zSum / validZScores.length : 0;

            // 计算图池平均分和已玩图池数量
            const validScores = Object.values(player.scores).filter(score => score !== null) as number[];
            player.playedMaps = validScores.length;
            player.averageScore = player.playedMaps > 0 ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / player.playedMaps) : 0;
        });

        // 计算总分排名
        const playersWithTotalScores = result.filter(player => player.totalScore > 0);
        console.log(`Players with total scores: ${playersWithTotalScores.length} out of ${result.length}`);

        // 打印每个玩家的总分和已玩图池数量
        result.forEach(player => {
            console.log(`${player.username} (${player.userId}): totalScore=${player.totalScore}, playedMaps=${player.playedMaps}`);
        });

        playersWithTotalScores.sort((a, b) => b.totalScore - a.totalScore);

        // 分配总分排名（处理并列情况）
        let currentTotalRank = 1;
        let currentTotalScore = playersWithTotalScores[0]?.totalScore || 0;

        playersWithTotalScores.forEach((player, index) => {
            if (player.totalScore !== currentTotalScore) {
                currentTotalRank = index + 1;
                currentTotalScore = player.totalScore;
            }
            player.totalRank = currentTotalRank;
        });

        console.log('处理完成，玩家分数结果:', result);
        return result;
    };

    // 计算图池平均分 - 直接从传入的scores数据计算
    const calculateMapPoolAverages = () => {
        const averages: { [modPosition: string]: number } = {};

        // 为每个mod位初始化
        modPositions.forEach(modPosition => {
            averages[modPosition] = 0;
        });

        // 统计每个mod位的分数和数量，按玩家分组取最高分
        const modPlayerScores: { [modPosition: string]: { [userId: string]: number } } = {};
        modPositions.forEach(modPosition => {
            modPlayerScores[modPosition] = {};
        });

        // 遍历所有分数数据，按mod位和玩家分组
        scores.forEach(score => {
            if (!approvedPlayers.has(score.user_id.toString())) return;

            // 只使用beatmap_id去匹配map_selections的beatmapId图池数据
            const scoreBeatmapId = (score as any).beatmap_id || (score as any).beatmapId || (score as any).beatmap?.id;

            let mapSelection = null;

            // 直接通过beatmapId找到对应的map selection
            if (scoreBeatmapId) {
                mapSelection = mapSelections.find(selection =>
                    selection.beatmapId.toString() === scoreBeatmapId.toString()
                );
            }

            if (mapSelection) {
                const modPosition = `${mapSelection.selectedMods}${mapSelection.modPosition}`;
                const userId = score.user_id.toString();

                // 只取每个玩家在该mod位的最高分
                if (modPlayerScores[modPosition]) {
                    const currentScore = modPlayerScores[modPosition][userId];
                    if (!currentScore || score.total_score > currentScore) {
                        modPlayerScores[modPosition][userId] = score.total_score;
                    }
                }
            }
        });

        // 计算每个mod位的平均分
        modPositions.forEach(modPosition => {
            const playerScores = Object.values(modPlayerScores[modPosition]);
            if (playerScores.length > 0) {
                const sum = playerScores.reduce((total, score) => total + score, 0);
                averages[modPosition] = Math.round(sum / playerScores.length);
            } else {
                averages[modPosition] = 0;
            }
        });

        return averages;
    };

    // 使用 refreshKey 强制重新计算
    const playerScores = processPlayerScores();
    const mapPoolAverages = calculateMapPoolAverages();

    // 检查是否有有效的平均分数据
    const hasValidAverages = Object.values(mapPoolAverages).some(average => average > 0);

    // 手动刷新函数
    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    // 排序玩家数据
    const sortedPlayers = [...playerScores].sort((a, b) => {
        if (sortBy === 'totalRank') {
            // 按排名排序（排名为null的排在最后）
            const rankA = a.totalRank || Number.MAX_SAFE_INTEGER;
            const rankB = b.totalRank || Number.MAX_SAFE_INTEGER;
            return sortOrder === 'asc' ? rankA - rankB : rankB - rankA;
        } else if (sortBy === 'totalScore') {
            return sortOrder === 'asc' ? a.totalScore - b.totalScore : b.totalScore - a.totalScore;
        } else if (sortBy === 'username') {
            return sortOrder === 'asc'
                ? a.username.localeCompare(b.username)
                : b.username.localeCompare(a.username);
        } else if (sortBy === 'zSum') {
            return sortOrder === 'asc' ? a.zSum - b.zSum : b.zSum - a.zSum;
        } else if (sortBy === 'rating') {
            return sortOrder === 'asc' ? a.rating - b.rating : b.rating - a.rating;
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
            case 'NM': return 'text-blue-500';
            case 'HD': return 'text-yellow-500';
            case 'HR': return 'text-red-500';
            case 'DT': return 'text-purple-500';
            case 'FM': return 'text-green-500';
            case 'LZ': return 'text-pink-500';
            case 'TB': return 'text-gray-800';
            default: return 'text-gray-500';
        }
    };

    // 获取mod显示名称
    const getModDisplayName = (modPosition: string): string => {
        const modType = modPosition.replace(/\d+$/, '');
        const position = modPosition.replace(/\D/g, '');
        return `${modType}${position}`;
    };

    // 根据modPosition找到对应的map selection
    const getMapSelectionForModPosition = (modPosition: string): MapSelection | null => {
        const modType = modPosition.replace(/\d+$/, '');
        const position = parseInt(modPosition.replace(/\D/g, '')) || 0;

        return mapSelections.find(selection =>
            selection.selectedMods === modType && selection.modPosition === position
        ) || null;
    };

    // 根据排名获取分数样式
    const getScoreRankStyle = (rank: number | null): string => {
        if (!rank) return 'text-white font-bold';

        switch (rank) {
            case 1:
                return 'text-yellow-500 font-bold'; // 金色
            case 2:
                return 'text-gray-400 font-bold'; // 暗银色
            case 3:
                return 'text-amber-700 font-bold'; // 铜色
            default:
                return 'text-white font-bold';
        }
    };

    const getScoreStyle = (rank: number | null): string => {
        switch (rank) {
            case 1:
                return 'text-yellow-500 font-bold'; // 金色
            case 2:
                return 'text-gray-400 font-bold'; // 暗银色
            case 3:
                return 'text-amber-700 font-bold'; // 铜色
            default:
                return 'text-black font-bold';
        }
    };

    // 根据排名获取行背景样式
    const getRowBackgroundStyle = (totalRank: number | null): string => {
        if (!totalRank) return 'bg-gray-400'; // 无排名的默认背景

        if (totalRank > 16) {
            return 'bg-gray-300'; // 16名以后的灰色背景
        }

        return 'bg-white'; // 前16名的默认背景
    };

    if (loading) {
        return (
            <div className="text-center py-8 text-white">
                <div className="inline-block animate-spin h-8 w-8 border-b-2 border-white"></div>
                <p className="mt-2">加载总分数据中...</p>
            </div>
        );
    }

    return (
        <div className="">
            <div className="flex justify-between items-center ">
                <h2 className="text-xl font-bold text-white">按总分</h2>
            </div>
            {/* 显示图池平均分数 */}
            {sortedPlayers.length === 0 ? (
                <div className="text-center py-8 text-white bg-[#3D3D3D]">
                    <p className="text-lg">暂无总分数据</p>
                    <p className="text-sm text-gray-400 mt-2">等待玩家完成比赛后数据将显示在这里</p>
                </div>
            ) : (
                <div className="overflow-x-auto w-full">
                    {/* 玩家总分表格 */}
                    <table className="w-full bg-[#3D3D3D] text-white table-auto">
                        <thead>
                            <tr className="border-b border-gray-600 bg-[#2D2D2D]">
                                <th
                                    className="px-2 py-3 text-center cursor-pointer hover:bg-gray-700 transition border-r border-gray-600 min-w-[60px]"
                                    onClick={() => handleSort('totalRank')}
                                >
                                    <div className="flex text-center">
                                        <span>排名</span>
                                        <SortIcon column="totalRank" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left cursor-pointer hover:bg-gray-700 transition border-r border-gray-600 min-w-[200px]"
                                    onClick={() => handleSort('username')}
                                >
                                    <div className="flex items-center">
                                        <span>玩家</span>
                                        <SortIcon column="username" />
                                    </div>
                                </th>
                                {modPositions.map(modPosition => {
                                    const mapSelection = getMapSelectionForModPosition(modPosition);
                                    const hasCover = mapSelection?.coverUrl;
                                    return (
                                        <th
                                            key={modPosition}
                                            className="px-3 py-2 text-center cursor-pointer hover:bg-gray-700 transition border-r border-gray-600 last:border-r-0 relative overflow-hidden"
                                            onClick={() => handleSort(modPosition)}
                                            style={{
                                                backgroundImage: hasCover ? `url(${mapSelection.coverUrl})` : undefined,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center'
                                            }}
                                        >
                                            {/* 半透明遮罩层 */}
                                            {hasCover && (
                                                <div className="absolute inset-0 bg-black/50"></div>
                                            )}
                                            <div className="flex flex-col items-center relative z-10 group">
                                                <span className={`px-2 py-1 text-2xl rounded font-bold text-shadow-lg ${getModColorClass(modPosition)}`}>
                                                    {getModDisplayName(modPosition)}
                                                    <SortIcon column={modPosition} />
                                                </span>
                                                {hasValidAverages && mapPoolAverages[modPosition] > 0 && (
                                                    <div className="absolute transform bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 whitespace-nowrap">
                                                        avg {mapPoolAverages[modPosition].toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                                <th
                                    className="px-4 py-3 text-center cursor-pointer hover:bg-gray-700 transition border-r border-gray-600 min-w-[100px]"
                                    onClick={() => handleSort('zSum')}
                                >
                                    <div className="flex items-center justify-center">
                                        <span>zSum</span>
                                        <SortIcon column="zSum" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-center cursor-pointer hover:bg-gray-700 transition border-r border-gray-600 min-w-[100px]"
                                    onClick={() => handleSort('rating')}
                                >
                                    <div className="flex items-center justify-center">
                                        <span>Rating</span>
                                        <SortIcon column="rating" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left cursor-pointer hover:bg-gray-700 transition bg-[#2D2D2D] min-w-[120px]"
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
                                    className={`border-b border-gray-700 hover:bg-gray-600 transition ${getRowBackgroundStyle(player.totalRank)}`}
                                >
                                    <td className="px-2 py-3 text-center font-mono border-r border-gray-600 bg-[#2D2D2D]">
                                        {player.totalRank ? (
                                            <span className={getScoreRankStyle(player.totalRank)}>
                                                {player.totalRank}
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 border-r border-gray-600 bg-[#2D2D2D]">
                                        <div className="flex items-center space-x-3">
                                            <Image
                                                src={player.avatarUrl}
                                                alt={player.username}
                                                width={40}
                                                height={40}
                                                className="rounded"
                                                unoptimized
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-white truncate">{player.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    {modPositions.map(modPosition => {
                                        const score = player.scores[modPosition];
                                        const rank = player.ranks[modPosition];
                                        return (
                                            <td
                                                key={modPosition}
                                                className="px-4 py-3 text-center font-mono border-r border-gray-600 last:border-r-0"
                                            >
                                                {score ? (
                                                    <span className={getScoreStyle(rank)}>
                                                        {score.toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500">-</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="px-4 py-3 text-center font-mono border-r border-gray-600">
                                        <span className="text-black font-bold">
                                            {player.zSum.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center font-mono border-r border-gray-600">
                                        <span className="text-black font-bold">
                                            {player.rating.toFixed(2)}
                                        </span>
                                    </td>
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
