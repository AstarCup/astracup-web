"use client";

import { useState } from 'react';
import { PlayerMatchup, ApprovedPlayer } from './types';
import { showSuccess, showError } from '@/app/components/Notification';

interface MatchupManagementProps {
    matchups: PlayerMatchup[];
    matchupsLoading: boolean;
    deletingMatchupId: number | null;
    approvedPlayers: ApprovedPlayer[];
    onDeleteMatchup: (matchupId: number) => void;
    onCreateMatchup: (matchupData: {
        player1_osuId: number;
        player1_username: string;
        player2_osuId: number;
        player2_username: string;
    }) => void;
}

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

export default function MatchupManagement({ matchups, matchupsLoading, deletingMatchupId, approvedPlayers, onDeleteMatchup, onCreateMatchup }: MatchupManagementProps) {
    const [showCreateMatchupModal, setShowCreateMatchupModal] = useState(false);

    const handleDeleteMatchup = async (matchupId: number) => {
        if (!confirm('确定要删除这个玩家对战吗？此操作不可撤销。')) {
            return;
        }
        onDeleteMatchup(matchupId);
    };

    const handleCreateMatchup = async (matchupData: {
        player1_osuId: number;
        player1_username: string;
        player2_osuId: number;
        player2_username: string;
    }) => {
        await onCreateMatchup(matchupData);
        setShowCreateMatchupModal(false);
    };

    return (
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

            {/* 创建对战模态框 */}
            {showCreateMatchupModal && (
                <CreateMatchupModal
                    onClose={() => setShowCreateMatchupModal(false)}
                    onCreate={handleCreateMatchup}
                    approvedPlayers={approvedPlayers}
                />
            )}
        </div>
    );
}