"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserSession } from '@/lib/session';
import { UserPermissions } from '@/lib/permissions';
import { getUserPermissions } from '@/lib/permissions';
import MatchScheduleSystem from '@/app/components/MatchScheduleSystem';
import MessageNotification from '@/app/components/MessageNotification';
import localFont from "next/font/local";
import { MatchRoom } from '@/lib/mysql-registrations';
import Link from 'next/link';
import Image from 'next/image';

const audiowide = localFont({
    src: "../components/font/Audiowide-Regular.ttf",
    display: "auto",
});

interface Registration {
    osuId: string;
    username: string;
    inGameName: string;
    timezone: string;
    availability: string;
    registeredAt: string;
    avatar_url: string;
    pp: number;
    global_rank: number;
    country_rank: number;
    country: string;
    approved: boolean;
    approvedAt: string | null;
}

interface NextMatch {
    id: number;
    opponent: {
        osuId: string;
        username: string;
        avatar_url: string | null;
    };
    status: 'available' | 'scheduled' | 'completed';
}

export default function PlayerInfoPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserSession | null>(null);
    const [permissions, setPermissions] = useState<UserPermissions>({
        isMapSelector: false,
        isReplayTester: false,
        isAdmin: false
    });
    const [registration, setRegistration] = useState<Registration | null>(null);
    const [nextMatch, setNextMatch] = useState<NextMatch | null>(null);
    const [requestingMatch, setRequestingMatch] = useState(false);
    const [availableRooms, setAvailableRooms] = useState<MatchRoom[]>([]);
    const [showRoomSelection, setShowRoomSelection] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // 获取用户session
                const sessionResponse = await fetch('/api/session/get');
                const sessionData = await sessionResponse.json();

                if (!sessionData.success || !sessionData.session) {
                    router.push('/register');
                    return;
                }

                setUser(sessionData.session);

                // 获取用户权限
                const userPermissions = await getUserPermissions(sessionData.session.osuId.toString());
                setPermissions(userPermissions);

                // 获取注册信息
                const registrationResponse = await fetch(`/api/user-registration?osuId=${sessionData.session.osuId}`);
                if (registrationResponse.ok) {
                    const registrationData = await registrationResponse.json();
                    setRegistration(registrationData.registration);
                }

                // 获取下一轮对战信息
                const nextMatchResponse = await fetch('/api/player-next-match');
                if (nextMatchResponse.ok) {
                    const nextMatchData = await nextMatchResponse.json();
                    setNextMatch(nextMatchData.nextMatch);
                }
            } catch (error) {
                console.error('Failed to fetch user data:', error);
                router.push('/register');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [router]);

    // 格式化日期函数
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        // 转换为东八区时间
        const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
        const cstTime = new Date(utcTime + (8 * 3600000));
        return cstTime.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const formatRank = (rank: number | null) => {
        if (rank === null) return "未排名";
        return `#${rank.toLocaleString()}`;
    };

    const handleRequestMatch = async () => {
        if (!nextMatch) return;

        try {
            // 获取所有房间
            const roomsResponse = await fetch('/api/match-rooms');
            const roomsData = await roomsResponse.json();

            if (roomsData.success) {
                setAvailableRooms(roomsData.rooms);
                setShowRoomSelection(true);
            } else {
                alert('获取房间列表失败');
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
            alert('获取房间列表时发生错误');
        }
    };

    const handleRoomSelect = async (roomId: number) => {
        if (!nextMatch) return;

        try {
            setRequestingMatch(true);
            setShowRoomSelection(false);

            const response = await fetch('/api/request-match', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    matchupId: nextMatch.id,
                    roomId: roomId
                }),
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);
                // 刷新下一轮对战信息
                const nextMatchResponse = await fetch('/api/player-next-match');
                if (nextMatchResponse.ok) {
                    const nextMatchData = await nextMatchResponse.json();
                    setNextMatch(nextMatchData.nextMatch);
                }
            } else {
                alert(`预约失败: ${data.error}`);
            }
        } catch (error) {
            console.error('Error requesting match:', error);
            alert('预约对战时发生错误');
        } finally {
            setRequestingMatch(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">加载中...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">未登录</div>
            </div>
        );
    }

    return (
        <div className={`${audiowide.className} min-h-screen from-gray-900 via-gray-800 to-gray-900`}>


            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 shadow-2xl">
                    {/* 用户基本信息 */}
                    <div className="flex items-center mb-8 pb-6 border-b border-gray-600">

                        <img
                            src={user.avatar_url}
                            alt={user.username}
                            width={80}
                            height={80}
                            className="rounded-full outline outline-2 outline-[#E93B66] ml-4 mr-6"
                            onError={(e) => {
                                e.currentTarget.src = '/default-avatar.png';
                            }}
                        />
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold text-white mb-2">{user.username}</h2>
                            <div className="grid grid-cols-2 gap-4 text-gray-300">
                                <div>
                                    <span className="font-medium">PP:</span> {user.pp?.toFixed(0) || 'N/A'}
                                </div>
                                <div>
                                    <span className="font-medium">全球排名:</span> {formatRank(user.global_rank)}
                                </div>
                                <div>
                                    <span className="font-medium">国家排名:</span> {formatRank(user.country_rank)}
                                </div>
                                <div>
                                    <span className="font-medium">国家:</span> {user.country || '未知'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 权限信息 */}
                    {(permissions.isMapSelector || permissions.isReplayTester || permissions.isAdmin) && (
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-white mb-4">权限组</h3>
                            <div className="flex flex-wrap gap-3">
                                {permissions.isAdmin && (
                                    <span className="px-4 py-2 bg-red-600 text-white text-lg rounded-lg">
                                        管理员
                                    </span>
                                )}
                                {permissions.isMapSelector && (
                                    <span className="px-4 py-2 bg-blue-600 text-white text-lg rounded-lg">
                                        选图组
                                    </span>
                                )}
                                {permissions.isReplayTester && (
                                    <span className="px-4 py-2 bg-green-600 text-white text-lg rounded-lg">
                                        测图组
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 注册信息 */}
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-white mb-4">注册信息</h3>
                        {registration ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                                <div>
                                    <span className="font-medium text-white">游戏内名称:</span> {registration.inGameName}
                                </div>
                                <div>
                                    <span className="font-medium text-white">时区:</span> {registration.timezone || '未设置'}
                                </div>
                                <div>
                                    <span className="font-medium text-white">注册时间:</span> {formatDate(registration.registeredAt)}
                                </div>
                                <div>
                                    <span className="font-medium text-white">审核状态:</span>
                                    <span className={registration.approved ? 'text-green-400' : 'text-yellow-400'}>
                                        {registration.approved ? '已通过' : '待审核'}
                                    </span>
                                </div>
                                {registration.approved && registration.approvedAt && (
                                    <div>
                                        <span className="font-medium text-white">审核时间:</span> {formatDate(registration.approvedAt)}
                                    </div>
                                )}
                                {registration.availability && (
                                    <div className="md:col-span-2">
                                        <span className="font-medium text-white">可用时间:</span> {registration.availability}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-400">未找到注册信息</p>
                        )}
                    </div>

                    {/* 下一轮对战信息 */}
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-white mb-4">下一轮对战</h3>
                        {nextMatch ? (
                            <div className="bg-gray-700/50 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-white">对战对手</h4>
                                        <p className="text-gray-300">与 {nextMatch.opponent.username} 的比赛</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${nextMatch.status === 'available' ? 'bg-green-600 text-white' :
                                            nextMatch.status === 'scheduled' ? 'bg-blue-600 text-white' :
                                                'bg-gray-600 text-white'
                                            }`}>
                                            {nextMatch.status === 'available' ? '可预约' :
                                                nextMatch.status === 'scheduled' ? '已预约' : '已完成'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center space-x-8">
                                    {/* 当前玩家 */}
                                    <div className="text-center">
                                        <img
                                            src={user.avatar_url}
                                            alt={user.username}
                                            width={60}
                                            height={60}
                                            className="rounded-full mx-auto mb-2 outline outline-2 outline-[#E93B66]"
                                            onError={(e) => {
                                                e.currentTarget.src = '/default-avatar.png';
                                            }}
                                        />
                                        <p className="text-white font-medium">{user.username}</p>
                                        <p className="text-gray-400 text-sm">你</p>
                                    </div>

                                    {/* VS */}
                                    <div className="text-white text-2xl font-bold">VS</div>

                                    {/* 对手 */}
                                    <div className="text-center">
                                        <img
                                            src={nextMatch.opponent.avatar_url || '/default-avatar.png'}
                                            alt={nextMatch.opponent.username}
                                            width={60}
                                            height={60}
                                            className="rounded-full mx-auto mb-2 outline outline-2 outline-[#3BE9D8]"
                                            onError={(e) => {
                                                e.currentTarget.src = '/default-avatar.png';
                                            }}
                                        />
                                        <p className="text-white font-medium">{nextMatch.opponent.username}</p>
                                        <p className="text-gray-400 text-sm">对手</p>
                                    </div>
                                </div>

                                {nextMatch.status === 'available' && (
                                    <div className="mt-4 text-center">
                                        <button
                                            className="bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={handleRequestMatch}
                                            disabled={requestingMatch}
                                        >
                                            {requestingMatch ? '预约中...' : '预约对战'}
                                        </button>
                                    </div>
                                )}

                                {/* 房间选择界面 */}
                                {showRoomSelection && (
                                    <div className="mt-6">
                                        <h4 className="text-white font-medium mb-4 text-center">选择比赛房间</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                                            {availableRooms.map((room) => (
                                                <div
                                                    key={room.id}
                                                    className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-4 border border-gray-600 hover:border-[#E93B66] transition-colors cursor-pointer"
                                                    onClick={() => handleRoomSelect(room.id)}
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h5 className="text-white font-bold text-lg">{room.room_name}</h5>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${room.status === 'open' ? 'bg-green-600 text-white' :
                                                            room.status === 'full' ? 'bg-red-600 text-white' :
                                                                'bg-gray-600 text-white'
                                                            }`}>
                                                            {room.status === 'open' ? '可预约' :
                                                                room.status === 'full' ? '已满' : '关闭'}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-2 text-sm text-gray-300">
                                                        <div className="flex justify-between">
                                                            <span>轮次:</span>
                                                            <span className="text-white">第{room.round_number}轮</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>日期:</span>
                                                            <span className="text-white">{formatDate(room.match_date)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>时间:</span>
                                                            <span className="text-white">{room.match_time}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>房间号:</span>
                                                            <span className="text-white">{room.match_number}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>最多参与:</span>
                                                            <span className="text-white">{room.max_participants}人</span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        className="w-full mt-3 bg-[#E93B66] hover:bg-[#3BE9D8] text-white py-2 rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                        disabled={requestingMatch || room.status !== 'open'}
                                                    >
                                                        {requestingMatch ? '预约中...' : '选择此房间'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 text-center">
                                            <button
                                                onClick={() => setShowRoomSelection(false)}
                                                className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-lg transition-colors"
                                                disabled={requestingMatch}
                                            >
                                                取消选择
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        ) : (
                            <div className="bg-gray-700/50 rounded-lg p-6 text-center">
                                <p className="text-gray-400">暂无下一轮对战安排</p>
                            </div>
                        )}
                    </div>

                    {/* 比赛预约系统 */}
                    <div className="border-t border-gray-600 pt-8">
                        <MatchScheduleSystem userOsuId={user.osuId} isAdmin={false} />
                    </div>

                    {/* 登出按钮 */}
                    <div className="border-t border-gray-600 pt-8 mt-8">
                        <button
                            onClick={handleLogout}
                            className="w-full bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium text-lg"
                        >
                            登出
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}