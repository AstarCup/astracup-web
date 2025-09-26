"use client";

import { useState, useEffect } from 'react';
import { usePageTitle } from '@/lib/usePageTitle';

interface Match {
    id: string;
    round: string;
    date: string;
    time: string;
    matchNumber: string;
    player1Id?: string;
    player2Id?: string;
    player1Name?: string;
    player2Name?: string;
    redScore?: number;
    blueScore?: number;
    status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
    streamLink?: string;
    replayLink?: string;
    matchLink?: string;
    createdAt: string;
    updatedAt: string;
}

interface Appointment {
    id: string;
    matchId: string;
    playerId: string;
    playerName: string;
    opponentId?: string;
    opponentName?: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
    updatedAt: string;
}

interface PlayerStats {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
}

export default function PlayerDashboardPage() {
    usePageTitle('/player-dashboard');

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isPlayer, setIsPlayer] = useState(false);
    const [activeTab, setActiveTab] = useState<'schedule' | 'mappool' | 'profile' | 'appointments'>('schedule');
    const [matches, setMatches] = useState<Match[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [playerStats, setPlayerStats] = useState<PlayerStats>({ totalMatches: 0, wins: 0, losses: 0, winRate: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        initializeDashboard();
    }, []);

    const initializeDashboard = async () => {
        try {
            setLoading(true);

            // 获取当前用户信息
            const sessionResponse = await fetch('/api/session/get');
            const sessionData = await sessionResponse.json();

            if (sessionData.session?.osuId) {
                setCurrentUser(sessionData.session);

                // 检查用户权限
                const permissionsResponse = await fetch('/api/user-permissions');
                const permissionsData = await permissionsResponse.json();

                if (permissionsData.success && permissionsData.permissions.isPlayer) {
                    setIsPlayer(true);
                    await loadDashboardData();
                } else {
                    setError('您不是已过审的选手，无法访问玩家面板');
                }
            } else {
                setError('请先登录');
            }
        } catch (error) {
            setError('初始化失败，请刷新页面重试');
            console.error('Failed to initialize dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDashboardData = async () => {
        try {
            // 并行获取数据
            const [matchesResponse, appointmentsResponse] = await Promise.all([
                fetch('/api/matches'),
                fetch('/api/appointments')
            ]);

            const [matchesData, appointmentsData] = await Promise.all([
                matchesResponse.json(),
                appointmentsResponse.json()
            ]);

            if (matchesData.success) {
                setMatches(matchesData.matches);
                calculatePlayerStats(matchesData.matches);
            }

            if (appointmentsData.success) {
                setAppointments(appointmentsData.appointments);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    };

    const calculatePlayerStats = (matches: Match[]) => {
        if (!currentUser?.osuId) return;

        let totalMatches = 0;
        let wins = 0;
        let losses = 0;

        matches.forEach(match => {
            if (match.status === 'completed') {
                const isPlayer1 = match.player1Id === currentUser.osuId;
                const isPlayer2 = match.player2Id === currentUser.osuId;

                if (isPlayer1 || isPlayer2) {
                    totalMatches++;

                    // 简单胜负判断（可以根据实际需求调整）
                    if (isPlayer1 && match.redScore && match.blueScore) {
                        if (match.redScore > match.blueScore) {
                            wins++;
                        } else {
                            losses++;
                        }
                    } else if (isPlayer2 && match.redScore && match.blueScore) {
                        if (match.blueScore > match.redScore) {
                            wins++;
                        } else {
                            losses++;
                        }
                    }
                }
            }
        });

        const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

        setPlayerStats({
            totalMatches,
            wins,
            losses,
            winRate: Math.round(winRate * 100) / 100
        });
    };

    const getMyMatches = () => {
        if (!currentUser?.osuId) return [];

        return matches.filter(match =>
            match.player1Id === currentUser.osuId || match.player2Id === currentUser.osuId
        );
    };

    const getMyAppointments = () => {
        if (!currentUser?.osuId) return [];

        return appointments.filter(apt =>
            apt.playerId === currentUser.osuId || apt.opponentId === currentUser.osuId
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'ongoing': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return '等待中';
            case 'ongoing': return '进行中';
            case 'completed': return '已完成';
            case 'cancelled': return '已取消';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen py-12">
                <div className="max-w-6xl mx-auto p-6">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F38181] mx-auto"></div>
                        <p className="mt-4 text-gray-300">加载中...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isPlayer) {
        return (
            <div className="min-h-screen py-12">
                <div className="max-w-2xl mx-auto p-6">
                    <div className="bg-red-50 border border-red-200 p-6 text-center">
                        <h2 className="text-xl font-bold text-red-800 mb-2">访问受限</h2>
                        <p className="text-red-600">{error || '您不是已过审的选手，无法访问玩家面板'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-6xl mx-auto p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">玩家对战面板</h1>
                    <p className="text-gray-300">查看比赛信息、管理预约、追踪战绩</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 p-4 mb-6">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* 标签页导航 */}
                <div className="mb-6">
                    <div className="flex space-x-1 bg-gray-800 p-1 ">
                        {[
                            { id: 'schedule', label: '比赛日程' },
                            { id: 'mappool', label: '比赛图池' },
                            { id: 'profile', label: '个人信息' },
                            { id: 'appointments', label: '应战预约' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-[#F38181] text-white'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 标签页内容 */}
                <div className="bg-gray-800  shadow-md overflow-hidden">
                    {activeTab === 'schedule' && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">我的比赛日程</h2>

                            {getMyMatches().length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-400">暂无比赛安排</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {getMyMatches().map((match) => (
                                        <div key={match.id} className="bg-gray-700  p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="text-lg font-medium text-white">
                                                        {match.round} - {match.matchNumber}
                                                    </h3>
                                                    <p className="text-gray-300 text-sm">
                                                        {match.date} {match.time}
                                                    </p>
                                                    <p className="text-gray-400 text-sm">
                                                        对阵: {match.player1Name} vs {match.player2Name}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                                                    {getStatusText(match.status)}
                                                </span>
                                            </div>

                                            {match.status === 'completed' && (match.redScore !== undefined || match.blueScore !== undefined) && (
                                                <div className="mt-3 p-3 bg-gray-600 rounded">
                                                    <p className="text-white text-sm">
                                                        比分: {match.redScore || 0} - {match.blueScore || 0}
                                                    </p>
                                                </div>
                                            )}

                                            {(match.streamLink || match.replayLink || match.matchLink) && (
                                                <div className="mt-3 flex space-x-2">
                                                    {match.streamLink && (
                                                        <a
                                                            href={match.streamLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                                                        >
                                                            观看直播
                                                        </a>
                                                    )}
                                                    {match.replayLink && (
                                                        <a
                                                            href={match.replayLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                                                        >
                                                            查看回放
                                                        </a>
                                                    )}
                                                    {match.matchLink && (
                                                        <a
                                                            href={match.matchLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                                                        >
                                                            比赛链接
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'mappool' && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">比赛图池</h2>
                            <div className="text-center py-8">
                                <p className="text-gray-400">图池信息即将上线</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">个人信息</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-700  p-4">
                                    <h3 className="text-lg font-medium text-white mb-3">基本信息</h3>
                                    <div className="space-y-2">
                                        <p className="text-gray-300">
                                            <span className="text-gray-400">用户名:</span> {currentUser?.username}
                                        </p>
                                        <p className="text-gray-300">
                                            <span className="text-gray-400">osu! ID:</span> {currentUser?.osuId}
                                        </p>
                                        <p className="text-gray-300">
                                            <span className="text-gray-400">注册时间:</span> {currentUser?.registeredAt ? new Date(currentUser.registeredAt).toLocaleDateString('zh-CN') : '未知'}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-700  p-4">
                                    <h3 className="text-lg font-medium text-white mb-3">比赛统计</h3>
                                    <div className="space-y-2">
                                        <p className="text-gray-300">
                                            <span className="text-gray-400">总场次:</span> {playerStats.totalMatches}
                                        </p>
                                        <p className="text-gray-300">
                                            <span className="text-gray-400">胜场:</span> {playerStats.wins}
                                        </p>
                                        <p className="text-gray-300">
                                            <span className="text-gray-400">负场:</span> {playerStats.losses}
                                        </p>
                                        <p className="text-gray-300">
                                            <span className="text-gray-400">胜率:</span> {playerStats.winRate}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appointments' && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">应战预约</h2>

                            {getMyAppointments().length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-400">暂无预约记录</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {getMyAppointments().map((appointment) => {
                                        const match = matches.find(m => m.id === appointment.matchId);
                                        const isInitiator = appointment.playerId === currentUser?.osuId;
                                        const opponentName = isInitiator ? appointment.opponentName : appointment.playerName;

                                        return (
                                            <div key={appointment.id} className="bg-gray-700  p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-white">
                                                            {isInitiator ? `挑战 ${opponentName}` : `被 ${appointment.playerName} 挑战`}
                                                        </h3>
                                                        {match && (
                                                            <p className="text-gray-300 text-sm">
                                                                比赛: {match.round} - {match.matchNumber} ({match.date} {match.time})
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                                                        {appointment.status === 'pending' ? '等待确认' :
                                                            appointment.status === 'accepted' ? '已接受' : '已拒绝'}
                                                    </span>
                                                </div>
                                                <p className="text-gray-400 text-sm">
                                                    {new Date(appointment.createdAt).toLocaleString('zh-CN')}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}