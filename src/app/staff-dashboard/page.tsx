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
    referee?: string;
    streamer?: string;
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

interface StaffMember {
    id: string;
    username: string;
    role: 'referee' | 'streamer' | 'admin';
}

export default function StaffDashboardPage() {
    usePageTitle('/staff-dashboard');

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userPermissions, setUserPermissions] = useState<any>(null);
    const [isStaff, setIsStaff] = useState(false);
    const [activeTab, setActiveTab] = useState<'matches' | 'appointments' | 'staff' | 'schedule'>('matches');
    const [matches, setMatches] = useState<Match[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        referee: '',
        streamer: '',
        streamLink: '',
        replayLink: '',
        matchLink: '',
        status: 'pending' as Match['status'],
        redScore: '',
        blueScore: ''
    });

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

                if (permissionsData.success && (permissionsData.permissions.isAdmin || permissionsData.permissions.isMapSelector || permissionsData.permissions.isReplayTester || permissionsData.permissions.isReferee || permissionsData.permissions.isStreamer)) {
                    setUserPermissions(permissionsData.permissions);
                    setIsStaff(true);
                    await loadDashboardData();
                } else {
                    setError('您没有工作人员权限，无法访问管理面板');
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
            }

            if (appointmentsData.success) {
                setAppointments(appointmentsData.appointments);
            }

            // 获取工作人员数据
            const staffResponse = await fetch('/api/staff-members');
            const staffData = await staffResponse.json();

            if (staffData.success) {
                setStaffMembers(staffData.staffMembers);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    };

    const updateMatch = async () => {
        if (!selectedMatch) return;

        try {
            const updateData = {
                ...editForm,
                redScore: editForm.redScore ? parseInt(editForm.redScore) : undefined,
                blueScore: editForm.blueScore ? parseInt(editForm.blueScore) : undefined
            };

            const response = await fetch(`/api/matches/${selectedMatch.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            const data = await response.json();

            if (data.success) {
                setShowEditModal(false);
                setSelectedMatch(null);
                await loadDashboardData();
                alert('比赛信息已更新！');
            } else {
                setError(data.error || '更新失败');
            }
        } catch (error) {
            setError('网络错误，请稍后重试');
            console.error('Failed to update match:', error);
        }
    };

    const updateAppointmentStatus = async (appointmentId: string, status: string) => {
        try {
            const response = await fetch(`/api/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });

            const data = await response.json();

            if (data.success) {
                await loadDashboardData();
                alert(`预约已${status === 'accepted' ? '接受' : '拒绝'}！`);
            } else {
                setError(data.error || '更新预约状态失败');
            }
        } catch (error) {
            setError('网络错误，请稍后重试');
            console.error('Failed to update appointment:', error);
        }
    };

    const openEditModal = (match: Match) => {
        setSelectedMatch(match);
        setEditForm({
            referee: match.referee || '',
            streamer: match.streamer || '',
            streamLink: match.streamLink || '',
            replayLink: match.replayLink || '',
            matchLink: match.matchLink || '',
            status: match.status,
            redScore: match.redScore?.toString() || '',
            blueScore: match.blueScore?.toString() || ''
        });
        setShowEditModal(true);
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

    if (!isStaff) {
        return (
            <div className="min-h-screen py-12">
                <div className="max-w-2xl mx-auto p-6">
                    <div className="bg-red-50 border border-red-200 p-6 text-center">
                        <h2 className="text-xl font-bold text-red-800 mb-2">访问受限</h2>
                        <p className="text-red-600">{error || '您没有工作人员权限，无法访问管理面板'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-6xl mx-auto p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">工作人员管理面板</h1>
                    <p className="text-gray-300">管理比赛、预约、工作人员和赛程安排</p>
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
                            { id: 'matches', label: '比赛管理' },
                            { id: 'appointments', label: '预约管理' },
                            { id: 'staff', label: '工作人员' },
                            { id: 'schedule', label: '赛程安排' }
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
                    {activeTab === 'matches' && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">比赛管理</h2>

                            {matches.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-400">暂无比赛数据</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {matches.map((match) => (
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
                                                        对阵: {match.player1Name || '待定'} vs {match.player2Name || '待定'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                                                        {getStatusText(match.status)}
                                                    </span>
                                                    <button
                                                        onClick={() => openEditModal(match)}
                                                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                                                    >
                                                        编辑
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-400">裁判员:</span>
                                                    <span className="text-white ml-2">{match.referee || '未分配'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">直播员:</span>
                                                    <span className="text-white ml-2">{match.streamer || '未分配'}</span>
                                                </div>
                                            </div>

                                            {match.status === 'completed' && (match.redScore !== undefined || match.blueScore !== undefined) && (
                                                <div className="mt-3 p-3 bg-gray-600 rounded">
                                                    <p className="text-white text-sm">
                                                        比分: {match.redScore || 0} - {match.blueScore || 0}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'appointments' && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">预约管理</h2>

                            {appointments.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-400">暂无预约申请</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {appointments.map((appointment) => {
                                        const match = matches.find(m => m.id === appointment.matchId);
                                        return (
                                            <div key={appointment.id} className="bg-gray-700  p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-white">
                                                            {appointment.playerName} 挑战 {appointment.opponentName}
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

                                                <p className="text-gray-400 text-sm mb-3">
                                                    申请时间: {new Date(appointment.createdAt).toLocaleString('zh-CN')}
                                                </p>

                                                {appointment.status === 'pending' && (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => updateAppointmentStatus(appointment.id, 'accepted')}
                                                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                                                        >
                                                            接受预约
                                                        </button>
                                                        <button
                                                            onClick={() => updateAppointmentStatus(appointment.id, 'rejected')}
                                                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                                                        >
                                                            拒绝预约
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'staff' && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">工作人员管理</h2>

                            <div className="space-y-4">
                                {staffMembers.map((staff) => (
                                    <div key={staff.id} className="bg-gray-700  p-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="text-lg font-medium text-white">{staff.username}</h3>
                                                <p className="text-gray-400 text-sm">
                                                    角色: {staff.role === 'referee' ? '裁判员' : staff.role === 'streamer' ? '直播员' : '管理员'}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${staff.role === 'admin' ? 'bg-red-100 text-red-800' :
                                                staff.role === 'referee' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-purple-100 text-purple-800'
                                                }`}>
                                                {staff.role === 'referee' ? '裁判员' : staff.role === 'streamer' ? '直播员' : '管理员'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">赛程安排</h2>
                            <div className="text-center py-8">
                                <p className="text-gray-400">赛程安排功能即将上线</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 编辑比赛模态框 */}
                {showEditModal && selectedMatch && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-gray-800  p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                            <h3 className="text-xl font-bold text-white mb-4">编辑比赛信息</h3>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">裁判员</label>
                                        <input
                                            type="text"
                                            value={editForm.referee}
                                            onChange={(e) => setEditForm({ ...editForm, referee: e.target.value })}
                                            className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38181]"
                                            placeholder="输入裁判员姓名"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">直播员</label>
                                        <input
                                            type="text"
                                            value={editForm.streamer}
                                            onChange={(e) => setEditForm({ ...editForm, streamer: e.target.value })}
                                            className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38181]"
                                            placeholder="输入直播员姓名"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">直播链接</label>
                                    <input
                                        type="url"
                                        value={editForm.streamLink}
                                        onChange={(e) => setEditForm({ ...editForm, streamLink: e.target.value })}
                                        className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38181]"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">回放链接</label>
                                    <input
                                        type="url"
                                        value={editForm.replayLink}
                                        onChange={(e) => setEditForm({ ...editForm, replayLink: e.target.value })}
                                        className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38181]"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">比赛链接</label>
                                    <input
                                        type="url"
                                        value={editForm.matchLink}
                                        onChange={(e) => setEditForm({ ...editForm, matchLink: e.target.value })}
                                        className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38181]"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">状态</label>
                                        <select
                                            value={editForm.status}
                                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Match['status'] })}
                                            className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38181]"
                                        >
                                            <option value="pending">等待中</option>
                                            <option value="ongoing">进行中</option>
                                            <option value="completed">已完成</option>
                                            <option value="cancelled">已取消</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">红方分数</label>
                                        <input
                                            type="number"
                                            value={editForm.redScore}
                                            onChange={(e) => setEditForm({ ...editForm, redScore: e.target.value })}
                                            className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38181]"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">蓝方分数</label>
                                        <input
                                            type="number"
                                            value={editForm.blueScore}
                                            onChange={(e) => setEditForm({ ...editForm, blueScore: e.target.value })}
                                            className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38181]"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedMatch(null);
                                    }}
                                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={updateMatch}
                                    className="flex-1 bg-[#F38181] text-white px-4 py-2 rounded-md hover:bg-[#95E1D3] transition-colors"
                                >
                                    保存修改
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}