"use client";

import { useState, useEffect } from 'react';
import localFont from "next/font/local";

const audiowide = localFont({
    src: "./font/Audiowide-Regular.ttf",
    display: "auto",
});

interface MatchSchedule {
    id: number;
    round_number: number;
    match_date: string;
    match_time: string;
    match_number: number;
    player1_osuId: string;
    player1_username: string;
    player2_osuId: string;
    player2_username: string;
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
}

interface MatchScheduleSystemProps {
    userOsuId: string;
    isAdmin: boolean;
}

export default function MatchScheduleSystem({ userOsuId, isAdmin }: MatchScheduleSystemProps) {
    const [schedules, setSchedules] = useState<MatchSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        round_number: '',
        match_date: '',
        match_time: '',
        match_number: '',
        player1_osuId: '',
        player1_username: '',
        player2_osuId: '',
        player2_username: ''
    });

    useEffect(() => {
        fetchSchedules();
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
                setFormData({
                    round_number: '',
                    match_date: '',
                    match_time: '',
                    match_number: '',
                    player1_osuId: '',
                    player1_username: '',
                    player2_osuId: '',
                    player2_username: ''
                });
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

    const handleUpdateStatus = async (id: number, status: MatchSchedule['status']) => {
        try {
            const response = await fetch('/api/match-schedules/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
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

    const isUserInMatch = (schedule: MatchSchedule) => {
        return schedule.player1_osuId === userOsuId || schedule.player2_osuId === userOsuId;
    };

    if (loading) {
        return <div className="text-center py-4">加载中...</div>;
    }

    return (
        <div className={`${audiowide.className} space-y-4`}>
            {/* 标题和创建按钮 */}
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">比赛预约系统</h3>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-4 py-2 rounded-md transition-colors duration-200"
                >
                    {showCreateForm ? '取消' : '预约比赛'}
                </button>
            </div>

            {/* 创建预约表单 */}
            {showCreateForm && (
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-lg font-bold text-white mb-4">创建比赛预约</h4>
                    <form onSubmit={handleCreateSchedule} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    轮次
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.round_number}
                                    onChange={(e) => setFormData({ ...formData, round_number: e.target.value })}
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
                                    value={formData.match_number}
                                    onChange={(e) => setFormData({ ...formData, match_number: e.target.value })}
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
                                    value={formData.match_date}
                                    onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
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
                                    value={formData.match_time}
                                    onChange={(e) => setFormData({ ...formData, match_time: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    选手1 osu! ID
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.player1_osuId}
                                    onChange={(e) => setFormData({ ...formData, player1_osuId: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    选手1 用户名
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.player1_username}
                                    onChange={(e) => setFormData({ ...formData, player1_username: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    选手2 osu! ID
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.player2_osuId}
                                    onChange={(e) => setFormData({ ...formData, player2_osuId: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    选手2 用户名
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.player2_username}
                                    onChange={(e) => setFormData({ ...formData, player2_username: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors duration-200"
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-[#E93B66] hover:bg-[#3BE9D8] text-white rounded-md transition-colors duration-200"
                            >
                                创建预约
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* 预约列表 */}
            <div className="space-y-3">
                {schedules.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        暂无比赛预约
                    </div>
                ) : (
                    schedules.map((schedule) => (
                        <div key={schedule.id} className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="text-lg font-bold text-white">
                                        第{schedule.round_number}轮 - 场次{schedule.match_number}
                                    </h4>
                                    <p className="text-gray-300">
                                        {schedule.match_date} {schedule.match_time}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-sm rounded ${getStatusColor(schedule.status)}`}>
                                    {getStatusText(schedule.status)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <div className="text-center">
                                    <p className="text-sm text-gray-400">选手1</p>
                                    <p className="font-medium text-white">{schedule.player1_username}</p>
                                    {schedule.red_player_osuId === schedule.player1_osuId && (
                                        <span className="text-red-400 text-sm">红方</span>
                                    )}
                                    {schedule.blue_player_osuId === schedule.player1_osuId && (
                                        <span className="text-blue-400 text-sm">蓝方</span>
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-400">选手2</p>
                                    <p className="font-medium text-white">{schedule.player2_username}</p>
                                    {schedule.red_player_osuId === schedule.player2_osuId && (
                                        <span className="text-red-400 text-sm">红方</span>
                                    )}
                                    {schedule.blue_player_osuId === schedule.player2_osuId && (
                                        <span className="text-blue-400 text-sm">蓝方</span>
                                    )}
                                </div>
                            </div>

                            {schedule.status === 'completed' && (
                                <div className="text-center mb-3">
                                    <p className="text-lg font-bold">
                                        <span className="text-red-400">{schedule.red_score}</span>
                                        {' - '}
                                        <span className="text-blue-400">{schedule.blue_score}</span>
                                    </p>
                                </div>
                            )}

                            {/* 操作按钮 */}
                            <div className="flex justify-end space-x-2">
                                {isUserInMatch(schedule) && schedule.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleUpdateStatus(schedule.id, 'confirmed')}
                                            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-sm rounded transition-colors duration-200"
                                        >
                                            接受
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(schedule.id, 'cancelled')}
                                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-sm rounded transition-colors duration-200"
                                        >
                                            拒绝
                                        </button>
                                    </>
                                )}

                                {isAdmin && schedule.status === 'confirmed' && (
                                    <button
                                        onClick={() => handleUpdateStatus(schedule.id, 'completed')}
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors duration-200"
                                    >
                                        完成比赛
                                    </button>
                                )}
                            </div>

                            {/* 附加信息 */}
                            {(schedule.referee_username || schedule.commentator_username || schedule.replay_link || schedule.match_link) && (
                                <div className="mt-3 pt-3 border-t border-gray-600 text-sm text-gray-400">
                                    {schedule.referee_username && (
                                        <p>裁判: {schedule.referee_username}</p>
                                    )}
                                    {schedule.commentator_username && (
                                        <p>解说: {schedule.commentator_username}</p>
                                    )}
                                    {schedule.match_link && (
                                        <p>比赛链接: <a href={schedule.match_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">点击查看</a></p>
                                    )}
                                    {schedule.replay_link && (
                                        <p>回放链接: <a href={schedule.replay_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">点击查看</a></p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}