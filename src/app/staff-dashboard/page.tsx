"use client";

import { useState, useEffect } from 'react';
import { usePageTitle } from '@/lib/usePageTitle';
import { UserSession } from '@/lib/permissions';
import { UserPermissions } from '@/lib/permissions';
import { getUserPermissions } from '@/lib/permissions';
import MatchScheduleSystem from '@/app/components/MatchScheduleSystem';
import MessageNotification from '@/app/components/MessageNotification';
import localFont from "next/font/local";
import Link from 'next/link';
import Image from 'next/image';
import { TournamentRegistration } from '@/lib/mysql-registrations';
import { showSuccess, showError, showInfo, showWarning } from '@/app/components/Notification';
import { MatchesManagement } from '@/components/staff-dashboard/MatchesManagement';
import { AppointmentsManagement } from '@/components/staff-dashboard/AppointmentsManagement';
import { StaffManagement } from '@/components/staff-dashboard/StaffManagement';
import { ScheduleManagement } from '@/components/staff-dashboard/ScheduleManagement';

interface Match {
    id: string;
    round: string;
    date: string;
    time: string;
    matchNumber: string;
    player1Id?: string;
    player2Id?: string;
    player1Name?: string;
    player2Name?: string;
    redScore?: number;
    blueScore?: number;
    status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
    streamLink?: string;
    replayLink?: string;
    matchLink?: string;
    referee?: string;
    streamer?: string;
    createdAt: string;
    updatedAt: string;
}

interface Appointment {
    id: string;
    matchId: string;
    playerId: string;
    playerName: string;
    opponentId?: string;
    opponentName?: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
    updatedAt: string;
}

interface StaffMember {
    id: string;
    username: string;
    role: 'referee' | 'streamer' | 'admin';
}

// Schedule Management Interfaces
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
        player1_username: string;
        player2_username: string;
        scheduled_time: string;
    };
}

// Map Selection Interfaces
interface User {
    id: number;
    username: string;
    avatar_url: string;
}

interface BeatmapInfo {
    id: number;
    beatmapset_id: number;
    title: string;
    artist: string;
    version: string;
    creator: string;
    star_rating: number;
    bpm: number;
    total_length: number;
    ar: number;
    cs: number;
    od: number;
    hp: number;
    url: string;
    cover_url: string;
}

interface MapSelection {
    id: number;
    beatmapId: number;
    beatmapsetId: number;
    title: string;
    artist: string;
    version: string;
    creator: string;
    starRating: number;
    bpm: number;
    totalLength: number;
    ar: number;
    cs: number;
    od: number;
    hp: number;
    selectedMods: string;
    modPosition: number;
    comment: string;
    selectedBy: string;
    selectedByUsername?: string;
    selectedByAvatar?: string;
    selectedAt: string;
    season: string;
    category: string;
    url: string;
    coverUrl: string;
    approved: boolean;
    padding?: boolean;
    customModName?: string;
    customDASettings?: {
        cs?: number | null;
        ar?: number | null;
        od?: number | null;
        hp?: number | null;
    } | null;
    customDTRate?: number | null;
}

export default function StaffDashboardPage() {
    usePageTitle('/staff-dashboard');

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userPermissions, setUserPermissions] = useState<any>(null);
    const [isStaff, setIsStaff] = useState(false);
    const [activeTab, setActiveTab] = useState<'matches' | 'appointments' | 'staff' | 'schedule' | 'mappool'>('matches');
    const [matches, setMatches] = useState<Match[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        referee: '',
        streamer: '',
        streamLink: '',
        replayLink: '',
        matchLink: '',
        status: 'pending' as Match['status'],
        redScore: '',
        blueScore: ''
    });

    useEffect(() => {
        initializeDashboard();
    }, []);

    const formatDateTime = (dateString: string | Date) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return '无效日期';
        }
        // 转换为东八区时间
        const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
        const cstTime = new Date(utcTime + (8 * 3600000));
        const year = cstTime.getFullYear();
        const month = String(cstTime.getMonth() + 1).padStart(2, '0');
        const day = String(cstTime.getDate()).padStart(2, '0');
        const hours = String(cstTime.getHours()).padStart(2, '0');
        const minutes = String(cstTime.getMinutes()).padStart(2, '0');
        return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    };

    // Schedule Management State
    const [scheduleUser, setScheduleUser] = useState<UserSession | null>(null);
    const [schedulePermissions, setSchedulePermissions] = useState<UserPermissions>({
        isMapSelector: false,
        isReplayTester: false,
        isAdmin: false,
        isStreamer: false,
        isReferee: false
    });
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
    const [registrationsLoading, setRegistrationsLoading] = useState(false);
    const [processingUser, setProcessingUser] = useState<string | null>(null);
    const [scheduleActiveTab, setScheduleActiveTab] = useState('overview');

    // 房间管理状态
    const [rooms, setRooms] = useState<MatchRoom[]>([]);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
    const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);

    // 对战管理状态
    const [matchups, setMatchups] = useState<PlayerMatchup[]>([]);
    const [matchupsLoading, setMatchupsLoading] = useState(false);
    const [showCreateMatchupModal, setShowCreateMatchupModal] = useState(false);
    const [deletingMatchupId, setDeletingMatchupId] = useState<number | null>(null);

    // 已过审玩家状态
    const [approvedPlayers, setApprovedPlayers] = useState<ApprovedPlayer[]>([]);

    // Staff房间分配状态
    const [staffAssignments, setStaffAssignments] = useState<StaffRoomAssignment[]>([]);
    const [staffAssignmentsLoading, setStaffAssignmentsLoading] = useState(false);

    // 可供staff选择的房间状态
    const [availableRooms, setAvailableRooms] = useState<any[]>([]);
    const [availableRoomsLoading, setAvailableRoomsLoading] = useState(false);

    // Map Selection State
    const [mapUser, setMapUser] = useState<User | null>(null);
    const [mapIsLoading, setMapIsLoading] = useState(true);
    const [mapIsAuthorized, setMapIsAuthorized] = useState(false);
    const [mapIsAdmin, setMapIsAdmin] = useState(false);

    // Season configuration
    const [availableSeasons, setAvailableSeasons] = useState([
        { value: 's1', label: '第一赛季' }
    ]);

    // Map selection data
    const [selections, setSelections] = useState<MapSelection[]>([]);
    const [season, setSeason] = useState('s1');
    const [category, setCategory] = useState('qualification');
    const [modFilter, setModFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sortByRating, setSortByRating] = useState<boolean>(false);

    // Rating states
    const [userRatings, setUserRatings] = useState<{ [key: number]: number }>({});
    const [mapRatings, setMapRatings] = useState<{ [key: number]: any[] }>({});
    const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);

    // Add selection form
    const [showAddForm, setShowAddForm] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [selectedMods, setSelectedMods] = useState('NM');
    const [modPosition, setModPosition] = useState(1);
    const [comment, setComment] = useState('');
    const [approved, setApproved] = useState(false);
    const [padding, setPadding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [beatmapPreview, setBeatmapPreview] = useState<BeatmapInfo | null>(null);
    const [availableBeatmaps, setAvailableBeatmaps] = useState<BeatmapInfo[]>([]);
    const [moddedStats, setModdedStats] = useState<any>(null);

    // 重复检查状态
    const [duplicateWarning, setDuplicateWarning] = useState<{
        show: boolean;
        beatmapId: number;
        existingSelections: any[];
    }>({
        show: false,
        beatmapId: 0,
        existingSelections: []
    });

    // Lazer特有mod相关状态
    const [customModName, setCustomModName] = useState('');
    const [availableLazerMods, setAvailableLazerMods] = useState<{ name: string, description: string }[]>([]);

    // DA mod自定义属性
    const [customCS, setCustomCS] = useState<number | ''>('');
    const [customAR, setCustomAR] = useState<number | ''>('');
    const [customOD, setCustomOD] = useState<number | ''>('');
    const [customHP, setCustomHP] = useState<number | ''>('');

    // DT自定义倍率
    const [customDTRate, setCustomDTRate] = useState<number | ''>(1.5);

    // 批量过审相关状态
    const [tempApprovedSelections, setTempApprovedSelections] = useState<Set<number>>(new Set());
    const [showBulkApprovalModal, setShowBulkApprovalModal] = useState(false);
    const [isBulkApproving, setIsBulkApproving] = useState(false);

    // Map Selection Constants
    const MOD_OPTIONS = [
        'NM', 'HD', 'HR', 'DT', 'FM', 'LZ', 'TB'
    ];

    const CATEGORY_OPTIONS = [
        { value: 'qualification', label: '资格赛' },
        { value: 'ro32', label: '32强赛' },
        { value: 'ro16', label: '16强赛' },
        { value: 'quarterfinals', label: '四分之一决赛' },
        { value: 'semifinals', label: '半决赛' },
        { value: 'finals', label: '决赛' },
        { value: 'grandfinals', label: '总决赛' }
    ];

    // 图池配置数据
    const poolData = [
        {
            pool: 'QUA',
            difficulty: '6.2星',
            boBan: '',
            nmCount: 4,
            hdCount: 2,
            hrCount: 2,
            dtCount: 2,
            lzCount: 0,
            tbCount: 0
        },
        {
            pool: 'RO16',
            difficulty: '5.9星',
            boBan: '9/1',
            nmCount: 5,
            hdCount: 3,
            hrCount: 2,
            dtCount: 2,
            lzCount: 1,
            tbCount: 1
        },
        {
            pool: 'QF',
            difficulty: '6.2星',
            boBan: '11/1',
            nmCount: 5,
            hdCount: 3,
            hrCount: 2,
            dtCount: 3,
            lzCount: 1,
            tbCount: 1
        },
        {
            pool: 'SF',
            difficulty: '6.5星',
            boBan: '11/1',
            nmCount: 5,
            hdCount: 3,
            hrCount: 3,
            dtCount: 3,
            lzCount: 1,
            tbCount: 1
        },
        {
            pool: 'F',
            difficulty: '6.7星',
            boBan: '11/2',
            nmCount: 6,
            hdCount: 3,
            hrCount: 3,
            dtCount: 3,
            lzCount: 1,
            tbCount: 1
        },
        {
            pool: 'GF',
            difficulty: '7.0星',
            boBan: '13/2',
            nmCount: 6,
            hdCount: 3,
            hrCount: 3,
            dtCount: 4,
            lzCount: 2,
            tbCount: 1
        }
    ];

    const initializeDashboard = async () => {
        try {
            setLoading(true);

            // 获取当前用户信息
            const sessionResponse = await fetch('/api/session/get');
            const sessionData = await sessionResponse.json();

            if (sessionData.session?.osuId) {
                setCurrentUser(sessionData.session);

                // 检查用户权限
                const permissionsResponse = await fetch('/api/user-permissions');
                const permissionsData = await permissionsResponse.json();

                if (permissionsData.success && (permissionsData.permissions.isAdmin || permissionsData.permissions.isMapSelector || permissionsData.permissions.isReplayTester || permissionsData.permissions.isReferee || permissionsData.permissions.isStreamer)) {
                    setUserPermissions(permissionsData.permissions);
                    setIsStaff(true);
                    await loadDashboardData();
                } else {
                    setError('您没有工作人员权限，无法访问管理面板');
                }
            } else {
                setError('请先登录');
            }
        } catch (error) {
            setError('初始化失败，请刷新页面重试');
            console.error('Failed to initialize dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    // Schedule Management Functions
    const fetchScheduleUserData = async () => {
        try {
            // 获取用户session
            const sessionResponse = await fetch('/api/session/get');
            const sessionData = await sessionResponse.json();

            if (!sessionData.success || !sessionData.session) {
                return;
            }

            setScheduleUser(sessionData.session);

            // 获取用户权限
            const userPermissions = await getUserPermissions(sessionData.session.osuId.toString());
            setSchedulePermissions(userPermissions);
        } catch (error) {
            console.error('Failed to fetch schedule user data:', error);
        }
    };

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

    // 获取房间列表
    const fetchRooms = async () => {
        try {
            setRoomsLoading(true);
            const response = await fetch('/api/match-rooms');
            if (!response.ok) {
                throw new Error('Failed to fetch rooms');
            }
            const data = await response.json();
            setRooms(data.rooms || []);
        } catch (error) {
            console.error('Error fetching rooms:', error);
            showError('获取房间列表失败');
        } finally {
            setRoomsLoading(false);
        }
    };

    // 获取对战列表
    const fetchMatchups = async () => {
        try {
            setMatchupsLoading(true);
            const response = await fetch('/api/player-matchups');
            if (!response.ok) {
                throw new Error('Failed to fetch matchups');
            }
            const data = await response.json();
            setMatchups(data.matchups || []);
        } catch (error) {
            console.error('Error fetching matchups:', error);
            showError('获取对战列表失败');
        } finally {
            setMatchupsLoading(false);
        }
    };

    // 获取已过审玩家列表
    const fetchApprovedPlayers = async () => {
        try {
            const response = await fetch('/api/approved-players');
            if (!response.ok) {
                throw new Error('Failed to fetch approved players');
            }
            const data = await response.json();
            setApprovedPlayers(data.players || []);
        } catch (error) {
            console.error('Error fetching approved players:', error);
        }
    };

    // 获取staff分配列表
    const fetchStaffAssignments = async () => {
        try {
            setStaffAssignmentsLoading(true);
            const response = await fetch('/api/staff-room-assignments');
            if (!response.ok) {
                throw new Error('Failed to fetch staff assignments');
            }
            const data = await response.json();
            setStaffAssignments(data.assignments || []);
        } catch (error) {
            console.error('Error fetching staff assignments:', error);
            showError('获取工作人员分配失败');
        } finally {
            setStaffAssignmentsLoading(false);
        }
    };

    // 获取可供staff选择的房间
    const fetchAvailableRooms = async () => {
        try {
            setAvailableRoomsLoading(true);
            const response = await fetch('/api/available-rooms-for-staff');
            if (!response.ok) {
                throw new Error('Failed to fetch available rooms');
            }
            const data = await response.json();
            setAvailableRooms(data.rooms || []);
        } catch (error) {
            console.error('Error fetching available rooms:', error);
        } finally {
            setAvailableRoomsLoading(false);
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
                showError(data.message || '审核失败');
            }
        } catch (error) {
            console.error('Error approving registration:', error);
            showError('审核失败，请重试');
        } finally {
            setProcessingUser(null);
        }
    };

    // 删除用户注册
    const handleDeleteRegistration = async (osuId: string, username: string) => {
        if (!confirm(`确定要删除用户 ${username} (ID: ${osuId}) 的注册信息吗？此操作不可撤销。`)) {
            return;
        }

        try {
            setProcessingUser(osuId);
            const response = await fetch('/api/admin/delete-registration', {
                method: 'DELETE',
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
                showError(data.message || '删除失败');
            }
        } catch (error) {
            console.error('Error deleting registration:', error);
            showError('删除失败，请重试');
        } finally {
            setProcessingUser(null);
        }
    };

    // 创建房间
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
                showSuccess('房间创建成功');
                setShowCreateRoomModal(false);
                fetchRooms();
            } else {
                showError(data.message || '创建房间失败');
            }
        } catch (error) {
            console.error('Error creating room:', error);
            showError('创建房间失败，请重试');
        }
    };

    // 删除房间
    const handleDeleteRoom = async (roomId: number, roomName: string) => {
        if (!confirm(`确定要删除房间 "${roomName}" 吗？此操作不可撤销。`)) {
            return;
        }

        try {
            setDeletingRoomId(roomId);
            const response = await fetch(`/api/match-rooms/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ roomId }),
            });

            const data = await response.json();

            if (data.success) {
                showSuccess('房间删除成功');
                fetchRooms();
            } else {
                showError(data.message || '删除房间失败');
            }
        } catch (error) {
            console.error('Error deleting room:', error);
            showError('删除房间失败，请重试');
        } finally {
            setDeletingRoomId(null);
        }
    };

    // 创建对战
    const handleCreateMatchup = async (matchupData: {
        player1_osuId: number;
        player2_osuId: number;
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
                showSuccess('对战创建成功');
                setShowCreateMatchupModal(false);
                fetchMatchups();
            } else {
                showError(data.message || '创建对战失败');
            }
        } catch (error) {
            console.error('Error creating matchup:', error);
            showError('创建对战失败，请重试');
        }
    };

    // 删除对战
    const handleDeleteMatchup = async (matchupId: number) => {
        if (!confirm('确定要删除这个对战吗？此操作不可撤销。')) {
            return;
        }

        try {
            setDeletingMatchupId(matchupId);
            const response = await fetch(`/api/player-matchups/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ matchupId }),
            });

            const data = await response.json();

            if (data.success) {
                showSuccess('对战删除成功');
                fetchMatchups();
            } else {
                showError(data.message || '删除对战失败');
            }
        } catch (error) {
            console.error('Error deleting matchup:', error);
            showError('删除对战失败，请重试');
        } finally {
            setDeletingMatchupId(null);
        }
    };

    // 撤销工作人员分配
    const handleRevokeAssignment = async (assignmentId: number, roleName: string) => {
        if (!confirm(`确定要撤销这个${roleName}分配吗？`)) {
            return;
        }

        try {
            const response = await fetch(`/api/staff-room-assignments/${assignmentId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                showSuccess('分配撤销成功');
                fetchStaffAssignments();
            } else {
                showError(data.message || '撤销分配失败');
            }
        } catch (error) {
            console.error('Error revoking assignment:', error);
            showError('撤销分配失败，请重试');
        }
    };

    // Schedule Management useEffect hooks
    useEffect(() => {
        if (activeTab === 'schedule') {
            fetchScheduleUserData();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'schedule' && scheduleActiveTab === 'rooms' && schedulePermissions.isAdmin) {
            fetchRooms();
        }
    }, [activeTab, scheduleActiveTab, schedulePermissions.isAdmin]);

    useEffect(() => {
        if (activeTab === 'schedule' && scheduleActiveTab === 'matchups' && schedulePermissions.isAdmin) {
            fetchMatchups();
            fetchApprovedPlayers();
        }
    }, [activeTab, scheduleActiveTab, schedulePermissions.isAdmin]);

    useEffect(() => {
        if (activeTab === 'schedule' && scheduleActiveTab === 'users' && schedulePermissions.isAdmin) {
            fetchRegistrations();
        }
    }, [activeTab, scheduleActiveTab, schedulePermissions.isAdmin]);

    useEffect(() => {
        if (activeTab === 'schedule' && scheduleActiveTab === 'streaming' && (schedulePermissions.isAdmin || schedulePermissions.isReferee || schedulePermissions.isStreamer)) {
            fetchStaffAssignments();
            fetchAvailableRooms();
        }
    }, [activeTab, scheduleActiveTab, schedulePermissions.isAdmin, schedulePermissions.isReferee, schedulePermissions.isStreamer]);

    // Map Selection useEffect hooks
    useEffect(() => {
        if (activeTab === 'mappool' && mapIsAuthorized && mapUser) {
            fetchSelections();
        }
    }, [activeTab, mapIsAuthorized, mapUser, season, category]);

    const loadDashboardData = async () => {
        try {
            // 并行获取数据
            const [matchesResponse, appointmentsResponse] = await Promise.all([
                fetch('/api/matches'),
                fetch('/api/appointments')
            ]);

            const [matchesData, appointmentsData] = await Promise.all([
                matchesResponse.json(),
                appointmentsResponse.json()
            ]);

            if (matchesData.success) {
                setMatches(matchesData.matches);
            }

            if (appointmentsData.success) {
                setAppointments(appointmentsData.appointments);
            }

            // 获取工作人员数据
            const staffResponse = await fetch('/api/staff-members');
            const staffData = await staffResponse.json();

            if (staffData.success) {
                setStaffMembers(staffData.staffMembers);
            }

            // 初始化map-selection功能
            await checkMapUserAuth();
            await fetchAvailableLazerMods();
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    };

    const updateMatch = async () => {
        if (!selectedMatch) return;

        try {
            const updateData = {
                ...editForm,
                redScore: editForm.redScore ? parseInt(editForm.redScore) : undefined,
                blueScore: editForm.blueScore ? parseInt(editForm.blueScore) : undefined
            };

            const response = await fetch(`/api/matches/${selectedMatch.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            const data = await response.json();

            if (data.success) {
                setShowEditModal(false);
                setSelectedMatch(null);
                await loadDashboardData();
                alert('比赛信息已更新！');
            } else {
                setError(data.error || '更新失败');
            }
        } catch (error) {
            setError('网络错误，请稍后重试');
            console.error('Failed to update match:', error);
        }
    };

    const updateAppointmentStatus = async (appointmentId: string, status: string) => {
        try {
            const response = await fetch(`/api/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });

            const data = await response.json();

            if (data.success) {
                await loadDashboardData();
                alert(`预约已${status === 'accepted' ? '接受' : '拒绝'}！`);
            } else {
                setError(data.error || '更新预约状态失败');
            }
        } catch (error) {
            setError('网络错误，请稍后重试');
            console.error('Failed to update appointment:', error);
        }
    };

    // Map Selection Functions
    const fetchAvailableLazerMods = async () => {
        try {
            const response = await fetch('/api/get-available-mods');
            if (response.ok) {
                const data = await response.json();
                setAvailableLazerMods(data.availableMods || []);
            } else {
                // 如果API失败，使用预定义的mod列表
                const fallbackMods = [
                    { name: 'DA', description: 'Difficulty Adjust - 自定义难度属性' },
                    { name: 'WG', description: 'Wiggle - 摆动效果' },
                    { name: 'MR', description: 'Mirror - 镜像' },
                    { name: 'RD', description: 'Random - 随机' },
                    { name: 'AS', description: 'Adaptive Speed - 自适应速度' },
                    { name: 'CL', description: 'Classic - 经典模式' },
                    { name: 'SG', description: 'Single Tap - 单键模式' },
                    { name: 'TC', description: 'Target Practice - 目标练习' },
                    { name: 'AC', description: 'Accuracy Challenge - 精确度挑战' }
                ];
                setAvailableLazerMods(fallbackMods);
            }
        } catch (error) {
            console.error('Failed to fetch available Lazer mods:', error);
            // 使用预定义的mod列表作为备选
            const fallbackMods = [
                { name: 'DA', description: 'Difficulty Adjust - 自定义难度属性' },
                { name: 'WG', description: 'Wiggle - 摆动效果' },
                { name: 'MR', description: 'Mirror - 镜像' },
                { name: 'RD', description: 'Random - 随机' },
                { name: 'AS', description: 'Adaptive Speed - 自适应速度' },
                { name: 'CL', description: 'Classic - 经典模式' },
                { name: 'SG', description: 'Single Tap - 单键模式' },
                { name: 'TC', description: 'Target Practice - 目标练习' },
                { name: 'AC', description: 'Accuracy Challenge - 精确度挑战' }
            ];
            setAvailableLazerMods(fallbackMods);
        }
    };

    const checkMapUserAuth = async () => {
        try {
            const sessionResponse = await fetch('/api/session/get');
            if (!sessionResponse.ok) {
                showError('未登录。正在跳转到登录页面...');
                return;
            }

            const sessionData = await sessionResponse.json();
            if (!sessionData.success || !sessionData.session) {
                showError('未找到用户信息');
                return;
            }

            setMapUser(sessionData.session);
            setMapIsAuthorized(true);

            // 检查用户权限
            const permissionsResponse = await fetch('/api/user-permissions');
            const permissionsData = await permissionsResponse.json();

            if (permissionsData.success) {
                const permissions = permissionsData.permissions;
                setMapIsAdmin(permissions.isAdmin || permissions.isMapSelector);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            showError('权限检查失败');
        } finally {
            setMapIsLoading(false);
        }
    };

    const fetchSelections = async () => {
        try {
            const response = await fetch(`/api/map-selections?season=${season}&category=${category}`);
            if (response.ok) {
                const data = await response.json();
                setSelections(data.selections || []);
            } else {
                console.error('Failed to fetch selections');
            }
        } catch (error) {
            console.error('Error fetching selections:', error);
        }
    };

    const openEditModal = (match: Match) => {
        setSelectedMatch(match);
        setEditForm({
            referee: match.referee || '',
            streamer: match.streamer || '',
            streamLink: match.streamLink || '',
            replayLink: match.replayLink || '',
            matchLink: match.matchLink || '',
            status: match.status,
            redScore: match.redScore?.toString() || '',
            blueScore: match.blueScore?.toString() || ''
        });
        setShowEditModal(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'ongoing': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return '等待中';
            case 'ongoing': return '进行中';
            case 'completed': return '已完成';
            case 'cancelled': return '已取消';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen py-12">
                <div className="max-w-6xl mx-auto p-6">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F38181] mx-auto"></div>
                        <p className="mt-4 text-gray-300">加载中...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isStaff) {
        return (
            <div className="min-h-screen py-12">
                <div className="max-w-2xl mx-auto p-6">
                    <div className="bg-red-50 border border-red-200 p-6 text-center">
                        <h2 className="text-xl font-bold text-red-800 mb-2">访问受限</h2>
                        <p className="text-red-600">{error || '您没有工作人员权限，无法访问管理面板'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-6xl mx-auto p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">工作人员管理面板</h1>
                    <p className="text-gray-300">管理比赛、预约、工作人员和赛程安排</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 p-4 mb-6">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* 标签页导航 */}
                <div className="mb-6">
                    <div className="flex space-x-1 bg-gray-800 p-1 ">
                        {[
                            { id: 'matches', label: '比赛管理' },
                            { id: 'appointments', label: '预约管理' },
                            { id: 'staff', label: '工作人员' },
                            { id: 'schedule', label: '赛程安排' },
                            { id: 'mappool', label: '图池管理' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-[#F38181] text-white'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 标签页内容 */}
                <div className="bg-gray-800  shadow-md overflow-hidden">
                    {activeTab === 'matches' && (
                        <MatchesManagement
                            matches={matches.map(match => ({
                                id: parseInt(match.id),
                                player1: match.player1Name || '待定',
                                player2: match.player2Name || '待定',
                                round: match.round,
                                status: match.status,
                                scheduled_time: `${match.date} ${match.time}`,
                                referee: match.referee,
                                streamer: match.streamer,
                                stream_link: match.streamLink,
                                replay_link: match.replayLink,
                                match_link: match.matchLink
                            }))}
                            loading={false}
                            onEditMatch={(match) => {
                                const originalMatch = matches.find(m => m.id === match.id.toString());
                                if (originalMatch) openEditModal(originalMatch);
                            }}
                            onRefresh={() => loadDashboardData()}
                        />
                    )}

                    {activeTab === 'appointments' && (
                        <AppointmentsManagement
                            appointments={appointments.map(appointment => ({
                                id: parseInt(appointment.id),
                                player_name: appointment.playerName,
                                player_id: parseInt(appointment.playerId),
                                requested_time: appointment.createdAt,
                                status: appointment.status === 'accepted' ? 'approved' : appointment.status === 'rejected' ? 'rejected' : 'pending',
                                match_id: appointment.matchId ? parseInt(appointment.matchId) : undefined
                            }))}
                            matches={matches.map(match => ({
                                id: parseInt(match.id),
                                player1: match.player1Name || '待定',
                                player2: match.player2Name || '待定',
                                round: match.round,
                                status: match.status,
                                scheduled_time: `${match.date} ${match.time}`,
                                referee: match.referee,
                                streamer: match.streamer,
                                stream_link: match.streamLink,
                                replay_link: match.replayLink,
                                match_link: match.matchLink
                            }))}
                            loading={false}
                            onApproveAppointment={(appointmentId) => updateAppointmentStatus(appointmentId.toString(), 'accepted')}
                            onRejectAppointment={(appointmentId) => updateAppointmentStatus(appointmentId.toString(), 'rejected')}
                            onRefresh={() => loadDashboardData()}
                        />
                    )}

                    {activeTab === 'staff' && (
                        <StaffManagement
                            staffMembers={staffMembers.map(staff => ({
                                id: parseInt(staff.id),
                                username: staff.username,
                                role: staff.role
                            }))}
                            loading={false}
                            onRefresh={() => loadDashboardData()}
                        />
                    )}

                    {activeTab === 'schedule' && (
                        <ScheduleManagement
                            rooms={rooms.map(room => ({
                                id: room.id,
                                name: room.room_name,
                                status: room.status === 'open' ? 'available' : room.status === 'closed' ? 'occupied' : 'maintenance',
                                current_match: room.match_number
                            }))}
                            roomsLoading={roomsLoading}
                            onRefreshRooms={fetchRooms}
                            onCreateRoom={() => {/* TODO: Implement create room modal */ }}
                            onDeleteRoom={(roomId) => {/* TODO: Implement delete room */ }}
                            matchups={matchups.map(matchup => ({
                                id: matchup.id,
                                player1_id: matchup.player1_osuId,
                                player1_name: matchup.player1_username,
                                player2_id: matchup.player2_osuId,
                                player2_name: matchup.player2_username,
                                round: `Round ${matchup.id}`, // TODO: Add round info
                                scheduled_time: matchup.created_at,
                                status: matchup.status === 'available' ? 'scheduled' : matchup.status === 'in_progress' ? 'scheduled' : 'completed'
                            }))}
                            matchupsLoading={matchupsLoading}
                            approvedPlayers={approvedPlayers.map(player => ({
                                id: parseInt(player.osuId),
                                player_name: player.username,
                                player_id: parseInt(player.osuId),
                                approved_time: new Date().toISOString(), // TODO: Add actual approved time
                                registration_id: parseInt(player.osuId) // TODO: Add actual registration ID
                            }))}
                            onRefreshMatchups={() => {
                                fetchMatchups();
                                fetchApprovedPlayers();
                            }}
                            onCreateMatchup={() => {/* TODO: Implement create matchup modal */ }}
                            onDeleteMatchup={(matchupId) => {/* TODO: Implement delete matchup */ }}
                            registrations={registrations.map(reg => ({
                                id: parseInt(reg.osuId),
                                player_name: reg.username,
                                player_id: parseInt(reg.osuId),
                                registration_time: reg.registeredAt,
                                status: reg.approved ? 'approved' : 'pending',
                                discord_username: undefined, // Not available in this interface
                                osu_username: reg.username
                            }))}
                            registrationsLoading={registrationsLoading}
                            processingUser={processingUser}
                            onRefreshRegistrations={fetchRegistrations}
                            onApproveRegistration={handleApproveRegistration}
                            onDeleteRegistration={handleDeleteRegistration}
                            staffAssignments={staffAssignments.map(assignment => ({
                                id: assignment.id,
                                room_id: assignment.room_id,
                                staff_id: parseInt(assignment.staff_osuId),
                                assignment_time: assignment.assigned_at
                            }))}
                            staffAssignmentsLoading={staffAssignmentsLoading}
                            availableRooms={availableRooms}
                            availableRoomsLoading={availableRoomsLoading}
                            onRefreshStaffAssignments={() => {
                                fetchStaffAssignments();
                                fetchAvailableRooms();
                            }}
                            onAssignStaffToRoom={(staffId, roomId) => {/* TODO: Implement assign staff */ }}
                            onRevokeStaffAssignment={(assignmentId) => {/* TODO: Implement revoke assignment */ }}
                            schedulePermissions={schedulePermissions}
                        />
                    )}
                </div>

                {/* 编辑比赛模态框 */}
                {showEditModal && selectedMatch && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-gray-800  p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                            <h3 className="text-xl font-bold text-white mb-4">编辑比赛信息</h3>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">裁判员</label>
                                        <input
                                            type="text"
                                            value={editForm.referee}
                                            onChange={(e) => setEditForm({ ...editForm, referee: e.target.value })}
                                            className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38181]"
                                            placeholder="输入裁判员姓名"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">直播员</label>
                                        <input
                                            type="text"
                                            value={editForm.streamer}
                                            onChange={(e) => setEditForm({ ...editForm, streamer: e.target.value })}
                                            className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38181]"
                                            placeholder="输入直播员姓名"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">直播链接</label>
                                    <input
                                        type="url"
                                        value={editForm.streamLink}
                                        onChange={(e) => setEditForm({ ...editForm, streamLink: e.target.value })}
                                        className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38181]"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">回放链接</label>
                                    <input
                                        type="url"
                                        value={editForm.replayLink}
                                        onChange={(e) => setEditForm({ ...editForm, replayLink: e.target.value })}
                                        className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38181]"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">比赛链接</label>
                                    <input
                                        type="url"
                                        value={editForm.matchLink}
                                        onChange={(e) => setEditForm({ ...editForm, matchLink: e.target.value })}
                                        className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38181]"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">状态</label>
                                        <select
                                            value={editForm.status}
                                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Match['status'] })}
                                            className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38181]"
                                        >
                                            <option value="pending">等待中</option>
                                            <option value="ongoing">进行中</option>
                                            <option value="completed">已完成</option>
                                            <option value="cancelled">已取消</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">红方分数</label>
                                        <input
                                            type="number"
                                            value={editForm.redScore}
                                            onChange={(e) => setEditForm({ ...editForm, redScore: e.target.value })}
                                            className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38181]"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">蓝方分数</label>
                                        <input
                                            type="number"
                                            value={editForm.blueScore}
                                            onChange={(e) => setEditForm({ ...editForm, blueScore: e.target.value })}
                                            className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38181]"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedMatch(null);
                                    }}
                                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={updateMatch}
                                    className="flex-1 bg-[#F38181] text-white px-4 py-2 rounded-md hover:bg-[#95E1D3] transition-colors"
                                >
                                    保存修改
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 创建房间模态框 */}
            {showCreateRoomModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">创建比赛房间</h3>
                            <button
                                onClick={() => setShowCreateRoomModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target as HTMLFormElement);
                            handleCreateRoom({
                                room_name: (e.target as any).room_name.value,
                                round_number: parseInt((e.target as any).round_number.value),
                                match_date: (e.target as any).match_date.value,
                                match_time: (e.target as any).match_time.value,
                                match_number: parseInt((e.target as any).match_number.value),
                                max_participants: parseInt((e.target as any).max_participants.value) || 2,
                                description: (e.target as any).description.value
                            });
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    房间名称 *
                                </label>
                                <input
                                    name="room_name"
                                    type="text"
                                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        轮次 *
                                    </label>
                                    <input
                                        name="round_number"
                                        type="number"
                                        min="1"
                                        defaultValue="1"
                                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        比赛编号 *
                                    </label>
                                    <input
                                        name="match_number"
                                        type="number"
                                        min="1"
                                        defaultValue="1"
                                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        比赛日期 *
                                    </label>
                                    <input
                                        name="match_date"
                                        type="date"
                                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        比赛时间 *
                                    </label>
                                    <input
                                        name="match_time"
                                        type="time"
                                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    最大参与者数
                                </label>
                                <input
                                    name="max_participants"
                                    type="number"
                                    min="2"
                                    max="16"
                                    defaultValue="2"
                                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    描述
                                </label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none resize-none"
                                    placeholder="可选的房间描述..."
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateRoomModal(false)}
                                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#E93B66] text-white rounded-md hover:bg-[#d32f5a] flex items-center"
                                >
                                    创建房间
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 创建对战模态框 */}
            {showCreateMatchupModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">创建玩家对战</h3>
                            <button
                                onClick={() => setShowCreateMatchupModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target as HTMLFormElement);
                            handleCreateMatchup({
                                player1_osuId: parseInt((e.target as any).player1_osuId.value),
                                player2_osuId: parseInt((e.target as any).player2_osuId.value)
                            });
                        }} className="space-y-4">
                            {/* 玩家1 */}
                            <div className="bg-[#1a1a1a] p-4 rounded-lg">
                                <h4 className="text-white font-medium mb-3 flex items-center">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                    玩家 1
                                </h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        选择玩家 *
                                    </label>
                                    <select
                                        name="player1_osuId"
                                        className="w-full px-3 py-2 bg-[#2d2d2d] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                                        required
                                    >
                                        <option value="">请选择玩家...</option>
                                        {approvedPlayers.map(player => (
                                            <option key={player.osuId} value={player.osuId}>
                                                {player.username} (ID: {player.osuId})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* VS */}
                            <div className="flex justify-center py-2">
                                <span className="text-[#E93B66] font-bold text-xl">VS</span>
                            </div>

                            {/* 玩家2 */}
                            <div className="bg-[#1a1a1a] p-4 rounded-lg">
                                <h4 className="text-white font-medium mb-3 flex items-center">
                                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                    玩家 2
                                </h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        选择玩家 *
                                    </label>
                                    <select
                                        name="player2_osuId"
                                        className="w-full px-3 py-2 bg-[#2d2d2d] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                                        required
                                    >
                                        <option value="">请选择玩家...</option>
                                        {approvedPlayers.map(player => (
                                            <option key={player.osuId} value={player.osuId}>
                                                {player.username} (ID: {player.osuId})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateMatchupModal(false)}
                                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#E93B66] text-white rounded-md hover:bg-[#d32f5a] flex items-center"
                                >
                                    创建对战
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 图池管理标签页 */}
            {activeTab === 'mappool' && (
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">图池管理</h2>

                    {/* 筛选和控制区域 */}
                    <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* 赛季选择 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    赛季
                                </label>
                                <select
                                    value={season}
                                    onChange={(e) => setSeason(e.target.value)}
                                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                                >
                                    {availableSeasons.map(seasonOption => (
                                        <option key={seasonOption.value} value={seasonOption.value}>
                                            {seasonOption.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 阶段选择 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    比赛阶段
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                                >
                                    {CATEGORY_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Mod筛选 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Mod筛选
                                </label>
                                <select
                                    value={modFilter}
                                    onChange={(e) => setModFilter(e.target.value)}
                                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                                >
                                    <option value="all">全部</option>
                                    {MOD_OPTIONS.map(mod => (
                                        <option key={mod} value={mod}>{mod}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 搜索框 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    搜索
                                </label>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="搜索歌曲或艺术家..."
                                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* 控制按钮 */}
                        <div className="flex justify-between items-center mt-4">
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={sortByRating}
                                        onChange={(e) => setSortByRating(e.target.checked)}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-300">按评分排序</span>
                                </label>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="px-4 py-2 bg-[#E93B66] text-white rounded-md hover:bg-[#d32f5a] flex items-center"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    添加地图
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 图池信息展示 */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-white mb-3">图池配置</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {poolData.map((pool) => (
                                <div key={pool.pool} className="bg-gray-700 p-4 rounded-lg">
                                    <h4 className="text-white font-medium mb-2">{pool.pool}</h4>
                                    <div className="text-sm text-gray-300 space-y-1">
                                        <p>难度: {pool.difficulty}</p>
                                        <p>BO/BAN: {pool.boBan || '无'}</p>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div>NM: {pool.nmCount}</div>
                                            <div>HD: {pool.hdCount}</div>
                                            <div>HR: {pool.hrCount}</div>
                                            <div>DT: {pool.dtCount}</div>
                                            <div>LZ: {pool.lzCount}</div>
                                            <div>TB: {pool.tbCount}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 地图列表 */}
                    <div className="bg-gray-700 rounded-lg overflow-hidden">
                        <div className="p-4 border-b border-gray-600">
                            <h3 className="text-lg font-medium text-white">
                                地图列表 ({selections.length} 张地图)
                            </h3>
                        </div>

                        {selections.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                暂无地图数据
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-600">
                                {selections.slice(0, 10).map((selection) => (
                                    <div key={selection.id} className="p-4 hover:bg-gray-600 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-12 h-12 bg-gray-600 rounded flex items-center justify-center text-white font-bold">
                                                        {selection.selectedMods}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-medium">{selection.title}</h4>
                                                        <p className="text-gray-300 text-sm">
                                                            {selection.artist} // {selection.creator}
                                                        </p>
                                                        <p className="text-gray-400 text-xs">
                                                            {selection.starRating.toFixed(2)}★ • {selection.selectedByUsername || selection.selectedBy}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-1 rounded text-xs ${selection.approved
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-yellow-600 text-white'
                                                    }`}>
                                                    {selection.approved ? '已过审' : '待审核'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}