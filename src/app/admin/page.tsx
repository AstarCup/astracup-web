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
            <div className="flex flex-col items-center justify-center min-h-screen relative">
                <div className="fixed inset-0 z-0">
                    <Image
                        src="/background-parallax.svg"
                        alt="background"
                        fill
                        className="object-cover opacity-20"
                    />
                </div>
                <div className="relative z-10 bg-[#3D3D3D] border-b-4 border-[#E93B66]  p-8 text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#E93B66] mx-auto mb-4"></div>
                    <div className="text-white text-xl font-medium">加载中...</div>
                </div>
            </div>
        );
    }

    if (!user || !permissions.isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen relative">
                <div className="fixed inset-0 z-0">
                    <Image
                        src="/background-parallax.svg"
                        alt="background"
                        fill
                        className="object-cover opacity-20"
                    />
                </div>
                <div className="relative z-10 bg-[#3D3D3D] border-b-4 border-[#E93B66]  p-8 text-center max-w-md">
                    <div className="text-red-400 text-2xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-white mb-4">
                        {!user ? '请先登录' : '权限不足'}
                    </h1>
                    <p className="text-gray-300 mb-6">
                        {!user
                            ? '您需要登录后才能访问此页面'
                            : '您没有权限访问管理员面板'
                        }
                    </p>
                    <Link
                        href="/"
                        className="inline-block bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-6 py-3  transition-colors duration-200 font-medium"
                    >
                        返回首页
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center relative min-h-screen">
            {/* 背景 */}
            <div className="fixed inset-0 z-0">
                <Image
                    src="/background-parallax.svg"
                    alt="background"
                    fill
                    className="object-cover opacity-20"
                />
            </div>

            {/* Header */}
            <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-4 mb-6">
                <div className="bg-[#3D3D3D80] backdrop-blur-sm border-b-4 border-[#E93B66]  p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link href="/" className="flex items-center space-x-2">
                                <Image src='/AstaraCup.svg' alt='AstataCup' width={120} height={48} />
                            </Link>
                            <h1 className={`${audiowide.className} text-2xl font-bold text-white`}>管理员面板</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <MessageNotification />
                            <Link
                                href="/player-info"
                                className="text-gray-300 hover:text-[#3BE9D8] transition-colors duration-200 px-3 py-2 rounded hover:bg-[#3BE9D8]/20"
                            >
                                返回个人中心
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 左侧主要内容 */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* 管理员信息卡片 */}
                        <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66]  p-6">
                            <div className="flex items-center mb-4">
                                <img
                                    src={user.avatar_url}
                                    alt={user.username}
                                    width={60}
                                    height={60}
                                    className="rounded-full outline outline-2 outline-[#E93B66] mr-4"
                                    onError={(e) => {
                                        e.currentTarget.src = '/default-avatar.png';
                                    }}
                                />
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-white mb-2">管理员: {user.username}</h2>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-[#E93B66] text-white text-sm  border-b-2 border-[#E93B66]">
                                            管理员
                                        </span>
                                        {permissions.isMapSelector && (
                                            <span className="px-3 py-1 bg-blue-600 text-white text-sm  border-b-2 border-blue-600">
                                                选图组
                                            </span>
                                        )}
                                        {permissions.isReplayTester && (
                                            <span className="px-3 py-1 bg-green-600 text-white text-sm  border-b-2 border-green-600">
                                                测图组
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 比赛预约系统管理 */}
                        <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66]  p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                                比赛预约系统管理
                            </h3>
                            <div className="bg-[#3D3D3D80]  p-4 border border-gray-600">
                                <MatchScheduleSystem userOsuId={user.osuId} isAdmin={permissions.isAdmin} />
                            </div>
                        </div>

                        {/* 用户注册审核管理 */}
                        <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66]  p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                                用户注册审核管理
                            </h3>
                            <div className="bg-[#3D3D3D80]  p-4 border border-gray-600">
                                <div className="mb-4">
                                    <button
                                        onClick={fetchRegistrations}
                                        disabled={registrationsLoading}
                                        className="bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-6 py-3  transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        {registrationsLoading ? (
                                            <div className="flex items-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                加载中...
                                            </div>
                                        ) : '获取待审核用户列表'}
                                    </button>
                                </div>

                                {registrationsLoading && (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#E93B66] mx-auto mb-4"></div>
                                        <p className="text-gray-400">正在加载注册数据...</p>
                                    </div>
                                )}

                                {registrations.length > 0 && (
                                    <div className="mt-6">
                                        <h4 className="text-lg font-medium text-white mb-4">
                                            注册用户列表 ({registrations.length} 人)
                                        </h4>
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {registrations.map((player) => (
                                                <div key={player.osuId} className="bg-[#3D3D3D80] border border-gray-600  p-4 hover:border-[#3BE9D8] transition-colors duration-200">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <img
                                                                src={player.avatar_url}
                                                                alt={player.username}
                                                                width={40}
                                                                height={40}
                                                                className="rounded-full outline outline-1 outline-[#E93B66]"
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
                                                                <p className={`text-xs font-medium ${player.approved ? 'text-green-400' : 'text-yellow-400'}`}>
                                                                    {player.approved ? '✓ 已审核通过' : '⏳ 待审核'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end space-y-2">
                                                            {!player.approved && (
                                                                <button
                                                                    onClick={() => handleApproveRegistration(player.osuId, player.username)}
                                                                    disabled={processingUser === player.osuId}
                                                                    className="bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-4 py-2  transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                                                >
                                                                    {processingUser === player.osuId ? '审核中...' : '审核通过'}
                                                                </button>
                                                            )}
                                                            <p className="text-xs text-gray-500 text-right">
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
                                    <div className="text-center py-8 text-gray-400">
                                        <p>暂无注册用户数据，点击上方按钮获取</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 右侧边栏 */}
                    <div className="space-y-6">
                        {/* 快速操作 */}
                        <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66]  p-6">
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                                <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                                快速操作
                            </h4>
                            <div className="space-y-3">
                                <Link
                                    href="/map-selection"
                                    className="block w-full bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-4 py-3  transition-colors duration-200 text-center font-medium border-b-2 border-[#E93B66] hover:border-[#3BE9D8]"
                                >
                                    图池管理
                                </Link>
                                <Link
                                    href="/replay-collection"
                                    className="block w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-3  transition-colors duration-200 text-center font-medium border-b-2 border-purple-600 hover:border-purple-500"
                                >
                                    回放管理
                                </Link>
                                <Link
                                    href="/debug"
                                    className="block w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-3  transition-colors duration-200 text-center font-medium border-b-2 border-gray-600 hover:border-gray-500"
                                >
                                    调试面板
                                </Link>
                            </div>
                        </div>

                        {/* 数据统计 */}
                        <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66]  p-6">
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                                <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                                数据统计
                            </h4>
                            <div className="space-y-3 text-gray-300">
                                <div className="flex justify-between items-center">
                                    <span>注册玩家:</span>
                                    <span className="text-[#3BE9D8] font-medium">{registrations.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>活跃房间:</span>
                                    <span className="text-[#3BE9D8] font-medium">-</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>待处理预约:</span>
                                    <span className="text-[#3BE9D8] font-medium">-</span>
                                </div>
                            </div>
                        </div>

                        {/* 系统状态 */}
                        <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66]  p-6">
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                                <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                                系统状态
                            </h4>
                            <div className="space-y-3 text-gray-300">
                                <div className="flex justify-between items-center">
                                    <span>服务器状态:</span>
                                    <span className="text-green-400 font-medium">正常</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>数据库连接:</span>
                                    <span className="text-green-400 font-medium">正常</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>最后更新:</span>
                                    <span className="text-[#3BE9D8] font-medium">刚刚</span>
                                </div>
                            </div>
                        </div>

                        {/* 登出按钮 */}
                        <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66]  p-6">
                            <button
                                onClick={handleLogout}
                                className="w-full bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-6 py-3  transition-colors duration-200 font-medium text-lg border-b-2 border-[#E93B66] hover:border-[#3BE9D8]"
                            >
                                登出
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}