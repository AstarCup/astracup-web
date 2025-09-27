"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserSession } from '@/lib/permissions';
import { UserPermissions } from '@/lib/permissions';
import localFont from "next/font/local";
import Link from 'next/link';
import Image from 'next/image';
import { TournamentRegistration } from '@/lib/mysql-registrations';
import { usePageTitle } from '@/lib/usePageTitle';
import { showSuccess, showError } from '@/app/components/ui/Notification';
import OverviewManagement from '@/app/components/staff/OverviewManagement';
import RoomManagement from '@/app/components/staff/RoomManagement';
import MatchupManagement from '@/app/components/staff/MatchupManagement';
import StreamingManagement from '@/app/components/staff/StreamingManagement';
import UserManagement from '@/app/components/staff/UserManagement';
import MatchManagement from '@/app/components/staff/MatchManagement';
import SettingsManagement from '@/app/components/staff/SettingsManagement';
import ReplayCollectionManagement from '@/app/components/staff/ReplayCollectionManagement';
import MapSelectionManagement from '@/app/components/staff/MapSelectionManagement';

interface MatchRoom {
    id: number;
    room_name: string;
    round_number: number;
    match_date: string;
    match_time: string;
    match_number: number;
    max_participants: number;
    status: 'open' | 'closed' | 'in_progress';
    description: string;
    created_by: number;
    created_at: string;
    schedules?: {
        id: number;
        player1_osuId: number;
        player1_username: string;
        player1_avatar_url: string;
        player2_osuId: number;
        player2_username: string;
        player2_avatar_url: string;
        status: 'scheduled' | 'in_progress' | 'completed';
        scheduled_time: string;
    }[];
}

interface PlayerMatchup {
    id: number;
    player1_osuId: number;
    player1_username: string;
    player1_avatar_url: string;
    player2_osuId: number;
    player2_username: string;
    player2_avatar_url: string;
    status: 'available' | 'in_progress' | 'completed';
    created_by: number;
    created_at: string;
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

interface StaffRoomAssignment {
    id: number;
    room_id: number;
    staff_osuId: string;
    staff_username: string;
    staff_role: 'referee' | 'streamer' | 'commentator';
    status: 'pending' | 'confirmed' | 'declined';
    assigned_by: string;
    assigned_at: string;
    responded_at?: string | null;
    created_at: string;
    updated_at: string;
    room?: {
        id: number;
        room_name: string;
        round_number: number;
        match_date: string;
        match_time: string;
        match_number: number;
    };
    staff_avatar_url?: string;
    match_info?: {
        id: number;
        player1_username: string;
        player2_username: string;
        scheduled_time: string;
        red_score?: number;
        blue_score?: number;
        match_link?: string;
        replay_link?: string;
        stream_link?: string;
        status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    };
}

// 创建对战模态框组件

export default function AdminPage() {
    const router = useRouter();
    usePageTitle('/staff-dashboard');
    const [user, setUser] = useState<UserSession | null>(null);
    const [permissions, setPermissions] = useState<UserPermissions>({
        isMapSelector: false,
        isReplayTester: false,
        isAdmin: false,
        isStreamer: false,
        isReferee: false,
        isCommentator: false
    });
    const [permissionsLoading, setPermissionsLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
    const [registrationsLoading, setRegistrationsLoading] = useState(false);
    const [processingUser, setProcessingUser] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');

    console.log('[Staff Dashboard] 组件初始化，当前环境:', process.env.NODE_ENV);
    console.log('[Staff Dashboard] 初始状态:', {
        user: !!user,
        permissionsLoading,
        loading,
        permissions
    });

    // 房间管理状态
    const [rooms, setRooms] = useState<MatchRoom[]>([]);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);

    // 对战管理状态
    const [matchups, setMatchups] = useState<PlayerMatchup[]>([]);
    const [matchupsLoading, setMatchupsLoading] = useState(false);
    const [deletingMatchupId, setDeletingMatchupId] = useState<number | null>(null);

    // 已过审玩家状态
    const [approvedPlayers, setApprovedPlayers] = useState<ApprovedPlayer[]>([]);

    // Staff房间分配状态
    const [staffAssignments, setStaffAssignments] = useState<StaffRoomAssignment[]>([]);
    const [staffAssignmentsLoading, setStaffAssignmentsLoading] = useState(false);

    // 可供staff选择的房间状态
    const [availableRooms, setAvailableRooms] = useState<any[]>([]);
    const [availableRoomsLoading, setAvailableRoomsLoading] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                console.log('[Staff Dashboard] 开始获取用户数据');

                // 获取用户session
                const sessionResponse = await fetch('/api/session/get');
                const sessionData = await sessionResponse.json();

                if (!sessionData.success || !sessionData.session) {
                    console.log('[Staff Dashboard] Session获取失败:', sessionData);
                    router.push('/register');
                    return;
                }

                console.log('[Staff Dashboard] Session获取成功，用户ID:', sessionData.session.osuId);
                setUser(sessionData.session);

                // 获取用户权限
                setPermissionsLoading(true);
                console.log('[Staff Dashboard] 开始获取用户权限');
                try {
                    const permissionsResponse = await fetch(`/api/user-permissions?osuId=${sessionData.session.osuId}`);
                    if (permissionsResponse.ok) {
                        const userPermissions = await permissionsResponse.json();
                        console.log('[Staff Dashboard] 权限获取成功:', userPermissions);
                        setPermissions(userPermissions.permissions);
                        setPermissionsLoading(false);

                        // 检查是否有staff权限（管理员、裁判员、解说员或主播）
                        const hasStaffPermission = userPermissions.permissions.isAdmin || userPermissions.permissions.isReferee || userPermissions.permissions.isStreamer || userPermissions.permissions.isCommentator;
                        console.log('[Staff Dashboard] 权限检查结果:', {
                            isAdmin: userPermissions.permissions.isAdmin,
                            isReferee: userPermissions.permissions.isReferee,
                            isStreamer: userPermissions.permissions.isStreamer,
                            isCommentator: userPermissions.permissions.isCommentator,
                            hasStaffPermission
                        });

                        if (!hasStaffPermission) {
                            console.log('[Staff Dashboard] 权限不足，重定向到player-info');
                            showError('需要工作人员权限');
                            router.push('/player-info');
                            return;
                        }

                        console.log('[Staff Dashboard] 权限验证通过，继续加载页面');
                    } else {
                        console.log('[Staff Dashboard] 权限API请求失败:', permissionsResponse.status);
                        setPermissionsLoading(false);
                        showError('获取权限失败');
                        router.push('/player-info');
                        return;
                    }
                } catch (error) {
                    console.error('[Staff Dashboard] 获取权限时发生错误:', error);
                    setPermissionsLoading(false);
                    showError('获取权限失败');
                    router.push('/player-info');
                    return;
                }
            } catch (error) {
                console.error('[Staff Dashboard] 获取用户数据时发生错误:', error);
                router.push('/register');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [router]);

    // 权限验证：等待权限加载完成后进行验证
    useEffect(() => {
        console.log('[Staff Dashboard] 权限验证useEffect触发:', {
            permissionsLoading,
            user: user ? user.osuId : null,
            permissions
        });

        if (!permissionsLoading && user) {
            const hasStaffPermission = permissions.isAdmin || permissions.isReferee || permissions.isStreamer || permissions.isCommentator;
            console.log('[Staff Dashboard] 执行权限验证:', {
                hasStaffPermission,
                isAdmin: permissions.isAdmin,
                isReferee: permissions.isReferee,
                isStreamer: permissions.isStreamer,
                isCommentator: permissions.isCommentator
            });

            if (!hasStaffPermission) {
                console.log('[Staff Dashboard] 权限验证失败，重定向');
                showError('需要工作人员权限');
                router.push('/player-info');
            } else {
                console.log('[Staff Dashboard] 权限验证通过');
            }
        } else {
            console.log('[Staff Dashboard] 权限验证跳过 - 权限加载中或用户未加载');
        }
    }, [permissionsLoading, permissions, user, router]);

    // 当切换到房间管理选项卡时获取房间列表
    useEffect(() => {
        if (activeTab === 'rooms' && permissions.isAdmin) {
            fetchRooms();
        }
    }, [activeTab, permissions.isAdmin]);

    // 当切换到对战管理选项卡时获取对战列表和已过审玩家
    useEffect(() => {
        if (activeTab === 'matchups' && permissions.isAdmin) {
            fetchMatchups();
            fetchApprovedPlayers();
        }
    }, [activeTab, permissions.isAdmin]);

    // 当切换到用户管理选项卡时获取用户列表
    useEffect(() => {
        if (activeTab === 'users' && permissions.isAdmin) {
            fetchRegistrations();
        }
    }, [activeTab, permissions.isAdmin]);

    // 当切换到直播裁判选项卡时获取staff分配列表和可用房间
    useEffect(() => {
        if (activeTab === 'streaming' && (permissions.isAdmin || permissions.isReferee || permissions.isStreamer)) {
            fetchStaffAssignments();
            fetchAvailableRooms();
        }
    }, [activeTab, permissions.isAdmin, permissions.isReferee, permissions.isStreamer]);

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
            showError('获取注册数据失败');
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
                showSuccess(data.message);
                // 刷新注册列表
                fetchRegistrations();
            } else {
                showError(`审核失败: ${data.error}`);
            }
        } catch (error) {
            console.error('Error approving registration:', error);
            showError('审核用户注册信息时发生错误');
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
                showSuccess(data.message);
                // 刷新注册列表
                fetchRegistrations();
            } else {
                showError(`删除失败: ${data.error}`);
            }
        } catch (error) {
            console.error('Error deleting registration:', error);
            showError('删除用户注册信息时发生错误');
        } finally {
            setProcessingUser(null);
        }
    };

    // 房间管理函数
    const fetchRooms = async () => {
        setRoomsLoading(true);
        try {
            const response = await fetch('/api/match-rooms?withSchedules=true');
            const data = await response.json();
            if (data.success) {
                setRooms(data.rooms);
            } else {
                console.error('Failed to fetch rooms:', data.error);
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setRoomsLoading(false);
        }
    };

    const handleDeleteRoom = async (roomId: number) => {
        if (!confirm('确定要删除这个比赛房间吗？此操作不可撤销。')) {
            return;
        }

        setDeletingRoomId(roomId);
        try {
            const response = await fetch('/api/match-rooms/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: roomId }),
            });

            const data = await response.json();
            if (data.success) {
                setRooms(rooms.filter(room => room.id !== roomId));
                showSuccess('房间删除成功');
            } else {
                showError('删除失败: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting room:', error);
            showError('删除房间时发生错误');
        } finally {
            setDeletingRoomId(null);
        }
    };

    const handleCreateRoom = async (roomData: {
        room_name: string;
        round_number: number;
        match_date: string;
        match_time: string;
        match_number: number;
        max_participants: number;
        description: string;
    }) => {
        try {
            const response = await fetch('/api/match-rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(roomData),
            });

            const data = await response.json();
            if (data.success) {
                fetchRooms(); // 重新获取房间列表
                showSuccess('房间创建成功');
            } else {
                showError('创建失败: ' + data.error);
            }
        } catch (error) {
            console.error('Error creating room:', error);
            showError('创建房间时发生错误');
        }
    };

    // 对战管理函数
    const fetchMatchups = async () => {
        setMatchupsLoading(true);
        try {
            const response = await fetch('/api/player-matchups');
            const data = await response.json();
            if (data.success) {
                setMatchups(data.matchups);
            } else {
                console.error('Failed to fetch matchups:', data.error);
            }
        } catch (error) {
            console.error('Error fetching matchups:', error);
        } finally {
            setMatchupsLoading(false);
        }
    };

    const handleDeleteMatchup = async (matchupId: number) => {
        if (!confirm('确定要删除这个玩家对战吗？此操作不可撤销。')) {
            return;
        }

        setDeletingMatchupId(matchupId);
        try {
            const response = await fetch('/api/player-matchups/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: matchupId }),
            });

            const data = await response.json();
            if (data.success) {
                setMatchups(matchups.filter(matchup => matchup.id !== matchupId));
                showSuccess('对战删除成功');
            } else {
                showError('删除失败: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting matchup:', error);
            showError('删除对战时发生错误');
        } finally {
            setDeletingMatchupId(null);
        }
    };

    const handleCreateMatchup = async (matchupData: {
        player1_osuId: number;
        player1_username: string;
        player2_osuId: number;
        player2_username: string;
    }) => {
        try {
            const response = await fetch('/api/player-matchups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(matchupData),
            });

            const data = await response.json();
            if (data.success) {
                fetchMatchups(); // 重新获取对战列表
                showSuccess('对战创建成功');
            } else {
                showError('创建失败: ' + data.error);
            }
        } catch (error) {
            console.error('Error creating matchup:', error);
            showError('创建对战时发生错误');
        }
    };

    // 获取已过审玩家
    const fetchApprovedPlayers = async () => {
        try {
            const response = await fetch('/api/approved-players');
            if (response.ok) {
                const data = await response.json();
                setApprovedPlayers(data.players || []);
            }
        } catch (error) {
            console.error('Error fetching approved players:', error);
        }
    };

    // 获取staff房间分配列表
    const fetchStaffAssignments = async () => {
        try {
            setStaffAssignmentsLoading(true);
            const response = await fetch('/api/staff-room-assignments');
            if (response.ok) {
                const data = await response.json();
                setStaffAssignments(data.assignments || []);
            }
        } catch (error) {
            console.error('Error fetching staff assignments:', error);
        } finally {
            setStaffAssignmentsLoading(false);
        }
    };

    // 获取可供staff选择的房间列表
    const fetchAvailableRooms = async () => {
        try {
            setAvailableRoomsLoading(true);
            const response = await fetch('/api/available-rooms-for-staff');
            if (response.ok) {
                const data = await response.json();
                setAvailableRooms(data.rooms || []);
            }
        } catch (error) {
            console.error('Error fetching available rooms:', error);
        } finally {
            setAvailableRoomsLoading(false);
        }
    };

    // Staff申请加入房间
    const handleApplyForRoom = async (roomId: number, role: 'referee' | 'streamer' | 'commentator') => {
        if (!user) return;

        const roleName = role === 'referee' ? '裁判' : role === 'streamer' ? '直播' : '解说';

        try {
            const response = await fetch('/api/staff-room-assignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    room_id: roomId,
                    staff_osuId: user.osuId,
                    staff_username: user.username,
                    staff_role: role,
                    assigned_by: user.osuId // 自己申请，所以assigned_by也是自己
                }),
            });

            if (response.ok) {
                showSuccess(`成功加入房间成为${roleName}！`);
                // 重新获取数据
                fetchStaffAssignments();
                fetchAvailableRooms();
            } else {
                const errorData = await response.json();
                showError(`申请失败: ${errorData.error || '未知错误'}`);
            }
        } catch (error) {
            console.error('Error applying for room:', error);
            showError('申请失败，请稍后重试');
        }
    };

    const handleRevokeAssignment = async (assignmentId: number, roleName: string) => {
        if (!confirm(`确定要撤销${roleName}分配吗？`)) {
            return;
        }

        try {
            const response = await fetch(`/api/staff-room-assignments?assignmentId=${assignmentId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                showSuccess(`已撤销${roleName}分配`);
                // 重新获取数据
                fetchStaffAssignments();
                fetchAvailableRooms();
            } else {
                const errorData = await response.json();
                showError(`撤销失败: ${errorData.error || '未知错误'}`);
            }
        } catch (error) {
            console.error('Error revoking assignment:', error);
            showError('撤销失败，请稍后重试');
        }
    };

    // Staff加入房间
    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (loading) {
        console.log('[Staff Dashboard] 显示加载页面');
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

    if (!user || !permissions.isAdmin && !permissions.isReferee && !permissions.isStreamer && !permissions.isCommentator) {
        console.log('[Staff Dashboard] 渲染时权限检查失败:', {
            user: !!user,
            isAdmin: permissions.isAdmin,
            isReferee: permissions.isReferee,
            isStreamer: permissions.isStreamer,
            isCommentator: permissions.isCommentator
        });
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

    console.log('[Staff Dashboard] 开始渲染主界面，用户信息:', {
        userId: user?.osuId,
        username: user?.username,
        permissions
    });

    return (
        <div className="flex h-screen bg-[#1a1a1a]">
            {/* 开发环境调试信息 */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed top-0 left-0 bg-black text-white p-2 text-xs z-50 rounded-br">
                    权限加载: {permissionsLoading ? '加载中' : '完成'} |
                    用户: {user?.osuId || '未知'} |
                    管理员: {permissions.isAdmin ? '是' : '否'} |
                    裁判: {permissions.isReferee ? '是' : '否'} |
                    主播: {permissions.isStreamer ? '是' : '否'} |
                    解说: {permissions.isCommentator ? '是' : '否'}
                </div>
            )}

            {/* 侧边栏 */}
            <div className="w-64 bg-[#2d2d2d] border-r border-[#404040] flex flex-col">
                {/* 头部信息 */}
                <div className="p-6 border-b border-[#404040]">
                    <div className="flex items-center mb-4">
                        <Image
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
                            onClick={() => setActiveTab('rooms')}
                            className={`w-full flex items-center px-4 py-3 text-left transition-colors duration-200 ${activeTab === 'rooms'
                                ? 'bg-[#E93B66] text-white border-r-4 border-[#3BE9D8]'
                                : 'text-gray-300 hover:bg-[#3a3a3a] hover:text-white'
                                }`}
                        >
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                            比赛房间管理
                        </button>

                        <button
                            onClick={() => setActiveTab('matchups')}
                            className={`w-full flex items-center px-4 py-3 text-left transition-colors duration-200 ${activeTab === 'matchups'
                                ? 'bg-[#E93B66] text-white border-r-4 border-[#3BE9D8]'
                                : 'text-gray-300 hover:bg-[#3a3a3a] hover:text-white'
                                }`}
                        >
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                            </svg>
                            对战列表管理
                        </button>

                        <button
                            onClick={() => setActiveTab('streaming')}
                            className={`w-full flex items-center px-4 py-3 text-left transition-colors duration-200 ${activeTab === 'streaming'
                                ? 'bg-[#E93B66] text-white border-r-4 border-[#3BE9D8]'
                                : 'text-gray-300 hover:bg-[#3a3a3a] hover:text-white'
                                }`}
                        >
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.414-1.414A1 1 0 0010.586 3H7.414a1 1 0 00-.707.293L5.293 4.707A1 1 0 014.586 5H4zm12 12H4a4 4 0 01-4-4V7a4 4 0 014-4h1.586a1 1 0 01.707.293L7.707 5.707A1 1 0 008.414 6h3.172a1 1 0 01.707.293l1.414 1.414A1 1 0 0014.414 8H16a4 4 0 014 4v6a4 4 0 01-4 4z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M8 11a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                            直播裁判
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
                            onClick={() => setActiveTab('replays')}
                            className={`w-full flex items-center px-4 py-3 text-left transition-colors duration-200 ${activeTab === 'replays'
                                ? 'bg-[#E93B66] text-white border-r-4 border-[#3BE9D8]'
                                : 'text-gray-300 hover:bg-[#3a3a3a] hover:text-white'
                                }`}
                        >
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h4a2 2 0 012 2v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2z" clipRule="evenodd" />
                            </svg>
                            回放收集
                        </button>

                        <button
                            onClick={() => setActiveTab('map-selection')}
                            className={`w-full flex items-center px-4 py-3 text-left transition-colors duration-200 ${activeTab === 'map-selection'
                                ? 'bg-[#E93B66] text-white border-r-4 border-[#3BE9D8]'
                                : 'text-gray-300 hover:bg-[#3a3a3a] hover:text-white'
                                }`}
                        >
                            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                            </svg>
                            选图管理
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
                        {activeTab === 'matchups' && '对战列表管理'}
                        {activeTab === 'rooms' && '比赛房间管理'}
                        {activeTab === 'matches' && '比赛管理'}
                        {activeTab === 'streaming' && '直播裁判'}
                        {activeTab === 'users' && '用户管理'}
                        {activeTab === 'replays' && '回放收集管理'}
                        {activeTab === 'map-selection' && '选图管理'}
                        {activeTab === 'settings' && '系统设置'}
                    </h1>
                </header>

                {/* 内容区域 */}
                <main className="flex-1 overflow-y-auto p-6 bg-[#1a1a1a]">
                    {/* 概览页面 */}
                    {activeTab === 'overview' && (
                        <OverviewManagement
                            user={user}
                            permissions={permissions}
                            registrations={registrations}
                        />
                    )}

                    {/* 比赛管理页面 */}
                    {activeTab === 'matches' && (
                        <MatchManagement
                            userOsuId={user.osuId}
                            isAdmin={permissions.isAdmin}
                        />
                    )}

                    {/* 用户管理页面 */}
                    {activeTab === 'users' && (
                        <UserManagement
                            registrations={registrations}
                            registrationsLoading={registrationsLoading}
                            processingUser={processingUser}
                            onFetchRegistrations={fetchRegistrations}
                            onApproveRegistration={handleApproveRegistration}
                            onDeleteRegistration={handleDeleteRegistration}
                        />
                    )}

                    {/* 回放收集管理页面 */}
                    {activeTab === 'replays' && (
                        <ReplayCollectionManagement
                            user={user}
                            permissions={permissions}
                        />
                    )}

                    {/* 选图管理页面 */}
                    {activeTab === 'map-selection' && user && (
                        <MapSelectionManagement
                            user={user}
                            permissions={permissions}
                        />
                    )}

                    {/* 系统设置页面 */}
                    {activeTab === 'settings' && (
                        <SettingsManagement
                            userOsuId={user?.osuId || ''}
                            isAdmin={permissions.isAdmin}
                        />
                    )}

                    {activeTab === 'rooms' && (
                        <RoomManagement
                            rooms={rooms}
                            roomsLoading={roomsLoading}
                            deletingRoomId={deletingRoomId}
                            onDeleteRoom={handleDeleteRoom}
                            onCreateRoom={handleCreateRoom}
                        />
                    )}

                    {activeTab === 'matchups' && (
                        <MatchupManagement
                            matchups={matchups}
                            matchupsLoading={matchupsLoading}
                            deletingMatchupId={deletingMatchupId}
                            approvedPlayers={approvedPlayers}
                            onDeleteMatchup={handleDeleteMatchup}
                            onCreateMatchup={handleCreateMatchup}
                        />
                    )}

                    {activeTab === 'streaming' && (
                        <StreamingManagement
                            user={user}
                            permissions={permissions}
                            staffAssignments={staffAssignments}
                            staffAssignmentsLoading={staffAssignmentsLoading}
                            availableRooms={availableRooms}
                            availableRoomsLoading={availableRoomsLoading}
                            onApplyForRoom={handleApplyForRoom}
                            onRevokeAssignment={handleRevokeAssignment}
                        />
                    )}
                </main>
            </div>




        </div>
    );
}