"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import localFont from "next/font/local";

const audiowide = localFont({
    src: '../../font/Audiowide-Regular.ttf',
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
    player1_avatar_url?: string;
    player2_osuId: string;
    player2_username: string;
    player2_avatar_url?: string;
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
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showMatchupModal, setShowMatchupModal] = useState(false);
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
                setShowRoomModal(false);
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
                setShowMatchupModal(false);
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
                                            <Image
                                                src={schedule.player1_avatar_url}
                                                alt={`${schedule.player1_username} avatar`}
                                                width={40}
                                                height={40}
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
                                            <Image
                                                src={schedule.player2_avatar_url}
                                                alt={`${schedule.player2_username} avatar`}
                                                width={40}
                                                height={40}
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
        </div>
    );
}