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
}

const audiowide = localFont({
    src: "../components/font/Audiowide-Regular.ttf",
    display: "auto",
});
function CreateRoomModal({ onClose, onCreate }: {
    onClose: () => void;
    onCreate: (roomData: {
        room_name: string;
        round_number: number;
        match_date: string;
        match_time: string;
        match_number: number;
        max_participants: number;
        description: string;
    }) => void;
}) {
    const [formData, setFormData] = useState({
        room_name: '',
        round_number: 1,
        match_date: '',
        match_time: '',
        match_number: 1,
        max_participants: 2,
        description: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onCreate(formData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">创建比赛房间</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            房间名称 *
                        </label>
                        <input
                            type="text"
                            value={formData.room_name}
                            onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
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
                                type="number"
                                min="1"
                                value={formData.round_number}
                                onChange={(e) => setFormData({ ...formData, round_number: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                比赛编号 *
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={formData.match_number}
                                onChange={(e) => setFormData({ ...formData, match_number: parseInt(e.target.value) })}
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
                                type="date"
                                value={formData.match_date}
                                onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                比赛时间 *
                            </label>
                            <input
                                type="time"
                                value={formData.match_time}
                                onChange={(e) => setFormData({ ...formData, match_time: e.target.value })}
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
                            type="number"
                            min="2"
                            max="16"
                            value={formData.max_participants}
                            onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            描述
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none resize-none"
                            placeholder="可选的房间描述..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-[#E93B66] text-white rounded-md hover:bg-[#d32f5a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {loading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
                            )}
                            创建房间
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// 创建对战模态框组件
function CreateMatchupModal({ onClose, onCreate, approvedPlayers }: {
    onClose: () => void;
    onCreate: (matchupData: {
        player1_osuId: number;
        player1_username: string;
        player2_osuId: number;
        player2_username: string;
    }) => void;
    approvedPlayers: ApprovedPlayer[];
}) {
    const [formData, setFormData] = useState({
        player1_osuId: '',
        player1_username: '',
        player2_osuId: '',
        player2_username: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onCreate({
                player1_osuId: parseInt(formData.player1_osuId),
                player1_username: formData.player1_username,
                player2_osuId: parseInt(formData.player2_osuId),
                player2_username: formData.player2_username
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">创建玩家对战</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 玩家1 */}
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                        <h4 className="text-white font-medium mb-3 flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            玩家 1
                        </h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    选择玩家 *
                                </label>
                                <select
                                    value={formData.player1_osuId}
                                    onChange={(e) => {
                                        const selectedPlayer = approvedPlayers.find(p => p.osuId === e.target.value);
                                        if (selectedPlayer) {
                                            setFormData({
                                                ...formData,
                                                player1_osuId: e.target.value,
                                                player1_username: selectedPlayer.username
                                            });
                                        }
                                    }}
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
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    选择玩家 *
                                </label>
                                <select
                                    value={formData.player2_osuId}
                                    onChange={(e) => {
                                        const selectedPlayer = approvedPlayers.find(p => p.osuId === e.target.value);
                                        if (selectedPlayer) {
                                            setFormData({
                                                ...formData,
                                                player2_osuId: e.target.value,
                                                player2_username: selectedPlayer.username
                                            });
                                        }
                                    }}
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
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-[#E93B66] text-white rounded-md hover:bg-[#d32f5a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {loading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
                            )}
                            创建对战
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function CreateStaffAssignmentModal({ onClose, onCreate, rooms }: {
    onClose: () => void;
    onCreate: (assignmentData: {
        room_id: number;
        staff_osuId: string;
        staff_username: string;
        staff_role: 'referee' | 'streamer' | 'commentator';
    }) => void;
    rooms: MatchRoom[];
}) {
    const [formData, setFormData] = useState({
        room_id: '',
        staff_osuId: '',
        staff_username: '',
        staff_role: 'referee' as 'referee' | 'streamer' | 'commentator'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.room_id || !formData.staff_osuId || !formData.staff_username) {
            alert('请填写所有必要信息');
            return;
        }

        setLoading(true);

        try {
            await onCreate({
                room_id: parseInt(formData.room_id),
                staff_osuId: formData.staff_osuId,
                staff_username: formData.staff_username,
                staff_role: formData.staff_role
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">分配Staff到房间</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            选择房间
                        </label>
                        <select
                            value={formData.room_id}
                            onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                            className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:outline-none focus:border-[#E93B66]"
                            required
                        >
                            <option value="">请选择房间</option>
                            {rooms.map((room) => (
                                <option key={room.id} value={room.id}>
                                    {room.room_name} (轮次 {room.round_number}, 场次 {room.match_number})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Staff osu! ID
                        </label>
                        <input
                            type="text"
                            value={formData.staff_osuId}
                            onChange={(e) => setFormData({ ...formData, staff_osuId: e.target.value })}
                            className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:outline-none focus:border-[#E93B66]"
                            placeholder="输入Staff的osu! ID"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Staff 用户名
                        </label>
                        <input
                            type="text"
                            value={formData.staff_username}
                            onChange={(e) => setFormData({ ...formData, staff_username: e.target.value })}
                            className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:outline-none focus:border-[#E93B66]"
                            placeholder="输入Staff的用户名"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Staff 角色
                        </label>
                        <select
                            value={formData.staff_role}
                            onChange={(e) => setFormData({ ...formData, staff_role: e.target.value as 'referee' | 'streamer' | 'commentator' })}
                            className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:outline-none focus:border-[#E93B66]"
                            required
                        >
                            <option value="referee">裁判 (Referee)</option>
                            <option value="streamer">直播 (Streamer)</option>
                            <option value="commentator">解说 (Commentator)</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-[#E93B66] text-white rounded-md hover:bg-[#d32f5a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {loading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
                            )}
                            分配Staff
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function JoinRoomModal({ onClose, onJoin, room, user }: {
    onClose: () => void;
    onJoin: (roomId: number, role: 'referee' | 'streamer' | 'commentator') => void;
    room: MatchRoom;
    user: UserSession;
}) {
    const [selectedRole, setSelectedRole] = useState<'referee' | 'streamer' | 'commentator'>('referee');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onJoin(room.id, selectedRole);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">参加房间</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                        <h4 className="text-white font-medium mb-2">{room.room_name}</h4>
                        <div className="text-sm text-gray-400 space-y-1">
                            <div>轮次: {room.round_number} | 场次: {room.match_number}</div>
                            <div>日期: {room.match_date} | 时间: {room.match_time}</div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            选择您的角色 *
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center p-3 bg-[#1a1a1a] rounded-lg cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                                <input
                                    type="radio"
                                    name="role"
                                    value="referee"
                                    checked={selectedRole === 'referee'}
                                    onChange={(e) => setSelectedRole(e.target.value as 'referee')}
                                    className="mr-3 text-[#E93B66] focus:ring-[#E93B66]"
                                />
                                <div>
                                    <div className="text-white font-medium">裁判 (Referee)</div>
                                    <div className="text-sm text-gray-400">负责比赛裁决和规则执行</div>
                                </div>
                            </label>

                            <label className="flex items-center p-3 bg-[#1a1a1a] rounded-lg cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                                <input
                                    type="radio"
                                    name="role"
                                    value="streamer"
                                    checked={selectedRole === 'streamer'}
                                    onChange={(e) => setSelectedRole(e.target.value as 'streamer')}
                                    className="mr-3 text-[#E93B66] focus:ring-[#E93B66]"
                                />
                                <div>
                                    <div className="text-white font-medium">直播 (Streamer)</div>
                                    <div className="text-sm text-gray-400">负责比赛直播和技术支持</div>
                                </div>
                            </label>

                            <label className="flex items-center p-3 bg-[#1a1a1a] rounded-lg cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                                <input
                                    type="radio"
                                    name="role"
                                    value="commentator"
                                    checked={selectedRole === 'commentator'}
                                    onChange={(e) => setSelectedRole(e.target.value as 'commentator')}
                                    className="mr-3 text-[#E93B66] focus:ring-[#E93B66]"
                                />
                                <div>
                                    <div className="text-white font-medium">解说 (Commentator)</div>
                                    <div className="text-sm text-gray-400">负责比赛解说和观众互动</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-[#E93B66] text-white rounded-md hover:bg-[#d32f5a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {loading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
                            )}
                            申请参加
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AdminPage() {
    const router = useRouter();
    usePageTitle('/schedulemanagement');
    const [user, setUser] = useState<UserSession | null>(null);
    const [permissions, setPermissions] = useState<UserPermissions>({
        isMapSelector: false,
        isReplayTester: false,
        isAdmin: false,
        isStreamer: false,
        isReferee: false
    });
    const [loading, setLoading] = useState(true);
    const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
    const [registrationsLoading, setRegistrationsLoading] = useState(false);
    const [processingUser, setProcessingUser] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');

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
    const [showCreateStaffAssignmentModal, setShowCreateStaffAssignmentModal] = useState(false);
    const [deletingAssignmentId, setDeletingAssignmentId] = useState<number | null>(null);
    const [selectedRoomForJoin, setSelectedRoomForJoin] = useState<MatchRoom | null>(null);

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

    // 当切换到直播裁判选项卡时获取staff分配列表
    useEffect(() => {
        if (activeTab === 'streaming' && (permissions.isAdmin || permissions.isReferee || permissions.isStreamer)) {
            fetchStaffAssignments();
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

    // 房间管理函数
    const fetchRooms = async () => {
        setRoomsLoading(true);
        try {
            const response = await fetch('/api/match-rooms');
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
                alert('房间删除成功');
            } else {
                alert('删除失败: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting room:', error);
            alert('删除房间时发生错误');
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
                setShowCreateRoomModal(false);
                fetchRooms(); // 重新获取房间列表
                alert('房间创建成功');
            } else {
                alert('创建失败: ' + data.error);
            }
        } catch (error) {
            console.error('Error creating room:', error);
            alert('创建房间时发生错误');
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
                alert('对战删除成功');
            } else {
                alert('删除失败: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting matchup:', error);
            alert('删除对战时发生错误');
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
                setShowCreateMatchupModal(false);
                fetchMatchups(); // 重新获取对战列表
                alert('对战创建成功');
            } else {
                alert('创建失败: ' + data.error);
            }
        } catch (error) {
            console.error('Error creating matchup:', error);
            alert('创建对战时发生错误');
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

    // 创建staff房间分配
    const handleCreateStaffAssignment = async (assignmentData: {
        room_id: number;
        staff_osuId: string;
        staff_username: string;
        staff_role: 'referee' | 'streamer' | 'commentator';
    }) => {
        if (!user) return;

        try {
            const response = await fetch('/api/staff-room-assignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...assignmentData,
                    assigned_by: user.osuId
                }),
            });

            if (response.ok) {
                fetchStaffAssignments(); // 重新获取列表
                setShowCreateStaffAssignmentModal(false);
            } else {
                alert('创建staff分配失败');
            }
        } catch (error) {
            console.error('Error creating staff assignment:', error);
            alert('创建staff分配时发生错误');
        }
    };

    // 更新staff分配状态
    const handleUpdateStaffAssignmentStatus = async (assignmentId: number, status: StaffRoomAssignment['status']) => {
        if (!user) return;

        try {
            const response = await fetch(`/api/staff-room-assignments/${assignmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status,
                    staff_osuId: user.osuId // 用于权限验证
                }),
            });

            if (response.ok) {
                fetchStaffAssignments(); // 重新获取列表
            } else {
                alert('更新分配状态失败');
            }
        } catch (error) {
            console.error('Error updating staff assignment status:', error);
            alert('更新分配状态时发生错误');
        }
    };

    // 删除staff分配
    const handleDeleteStaffAssignment = async (assignmentId: number) => {
        if (!confirm('确定要删除这个staff分配吗？此操作不可撤销。')) {
            return;
        }

        try {
            setDeletingAssignmentId(assignmentId);
            const response = await fetch(`/api/staff-room-assignments/${assignmentId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchStaffAssignments(); // 重新获取列表
            } else {
                alert('删除staff分配失败');
            }
        } catch (error) {
            console.error('Error deleting staff assignment:', error);
            alert('删除staff分配时发生错误');
        } finally {
            setDeletingAssignmentId(null);
        }
    };

    // Staff加入房间
    const handleJoinRoom = async (roomId: number, role: 'referee' | 'streamer' | 'commentator') => {
        if (!user) return;

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
                    assigned_by: user.osuId // Staff自己申请，所以assigned_by也是自己
                }),
            });

            if (response.ok) {
                fetchStaffAssignments(); // 重新获取列表
                alert('申请成功！请等待管理员确认。');
            } else {
                const errorData = await response.json();
                alert(`申请失败: ${errorData.error || '未知错误'}`);
            }
        } catch (error) {
            console.error('Error joining room:', error);
            alert('申请参加房间时发生错误');
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

                        {(permissions?.isStreamer || permissions?.isReferee || permissions?.isAdmin) && (
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
                        )}
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
                        {activeTab === 'matchups' && '对战列表管理'}
                        {activeTab === 'rooms' && '比赛房间管理'}
                        {activeTab === 'matches' && '比赛管理'}
                        {activeTab === 'streaming' && '直播裁判'}
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

                    {activeTab === 'rooms' && (
                        <div className="space-y-6">
                            <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                    <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                                    比赛房间管理
                                </h3>

                                {roomsLoading ? (
                                    <div className="flex justify-center items-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E93B66]"></div>
                                        <span className="ml-2 text-gray-400">加载中...</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {/* 添加房间卡片 */}
                                        <div
                                            onClick={() => setShowCreateRoomModal(true)}
                                            className="bg-[#2d2d2d] border-2 border-dashed border-gray-600 hover:border-[#E93B66] rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 min-h-[200px]"
                                        >
                                            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            <span className="text-gray-400 text-center">添加新房间</span>
                                        </div>

                                        {/* 房间卡片列表 */}
                                        {rooms.map((room) => (
                                            <div key={room.id} className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-4 hover:border-[#E93B66] transition-colors duration-200">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="text-white font-semibold text-sm truncate flex-1 mr-2">{room.room_name}</h4>
                                                    <button
                                                        onClick={() => handleDeleteRoom(room.id)}
                                                        disabled={deletingRoomId === room.id}
                                                        className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                                                        title="删除房间"
                                                    >
                                                        {deletingRoomId === room.id ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b border-red-400"></div>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>

                                                <div className="space-y-2 text-xs text-gray-400">
                                                    <div className="flex justify-between">
                                                        <span>轮次:</span>
                                                        <span className="text-white">{room.round_number}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>比赛编号:</span>
                                                        <span className="text-white">{room.match_number}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>日期:</span>
                                                        <span className="text-white">{room.match_date}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>时间:</span>
                                                        <span className="text-white">{room.match_time}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>最大参与者:</span>
                                                        <span className="text-white">{room.max_participants}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>状态:</span>
                                                        <span className={`px-2 py-1 rounded text-xs ${room.status === 'open' ? 'bg-green-600 text-white' :
                                                            room.status === 'in_progress' ? 'bg-yellow-600 text-white' :
                                                                'bg-red-600 text-white'
                                                            }`}>
                                                            {room.status === 'open' ? '开放' :
                                                                room.status === 'in_progress' ? '进行中' : '关闭'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {room.description && (
                                                    <div className="mt-3 pt-3 border-t border-gray-600">
                                                        <p className="text-xs text-gray-500 line-clamp-2">{room.description}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'matchups' && (
                        <div className="space-y-6">
                            <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                    <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                                    对战列表管理
                                </h3>

                                {matchupsLoading ? (
                                    <div className="flex justify-center items-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E93B66]"></div>
                                        <span className="ml-2 text-gray-400">加载中...</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {/* 添加对战卡片 */}
                                        <div
                                            onClick={() => setShowCreateMatchupModal(true)}
                                            className="bg-[#2d2d2d] border-2 border-dashed border-gray-600 hover:border-[#E93B66] rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 min-h-[200px]"
                                        >
                                            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            <span className="text-gray-400 text-center">添加新对战</span>
                                        </div>

                                        {/* 对战卡片列表 */}
                                        {matchups.map((matchup) => (
                                            <div key={matchup.id} className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-4 hover:border-[#E93B66] transition-colors duration-200">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="text-white font-semibold text-sm truncate flex-1 mr-2">
                                                        对战 #{matchup.id}
                                                    </h4>
                                                    <button
                                                        onClick={() => handleDeleteMatchup(matchup.id)}
                                                        disabled={deletingMatchupId === matchup.id}
                                                        className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                                                        title="删除对战"
                                                    >
                                                        {deletingMatchupId === matchup.id ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b border-red-400"></div>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>

                                                <div className="space-y-3">
                                                    {/* 玩家1 */}
                                                    <div className="bg-[#1a1a1a] p-3 rounded">
                                                        <div className="flex items-center mb-1">
                                                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                                            <span className="text-xs text-gray-400">红方</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <img
                                                                src={matchup.player1_avatar_url}
                                                                alt={`${matchup.player1_username} avatar`}
                                                                className="w-8 h-8 rounded-full mr-3"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = '/unknow.svg'; // fallback to default avatar
                                                                }}
                                                            />
                                                            <div>
                                                                <p className="text-white text-sm font-medium">{matchup.player1_username}</p>
                                                                <p className="text-xs text-gray-500">ID: {matchup.player1_osuId}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* VS */}
                                                    <div className="flex justify-center">
                                                        <span className="text-[#E93B66] font-bold text-lg">VS</span>
                                                    </div>

                                                    {/* 玩家2 */}
                                                    <div className="bg-[#1a1a1a] p-3 rounded">
                                                        <div className="flex items-center mb-1">
                                                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                                            <span className="text-xs text-gray-400">蓝方</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <img
                                                                src={matchup.player2_avatar_url}
                                                                alt={`${matchup.player2_username} avatar`}
                                                                className="w-8 h-8 rounded-full mr-3"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = '/unknow.svg'; // fallback to default avatar
                                                                }}
                                                            />
                                                            <div>
                                                                <p className="text-white text-sm font-medium">{matchup.player2_username}</p>
                                                                <p className="text-xs text-gray-500">ID: {matchup.player2_osuId}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-3 pt-3 border-t border-gray-600">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-gray-400">状态:</span>
                                                        <span className={`px-2 py-1 rounded text-xs ${matchup.status === 'available' ? 'bg-green-600 text-white' :
                                                            matchup.status === 'in_progress' ? 'bg-yellow-600 text-white' :
                                                                'bg-blue-600 text-white'
                                                            }`}>
                                                            {matchup.status === 'available' ? '可参加' :
                                                                matchup.status === 'in_progress' ? '进行中' : '已完成'}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 text-xs text-gray-500">
                                                        创建时间: {new Date(matchup.created_at).toLocaleString('zh-CN')}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'streaming' && (
                        <div className="space-y-6">
                            <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                    <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                                    {permissions.isAdmin ? 'Staff房间分配管理' : '直播裁判房间确认'}
                                </h3>

                                {staffAssignmentsLoading ? (
                                    <div className="flex justify-center items-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E93B66]"></div>
                                        <span className="ml-2 text-gray-400">加载中...</span>
                                    </div>
                                ) : permissions.isAdmin ? (
                                    // 管理员视图 - 显示所有申请，允许确认/拒绝
                                    <div className="space-y-4">
                                        {/* 添加分配按钮 */}
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => setShowCreateStaffAssignmentModal(true)}
                                                className="bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-6 py-3 transition-colors duration-200 font-medium flex items-center"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                手动分配Staff到房间
                                            </button>
                                        </div>

                                        {/* Staff分配列表 */}
                                        {staffAssignments.length > 0 ? (
                                            <div className="space-y-3">
                                                {staffAssignments.map((assignment) => (
                                                    <div key={assignment.id} className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-4 hover:border-[#E93B66] transition-colors duration-200">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center space-x-3">
                                                                <img
                                                                    src={assignment.staff_avatar_url || '/unknow.svg'}
                                                                    alt={`${assignment.staff_username} avatar`}
                                                                    className="w-10 h-10 rounded-full"
                                                                    onError={(e) => {
                                                                        e.currentTarget.src = '/unknow.svg';
                                                                    }}
                                                                />
                                                                <div>
                                                                    <h4 className="text-white font-semibold">{assignment.staff_username}</h4>
                                                                    <p className="text-sm text-gray-400">ID: {assignment.staff_osuId}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <span className={`px-2 py-1 rounded text-xs font-medium ${assignment.staff_role === 'referee' ? 'bg-blue-600 text-white' :
                                                                        assignment.staff_role === 'streamer' ? 'bg-purple-600 text-white' :
                                                                            'bg-green-600 text-white'
                                                                    }`}>
                                                                    {assignment.staff_role === 'referee' ? '裁判' :
                                                                        assignment.staff_role === 'streamer' ? '直播' : '解说'}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleDeleteStaffAssignment(assignment.id)}
                                                                    disabled={deletingAssignmentId === assignment.id}
                                                                    className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                                                                    title="删除分配"
                                                                >
                                                                    {deletingAssignmentId === assignment.id ? (
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-b border-red-400"></div>
                                                                    ) : (
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between items-center">
                                                            <div className="text-sm text-gray-400">
                                                                <span>房间: </span>
                                                                <span className="text-white">
                                                                    {assignment.room?.room_name || `房间 ${assignment.room_id}`}
                                                                    (轮次 {assignment.room?.round_number}, 场次 {assignment.room?.match_number})
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center space-x-3">
                                                                <span className="text-xs text-gray-400">状态:</span>
                                                                <div className="flex items-center space-x-2">
                                                                    {assignment.status === 'confirmed' ? (
                                                                        <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">已确认</span>
                                                                    ) : assignment.status === 'declined' ? (
                                                                        <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">已拒绝</span>
                                                                    ) : (
                                                                        <div className="flex space-x-2">
                                                                            <button
                                                                                onClick={() => handleUpdateStaffAssignmentStatus(assignment.id, 'confirmed')}
                                                                                className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
                                                                            >
                                                                                确认
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleUpdateStaffAssignmentStatus(assignment.id, 'declined')}
                                                                                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                                                                            >
                                                                                拒绝
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-2 text-xs text-gray-500">
                                                            分配时间: {new Date(assignment.assigned_at).toLocaleString('zh-CN')}
                                                            {assignment.responded_at && (
                                                                <span className="ml-4">
                                                                    响应时间: {new Date(assignment.responded_at).toLocaleString('zh-CN')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-400">
                                                <p>暂无Staff房间分配</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Staff视图 - 显示自己的申请和可参加的房间
                                    <div className="space-y-6">
                                        {/* 已参加的房间 */}
                                        {staffAssignments.filter(a => a.staff_osuId === user.osuId && a.status === 'confirmed').length > 0 && (
                                            <div>
                                                <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                                                    我已确认参加的房间
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                                    {staffAssignments
                                                        .filter(a => a.staff_osuId === user.osuId && a.status === 'confirmed')
                                                        .map((assignment) => (
                                                            <div key={assignment.id} className="bg-[#2d2d2d] border border-green-600 rounded-lg p-4">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <h5 className="text-white font-semibold text-sm truncate flex-1 mr-2">
                                                                        {assignment.room?.room_name || `房间 ${assignment.room_id}`}
                                                                    </h5>
                                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${assignment.staff_role === 'referee' ? 'bg-blue-600 text-white' :
                                                                        assignment.staff_role === 'streamer' ? 'bg-purple-600 text-white' :
                                                                            'bg-green-600 text-white'
                                                                        }`}>
                                                                        {assignment.staff_role === 'referee' ? '裁判' :
                                                                            assignment.staff_role === 'streamer' ? '直播' : '解说'}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-gray-400 space-y-1">
                                                                    <div>轮次: {assignment.room?.round_number} | 场次: {assignment.room?.match_number}</div>
                                                                    <div>日期: {assignment.room?.match_date} | 时间: {assignment.room?.match_time}</div>
                                                                </div>
                                                                <div className="mt-3 flex justify-end">
                                                                    <button
                                                                        onClick={() => handleUpdateStaffAssignmentStatus(assignment.id, 'declined')}
                                                                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                                                                    >
                                                                        取消参加
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 待处理的申请 */}
                                        {staffAssignments.filter(a => a.staff_osuId === user.osuId && a.status === 'pending').length > 0 && (
                                            <div>
                                                <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                                                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                                                    待确认的申请
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                                    {staffAssignments
                                                        .filter(a => a.staff_osuId === user.osuId && a.status === 'pending')
                                                        .map((assignment) => (
                                                            <div key={assignment.id} className="bg-[#2d2d2d] border border-yellow-600 rounded-lg p-4">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <h5 className="text-white font-semibold text-sm truncate flex-1 mr-2">
                                                                        {assignment.room?.room_name || `房间 ${assignment.room_id}`}
                                                                    </h5>
                                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${assignment.staff_role === 'referee' ? 'bg-blue-600 text-white' :
                                                                        assignment.staff_role === 'streamer' ? 'bg-purple-600 text-white' :
                                                                            'bg-green-600 text-white'
                                                                        }`}>
                                                                        {assignment.staff_role === 'referee' ? '裁判' :
                                                                            assignment.staff_role === 'streamer' ? '直播' : '解说'}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-gray-400 space-y-1">
                                                                    <div>轮次: {assignment.room?.round_number} | 场次: {assignment.room?.match_number}</div>
                                                                    <div>日期: {assignment.room?.match_date} | 时间: {assignment.room?.match_time}</div>
                                                                </div>
                                                                <div className="mt-3 text-xs text-yellow-400">
                                                                    等待管理员确认...
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 可参加的房间 */}
                                        <div>
                                            <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                                                <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                                                可参加的比赛房间
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {rooms
                                                    .filter(room => room.status !== 'closed')
                                                    .map((room) => {
                                                        const myAssignment = staffAssignments.find(a =>
                                                            a.staff_osuId === user.osuId && a.room_id === room.id
                                                        );
                                                        const isParticipating = myAssignment && myAssignment.status !== 'declined';

                                                        return (
                                                            <div key={room.id} className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-4 hover:border-[#E93B66] transition-colors duration-200">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <h5 className="text-white font-semibold text-sm truncate flex-1 mr-2">
                                                                        {room.room_name}
                                                                    </h5>
                                                                    <span className={`px-2 py-1 rounded text-xs ${room.status === 'open' ? 'bg-green-600 text-white' :
                                                                        room.status === 'in_progress' ? 'bg-yellow-600 text-white' :
                                                                            'bg-red-600 text-white'
                                                                        }`}>
                                                                        {room.status === 'open' ? '开放' :
                                                                            room.status === 'in_progress' ? '进行中' : '关闭'}
                                                                    </span>
                                                                </div>

                                                                <div className="text-xs text-gray-400 space-y-1 mb-4">
                                                                    <div>轮次: {room.round_number} | 场次: {room.match_number}</div>
                                                                    <div>日期: {room.match_date} | 时间: {room.match_time}</div>
                                                                    <div>最大参与者: {room.max_participants}</div>
                                                                </div>

                                                                {room.description && (
                                                                    <div className="text-xs text-gray-500 mb-4 line-clamp-2">
                                                                        {room.description}
                                                                    </div>
                                                                )}

                                                                <div className="flex justify-end">
                                                                    {isParticipating ? (
                                                                        <div className="text-xs text-green-400 flex items-center">
                                                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                            </svg>
                                                                            已申请
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => setSelectedRoomForJoin(room)}
                                                                            className="px-4 py-2 bg-[#E93B66] hover:bg-[#3BE9D8] text-white text-sm rounded transition-colors"
                                                                        >
                                                                            参加房间
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>

                                            {rooms.filter(room => room.status !== 'closed').length === 0 && (
                                                <div className="text-center py-8 text-gray-400">
                                                    <p>暂无可参加的比赛房间</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* 创建房间模态框 */}
            {showCreateRoomModal && (
                <CreateRoomModal
                    onClose={() => setShowCreateRoomModal(false)}
                    onCreate={handleCreateRoom}
                />
            )}

            {/* 创建对战模态框 */}
            {showCreateMatchupModal && (
                <CreateMatchupModal
                    onClose={() => setShowCreateMatchupModal(false)}
                    onCreate={handleCreateMatchup}
                    approvedPlayers={approvedPlayers}
                />
            )}

            {/* 创建Staff分配模态框 */}
            {showCreateStaffAssignmentModal && (
                <CreateStaffAssignmentModal
                    onClose={() => setShowCreateStaffAssignmentModal(false)}
                    onCreate={handleCreateStaffAssignment}
                    rooms={rooms}
                />
            )}

            {/* 加入房间模态框 */}
            {selectedRoomForJoin && user && (
                <JoinRoomModal
                    onClose={() => setSelectedRoomForJoin(null)}
                    onJoin={handleJoinRoom}
                    room={selectedRoomForJoin}
                    user={user}
                />
            )}
        </div>
    );
}