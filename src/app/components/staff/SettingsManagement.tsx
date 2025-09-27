"use client";

import { useState, useEffect } from 'react';
import { showSuccess, showError } from '@/app/components/ui/Notification';

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
    registration_enabled: boolean;
    mappool_visible: boolean;
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
        registration_enabled: true,
        mappool_visible: false
    });

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

    const handleGroupChange = (groupType: 'admin_group' | 'map_selection_group' | 'map_testing_group', value: string) => {
        const users = value.split('\n').map(user => user.trim()).filter(user => user.length > 0);
        setFormData(prev => ({
            ...prev,
            [groupType]: users
        }));
    };

    const getGroupText = (group: string[]) => {
        return group.join('\n');
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
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E93B66]"></div>
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
                            <select
                                value={formData.current_season}
                                onChange={(e) => setFormData(prev => ({ ...prev, current_season: e.target.value }))}
                                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                            >
                                <option value="s1">Season 1</option>
                                <option value="s2">Season 2</option>
                                <option value="s3">Season 3</option>
                            </select>
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
                            <select
                                value={formData.current_season_stage}
                                onChange={(e) => setFormData(prev => ({ ...prev, current_season_stage: e.target.value }))}
                                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none"
                            >
                                <option value="registration">报名阶段</option>
                                <option value="qualification">资格赛阶段</option>
                                <option value="group_stage">小组赛阶段</option>
                                <option value="playoffs">淘汰赛阶段</option>
                                <option value="finals">决赛阶段</option>
                                <option value="completed">已结束</option>
                            </select>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                管理员组
                            </label>
                            <textarea
                                value={getGroupText(formData.admin_group)}
                                onChange={(e) => handleGroupChange('admin_group', e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none resize-none"
                                placeholder="每行一个用户名"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                选图组
                            </label>
                            <textarea
                                value={getGroupText(formData.map_selection_group)}
                                onChange={(e) => handleGroupChange('map_selection_group', e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none resize-none"
                                placeholder="每行一个用户名"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                测图组
                            </label>
                            <textarea
                                value={getGroupText(formData.map_testing_group)}
                                onChange={(e) => handleGroupChange('map_testing_group', e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md text-white focus:border-[#E93B66] focus:outline-none resize-none"
                                placeholder="每行一个用户名"
                            />
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
                                <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
                            )}
                            保存设置
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}