"use client";

import { useState, useEffect } from 'react';
import localFont from "next/font/local";

const audiowide = localFont({
    src: "./font/Audiowide-Regular.ttf",
    display: "auto",
});

interface MatchRoom {
    id: number;
    room_name: string;
    round_number: number;
    match_date: string;
    match_time: string;
    match_number: number;
    max_participants: number;
    status: 'open' | 'full' | 'closed';
    description?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

interface MatchSchedule {
    id: number;
    room_id: number;
    player1_osuId: string;
    player1_username: string;
    player1_avatar_url?: string;
    player2_osuId: string;
    player2_username: string;
    player2_avatar_url?: string;
    red_player_osuId?: string;
    blue_player_osuId?: string;
    red_score: number;
    blue_score: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    replay_link?: string;
    match_link?: string;
    referee_osuId?: string;
    referee_username?: string;
    commentator_osuId?: string;
    commentator_username?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    room?: MatchRoom;
}

interface ApprovedPlayer {
    osuId: string;
    username: string;
    inGameName: string;
    avatar_url: string;
    pp: number;
    global_rank: number;
    country_rank: number;
    country: string;
}

interface PlayerMatchup {
    id: number;
    room_id: number;
    player1_osuId: string;
    player1_username: string;
    player2_osuId: string;
    player2_username: string;
    status: 'available' | 'scheduled' | 'completed';
    created_by: string;
    created_at: string;
    updated_at: string;
    room?: MatchRoom;
}

interface MatchScheduleSystemProps {
    userOsuId: string;
    isAdmin: boolean;
}

export default function MatchScheduleSystem({ userOsuId, isAdmin }: MatchScheduleSystemProps) {
    const [schedules, setSchedules] = useState<MatchSchedule[]>([]);
    const [rooms, setRooms] = useState<MatchRoom[]>([]);
    const [matchups, setMatchups] = useState<PlayerMatchup[]>([]);
    const [approvedPlayers, setApprovedPlayers] = useState<ApprovedPlayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showRoomForm, setShowRoomForm] = useState(false);
    const [showMatchupForm, setShowMatchupForm] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [formData, setFormData] = useState({
        matchup_id: ''
    });
    const [roomFormData, setRoomFormData] = useState({
        room_name: '',
        round_number: '',
        match_date: '',
        match_time: '',
        match_number: '',
        max_participants: '2',
        description: ''
    });
    const [matchupFormData, setMatchupFormData] = useState({
        player1_osuId: '',
        player1_username: '',
        player2_osuId: '',
        player2_username: ''
    });

    useEffect(() => {
        fetchSchedules();
        fetchRooms();
        if (isAdmin) {
            fetchApprovedPlayers();
            fetchAllMatchups(); // 获取所有玩家对战列表
        }
    }, []);

    const fetchSchedules = async () => {
        try {
            const response = await fetch('/api/match-schedules');
            if (response.ok) {
                const data = await response.json();
                setSchedules(data.schedules || []);
            }
        } catch (error) {
            console.error('Failed to fetch schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRooms = async () => {
        try {
            const response = await fetch('/api/match-rooms');
            if (response.ok) {
                const data = await response.json();
                setRooms(data.rooms || []);
            }
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        }
    };

    const fetchAllMatchups = async () => {
        try {
            const response = await fetch('/api/player-matchups');
            if (response.ok) {
                const data = await response.json();
                setMatchups(data.matchups || []);
            }
        } catch (error) {
            console.error('Failed to fetch matchups:', error);
        }
    };

    const fetchApprovedPlayers = async () => {
        try {
            const response = await fetch('/api/approved-players');
            if (response.ok) {
                const data = await response.json();
                setApprovedPlayers(data.players || []);
            }
        } catch (error) {
            console.error('Failed to fetch approved players:', error);
        }
    };

    const handleCreateSchedule = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/match-schedules/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setShowCreateForm(false);
                setFormData({ matchup_id: '' });
                fetchSchedules();
                alert('比赛预约创建成功！');
            } else {
                const error = await response.json();
                alert(error.error || '创建失败');
            }
        } catch (error) {
            console.error('Failed to create schedule:', error);
            alert('创建失败');
        }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/match-rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roomFormData)
            });

            if (response.ok) {
                setShowRoomForm(false);
                setRoomFormData({
                    room_name: '',
                    round_number: '',
                    match_date: '',
                    match_time: '',
                    match_number: '',
                    max_participants: '2',
                    description: ''
                });
                fetchRooms();
                alert('比赛房间创建成功！');
            } else {
                const error = await response.json();
                alert(error.error || '创建失败');
            }
        } catch (error) {
            console.error('Error creating room:', error);
            alert('创建失败，请重试');
        }
    };

    const handleCreateMatchup = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/player-matchups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(matchupFormData)
            });

            if (response.ok) {
                setShowMatchupForm(false);
                setMatchupFormData({
                    player1_osuId: '',
                    player1_username: '',
                    player2_osuId: '',
                    player2_username: ''
                });
                fetchAllMatchups();
                alert('玩家对战创建成功！');
            } else {
                const error = await response.json();
                alert(error.error || '创建失败');
            }
        } catch (error) {
            console.error('Error creating matchup:', error);
            alert('创建失败，请重试');
        }
    };

    const handleDeleteRoom = async (roomId: number, roomName: string) => {
        if (!confirm(`确定要删除房间 "${roomName}" 吗？\n\n注意：删除房间将同时删除该房间的所有比赛预约！`)) {
            return;
        }

        try {
            const response = await fetch('/api/match-rooms/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: roomId })
            });

            if (response.ok) {
                fetchRooms();
                fetchSchedules();
                alert('房间删除成功！');
            } else {
                const error = await response.json();
                alert(error.error || '删除失败');
            }
        } catch (error) {
            console.error('Error deleting room:', error);
            alert('删除失败，请重试');
        }
    };

    const handleDeleteMatchup = async (matchupId: number, player1: string, player2: string) => {
        if (!confirm(`确定要删除对战 "${player1} vs ${player2}" 吗？`)) {
            return;
        }

        try {
            const response = await fetch('/api/player-matchups/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: matchupId })
            });

            if (response.ok) {
                fetchAllMatchups();
                alert('对战删除成功！');
            } else {
                const error = await response.json();
                alert(error.error || '删除失败');
            }
        } catch (error) {
            console.error('Error deleting matchup:', error);
            alert('删除失败，请重试');
        }
    };

    const handleUpdateStatus = async (scheduleId: number, status: MatchSchedule['status']) => {
        try {
            const response = await fetch('/api/match-schedules/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: scheduleId, status })
            });

            if (response.ok) {
                fetchSchedules();
                alert('更新成功！');
            } else {
                const error = await response.json();
                alert(error.error || '更新失败');
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('更新失败');
        }
    };

    const getStatusText = (status: MatchSchedule['status']) => {
        switch (status) {
            case 'pending': return '待确认';
            case 'confirmed': return '已确认';
            case 'completed': return '已完成';
            case 'cancelled': return '已取消';
            default: return status;
        }
    };

    const getStatusColor = (status: MatchSchedule['status']) => {
        switch (status) {
            case 'pending': return 'text-yellow-400';
            case 'confirmed': return 'text-green-400';
            case 'completed': return 'text-blue-400';
            case 'cancelled': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const getMatchupStatusText = (status: PlayerMatchup['status']) => {
        switch (status) {
            case 'available': return '可预约';
            case 'scheduled': return '已预约';
            case 'completed': return '已完成';
            default: return status;
        }
    };

    const getMatchupStatusColor = (status: PlayerMatchup['status']) => {
        switch (status) {
            case 'available': return 'text-green-400';
            case 'scheduled': return 'text-blue-400';
            case 'completed': return 'text-gray-400';
            default: return 'text-gray-400';
        }
    };

    const isUserInMatch = (schedule: MatchSchedule) => {
        return schedule.player1_osuId === userOsuId || schedule.player2_osuId === userOsuId;
    };

    const isUserInMatchup = (matchup: PlayerMatchup) => {
        return matchup.player1_osuId === userOsuId || matchup.player2_osuId === userOsuId;
    };

    if (loading) {
        return <div className="text-center py-4">加载中...</div>;
    }

    return (
        <div className={`${audiowide.className} space-y-4`}>
            {/* 标题和创建按钮 */}
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">比赛预约</h3>
            </div>

            {/* 管理员创建房间表单 */}
            {isAdmin && (
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">管理员功能</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowRoomForm(!showRoomForm)}
                            className="bg-[#3BE9D8] hover:bg-[#E93B66] text-white px-4 py-2 rounded-md transition-colors duration-200 text-sm"
                        >
                            {showRoomForm ? '取消创建房间' : '创建比赛房间'}
                        </button>
                        <button
                            onClick={() => setShowMatchupForm(!showMatchupForm)}
                            className="bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-4 py-2 rounded-md transition-colors duration-200 text-sm"
                        >
                            {showMatchupForm ? '取消创建对战' : '管理玩家对战'}
                        </button>
                    </div>
                </div>
            )}

            {/* 创建房间表单 */}
            {showRoomForm && isAdmin && (
                <div className="bg-gray-800 p-4 ">
                    <h4 className="text-lg font-bold text-white mb-4">创建比赛房间</h4>
                    <form onSubmit={handleCreateRoom} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                房间名称
                            </label>
                            <input
                                type="text"
                                required
                                value={roomFormData.room_name}
                                onChange={(e) => setRoomFormData({ ...roomFormData, room_name: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                placeholder="例如: 决赛房间A"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    轮次
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={roomFormData.round_number}
                                    onChange={(e) => setRoomFormData({ ...roomFormData, round_number: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    比赛场次
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={roomFormData.match_number}
                                    onChange={(e) => setRoomFormData({ ...roomFormData, match_number: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    最大参与人数
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="2"
                                    max="16"
                                    value={roomFormData.max_participants}
                                    onChange={(e) => setRoomFormData({ ...roomFormData, max_participants: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    比赛日期
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={roomFormData.match_date}
                                    onChange={(e) => setRoomFormData({ ...roomFormData, match_date: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    比赛时间
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={roomFormData.match_time}
                                    onChange={(e) => setRoomFormData({ ...roomFormData, match_time: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                房间描述（可选）
                            </label>
                            <textarea
                                value={roomFormData.description}
                                onChange={(e) => setRoomFormData({ ...roomFormData, description: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                rows={3}
                                placeholder="房间的额外说明信息..."
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-[#3BE9D8] hover:bg-[#E93B66] text-white px-4 py-2 rounded-md transition-colors duration-200"
                            >
                                创建房间
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowRoomForm(false)}
                                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md transition-colors duration-200"
                            >
                                取消
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* 创建对战表单 */}
            {showMatchupForm && isAdmin && (
                <div className="p-4 ">
                    <h4 className="text-lg font-bold text-white mb-4">创建玩家对战</h4>
                    <form onSubmit={handleCreateMatchup} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    选手1
                                </label>
                                <select
                                    required
                                    value={matchupFormData.player1_osuId}
                                    onChange={(e) => {
                                        const selectedPlayer = approvedPlayers.find(p => p.osuId === e.target.value);
                                        setMatchupFormData({
                                            ...matchupFormData,
                                            player1_osuId: e.target.value,
                                            player1_username: selectedPlayer?.inGameName || selectedPlayer?.username || ''
                                        });
                                    }}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                >
                                    <option value="">请选择选手1</option>
                                    {approvedPlayers.map(player => (
                                        <option key={player.osuId} value={player.osuId}>
                                            {player.inGameName || player.username} (ID: {player.osuId})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    选手1 用户名
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    value={matchupFormData.player1_username}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-md text-white cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    选手2
                                </label>
                                <select
                                    required
                                    value={matchupFormData.player2_osuId}
                                    onChange={(e) => {
                                        const selectedPlayer = approvedPlayers.find(p => p.osuId === e.target.value);
                                        setMatchupFormData({
                                            ...matchupFormData,
                                            player2_osuId: e.target.value,
                                            player2_username: selectedPlayer?.inGameName || selectedPlayer?.username || ''
                                        });
                                    }}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                >
                                    <option value="">请选择选手2</option>
                                    {approvedPlayers.map(player => (
                                        <option key={player.osuId} value={player.osuId}>
                                            {player.inGameName || player.username} (ID: {player.osuId})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    选手2 用户名
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    value={matchupFormData.player2_username}
                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-md text-white cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-4 py-2 rounded-md transition-colors duration-200"
                            >
                                创建对战
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowMatchupForm(false)}
                                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md transition-colors duration-200"
                            >
                                取消
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* 比赛预约列表 */}
            <div className="space-y-4">
                {schedules.length === 0 ? (
                    <div className="text-center py-8 text-white">
                        暂无比赛预约
                    </div>
                ) : (
                    schedules.map((schedule) => (
                        <div key={schedule.id} className="p-4 ">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="text-lg font-bold text-white">
                                        {schedule.room?.room_name || `房间 ${schedule.room_id}`}
                                    </h4>
                                    <p className="text-gray-400">
                                        第{schedule.room?.round_number || '?'}轮 - 场次{schedule.room?.match_number || '?'}
                                    </p>
                                    <p className="text-gray-400">
                                        {schedule.room?.match_date || '?'} {schedule.room?.match_time || '?'}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-sm rounded ${getStatusColor(schedule.status)}`}>
                                    {getStatusText(schedule.status)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-gray-700 p-3 rounded">
                                    <p className="text-sm text-gray-400">红方</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        {schedule.player1_avatar_url && (
                                            <img
                                                src={schedule.player1_avatar_url}
                                                alt={`${schedule.player1_username} avatar`}
                                                className="w-10 h-10 rounded-full border-2 border-red-500"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        )}
                                        <div>
                                            <p className="text-white font-medium">{schedule.player1_username}</p>
                                            <p className="text-xs text-gray-500">ID: {schedule.player1_osuId}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-700 p-3 rounded">
                                    <p className="text-sm text-gray-400">蓝方</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        {schedule.player2_avatar_url && (
                                            <img
                                                src={schedule.player2_avatar_url}
                                                alt={`${schedule.player2_username} avatar`}
                                                className="w-10 h-10 rounded-full border-2 border-blue-500"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        )}
                                        <div>
                                            <p className="text-white font-medium">{schedule.player2_username}</p>
                                            <p className="text-xs text-gray-500">ID: {schedule.player2_osuId}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex gap-2">
                                {isUserInMatch(schedule) && schedule.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleUpdateStatus(schedule.id, 'confirmed')}
                                            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
                                        >
                                            确认参加
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(schedule.id, 'cancelled')}
                                            className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm"
                                        >
                                            取消预约
                                        </button>
                                    </>
                                )}

                                {isAdmin && schedule.status === 'confirmed' && (
                                    <button
                                        onClick={() => handleUpdateStatus(schedule.id, 'completed')}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm"
                                    >
                                        标记完成
                                    </button>
                                )}

                                {isAdmin && (
                                    <button
                                        onClick={() => handleDeleteRoom(schedule.room_id, schedule.room?.room_name || `房间 ${schedule.room_id}`)}
                                        className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm"
                                    >
                                        删除房间
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 玩家对战列表（管理员可见） */}
            {isAdmin && matchups.length > 0 && (
                <div className="bg-gray-800 p-4 ">
                    <h4 className="text-lg font-bold text-white mb-4">
                        玩家对战列表
                    </h4>
                    <div className="space-y-2">
                        {matchups.map((matchup) => (
                            <div key={matchup.id} className="bg-gray-700 p-3 rounded flex justify-between items-center">
                                <div>
                                    <p className="text-white font-medium">
                                        {matchup.player1_username} vs {matchup.player2_username}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        ID: {matchup.player1_osuId} vs {matchup.player2_osuId}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 text-sm rounded ${getMatchupStatusColor(matchup.status)}`}>
                                        {getMatchupStatusText(matchup.status)}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteMatchup(matchup.id, matchup.player1_username, matchup.player2_username)}
                                        className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-sm"
                                        title="删除对战"
                                    >
                                        删除
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}