"use client";

import { useState, useEffect } from 'react';
import { showSuccess, showError } from '@/app/components/ui/Notification';
import Dropdown from '@/app/components/ui/Dropdown';
import Image from 'next/image';

interface TournamentSettings {
    id?: number;
    tournament_name: string;
    max_pp_for_registration: number;
    min_pp_for_registration: number;
    current_season: string;
    current_season_stage: string;
    admin_group: string[];
    map_selection_group: string[];
    map_testing_group: string[];
    streamer_group: string[];
    referee_group: string[];
    commentator_group: string[];
    registration_enabled: boolean;
    mappool_visible: boolean;
}

interface UserInfo {
    id: number;
    username: string;
    avatar_url: string;
    country_code: string;
    pp: number;
    global_rank: number | null;
}

interface SettingsManagementProps {
    userOsuId: string;
    isAdmin: boolean;
}

export default function SettingsManagement({ userOsuId, isAdmin }: SettingsManagementProps) {
    const [settings, setSettings] = useState<TournamentSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<TournamentSettings>({
        tournament_name: '',
        max_pp_for_registration: 7000,
        min_pp_for_registration: 0,
        current_season: 's1',
        current_season_stage: 'registration',
        admin_group: [],
        map_selection_group: [],
        map_testing_group: [],
        streamer_group: [],
        referee_group: [],
        commentator_group: [],
        registration_enabled: true,
        mappool_visible: false
    });

    // 模态框状态
    const [showAddModal, setShowAddModal] = useState(false);
    const [currentGroupType, setCurrentGroupType] = useState<'admin_group' | 'map_selection_group' | 'map_testing_group' | 'streamer_group' | 'referee_group' | 'commentator_group' | null>(null);
    const [userIdInput, setUserIdInput] = useState('');
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [fetchingUser, setFetchingUser] = useState(false);
    const [initializingDatabase, setInitializingDatabase] = useState(false);
    const [databaseStatus, setDatabaseStatus] = useState<string>('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/tournament-settings');
            const data = await response.json();

            if (data.success) {
                setSettings(data.settings);
                setFormData(data.settings);
            } else {
                showError(data.error || '获取设置失败');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            showError('获取设置失败');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!isAdmin) {
            showError('权限不足');
            return;
        }

        try {
            setSaving(true);
            const response = await fetch('/api/tournament-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                showSuccess('设置保存成功');
                fetchSettings(); // 重新获取最新设置
            } else {
                showError(data.error || '保存失败');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            showError('保存失败');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveUser = (groupType: 'admin_group' | 'map_selection_group' | 'map_testing_group' | 'streamer_group' | 'referee_group' | 'commentator_group', userId: string) => {
        setFormData(prev => ({
            ...prev,
            [groupType]: prev[groupType].filter(id => id !== userId)
        }));
    };

    const handleAddUser = () => {
        if (!userInfo || !currentGroupType) return;

        const userId = userInfo.id.toString();
        if (formData[currentGroupType].includes(userId)) {
            showError('该用户已在组中');
            return;
        }

        setFormData(prev => ({
            ...prev,
            [currentGroupType]: [...prev[currentGroupType], userId]
        }));

        // 关闭模态框并重置状态
        setShowAddModal(false);
        setUserIdInput('');
        setUserInfo(null);
        setCurrentGroupType(null);
        showSuccess('用户添加成功');
    };

    const handleFetchUser = async () => {
        if (!userIdInput.trim()) {
            showError('请输入用户ID');
            return;
        }

        try {
            setFetchingUser(true);
            const response = await fetch('/api/get-user-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: userIdInput.trim() }),
            });

            const data = await response.json();

            if (data.success) {
                setUserInfo(data.user);
            } else {
                showError(data.error || '获取用户信息失败');
                setUserInfo(null);
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
            showError('获取用户信息失败');
            setUserInfo(null);
        } finally {
            setFetchingUser(false);
        }
    };

    const openAddModal = (groupType: 'admin_group' | 'map_selection_group' | 'map_testing_group' | 'streamer_group' | 'referee_group' | 'commentator_group') => {
        setCurrentGroupType(groupType);
        setShowAddModal(true);
        setUserIdInput('');
        setUserInfo(null);
    };

    const closeAddModal = () => {
        setShowAddModal(false);
        setCurrentGroupType(null);
        setUserIdInput('');
        setUserInfo(null);
    };

    const handleInitializeDatabase = async () => {
        if (!isAdmin) {
            showError('权限不足');
            return;
        }

        try {
            setInitializingDatabase(true);
            setDatabaseStatus('正在初始化数据库...');

            const response = await fetch('/api/admin/init-database', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                setDatabaseStatus('数据库初始化成功！');
                showSuccess('数据库初始化成功');
            } else {
                setDatabaseStatus(`初始化失败: ${data.error}`);
                showError(data.error || '数据库初始化失败');
            }
        } catch (error) {
            console.error('Error initializing database:', error);
            setDatabaseStatus('初始化过程中发生错误');
            showError('数据库初始化失败');
        } finally {
            setInitializingDatabase(false);
        }
    };

    const getGroupName = (groupType: 'admin_group' | 'map_selection_group' | 'map_testing_group' | 'streamer_group' | 'referee_group' | 'commentator_group') => {
        switch (groupType) {
            case 'admin_group': return '管理员组';
            case 'map_selection_group': return '选图组';
            case 'map_testing_group': return '测图组';
            case 'streamer_group': return '直播组';
            case 'referee_group': return '裁判组';
            case 'commentator_group': return '解说组';
        }
    };

    const renderUserList = (groupType: 'admin_group' | 'map_selection_group' | 'map_testing_group' | 'streamer_group' | 'referee_group' | 'commentator_group', users: string[]) => {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-300">
                        {getGroupName(groupType)}
                    </label>
                    <button
                        onClick={() => openAddModal(groupType)}
                        className="px-3 py-1 bg-[#E93B66] text-white text-xs rounded hover:bg-[#d32f5a] flex items-center"
                    >
                        <span className="mr-1">+</span>
                        添加
                    </button>
                </div>
                <div className="bg-[#1a1a1a] border border-gray-600 rounded-md min-h-[100px] p-3">
                    {users.length === 0 ? (
                        <p className="text-gray-500 text-sm">暂无成员</p>
                    ) : (
                        <div className="space-y-2">
                            {users.map((userId) => (
                                <div key={userId} className="flex items-center justify-between bg-[#2a2a2a] p-2 rounded">
                                    <span className="text-white text-sm">ID: {userId}</span>
                                    <button
                                        onClick={() => handleRemoveUser(groupType, userId)}
                                        className="text-red-400 hover:text-red-300 text-sm px-2 py-1"
                                    >
                                        删除
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                        系统设置
                    </h3>
                    <div className="bg-[#3D3D3D80] p-4 border border-gray-600">
                        <div className="flex justify-center items-center py-8">
                            <Image src='/icons/loading.svg' alt='loading' width={120} height={120} className='animate-spin' />
                            <span className="ml-2 text-gray-400">加载中...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                    比赛设置管理
                </h3>
                <div className="bg-[#3D3D3D80] p-6 border border-gray-600 space-y-6">
                    {/* 基本信息 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                比赛名称 *
                            </label>
                            <input
                                type="text"
                                value={formData.tournament_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, tournament_name: e.target.value }))}
                                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                                placeholder="输入比赛名称"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                当前赛季
                            </label>
                            <Dropdown
                                options={[
                                    { value: "s1", label: "Season 1" },
                                    { value: "s2", label: "Season 2" },
                                    { value: "s3", label: "Season 3" }
                                ]}
                                value={formData.current_season}
                                onChange={(value) => setFormData(prev => ({ ...prev, current_season: value }))}
                                darkMode={true}
                            />
                        </div>
                    </div>

                    {/* PP分段设置 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                报名最低PP限制
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={formData.min_pp_for_registration}
                                onChange={(e) => setFormData(prev => ({ ...prev, min_pp_for_registration: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                报名最高PP限制
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={formData.max_pp_for_registration}
                                onChange={(e) => setFormData(prev => ({ ...prev, max_pp_for_registration: parseFloat(e.target.value) || 7000 }))}
                                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* 赛季阶段设置 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                当前赛季阶段
                            </label>
                            <Dropdown
                                options={[
                                    { value: "registration", label: "报名阶段" },
                                    { value: "qualification", label: "资格赛阶段" },
                                    { value: "group_stage", label: "小组赛阶段" },
                                    { value: "playoffs", label: "淘汰赛阶段" },
                                    { value: "finals", label: "决赛阶段" },
                                    { value: "completed", label: "已结束" }
                                ]}
                                value={formData.current_season_stage}
                                onChange={(value) => setFormData(prev => ({ ...prev, current_season_stage: value }))}
                                darkMode={true}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="registration_enabled"
                                    checked={formData.registration_enabled}
                                    onChange={(e) => setFormData(prev => ({ ...prev, registration_enabled: e.target.checked }))}
                                    className="w-4 h-4 text-[#E93B66] bg-[#1a1a1a] border-gray-600 rounded focus:ring-[#E93B66] focus:ring-2"
                                />
                                <label htmlFor="registration_enabled" className="ml-2 text-sm text-gray-300">
                                    当前阶段允许报名
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="mappool_visible"
                                    checked={formData.mappool_visible}
                                    onChange={(e) => setFormData(prev => ({ ...prev, mappool_visible: e.target.checked }))}
                                    className="w-4 h-4 text-[#E93B66] bg-[#1a1a1a] border-gray-600 rounded focus:ring-[#E93B66] focus:ring-2"
                                />
                                <label htmlFor="mappool_visible" className="ml-2 text-sm text-gray-300">
                                    当前阶段显示图池
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* 人员分组设置 */}
                    <div className="space-y-6">
                        {renderUserList('admin_group', formData.admin_group)}
                        {renderUserList('map_selection_group', formData.map_selection_group)}
                        {renderUserList('map_testing_group', formData.map_testing_group)}
                        {renderUserList('streamer_group', formData.streamer_group)}
                        {renderUserList('referee_group', formData.referee_group)}
                        {renderUserList('commentator_group', formData.commentator_group)}
                    </div>

                    {/* 数据库初始化 */}
                    <div className="border-t border-gray-600 pt-6">
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                            <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                            数据库管理
                        </h4>
                        <div className="bg-[#2a2a2a] p-4 rounded-md border border-gray-600">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-gray-300 text-sm mb-2">
                                        初始化比赛分数数据库表。此操作将创建必要的数据库表结构，用于存储比赛分数数据。
                                    </p>
                                    <p className="text-yellow-400 text-xs mb-4">
                                        注意：此操作只会创建表结构，不会删除或修改现有数据。
                                    </p>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={handleInitializeDatabase}
                                        disabled={initializingDatabase || !isAdmin}
                                        className="px-6 py-2 bg-[#E93B66] text-white rounded-md hover:bg-[#d32f5a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {initializingDatabase && (
                                            <Image src='/icons/loading.svg' alt='loading' width={120} height={120} className='animate-spin' />
                                        )}
                                        {initializingDatabase ? '初始化中...' : '初始化数据库'}
                                    </button>

                                    {databaseStatus && (
                                        <div className={`text-sm ${databaseStatus.includes('成功') ? 'text-green-400' : databaseStatus.includes('失败') ? 'text-red-400' : 'text-yellow-400'}`}>
                                            {databaseStatus}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 保存按钮 */}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving || !isAdmin}
                            className="px-6 py-2 bg-[#E93B66] text-white rounded-md hover:bg-[#d32f5a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {saving && (
                                <Image src='/icons/loading.svg' alt='loading' width={120} height={120} className='animate-spin' />
                            )}
                            保存设置
                        </button>
                    </div>
                </div>
            </div>

            {/* 添加用户模态框 */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[#3D3D3D] border border-gray-600 rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-bold text-white mb-4">
                            添加用户到 {currentGroupType && getGroupName(currentGroupType)}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    osu! 用户ID
                                </label>
                                <input
                                    type="text"
                                    value={userIdInput}
                                    onChange={(e) => setUserIdInput(e.target.value)}
                                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                                    placeholder="输入用户ID"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleFetchUser();
                                        }
                                    }}
                                />
                            </div>

                            <div className="flex space-x-2">
                                <button
                                    onClick={handleFetchUser}
                                    disabled={fetchingUser || !userIdInput.trim()}
                                    className="flex-1 px-4 py-2 bg-[#E93B66] text-white rounded-md hover:bg-[#d32f5a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {fetchingUser && (
                                        <Image src='/icons/loading.svg' alt='loading' width={120} height={120} className='animate-spin' />
                                    )}
                                    获取信息
                                </button>
                                <button
                                    onClick={closeAddModal}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
                                >
                                    取消
                                </button>
                            </div>

                            {userInfo && (
                                <div className="bg-[#2a2a2a] p-4 rounded-md border border-gray-600">
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={userInfo.avatar_url}
                                            alt={userInfo.username}
                                            className="w-12 h-12 rounded-full"
                                        />
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{userInfo.username}</p>
                                            <p className="text-gray-400 text-sm">
                                                {userInfo.country_code} • {userInfo.pp.toFixed(0)}pp
                                                {userInfo.global_rank && ` • #${userInfo.global_rank}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex space-x-2">
                                        <button
                                            onClick={handleAddUser}
                                            className="flex-1 px-4 py-2 bg-[#E93B66] text-white rounded-md hover:bg-[#d32f5a]"
                                        >
                                            确认添加
                                        </button>
                                        <button
                                            onClick={() => setUserInfo(null)}
                                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
                                        >
                                            重新输入
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
