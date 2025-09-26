"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserSession } from '@/lib/permissions';
import { UserPermissions } from '@/lib/permissions';
import { getUserPermissions } from '@/lib/permissions';
import MatchScheduleSystem from '@/app/components/MatchScheduleSystem';
import MessageNotification from '@/app/components/MessageNotification';
import localFont from "next/font/local";
import Link from 'next/link';
import Image from 'next/image';
import { TournamentRegistration } from '@/lib/mysql-registrations';
import { usePageTitle } from '@/lib/usePageTitle';

const audiowide = localFont({
    src: "../components/font/Audiowide-Regular.ttf",
    display: "auto",
});

export default function AdminPage() {
    const router = useRouter();
    usePageTitle('/schedulemanagement');
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
    const [activeTab, setActiveTab] = useState('overview');

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

    // 删除用户注册
    const handleDeleteRegistration = async (osuId: string, username: string) => {
        if (!confirm(`确定要删除用户 ${username} (ID: ${osuId}) 的注册信息吗？此操作不可撤销！`)) {
            return;
        }

        try {
            setProcessingUser(osuId);
            const response = await fetch('/api/admin/delete-registration', {
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
                alert(`删除失败: ${data.error}`);
            }
        } catch (error) {
            console.error('Error deleting registration:', error);
            alert('删除用户注册信息时发生错误');
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
                            : '您没有权限访问管理比赛安排页面'
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
        <div className="flex h-screen bg-[#1a1a1a]">
            {/* 侧边栏 */}
            <div className="w-64 bg-[#2d2d2d] border-r border-[#404040] flex flex-col">
                {/* 头部信息 */}
                <div className="p-6 border-b border-[#404040]">
                    <div className="flex items-center mb-4">
                        <img
                            src={user.avatar_url}
                            alt={user.username}
                            width={40}
                            height={40}
                            className="rounded-full outline outline-2 outline-[#E93B66] mr-3"
                            onError={(e) => {
                                e.currentTarget.src = '/default-avatar.png';
                            }}
                        />
                        <div>
                            <h3 className="text-white font-medium text-sm">{user.username}</h3>
                            <p className="text-gray-400 text-xs">管理员</p>
                        </div>
                    </div>
                </div>

                {/* 导航菜单 */}
                <nav className="flex-1 p-4">
                    <div className="space-y-2">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`w-full flex items-center px-4 py-3 text-left transition-colors duration-200 ${activeTab === 'overview'
                                    ? 'bg-[#E93B66] text-white border-r-4 border-[#3BE9D8]'
                                    : 'text-gray-300 hover:bg-[#3a3a3a] hover:text-white'
                                }`}
                        >
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                            概览
                        </button>

                        <button
                            onClick={() => setActiveTab('matches')}
                            className={`w-full flex items-center px-4 py-3 text-left transition-colors duration-200 ${activeTab === 'matches'
                                    ? 'bg-[#E93B66] text-white border-r-4 border-[#3BE9D8]'
                                    : 'text-gray-300 hover:bg-[#3a3a3a] hover:text-white'
                                }`}
                        >
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            比赛管理
                        </button>

                        <button
                            onClick={() => setActiveTab('users')}
                            className={`w-full flex items-center px-4 py-3 text-left transition-colors duration-200 ${activeTab === 'users'
                                    ? 'bg-[#E93B66] text-white border-r-4 border-[#3BE9D8]'
                                    : 'text-gray-300 hover:bg-[#3a3a3a] hover:text-white'
                                }`}
                        >
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            用户管理
                        </button>

                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`w-full flex items-center px-4 py-3 text-left transition-colors duration-200 ${activeTab === 'settings'
                                    ? 'bg-[#E93B66] text-white border-r-4 border-[#3BE9D8]'
                                    : 'text-gray-300 hover:bg-[#3a3a3a] hover:text-white'
                                }`}
                        >
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                            </svg>
                            系统设置
                        </button>
                    </div>
                </nav>

                {/* 底部登出按钮 */}
                <div className="p-4 border-t border-[#404040]">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 text-left text-gray-300 hover:bg-[#3a3a3a] hover:text-white transition-colors duration-200"
                    >
                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                        </svg>
                        登出
                    </button>
                </div>
            </div>

            {/* 主内容区域 */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* 顶部标题栏 */}
                <header className="bg-[#2d2d2d] border-b border-[#404040] px-6 py-4">
                    <h1 className="text-2xl font-bold text-white">
                        {activeTab === 'overview' && '管理概览'}
                        {activeTab === 'matches' && '比赛管理'}
                        {activeTab === 'users' && '用户管理'}
                        {activeTab === 'settings' && '系统设置'}
                    </h1>
                </header>

                {/* 内容区域 */}
                <main className="flex-1 overflow-y-auto p-6 bg-[#1a1a1a]">
                    {/* 概览页面 */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* 管理员信息卡片 */}
                            <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
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
                                            <span className="px-3 py-1 bg-[#E93B66] text-white text-sm border-b-2 border-[#E93B66]">
                                                管理员
                                            </span>
                                            {permissions.isMapSelector && (
                                                <span className="px-3 py-1 bg-blue-600 text-white text-sm border-b-2 border-blue-600">
                                                    选图组
                                                </span>
                                            )}
                                            {permissions.isReplayTester && (
                                                <span className="px-3 py-1 bg-green-600 text-white text-sm border-b-2 border-green-600">
                                                    测图组
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 数据统计 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                                    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                                        <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                                        注册玩家
                                    </h4>
                                    <div className="text-3xl font-bold text-[#3BE9D8]">{registrations.length}</div>
                                    <p className="text-gray-400 text-sm mt-2">总注册人数</p>
                                </div>

                                <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                                    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                                        <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                                        活跃房间
                                    </h4>
                                    <div className="text-3xl font-bold text-[#3BE9D8]">-</div>
                                    <p className="text-gray-400 text-sm mt-2">当前活跃比赛房间</p>
                                </div>

                                <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                                    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                                        <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                                        系统状态
                                    </h4>
                                    <div className="text-3xl font-bold text-green-400">正常</div>
                                    <p className="text-gray-400 text-sm mt-2">系统运行状态</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 比赛管理页面 */}
                    {activeTab === 'matches' && (
                        <div className="space-y-6">
                            {/* 比赛预约系统管理 */}
                            <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                    <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                                    比赛预约系统管理
                                </h3>
                                <div className="bg-[#3D3D3D80] p-4 border border-gray-600">
                                    <MatchScheduleSystem userOsuId={user.osuId} isAdmin={permissions.isAdmin} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 用户管理页面 */}
                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            {/* 用户注册审核管理 */}
                            <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                    <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                                    用户注册审核管理
                                </h3>
                                <div className="bg-[#3D3D3D80] p-4 border border-gray-600">
                                    <div className="mb-4">
                                        <button
                                            onClick={fetchRegistrations}
                                            disabled={registrationsLoading}
                                            className="bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-6 py-3 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
                                                    <div key={player.osuId} className="bg-[#3D3D3D80] border border-gray-600 p-4 hover:border-[#3BE9D8] transition-colors duration-200">
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
                                                                        className="bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-4 py-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                                                    >
                                                                        {processingUser === player.osuId ? '审核中...' : '审核通过'}
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDeleteRegistration(player.osuId, player.username)}
                                                                    disabled={processingUser === player.osuId}
                                                                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                                                >
                                                                    {processingUser === player.osuId ? '删除中...' : '删除用户'}
                                                                </button>
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
                    )}

                    {/* 系统设置页面 */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                    <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                                    系统设置
                                </h3>
                                <div className="bg-[#3D3D3D80] p-4 border border-gray-600">
                                    <p className="text-gray-400">系统设置功能开发中...</p>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}