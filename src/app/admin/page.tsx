"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserSession } from '@/lib/session';
import { UserPermissions } from '@/lib/permissions';
import { getUserPermissions } from '@/lib/permissions';
import MatchScheduleSystem from '@/app/components/MatchScheduleSystem';
import MessageNotification from '@/app/components/MessageNotification';
import localFont from "next/font/local";
import Link from 'next/link';
import Image from 'next/image';
import { TournamentRegistration } from '@/lib/edge-registrations';

const audiowide = localFont({
    src: "../components/font/Audiowide-Regular.ttf",
    display: "auto",
});

export default function AdminPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserSession | null>(null);
    const [permissions, setPermissions] = useState<UserPermissions>({
        isMapSelector: false,
        isReplayTester: false,
        isAdmin: false
    });
    const [loading, setLoading] = useState(true);
    const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
    const [registrationsLoading, setRegistrationsLoading] = useState(false);
    const [processingUser, setProcessingUser] = useState<string | null>(null);

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

                // 检查管理员权限
                if (!userPermissions.isAdmin) {
                    alert('需要管理员权限');
                    router.push('/player-info');
                    return;
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

    // 获取注册用户列表
    const fetchRegistrations = async () => {
        try {
            setRegistrationsLoading(true);
            const response = await fetch('/api/edge-registrations');

            if (!response.ok) {
                throw new Error('Failed to fetch registrations');
            }

            const data = await response.json();
            setRegistrations(data.registrations || []);
        } catch (error) {
            console.error('Error fetching registrations:', error);
            alert('获取注册数据失败');
        } finally {
            setRegistrationsLoading(false);
        }
    };

    // 审核通过用户注册
    const handleApproveRegistration = async (osuId: string, username: string) => {
        if (!confirm(`确定要审核通过用户 ${username} (ID: ${osuId}) 的注册信息吗？`)) {
            return;
        }

        try {
            setProcessingUser(osuId);
            const response = await fetch('/api/admin/approve-registration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ osuId }),
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);
                // 刷新注册列表
                fetchRegistrations();
            } else {
                alert(`审核失败: ${data.error}`);
            }
        } catch (error) {
            console.error('Error approving registration:', error);
            alert('审核用户注册信息时发生错误');
        } finally {
            setProcessingUser(null);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">加载中...</div>
            </div>
        );
    }

    if (!user || !permissions.isAdmin) {
        return (
            <div className="min-h-screen from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">无权限访问</div>
            </div>
        );
    }

    return (
        <div className={`${audiowide.className} min-h-screen from-gray-900 via-gray-800 to-gray-900`}>
            {/* Header */}
            <div className="bg-black/20 backdrop-blur-sm border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link href="/" className="flex items-center space-x-2">
                                <Image src='/AstaraCup.svg' alt='AstataCup' width={150} height={60} />
                            </Link>
                            <h1 className="text-2xl font-bold text-white">管理员面板</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <MessageNotification />
                            <Link
                                href="/player-info"
                                className="text-gray-300 hover:text-white transition-colors duration-200"
                            >
                                返回个人中心
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 shadow-2xl">
                    {/* 管理员信息 */}
                    <div className="flex items-center mb-8 pb-6 border-b border-gray-600">
                        <img
                            src={user.avatar_url}
                            alt={user.username}
                            width={80}
                            height={80}
                            className="rounded-full outline outline-2 outline-[#E93B66] mr-6"
                            onError={(e) => {
                                e.currentTarget.src = '/default-avatar.png';
                            }}
                        />
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold text-white mb-2">管理员: {user.username}</h2>
                            <div className="flex flex-wrap gap-3">
                                <span className="px-4 py-2 bg-red-600 text-white text-lg rounded-lg">
                                    管理员
                                </span>
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
                    </div>

                    {/* 比赛预约系统管理 */}
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-white mb-4">比赛预约系统管理</h3>
                        <div className="bg-gray-700/50 rounded-lg p-6">
                            <MatchScheduleSystem userOsuId={user.osuId} isAdmin={permissions.isAdmin} />
                        </div>
                    </div>

                    {/* 用户注册审核管理 */}
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-white mb-4">用户注册审核管理</h3>
                        <div className="bg-gray-700/50 rounded-lg p-6">
                            <div className="mb-4">
                                <button
                                    onClick={fetchRegistrations}
                                    disabled={registrationsLoading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {registrationsLoading ? '加载中...' : '获取待审核用户列表'}
                                </button>
                            </div>

                            {registrationsLoading && (
                                <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-2 text-sm text-gray-400">正在加载注册数据...</p>
                                </div>
                            )}

                            {registrations.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-lg font-medium text-white mb-3">
                                        注册用户列表 ({registrations.length} 人)
                                    </h4>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {registrations.map((player) => (
                                            <div key={player.osuId} className="bg-gray-600 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <img
                                                            src={player.avatar_url}
                                                            alt={player.username}
                                                            width={40}
                                                            height={40}
                                                            className="rounded-full"
                                                            onError={(e) => {
                                                                e.currentTarget.src = '/default-avatar.png';
                                                            }}
                                                        />
                                                        <div>
                                                            <h4 className="font-medium text-white">{player.username}</h4>
                                                            <p className="text-sm text-gray-400">ID: {player.osuId}</p>
                                                            <p className="text-sm text-gray-400">
                                                                PP: {Math.round(player.pp).toLocaleString()} |
                                                                排名: {player.global_rank ? `#${player.global_rank.toLocaleString()}` : '未排名'}
                                                            </p>
                                                            <p className={`text-xs ${player.approved ? 'text-green-400' : 'text-yellow-400'}`}>
                                                                {player.approved ? '✓ 已审核通过' : '⏳ 待审核'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col space-y-2">
                                                        {!player.approved && (
                                                            <button
                                                                onClick={() => handleApproveRegistration(player.osuId, player.username)}
                                                                disabled={processingUser === player.osuId}
                                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {processingUser === player.osuId ? '审核中...' : '审核通过'}
                                                            </button>
                                                        )}
                                                        <p className="text-xs text-gray-500 text-center">
                                                            {new Date(player.registeredAt).toLocaleString('zh-CN')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {registrations.length === 0 && !registrationsLoading && (
                                <div className="text-center py-4 text-gray-400">
                                    <p>暂无注册用户数据，点击上方按钮获取</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 其他管理功能 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gray-700/50 rounded-lg p-6">
                            <h4 className="text-lg font-bold text-white mb-4">快速操作</h4>
                            <div className="space-y-3">
                                <Link
                                    href="/map-selection"
                                    className="block w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-center"
                                >
                                    图池管理
                                </Link>
                                <Link
                                    href="/replay-collection"
                                    className="block w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-center"
                                >
                                    回放管理
                                </Link>
                            </div>
                        </div>

                        <div className="bg-gray-700/50 rounded-lg p-6">
                            <h4 className="text-lg font-bold text-white mb-4">数据统计</h4>
                            <div className="space-y-2 text-gray-300">
                                <p>注册玩家: 加载中...</p>
                                <p>活跃房间: 加载中...</p>
                                <p>待处理预约: 加载中...</p>
                            </div>
                        </div>

                        <div className="bg-gray-700/50 rounded-lg p-6">
                            <h4 className="text-lg font-bold text-white mb-4">系统状态</h4>
                            <div className="space-y-2 text-gray-300">
                                <p>服务器状态: <span className="text-green-400">正常</span></p>
                                <p>数据库连接: <span className="text-green-400">正常</span></p>
                                <p>最后更新: 刚刚</p>
                            </div>
                        </div>
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