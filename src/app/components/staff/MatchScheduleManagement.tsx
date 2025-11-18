"use client";

import { useState, useEffect } from 'react';
import { showSuccess, showError } from '@/app/components/ui/Notification';
import Image from 'next/image';

interface MatchRoom {
    id: number;
    room_name: string;
    round_number: number;
    match_date: string;
    match_time: string;
    match_number: number;
    status: string;
}

interface MatchSchedule {
    id: number;
    room_id: number;
    player1_osuId: string;
    player1_username: string;
    player2_osuId: string;
    player2_username: string;
    red_score: number;
    blue_score: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    created_by: string;
    created_at: string;
    room?: MatchRoom;
}

interface UserInfo {
    id: number;
    username: string;
    avatar_url: string;
    country_code: string;
    pp: number;
    global_rank: number | null;
}

interface MatchScheduleManagementProps {
    userOsuId: string;
    isAdmin: boolean;
}

export default function MatchScheduleManagement({ userOsuId, isAdmin }: MatchScheduleManagementProps) {
    const [matchRooms, setMatchRooms] = useState<MatchRoom[]>([]);
    const [matchSchedules, setMatchSchedules] = useState<MatchSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);

    // 创建预约表单状态
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [player1Input, setPlayer1Input] = useState('');
    const [player2Input, setPlayer2Input] = useState('');
    const [player1Info, setPlayer1Info] = useState<UserInfo | null>(null);
    const [player2Info, setPlayer2Info] = useState<UserInfo | null>(null);
    const [fetchingPlayer1, setFetchingPlayer1] = useState(false);
    const [fetchingPlayer2, setFetchingPlayer2] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 获取比赛房间
            const roomsResponse = await fetch('/api/match-rooms');
            const roomsData = await roomsResponse.json();

            // 获取比赛预约
            const schedulesResponse = await fetch('/api/match-schedules');
            const schedulesData = await schedulesResponse.json();

            if (roomsData.success) {
                setMatchRooms(roomsData.rooms || []);
            }

            if (schedulesData.success) {
                // 调试日志：检查接收到的status字段
                // console.log('[DEBUG Frontend] Received schedules:', schedulesData.schedules);
                if (schedulesData.schedules && schedulesData.schedules.length > 0) {
                    schedulesData.schedules.forEach((schedule: any, index: number) => {
                        // console.log(`[DEBUG Frontend] Schedule ${index}: id=${schedule.id}, status=${schedule.status}, type=${typeof schedule.status}`);
                    });
                }
                setMatchSchedules(schedulesData.schedules || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            showError('获取数据失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSchedule = async () => {
        if (!selectedRoomId || !player1Info || !player2Info) {
            showError('请选择房间并填写选手信息');
            return;
        }

        try {
            setCreating(true);
            const response = await fetch('/api/match-schedules/admin-create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    room_id: selectedRoomId,
                    player1_osuId: player1Info.id.toString(),
                    player1_username: player1Info.username,
                    player2_osuId: player2Info.id.toString(),
                    player2_username: player2Info.username,
                    status: 'pending'
                }),
            });

            const data = await response.json();

            if (data.success) {
                showSuccess('比赛预约创建成功');
                setShowCreateModal(false);
                resetForm();
                fetchData(); // 刷新数据
            } else {
                showError(data.error || '创建失败');
            }
        } catch (error) {
            console.error('Error creating match schedule:', error);
            showError('创建失败');
        } finally {
            setCreating(false);
        }
    };

    const resetForm = () => {
        setSelectedRoomId(null);
        setPlayer1Input('');
        setPlayer2Input('');
        setPlayer1Info(null);
        setPlayer2Info(null);
    };

    const handleFetchUser = async (playerNumber: 1 | 2) => {
        const input = playerNumber === 1 ? player1Input : player2Input;
        if (!input.trim()) {
            showError('请输入用户ID');
            return;
        }

        try {
            if (playerNumber === 1) {
                setFetchingPlayer1(true);
            } else {
                setFetchingPlayer2(true);
            }

            const response = await fetch('/api/get-user-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: input.trim() }),
            });

            const data = await response.json();

            if (data.success) {
                if (playerNumber === 1) {
                    setPlayer1Info(data.user);
                } else {
                    setPlayer2Info(data.user);
                }
            } else {
                showError(data.error || '获取用户信息失败');
                if (playerNumber === 1) {
                    setPlayer1Info(null);
                } else {
                    setPlayer2Info(null);
                }
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
            showError('获取用户信息失败');
            if (playerNumber === 1) {
                setPlayer1Info(null);
            } else {
                setPlayer2Info(null);
            }
        } finally {
            if (playerNumber === 1) {
                setFetchingPlayer1(false);
            } else {
                setFetchingPlayer2(false);
            }
        }
    };

    const openCreateModal = () => {
        setShowCreateModal(true);
        resetForm();
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
        resetForm();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-600';
            case 'confirmed': return 'bg-blue-600';
            case 'completed': return 'bg-green-600';
            case 'cancelled': return 'bg-red-600';
            default: return 'bg-gray-600';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return '待确认';
            case 'confirmed': return '已确认';
            case 'completed': return '已完成';
            case 'cancelled': return '已取消';
            default: return status;
        }
    };

    const formatDateTime = (dateString: string, timeString: string) => {
        // 调试日志：检查输入参数
        // console.log('[DEBUG MatchSchedule] formatDateTime 输入:', { dateString, timeString });

        // 检查日期是否为空或无效
        if (!dateString || dateString === '0000-00-00' || dateString === 'Invalid Date' || dateString === 'null') {
            // console.log('[DEBUG MatchSchedule] 日期为空或无效，返回"时间未定"');
            return '时间未定';
        }

        try {
            let date: Date;

            // 检查是否是ISO格式的日期时间字符串（包含T和Z）
            if (dateString.includes('T') && dateString.includes('Z')) {
                // 解析ISO格式的日期，但使用timeString中的时间
                // console.log('[DEBUG MatchSchedule] 检测到ISO格式日期，解析日期部分:', dateString);

                // 提取日期部分（YYYY-MM-DD）
                const datePart = dateString.split('T')[0];

                // 使用timeString中的时间，如果没有则使用默认时间
                const time = timeString && timeString !== '00:00:00' && timeString !== 'Invalid Date' && timeString !== 'null' ? timeString : '00:00:00';

                // 创建新的日期时间字符串，使用北京时间（UTC+8）
                const dateTimeString = `${datePart}T${time}+08:00`;
                // console.log('[DEBUG MatchSchedule] 组合后的日期时间字符串:', dateTimeString);
                date = new Date(dateTimeString);
            } else {
                // 处理MySQL格式：DATE + TIME
                // 处理空时间的情况，MySQL TIME 类型可能返回 '00:00:00'
                const time = timeString && timeString !== '00:00:00' && timeString !== 'Invalid Date' && timeString !== 'null' ? timeString : '00:00:00';

                // 创建日期对象，MySQL DATE 格式为 'YYYY-MM-DD', TIME 格式为 'HH:MM:SS'
                const dateTimeString = `${dateString}T${time}+08:00`;
                // console.log('[DEBUG MatchSchedule] MySQL格式日期时间字符串:', dateTimeString);
                date = new Date(dateTimeString);
            }

            // 检查日期是否有效
            if (isNaN(date.getTime())) {
                console.warn('[DEBUG MatchSchedule] 无效的日期时间:', dateString, timeString);
                return '时间未定';
            }

            // 格式化日期时间，显示为中文格式
            const formattedDate = date.toLocaleString('zh-CN', {
                timeZone: 'Asia/Shanghai',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            // console.log('[DEBUG MatchSchedule] 格式化后的日期时间:', formattedDate);
            return formattedDate;
        } catch (error) {
            console.error('[DEBUG MatchSchedule] 日期格式化错误:', error, dateString, timeString);
            return '时间未定';
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                        比赛预约管理
                    </h3>
                    <div className="bg-[#3D3D3D80] p-4 border border-gray-600">
                        <div className="flex justify-center items-center py-8">
                            <Image src='/icons/loading.svg' alt='loading' width={120} height={120} className='animate-spin' />
                            <span className="ml-2 text-gray-400">加载中...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                        比赛预约管理
                    </h3>
                    {isAdmin && (
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2 bg-[#E93B66] text-white rounded-md hover:bg-[#d32f5a] flex items-center"
                        >
                            <span className="mr-2">+</span>
                            创建预约
                        </button>
                    )}
                </div>

                <div className="bg-[#3D3D3D80] p-6 border border-gray-600">
                    {/* 比赛预约列表 */}
                    {matchSchedules.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <p>暂无比赛预约</p>
                            {isAdmin && (
                                <p className="text-sm mt-2">点击右上角"创建预约"按钮来添加新的比赛预约</p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {matchSchedules.map((schedule) => (
                                <div key={schedule.id} className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-4 hover:border-[#E93B66] transition-colors duration-200">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="text-white font-semibold text-sm">
                                            {schedule.room?.room_name || `房间 ${schedule.room_id}`}
                                        </h4>
                                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(schedule.status)} text-white`}>
                                            {getStatusText(schedule.status)}
                                        </span>
                                    </div>

                                    <div className="text-xs text-gray-400 space-y-1 mb-3">
                                        <div>轮次: {schedule.room?.round_number} | 场次: {schedule.room?.match_number}</div>
                                        {schedule.room?.match_date && schedule.room?.match_time && (
                                            <div>时间: {formatDateTime(schedule.room.match_date, schedule.room.match_time)}</div>
                                        )}
                                    </div>

                                    <div className="text-sm text-white mb-3">
                                        <div className="flex justify-between items-center">
                                            <span>{schedule.player1_username}</span>
                                            <span className="mx-2">vs</span>
                                            <span>{schedule.player2_username}</span>
                                        </div>
                                        {schedule.red_score > 0 || schedule.blue_score > 0 ? (
                                            <div className="text-center text-xs text-gray-400 mt-1">
                                                比分: {schedule.red_score} - {schedule.blue_score}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="text-xs text-gray-500">
                                        创建者: {schedule.created_by}
                                        <br />
                                        创建时间: {new Date(schedule.created_at).toLocaleString('zh-CN')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 创建预约模态框 */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[#3D3D3D] border border-gray-600 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-4">创建比赛预约</h3>

                        <div className="space-y-4">
                            {/* 选择房间 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    选择房间 *
                                </label>
                                <select
                                    value={selectedRoomId || ''}
                                    onChange={(e) => setSelectedRoomId(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                                >
                                    <option value="">请选择房间</option>
                                    {matchRooms.map((room) => (
                                        <option key={room.id} value={room.id}>
                                            {room.room_name} (轮次 {room.round_number}, 场次 {room.match_number})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 选手1信息 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    选手1信息 *
                                </label>
                                <div className="space-y-2">
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={player1Input}
                                            onChange={(e) => setPlayer1Input(e.target.value)}
                                            className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                                            placeholder="输入选手1的用户ID"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleFetchUser(1);
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => handleFetchUser(1)}
                                            disabled={fetchingPlayer1 || !player1Input.trim()}
                                            className="px-4 py-2 bg-[#E93B66] text-white rounded-md hover:bg-[#d32f5a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                        >
                                            {fetchingPlayer1 && (
                                                <Image src='/icons/loading.svg' alt='loading' width={120} height={120} className='animate-spin' />
                                            )}
                                            获取
                                        </button>
                                    </div>

                                    {player1Info && (
                                        <div className="bg-[#2a2a2a] p-3 rounded-md border border-gray-600">
                                            <div className="flex items-center space-x-3">
                                                <img
                                                    src={player1Info.avatar_url}
                                                    alt={player1Info.username}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-white font-medium">{player1Info.username}</p>
                                                    <p className="text-gray-400 text-sm">
                                                        {player1Info.country_code} • {player1Info.pp.toFixed(0)}pp
                                                        {player1Info.global_rank && ` • #${player1Info.global_rank}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 选手2信息 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    选手2信息 *
                                </label>
                                <div className="space-y-2">
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={player2Input}
                                            onChange={(e) => setPlayer2Input(e.target.value)}
                                            className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                                            placeholder="输入选手2的用户ID"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleFetchUser(2);
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => handleFetchUser(2)}
                                            disabled={fetchingPlayer2 || !player2Input.trim()}
                                            className="px-4 py-2 bg-[#E93B66] text-white rounded-md hover:bg-[#d32f5a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                        >
                                            {fetchingPlayer2 && (
                                                <Image src='/icons/loading.svg' alt='loading' width={120} height={120} className='animate-spin' />
                                            )}
                                            获取
                                        </button>
                                    </div>

                                    {player2Info && (
                                        <div className="bg-[#2a2a2a] p-3 rounded-md border border-gray-600">
                                            <div className="flex items-center space-x-3">
                                                <img
                                                    src={player2Info.avatar_url}
                                                    alt={player2Info.username}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-white font-medium">{player2Info.username}</p>
                                                    <p className="text-gray-400 text-sm">
                                                        {player2Info.country_code} • {player2Info.pp.toFixed(0)}pp
                                                        {player2Info.global_rank && ` • #${player2Info.global_rank}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex space-x-2 pt-4">
                                <button
                                    onClick={handleCreateSchedule}
                                    disabled={creating || !selectedRoomId || !player1Info || !player2Info}
                                    className="flex-1 px-4 py-2 bg-[#E93B66] text-white rounded-md hover:bg-[#d32f5a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {creating && (
                                        <Image src='/icons/loading.svg' alt='loading' width={120} height={120} className='animate-spin' />
                                    )}
                                    {creating ? '创建中...' : '创建预约'}
                                </button>
                                <button
                                    onClick={closeCreateModal}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
                                >
                                    取消
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
