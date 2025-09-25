"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserSession } from '@/lib/session';
import { UserPermissions } from '@/lib/permissions';
import { getUserPermissions } from '@/lib/permissions';
import MatchScheduleSystem from '@/app/components/MatchScheduleSystem';
import localFont from "next/font/local";
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

export default function PlayerInfoPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserSession | null>(null);
    const [permissions, setPermissions] = useState<UserPermissions>({
        isMapSelector: false,
        isReplayTester: false,
        isAdmin: false
    });
    const [registration, setRegistration] = useState<Registration | null>(null);
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
            } catch (error) {
                console.error('Failed to fetch user data:', error);
                router.push('/register');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [router]);

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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('zh-CN');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">加载中...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">未登录</div>
            </div>
        );
    }

    return (
        <div className={`${audiowide.className} min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900`}>
            {/* Header */}
            <div className="bg-black/20 backdrop-blur-sm border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link href="/" className="flex items-center space-x-2">
                                <Image src='/AstaraCup.svg' alt='AstataCup' width={150} height={60} />
                            </Link>
                            <h1 className="text-2xl font-bold text-white">玩家信息</h1>
                        </div>
                        <Link
                            href="/"
                            className="text-gray-300 hover:text-white transition-colors duration-200"
                        >
                            返回首页
                        </Link>
                    </div>
                </div>
            </div>

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
                            className="rounded-full outline outline-2 outline-[#E93B66] mr-6"
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

                    {/* 比赛预约系统 */}
                    <div className="border-t border-gray-600 pt-8">
                        <MatchScheduleSystem userOsuId={user.osuId} isAdmin={permissions.isAdmin} />
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