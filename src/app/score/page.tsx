'use client';

import React, { useState, useEffect } from 'react';
import siteConfig from '@/config/site-config.json';
import ScoreCard from '../components/ScoreCard';
import { MapPool, MatchData, getMapPoolData } from '@/lib/osu-api';

export default function ScorePage() {
    const [mapPool, setMapPool] = useState<MapPool>({});
    const [matchData, setMatchData] = useState<MatchData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [matchId, setMatchId] = useState<string>('');
    const [mapPoolLoading, setMapPoolLoading] = useState(true);

    // 加载图池数据
    useEffect(() => {
        async function loadMapPool() {
            try {
                setMapPoolLoading(true);
                const data = await getMapPoolData(siteConfig.nowSeason);
                setMapPool(data);
            } catch (err) {
                console.error('加载图池数据失败:', err);
                // 图池数据加载失败不影响页面展示，只是无法按分类显示
            } finally {
                setMapPoolLoading(false);
            }
        }
        
        loadMapPool();
    }, []);

    // 获取比赛数据
    const fetchMatchData = async (id: string) => {
        if (!id.trim()) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`/api/osu-match/${id}`);
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('需要登录 osu! 账号才能查看比赛数据');
                } else if (response.status === 404) {
                    throw new Error('找不到该比赛房间，请检查房间ID是否正确');
                } else {
                    throw new Error(`获取比赛数据失败 (${response.status})`);
                }
            }
            
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            
            setMatchData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '获取比赛数据失败');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchMatchData(matchId);
    };

    const clearData = () => {
        setMatchData(null);
        setError(null);
        setMatchId('');
    };

    return (
        <div className="max-w-7xl mx-auto p-6 text-white bg-[#3D3D3D] min-h-screen">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">比赛分数展示</h1>
                        <p className="text-gray-300">查看 osu! 比赛房间的详细分数数据，按图池分类展示</p>
                    </div>
                    {matchData && (
                        <button
                            onClick={clearData}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            清空数据
                        </button>
                    )}
                </div>
                
                {/* 比赛ID输入表单 */}
                <form onSubmit={handleSubmit} className="mb-6">
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-2 text-gray-300">
                                osu! 比赛房间ID
                            </label>
                            <input
                                type="text"
                                value={matchId}
                                onChange={(e) => setMatchId(e.target.value)}
                                placeholder="请输入比赛房间ID (例如: 114514)"
                                className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                可以从 osu! 比赛房间链接中获取 ID，如：osu.ppy.sh/mp/114514
                            </p>
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !matchId.trim()}
                            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    加载中...
                                </span>
                            ) : '获取数据'}
                        </button>
                    </div>
                </form>

                {/* 错误信息 */}
                {error && (
                    <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
                        <div className="flex items-center">
                            <span className="text-red-400 mr-2">❌</span>
                            <span className="text-red-200">{error}</span>
                        </div>
                    </div>
                )}

                {/* 图池加载状态 */}
                {mapPoolLoading && (
                    <div className="mb-6 p-4 bg-blue-900/50 border border-blue-500 rounded-lg">
                        <div className="flex items-center">
                            <svg className="animate-spin mr-2 h-4 w-4 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-blue-200">正在加载图池数据...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 比赛信息 */}
            {matchData && (
                <div className="mb-8">
                    <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1A1A1A] rounded-lg p-6 border border-gray-600 shadow-xl">
                        <h2 className="text-2xl font-bold mb-4 flex items-center">
                            🏆 比赛信息
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <div className="text-gray-400 text-sm">比赛名称</div>
                                <div className="text-white font-semibold text-lg break-words">
                                    {matchData.match.name}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-gray-400 text-sm">比赛ID</div>
                                <div className="text-white font-mono text-lg">
                                    {matchData.match.id}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-gray-400 text-sm">开始时间</div>
                                <div className="text-white">
                                    {new Date(matchData.match.start_time).toLocaleString('zh-CN')}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-gray-400 text-sm">比赛统计</div>
                                <div className="text-white">
                                    <div>{matchData.games.length} 场比赛</div>
                                    <div>{matchData.users.length} 位玩家</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 分数展示区域 */}
            {matchData ? (
                Object.keys(mapPool).length > 0 ? (
                    <div>
                        <h2 className="text-3xl font-bold mb-6 flex items-center">
                            📊 按图池分类的分数
                        </h2>
                        {Object.entries(mapPool).map(([category, maps]) => (
                            <ScoreCard
                                key={category}
                                category={category}
                                maps={maps}
                                matchGames={matchData.games}
                                users={matchData.users}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="bg-[#2A2A2A] rounded-lg p-8 border border-gray-600">
                            <div className="text-4xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold text-white mb-2">图池数据未加载</h3>
                            <p className="text-gray-400 mb-4">
                                无法按分类展示分数，但您仍可以查看原始比赛数据
                            </p>
                            <div className="text-left bg-[#1A1A1A] rounded p-4">
                                <h4 className="text-white font-semibold mb-2">比赛原始数据：</h4>
                                <div className="text-sm text-gray-300 space-y-1">
                                    {matchData.games.map((game, index) => (
                                        <div key={game.id}>
                                            Game {index + 1}: {game.beatmap?.artist} - {game.beatmap?.title} [{game.beatmap?.difficulty_name}]
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            ) : (
                <div className="text-center py-16">
                    <div className="text-6xl mb-6">🎮</div>
                    <h3 className="text-2xl font-bold text-white mb-2">准备查看比赛分数</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                        输入 osu! 比赛房间ID，获取详细的分数数据和按图池分类的展示
                    </p>
                </div>
            )}
        </div>
    );
}
