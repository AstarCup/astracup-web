"use client";

import { useState } from 'react';
import Image from 'next/image';
import { MatchRoom } from './types';
import { showSuccess, showError } from '@/app/components/Notification';

interface RoomManagementProps {
    rooms: MatchRoom[];
    roomsLoading: boolean;
    deletingRoomId: number | null;
    onDeleteRoom: (roomId: number) => void;
    onCreateRoom: (roomData: {
        room_name: string;
        round_number: number;
        match_date: string;
        match_time: string;
        match_number: number;
        max_participants: number;
        description: string;
    }) => void;
}

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

export default function RoomManagement({ rooms, roomsLoading, deletingRoomId, onDeleteRoom, onCreateRoom }: RoomManagementProps) {
    const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);

    const handleDeleteRoom = async (roomId: number) => {
        if (!confirm('确定要删除这个比赛房间吗？此操作不可撤销。')) {
            return;
        }
        onDeleteRoom(roomId);
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
        await onCreateRoom(roomData);
        setShowCreateRoomModal(false);
    };

    return (
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

                                {/* 显示比赛预约信息 */}
                                {room.schedules && room.schedules.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-600">
                                        <div className="text-xs text-gray-400 mb-2">比赛预约:</div>
                                        <div className="space-y-2">
                                            {room.schedules.map((schedule) => (
                                                <div key={schedule.id} className="bg-[#1a1a1a] rounded p-2">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center space-x-2">
                                                            <Image
                                                                src={schedule.player1_avatar_url || '/default-avatar.png'}
                                                                alt={schedule.player1_username}
                                                                width={20}
                                                                height={20}
                                                                className="rounded-full"
                                                            />
                                                            <span className="text-white text-xs">{schedule.player1_username}</span>
                                                        </div>
                                                        <span className="text-gray-400 text-xs">vs</span>
                                                        <div className="flex items-center space-x-2">
                                                            <Image
                                                                src={schedule.player2_avatar_url || '/default-avatar.png'}
                                                                alt={schedule.player2_username}
                                                                width={20}
                                                                height={20}
                                                                className="rounded-full"
                                                            />
                                                            <span className="text-white text-xs">{schedule.player2_username}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(schedule.scheduled_time).toLocaleString('zh-CN')}
                                                        </span>
                                                        <span className={`px-2 py-1 rounded text-xs ${schedule.status === 'scheduled' ? 'bg-blue-600 text-white' :
                                                            schedule.status === 'in_progress' ? 'bg-yellow-600 text-white' :
                                                                'bg-green-600 text-white'
                                                            }`}>
                                                            {schedule.status === 'scheduled' ? '已预约' :
                                                                schedule.status === 'in_progress' ? '进行中' : '已完成'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

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

            {/* 创建房间模态框 */}
            {showCreateRoomModal && (
                <CreateRoomModal
                    onClose={() => setShowCreateRoomModal(false)}
                    onCreate={handleCreateRoom}
                />
            )}
        </div>
    );
}