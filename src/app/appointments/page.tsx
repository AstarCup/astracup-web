"use client";

import { useState, useEffect } from 'react';
import { usePageTitle } from '@/lib/usePageTitle';

interface Player {
    id: string;
    username: string;
    osuId: string;
    approved: boolean;
}

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
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
    updatedAt: string;
}

export default function AppointmentsPage() {
    usePageTitle('/appointments');

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isPlayer, setIsPlayer] = useState(false);
    const [availableMatches, setAvailableMatches] = useState<Match[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [selectedOpponent, setSelectedOpponent] = useState<Player | null>(null);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);

    useEffect(() => {
        initializePage();
    }, []);

    const initializePage = async () => {
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
                    await loadAppointmentData();
                } else {
                    setError('您不是已过审的选手，无法使用预约功能');
                }
            } else {
                setError('请先登录');
            }
        } catch (error) {
            setError('初始化失败，请刷新页面重试');
            console.error('Failed to initialize:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAppointmentData = async () => {
        try {
            // 并行获取数据
            const [matchesResponse, playersResponse, appointmentsResponse] = await Promise.all([
                fetch('/api/matches'),
                fetch('/api/registrations?approved=true'), // 获取已过审玩家
                fetch('/api/appointments')
            ]);

            const [matchesData, playersData, appointmentsData] = await Promise.all([
                matchesResponse.json(),
                playersResponse.json(),
                appointmentsResponse.json()
            ]);

            if (matchesData.success) {
                // 过滤出可预约的比赛（未完成的比赛）
                const availableMatches = matchesData.matches.filter((match: Match) =>
                    match.status === 'pending' && (!match.player1Id || !match.player2Id)
                );
                setAvailableMatches(availableMatches);
            }

            if (playersData.success) {
                // 排除当前用户自己
                const otherPlayers = playersData.registrations.filter((player: Player) =>
                    player.osuId !== currentUser?.osuId
                );
                setPlayers(otherPlayers);
            }

            if (appointmentsData.success) {
                setAppointments(appointmentsData.appointments);
            }
        } catch (error) {
            console.error('Failed to load appointment data:', error);
        }
    };

    const createAppointment = async () => {
        if (!selectedMatch || !selectedOpponent || !currentUser) return;

        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    matchId: selectedMatch.id,
                    playerId: currentUser.osuId,
                    playerName: currentUser.username,
                    opponentId: selectedOpponent.osuId,
                    opponentName: selectedOpponent.username
                }),
            });

            const data = await response.json();

            if (data.success) {
                setShowAppointmentModal(false);
                setSelectedMatch(null);
                setSelectedOpponent(null);
                await loadAppointmentData(); // 重新加载数据
                alert('预约申请已发送！');
            } else {
                setError(data.error || '预约失败');
            }
        } catch (error) {
            setError('网络错误，请稍后重试');
            console.error('Failed to create appointment:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'accepted': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return '等待确认';
            case 'accepted': return '已接受';
            case 'rejected': return '已拒绝';
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
                        <p className="text-red-600">{error || '您不是已过审的选手，无法使用预约功能'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-6xl mx-auto p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">比赛预约</h1>
                    <p className="text-gray-300">选择比赛场次和对手，发送对战预约</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 p-4 mb-6">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 可预约比赛场次 */}
                    <div className="bg-gray-800  shadow-md overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">可预约比赛场次</h2>

                            {availableMatches.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-400">暂无可预约的比赛场次</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {availableMatches.map((match) => (
                                        <div key={match.id} className="bg-gray-700  p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="text-lg font-medium text-white">
                                                        {match.round} - {match.matchNumber}
                                                    </h3>
                                                    <p className="text-gray-300 text-sm">
                                                        {match.date} {match.time}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setSelectedMatch(match);
                                                        setShowAppointmentModal(true);
                                                    }}
                                                    className="bg-[#F38181] text-white px-4 py-2 rounded-md hover:bg-[#95E1D3] transition-colors text-sm"
                                                >
                                                    预约比赛
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 我的预约记录 */}
                    <div className="bg-gray-800  shadow-md overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">我的预约记录</h2>

                            {appointments.filter(apt => apt.playerId === currentUser?.osuId).length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-400">暂无预约记录</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {appointments.filter(apt => apt.playerId === currentUser?.osuId).map((appointment) => {
                                        const match = availableMatches.find(m => m.id === appointment.matchId);
                                        return (
                                            <div key={appointment.id} className="bg-gray-700  p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-white">
                                                            {match ? `${match.round} - ${match.matchNumber}` : '比赛场次'}
                                                        </h3>
                                                        <p className="text-gray-300 text-sm">
                                                            {match ? `${match.date} ${match.time}` : '时间未知'}
                                                        </p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                                                        {getStatusText(appointment.status)}
                                                    </span>
                                                </div>
                                                <p className="text-gray-400 text-sm">
                                                    申请时间: {new Date(appointment.createdAt).toLocaleString('zh-CN')}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 预约模态框 */}
                {showAppointmentModal && selectedMatch && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-gray-800  p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-white mb-4">预约比赛</h3>

                            <div className="mb-4">
                                <h4 className="text-white font-medium mb-2">比赛信息</h4>
                                <div className="bg-gray-700 rounded p-3">
                                    <p className="text-gray-300">{selectedMatch.round} - {selectedMatch.matchNumber}</p>
                                    <p className="text-gray-400 text-sm">{selectedMatch.date} {selectedMatch.time}</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h4 className="text-white font-medium mb-2">选择对手</h4>
                                <select
                                    value={selectedOpponent?.osuId || ''}
                                    onChange={(e) => {
                                        const opponent = players.find(p => p.osuId === e.target.value);
                                        setSelectedOpponent(opponent || null);
                                    }}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38181]"
                                >
                                    <option value="">请选择对手</option>
                                    {players.map((player) => (
                                        <option key={player.osuId} value={player.osuId}>
                                            {player.username}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowAppointmentModal(false);
                                        setSelectedMatch(null);
                                        setSelectedOpponent(null);
                                    }}
                                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={createAppointment}
                                    disabled={!selectedOpponent}
                                    className={`flex-1 px-4 py-2 rounded-md transition-colors ${selectedOpponent
                                        ? 'bg-[#F38181] text-white hover:bg-[#95E1D3]'
                                        : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                        }`}
                                >
                                    发送预约
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
