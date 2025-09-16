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

                // 从events中提取games数据
                const extractedGames = jsonData.events
                    ? jsonData.events
                        .filter((event: any) => event.game) // 只保留有game数据的events
                        .map((event: any) => event.game) // 提取game对象
                    : [];

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
                    games: extractedGames // 使用从events提取的games数据
                };

                setMatchData(importedMatchData);

                // 如果有图池数据也一并导入
                if (jsonData.mapPool && Object.keys(jsonData.mapPool).length > 0) {
                    setMapPool(jsonData.mapPool);
                }

                setError(null);
                setMatchId(jsonData.matchInfo.id.toString());

                // 显示成功提示
                const successMsg = document.createElement('div');
                if (extractedGames.length === 0) {
                    successMsg.className = 'fixed top-4 right-4 bg-yellow-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
                    successMsg.innerHTML = '⚠️ JSON导入成功，但未找到比赛游戏数据。请检查文件或重新获取数据！';
                } else {
                    successMsg.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
                    successMsg.innerHTML = `✅ JSON导入成功！找到 ${extractedGames.length} 场游戏数据`;
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
                        <div className="mb-20">
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
                                                                        Game #{index + 1}
                                                                    </div>
                                                                    <div className="ml-2 text-gray-400 text-sm">
                                                                        {game.scores ? `${game.scores.length} 分数` : '无分数'}
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

                                                            {/* 歌曲信息 */}
                                                            <div className="space-y-2 mb-3">
                                                                <div className="text-white font-semibold text-sm">
                                                                    {game.beatmap?.artist} - {game.beatmap?.title}
                                                                </div>
                                                                <div className="text-gray-400 text-xs">
                                                                    [{game.beatmap?.difficulty_name}]
                                                                </div>
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-gray-500">
                                                                        {game.beatmap?.version} • {game.mods?.join('') || 'NM'}
                                                                    </span>
                                                                    <span className="text-blue-400">
                                                                        ⭐ {(game.beatmap as any)?.difficulty_rating?.toFixed(2) || 'N/A'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* 时间信息 */}
                                                            <div className="border-t border-gray-600 pt-2 mb-3">
                                                                <div className="flex justify-between text-xs text-gray-400">
                                                                    <span>开始: {new Date(game.start_time).toLocaleTimeString('zh-CN')}</span>
                                                                    <span>结束: {new Date(game.end_time).toLocaleTimeString('zh-CN')}</span>
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    时长: {Math.round((new Date(game.end_time).getTime() - new Date(game.start_time).getTime()) / 1000 / 60)} 分钟
                                                                </div>
                                                            </div>

                                                            {/* 分数统计预览 */}
                                                            {game.scores && game.scores.length > 0 && (
                                                                <div className="border-t border-gray-600 pt-3">
                                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                                        <div>
                                                                            <div className="text-gray-400">最高分</div>
                                                                            <div className="text-white font-mono text-sm">
                                                                                {Math.max(...game.scores.map(s => s.score)).toLocaleString()}
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-gray-400">平均分</div>
                                                                            <div className="text-white font-mono text-sm">
                                                                                {Math.round(game.scores.reduce((sum, s) => sum + s.score, 0) / game.scores.length).toLocaleString()}
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-gray-400">最高准确率</div>
                                                                            <div className="text-green-400 font-mono text-sm">
                                                                                {(Math.max(...game.scores.map(s => s.accuracy)) * 100).toFixed(2)}%
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-gray-400">完成人数</div>
                                                                            <div className="text-blue-400 font-mono text-sm">
                                                                                {game.scores.filter(s => (s as any).passed || (s as any).pass).length}/{game.scores.length}
                                                                            </div>
                                                                        </div>
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
                                                            📊 Game {selectedGameIndex + 1}: {matchData.games[selectedGameIndex].beatmap?.artist} - {matchData.games[selectedGameIndex].beatmap?.title}
                                                        </h4>

                                                        {/* 游戏信息概览 */}
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-[#2A2A2A] rounded-lg">
                                                            <div>
                                                                <div className="text-gray-400 text-xs">难度星级</div>
                                                                <div className="text-white font-semibold">
                                                                    ⭐ {((matchData.games[selectedGameIndex].beatmap as any)?.difficulty_rating)?.toFixed(2) || 'N/A'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-gray-400 text-xs">游戏模式</div>
                                                                <div className="text-white font-semibold">
                                                                    {matchData.games[selectedGameIndex].scoring_type || 'N/A'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-gray-400 text-xs">参与人数</div>
                                                                <div className="text-white font-semibold">
                                                                    {matchData.games[selectedGameIndex].scores?.length || 0} 人
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-gray-400 text-xs">游戏时长</div>
                                                                <div className="text-white font-semibold">
                                                                    {Math.round((new Date(matchData.games[selectedGameIndex].end_time).getTime() - new Date(matchData.games[selectedGameIndex].start_time).getTime()) / 1000 / 60)} 分钟
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* 详细分数表格 - 替换为比赛结果展示 */}
                                                        <div className="mt-6">
                                                            {/* 比赛结果卡片 */}
                                                            <div className="relative overflow-hidden rounded-xl shadow-2xl">
                                                                {/* 背景图片层 */}
                                                                <div
                                                                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                                                    style={{
                                                                        backgroundImage: `url('https://assets.ppy.sh/beatmaps/${matchData.games[selectedGameIndex].beatmap?.beatmapset_id}/covers/cover@2x.jpg')`,
                                                                        filter: 'blur(3px) brightness(0.3)'
                                                                    }}
                                                                />

                                                                {/* 内容层 */}
                                                                <div className="relative z-10 p-8">
                                                                    {/* 歌曲信息头部 */}
                                                                    <div className="text-center mb-8">
                                                                        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 mx-auto max-w-2xl">
                                                                            <h2 className="text-3xl font-bold text-white mb-2">
                                                                                {matchData.games[selectedGameIndex].beatmap?.title}
                                                                            </h2>
                                                                            <p className="text-xl text-gray-200 mb-1">
                                                                                by {matchData.games[selectedGameIndex].beatmap?.artist}
                                                                            </p>
                                                                            <p className="text-lg text-gray-300">
                                                                                [{matchData.games[selectedGameIndex].beatmap?.difficulty_name}]
                                                                                ⭐ {((matchData.games[selectedGameIndex].beatmap as any)?.difficulty_rating)?.toFixed(2) || 'N/A'}
                                                                            </p>
                                                                            <div className="mt-4 text-sm text-gray-400">
                                                                                Game {selectedGameIndex + 1} • {matchData.games[selectedGameIndex].scoring_type || 'Score V2'}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* 队伍胜负结果 */}
                                                                    {(() => {
                                                                        const scores = matchData.games[selectedGameIndex].scores || [];
                                                                        const redTeamScores = scores.filter(s => {
                                                                            const user = matchData.users?.find(u => u.id === s.user_id);
                                                                            return user?.country_code === 'CN'; // 中国为红队
                                                                        });
                                                                        const blueTeamScores = scores.filter(s => {
                                                                            const user = matchData.users?.find(u => u.id === s.user_id);
                                                                            return user?.country_code !== 'CN'; // 其他国家为蓝队
                                                                        });

                                                                        const redTeamTotal = redTeamScores.reduce((sum, s) => sum + s.score, 0);
                                                                        const blueTeamTotal = blueTeamScores.reduce((sum, s) => sum + s.score, 0);
                                                                        const redWins = redTeamTotal > blueTeamTotal;

                                                                        return (
                                                                            <div className="flex justify-center mb-8">
                                                                                <div className="bg-black/60 backdrop-blur-sm rounded-xl p-6 flex items-center gap-8">
                                                                                    {/* 红队 */}
                                                                                    <div className={`text-center p-6 rounded-lg ${redWins ? 'bg-red-600/80' : 'bg-red-900/40'} transition-all`}>
                                                                                        <div className="text-2xl font-bold text-white mb-2">🇨🇳 中国队</div>
                                                                                        <div className="text-3xl font-mono text-white font-bold">
                                                                                            {redTeamTotal.toLocaleString()}
                                                                                        </div>
                                                                                        {redWins && <div className="text-yellow-400 text-xl mt-2">👑 WINNER</div>}
                                                                                    </div>

                                                                                    <div className="text-4xl text-white font-bold">VS</div>

                                                                                    {/* 蓝队 */}
                                                                                    <div className={`text-center p-6 rounded-lg ${!redWins ? 'bg-blue-600/80' : 'bg-blue-900/40'} transition-all`}>
                                                                                        <div className="text-2xl font-bold text-white mb-2">🇬🇧 英国队</div>
                                                                                        <div className="text-3xl font-mono text-white font-bold">
                                                                                            {blueTeamTotal.toLocaleString()}
                                                                                        </div>
                                                                                        {!redWins && <div className="text-yellow-400 text-xl mt-2">👑 WINNER</div>}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })()}

                                                                    {/* 选手成绩 - 竖直排版 */}
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                        {/* 红队选手 */}
                                                                        <div className="bg-red-900/20 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
                                                                            <h3 className="text-xl font-bold text-red-400 mb-4 text-center">🇨🇳 中国队选手</h3>
                                                                            <div className="space-y-4">
                                                                                {((matchData.games[selectedGameIndex].scores || [])
                                                                                    .filter(s => {
                                                                                        const user = matchData.users?.find(u => u.id === s.user_id);
                                                                                        return user?.country_code === 'CN';
                                                                                    })
                                                                                    .sort((a, b) => b.score - a.score)
                                                                                ).map((score, index) => {
                                                                                    const user = matchData.users?.find(u => u.id === score.user_id);
                                                                                    return (
                                                                                        <div key={score.user_id} className="bg-black/40 rounded-lg p-4">
                                                                                            <div className="flex items-center mb-3">
                                                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${index === 0 ? 'bg-yellow-500 text-black' :
                                                                                                        index === 1 ? 'bg-gray-400 text-black' :
                                                                                                            'bg-red-600 text-white'
                                                                                                    }`}>
                                                                                                    {index + 1}
                                                                                                </div>
                                                                                                <img
                                                                                                    src={user?.avatar_url || '/default-avatar.png'}
                                                                                                    alt={user?.username || 'Unknown'}
                                                                                                    className="w-10 h-10 rounded-full mr-3"
                                                                                                />
                                                                                                <div className="flex-1">
                                                                                                    <div className="text-white font-semibold text-lg">
                                                                                                        {user?.username || 'Unknown'}
                                                                                                    </div>
                                                                                                    <div className="text-red-300 text-sm">
                                                                                                        {user?.country_code || 'N/A'}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                                                <div>
                                                                                                    <div className="text-gray-400">分数</div>
                                                                                                    <div className="text-white font-mono text-lg">
                                                                                                        {score.score.toLocaleString()}
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <div className="text-gray-400">准确率</div>
                                                                                                    <div className="text-green-400 font-mono text-lg">
                                                                                                        {(score.accuracy * 100).toFixed(2)}%
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <div className="text-gray-400">最大连击</div>
                                                                                                    <div className="text-yellow-400 font-mono">
                                                                                                        {score.max_combo || 0}x
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <div className="text-gray-400">等级</div>
                                                                                                    <div className="flex items-center">
                                                                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${(score as any).rank === 'SS' || (score as any).rank === 'SSH' ? 'bg-yellow-500 text-black' :
                                                                                                                (score as any).rank === 'S' || (score as any).rank === 'SH' ? 'bg-yellow-600 text-white' :
                                                                                                                    (score as any).rank === 'A' ? 'bg-green-500 text-white' :
                                                                                                                        'bg-gray-500 text-white'
                                                                                                            }`}>
                                                                                                            {(score as any).rank || 'N/A'}
                                                                                                        </span>
                                                                                                        {score.mods && score.mods.length > 0 && (
                                                                                                            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                                                                                                +{score.mods.join('')}
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="mt-3 pt-3 border-t border-red-500/30">
                                                                                                <div className="text-xs text-gray-400 mb-1">统计</div>
                                                                                                <div className="text-xs space-x-2">
                                                                                                    <span className="text-blue-400">300: {score.statistics?.count_300 || 0}</span>
                                                                                                    <span className="text-green-400">100: {score.statistics?.count_100 || 0}</span>
                                                                                                    <span className="text-yellow-400">50: {score.statistics?.count_50 || 0}</span>
                                                                                                    <span className="text-red-400">Miss: {score.statistics?.count_miss || 0}</span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>

                                                                        {/* 蓝队选手 */}
                                                                        <div className="bg-blue-900/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
                                                                            <h3 className="text-xl font-bold text-blue-400 mb-4 text-center">🇬🇧 英国队选手</h3>
                                                                            <div className="space-y-4">
                                                                                {((matchData.games[selectedGameIndex].scores || [])
                                                                                    .filter(s => {
                                                                                        const user = matchData.users?.find(u => u.id === s.user_id);
                                                                                        return user?.country_code !== 'CN';
                                                                                    })
                                                                                    .sort((a, b) => b.score - a.score)
                                                                                ).map((score, index) => {
                                                                                    const user = matchData.users?.find(u => u.id === score.user_id);
                                                                                    return (
                                                                                        <div key={score.user_id} className="bg-black/40 rounded-lg p-4">
                                                                                            <div className="flex items-center mb-3">
                                                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${index === 0 ? 'bg-yellow-500 text-black' :
                                                                                                        index === 1 ? 'bg-gray-400 text-black' :
                                                                                                            'bg-blue-600 text-white'
                                                                                                    }`}>
                                                                                                    {index + 1}
                                                                                                </div>
                                                                                                <img
                                                                                                    src={user?.avatar_url || '/default-avatar.png'}
                                                                                                    alt={user?.username || 'Unknown'}
                                                                                                    className="w-10 h-10 rounded-full mr-3"
                                                                                                />
                                                                                                <div className="flex-1">
                                                                                                    <div className="text-white font-semibold text-lg">
                                                                                                        {user?.username || 'Unknown'}
                                                                                                    </div>
                                                                                                    <div className="text-blue-300 text-sm">
                                                                                                        {user?.country_code || 'N/A'}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                                                <div>
                                                                                                    <div className="text-gray-400">分数</div>
                                                                                                    <div className="text-white font-mono text-lg">
                                                                                                        {score.score.toLocaleString()}
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <div className="text-gray-400">准确率</div>
                                                                                                    <div className="text-green-400 font-mono text-lg">
                                                                                                        {(score.accuracy * 100).toFixed(2)}%
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <div className="text-gray-400">最大连击</div>
                                                                                                    <div className="text-yellow-400 font-mono">
                                                                                                        {score.max_combo || 0}x
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <div className="text-gray-400">等级</div>
                                                                                                    <div className="flex items-center">
                                                                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${(score as any).rank === 'SS' || (score as any).rank === 'SSH' ? 'bg-yellow-500 text-black' :
                                                                                                                (score as any).rank === 'S' || (score as any).rank === 'SH' ? 'bg-yellow-600 text-white' :
                                                                                                                    (score as any).rank === 'A' ? 'bg-green-500 text-white' :
                                                                                                                        'bg-gray-500 text-white'
                                                                                                            }`}>
                                                                                                            {(score as any).rank || 'N/A'}
                                                                                                        </span>
                                                                                                        {score.mods && score.mods.length > 0 && (
                                                                                                            <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                                                                                                +{score.mods.join('')}
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="mt-3 pt-3 border-t border-blue-500/30">
                                                                                                <div className="text-xs text-gray-400 mb-1">统计</div>
                                                                                                <div className="text-xs space-x-2">
                                                                                                    <span className="text-blue-400">300: {score.statistics?.count_300 || 0}</span>
                                                                                                    <span className="text-green-400">100: {score.statistics?.count_100 || 0}</span>
                                                                                                    <span className="text-yellow-400">50: {score.statistics?.count_50 || 0}</span>
                                                                                                    <span className="text-red-400">Miss: {score.statistics?.count_miss || 0}</span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
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
