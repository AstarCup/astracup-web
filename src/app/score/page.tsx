'use client';

import React, { useState, useEffect } from 'react';
import siteConfig from '@/config/site-config.json';
import { MapPool, MatchData, getMapPoolData } from '@/lib/osu-api';

export default function ScorePage() {
    const [session, setSession] = useState<any>(null);
    const [authUrl, setAuthUrl] = useState<string>('');
    const [sessionLoading, setSessionLoading] = useState(true);
    const [mapPool, setMapPool] = useState<MapPool>({});
    const [matchData, setMatchData] = useState<MatchData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [matchId, setMatchId] = useState<string>('');
    const [mapPoolLoading, setMapPoolLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedGameIndex, setSelectedGameIndex] = useState<number | null>(null);

    // 检查登录状态
    useEffect(() => {
        async function checkSession() {
            try {
                setSessionLoading(true);
                const response = await fetch('/api/session/get');
                const data = await response.json();

                if (data.success && data.session) {
                    setSession(data.session);
                } else {
                    // 获取登录链接
                    const authResponse = await fetch('/api/auth/url');
                    const authData = await authResponse.json();
                    if (authData.success) {
                        setAuthUrl(authData.authUrl);
                    }
                }
            } catch (err) {
                console.error('检查登录状态失败:', err);
            } finally {
                setSessionLoading(false);
            }
        }

        checkSession();
    }, []);

    // 加载图池数据（需要登录状态）
    useEffect(() => {
        async function loadMapPool() {
            if (!session) {
                // 如果没有登录，跳过图池加载
                setMapPoolLoading(false);
                return;
            }

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
    }, [session]); // 依赖session状态

    // 获取比赛数据
    const fetchMatchData = async (id: string) => {
        if (!id.trim()) return;

        if (!session) {
            setError('需要登录 osu! 账号才能获取比赛数据');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/osu-match/${id}`);
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('登录状态已过期，请重新登录');
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
        setIsExpanded(false);
        setSelectedGameIndex(null);
    };

    const handleLogin = () => {
        if (authUrl) {
            window.location.href = authUrl;
        }
    };

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/session/clear', {
                method: 'POST',
            });

            if (response.ok) {
                // 清除本地状态
                setSession(null);
                setMatchData(null);
                setMapPool({});
                setError(null);
                setMatchId('');

                // 获取新的登录URL
                const authResponse = await fetch('/api/auth/url');
                const authData = await authResponse.json();
                if (authData.success) {
                    setAuthUrl(authData.authUrl);
                }

                // 显示退出成功提示
                const successMsg = document.createElement('div');
                successMsg.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
                successMsg.innerHTML = '✅ 已成功退出登录';
                document.body.appendChild(successMsg);
                setTimeout(() => {
                    if (document.body.contains(successMsg)) {
                        document.body.removeChild(successMsg);
                    }
                }, 3000);
            } else {
                throw new Error('退出登录失败');
            }
        } catch (err) {
            console.error('退出登录失败:', err);
            setError('退出登录失败，请刷新页面重试');
        }
    };

    // 下载JSON功能
    const downloadJSON = () => {
        if (!matchData) return;

        const dataToDownload = {
            exportDate: new Date().toISOString(),
            matchInfo: {
                id: matchData.match.id,
                name: matchData.match.name,
                startTime: matchData.match.start_time,
                endTime: matchData.match.end_time
            },
            events: matchData.events,
            users: matchData.users,
            first_event_id: matchData.first_event_id,
            latest_event_id: matchData.latest_event_id,
            current_game_id: matchData.current_game_id,
            games: matchData.games,
            mapPool: mapPool
        };

        const dataStr = JSON.stringify(dataToDownload, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `osu-match-${matchData.match.id}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // 导入JSON功能
    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            setError('请选择有效的 JSON 文件');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target?.result as string);

                // 验证JSON格式 - 现在只要求基本字段
                if (!jsonData.users || !jsonData.matchInfo) {
                    throw new Error('JSON 文件格式不正确，缺少必要的数据字段');
                }

                // 重构数据格式以匹配 MatchData 类型
                const importedMatchData: MatchData = {
                    match: {
                        id: jsonData.matchInfo.id,
                        name: jsonData.matchInfo.name,
                        start_time: jsonData.matchInfo.startTime,
                        end_time: jsonData.matchInfo.endTime || null
                    },
                    events: jsonData.events || [],
                    users: jsonData.users,
                    first_event_id: jsonData.first_event_id || 0,
                    latest_event_id: jsonData.latest_event_id || 0,
                    current_game_id: jsonData.current_game_id || null,
                    games: jsonData.games || [] // 如果没有games数据，使用空数组
                };

                setMatchData(importedMatchData);

                // 如果有图池数据也一并导入
                if (jsonData.mapPool && Object.keys(jsonData.mapPool).length > 0) {
                    setMapPool(jsonData.mapPool);
                }

                setError(null);
                setMatchId(jsonData.matchInfo.id.toString());

                // 显示成功提示，但告知用户可能需要重新获取比赛数据
                const successMsg = document.createElement('div');
                successMsg.className = 'fixed top-4 right-4 bg-yellow-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
                if (!jsonData.games || jsonData.games.length === 0) {
                    successMsg.innerHTML = '⚠️ JSON导入成功，但缺少比赛数据。请重新获取比赛数据！';
                } else {
                    successMsg.innerHTML = '✅ JSON 文件导入成功！';
                }
                document.body.appendChild(successMsg);
                setTimeout(() => {
                    document.body.removeChild(successMsg);
                }, 3000);

            } catch (err) {
                setError(err instanceof Error ? `导入失败: ${err.message}` : '导入 JSON 文件失败');
            }
        };

        reader.readAsText(file);
        // 清空文件输入，允许重复选择同一文件
        event.target.value = '';
    };

    return (
        <div className="max-w-7xl mx-auto p-6 text-white bg-[#3D3D3D] min-h-screen">
            {/* 登录状态加载中 */}
            {sessionLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-gray-300">正在检查登录状态...</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-4xl font-bold mb-2">比赛分数展示</h1>
                                <p className="text-gray-300">查看 osu! 比赛房间的详细分数数据，按图池分类展示</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* 用户登录状态 */}
                                {session ? (
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center bg-[#2A2A2A] rounded-lg px-4 py-2 border border-gray-600">
                                            <img
                                                src={session.avatar_url}
                                                alt={session.username}
                                                className="w-8 h-8 rounded-full mr-3"
                                            />
                                            <div>
                                                <div className="text-white font-semibold">{session.username}</div>
                                                <div className="text-xs text-green-400">已登录</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                                        >
                                            退出登录
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleLogin}
                                        className="flex items-center gap-2 bg-[#FF66AA] hover:bg-[#E055AA] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                                    >
                                        <span>🎵</span>
                                        登录 osu!
                                    </button>
                                )}

                                {/* 导入JSON按钮 */}
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleFileImport}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        id="jsonFileInput"
                                    />
                                    <label
                                        htmlFor="jsonFileInput"
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer font-semibold"
                                    >
                                        📁 导入JSON
                                    </label>
                                </div>

                                {/* 下载JSON按钮 */}
                                {matchData && (
                                    <button
                                        onClick={downloadJSON}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                                    >
                                        💾 下载JSON
                                    </button>
                                )}

                                {/* 清空数据按钮 */}
                                {matchData && (
                                    <button
                                        onClick={clearData}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        🗑️ 清空数据
                                    </button>
                                )}
                            </div>
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
                                        placeholder={session ? "请输入比赛房间ID (例如: 114514)" : "请先登录 osu! 账号"}
                                        disabled={!session}
                                        className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        可以从 osu! 比赛房间链接中获取 ID，如：osu.ppy.sh/mp/114514
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !matchId.trim() || !session}
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

                        {/* 未登录提示 */}
                        {!session && (
                            <div className="mb-6 p-6 bg-[#FF66AA]/10 border border-[#FF66AA]/30 rounded-lg">
                                <div className="flex items-center">
                                    <span className="text-[#FF66AA] mr-3 text-2xl">🎵</span>
                                    <div>
                                        <h3 className="text-[#FF66AA] font-bold">需要登录 osu! 账号</h3>
                                        <p className="text-gray-300 text-sm">
                                            请先登录您的 osu! 账号以获取比赛数据的访问权限
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 功能说明 */}
                        <div className="mb-6 p-4 bg-[#2A2A2A] border border-gray-600 rounded-lg">
                            <div className="flex items-start">
                                <span className="text-blue-400 mr-3 text-xl">💡</span>
                                <div>
                                    <h3 className="text-white font-semibold mb-2">功能说明</h3>
                                    <div className="text-gray-300 text-sm space-y-1">
                                        <p>• <strong>在线获取：</strong>输入比赛房间ID直接从 osu! API 获取最新数据</p>
                                        <p>• <strong>窗帘展示：</strong>点击比赛信息可展开详细的每局游戏数据</p>
                                        <p>• <strong>交互式浏览：</strong>点击游戏卡片查看该局的详细分数排行</p>
                                        <p>• <strong>导出导入：</strong>支持JSON格式的数据导出和导入功能</p>
                                    </div>
                                </div>
                            </div>
                        </div>

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

                    {/* 比赛信息 - 窗帘式设计 */}
                    {matchData && (
                        <div className="mb-8">
                            {/* 比赛信息概览 - 可点击展开 */}
                            <div
                                className="bg-gradient-to-r from-[#2A2A2A] to-[#1A1A1A] rounded-lg p-6 border border-gray-600 shadow-xl cursor-pointer hover:border-[#FF66AA] transition-all duration-300"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <h2 className="text-2xl font-bold flex items-center">
                                            🏆 {matchData.match.name}
                                        </h2>
                                        <div className="ml-4 text-gray-400">
                                            {(matchData.games || []).length} 场比赛 • {(matchData.users || []).length} 位玩家
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-gray-400 mr-2">
                                            {isExpanded ? '点击收起' : '点击展开详情'}
                                        </span>
                                        <svg
                                            className={`w-6 h-6 text-[#FF66AA] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* 基本信息预览 */}
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <div className="text-gray-400 text-sm">比赛ID</div>
                                        <div className="text-white font-mono">{matchData.match.id}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-gray-400 text-sm">开始时间</div>
                                        <div className="text-white text-sm">
                                            {new Date(matchData.match.start_time).toLocaleString('zh-CN')}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-gray-400 text-sm">状态</div>
                                        <div className="text-green-400 text-sm">✅ 数据已加载</div>
                                    </div>
                                </div>
                            </div>

                            {/* 展开的详细内容 */}
                            <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                <div className="mt-4 bg-[#1A1A1A] rounded-lg border border-gray-700">
                                    {/* 游戏列表 */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold mb-4 flex items-center">
                                            🎮 比赛详情
                                        </h3>

                                        {/* 检查是否有游戏数据 */}
                                        {(!matchData.games || matchData.games.length === 0) ? (
                                            <div className="text-center py-12">
                                                <div className="bg-yellow-900/50 border border-yellow-500 rounded-lg p-6">
                                                    <div className="text-4xl mb-4">⚠️</div>
                                                    <h4 className="text-yellow-400 font-bold text-lg mb-2">缺少比赛游戏数据</h4>
                                                    <p className="text-gray-300 mb-4">
                                                        当前数据中没有比赛游戏信息。请使用比赛ID重新获取完整数据。
                                                    </p>
                                                    <div className="text-sm text-gray-400">
                                                        <p>• 比赛ID: {matchData.match.id}</p>
                                                        <p>• 玩家数量: {(matchData.users || []).length} 位</p>
                                                        <p>• 事件数量: {(matchData.events || []).length} 个</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* 游戏卡片网格 */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {(matchData.games || []).map((game, index) => (
                                                        <div
                                                            key={game.id}
                                                            className={`bg-[#2A2A2A] rounded-lg p-4 border cursor-pointer transition-all duration-200 hover:border-[#FF66AA] ${selectedGameIndex === index ? 'border-[#FF66AA] bg-[#FF66AA]/10' : 'border-gray-600'
                                                                }`}
                                                            onClick={() => setSelectedGameIndex(selectedGameIndex === index ? null : index)}
                                                        >
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex items-center">
                                                                    <div className="bg-[#FF66AA] text-white text-sm font-bold px-2 py-1 rounded">
                                                                        #{index + 1}
                                                                    </div>
                                                                    <div className="ml-2 text-gray-400 text-sm">
                                                                        {game.scores ? `${game.scores.length} 玩家` : '无分数'}
                                                                    </div>
                                                                </div>
                                                                <svg
                                                                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${selectedGameIndex === index ? 'rotate-180' : ''
                                                                        }`}
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <div className="text-white font-semibold text-sm">
                                                                    {game.beatmap?.artist} - {game.beatmap?.title}
                                                                </div>
                                                                <div className="text-gray-400 text-xs">
                                                                    [{game.beatmap?.difficulty_name}]
                                                                </div>
                                                                <div className="text-gray-500 text-xs">
                                                                    {game.beatmap?.version} • {game.mods?.join('') || 'NM'}
                                                                </div>
                                                            </div>

                                                            {/* 简要分数预览 */}
                                                            {game.scores && game.scores.length > 0 && (
                                                                <div className="mt-3 pt-3 border-t border-gray-600">
                                                                    <div className="text-xs text-gray-400 mb-1">最高分</div>
                                                                    <div className="text-sm text-white font-mono">
                                                                        {Math.max(...game.scores.map(s => s.score)).toLocaleString()}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* 选中游戏的详细分数 */}
                                                {selectedGameIndex !== null && matchData.games && matchData.games[selectedGameIndex] && (
                                                    <div className="mt-6 bg-[#0A0A0A] rounded-lg p-6 border border-gray-600">
                                                        <h4 className="text-lg font-bold mb-4 flex items-center">
                                                            📊 第 {selectedGameIndex + 1} 场比赛详细分数
                                                        </h4>

                                                        {/* 详细分数表格 */}
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className="border-b border-gray-600">
                                                                        <th className="text-left py-2 text-gray-400">排名</th>
                                                                        <th className="text-left py-2 text-gray-400">玩家</th>
                                                                        <th className="text-right py-2 text-gray-400">分数</th>
                                                                        <th className="text-right py-2 text-gray-400">准确率</th>
                                                                        <th className="text-center py-2 text-gray-400">统计</th>
                                                                        <th className="text-center py-2 text-gray-400">MOD</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {((matchData.games[selectedGameIndex].scores || []).sort((a, b) => b.score - a.score)).map((score, scoreIndex) => {
                                                                        const user = (matchData.users || []).find(u => u.id === score.user_id);
                                                                        return (
                                                                            <tr key={score.user_id} className="border-b border-gray-700 hover:bg-[#2A2A2A]/50">
                                                                                <td className="py-3">
                                                                                    <div className="flex items-center">
                                                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${scoreIndex === 0 ? 'bg-yellow-500 text-black' :
                                                                                            scoreIndex === 1 ? 'bg-gray-400 text-black' :
                                                                                                scoreIndex === 2 ? 'bg-orange-600 text-white' :
                                                                                                    'bg-gray-600 text-white'
                                                                                            }`}>
                                                                                            {scoreIndex + 1}
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-3">
                                                                                    <div className="flex items-center">
                                                                                        <img
                                                                                            src={user?.avatar_url || '/default-avatar.png'}
                                                                                            alt={user?.username || 'Unknown'}
                                                                                            className="w-8 h-8 rounded-full mr-3"
                                                                                        />
                                                                                        <span className="text-white font-medium">
                                                                                            {user?.username || 'Unknown'}
                                                                                        </span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-3 text-right">
                                                                                    <span className="text-white font-mono">
                                                                                        {score.score.toLocaleString()}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="py-3 text-right">
                                                                                    <span className="text-white">
                                                                                        {(score.accuracy * 100).toFixed(2)}%
                                                                                    </span>
                                                                                </td>
                                                                                <td className="py-3 text-center">
                                                                                    <div className="text-xs space-x-1">
                                                                                        <span className="text-blue-400">{score.statistics?.count_300 || 0}</span>/
                                                                                        <span className="text-green-400">{score.statistics?.count_100 || 0}</span>/
                                                                                        <span className="text-yellow-400">{score.statistics?.count_50 || 0}</span>/
                                                                                        <span className="text-red-400">{score.statistics?.count_miss || 0}</span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-3 text-center">
                                                                                    {score.mods && score.mods.length > 0 ? (
                                                                                        <span className="bg-[#FF66AA] text-white text-xs px-2 py-1 rounded">
                                                                                            +{score.mods.join('')}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="text-gray-500 text-xs">NM</span>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 未加载数据时的提示 */}
                    {!matchData && (
                        <div className="text-center py-16">
                            <div className="text-6xl mb-6">🎮</div>
                            <h3 className="text-2xl font-bold text-white mb-2">准备查看比赛分数</h3>
                            <p className="text-gray-400 max-w-md mx-auto">
                                输入 osu! 比赛房间ID，获取详细的分数数据展示
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
