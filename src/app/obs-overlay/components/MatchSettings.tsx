"use client";

import { useState, useEffect } from "react";
import { MatchSettings as MatchSettingsType, Player } from "../types/match";
import Image from "next/image";
import Dropdown, { DropdownOption } from "@/app/components/ui/Dropdown";

interface MatchSettingsProps {
    settings: MatchSettingsType;
    onSettingsChange: (settings: MatchSettingsType) => void;
}

export default function MatchSettings({ settings, onSettingsChange }: MatchSettingsProps) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);


    // 获取玩家列表
    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const response = await fetch('/api/obs-overlay/players');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setPlayers(data.players);
                    }
                }
            } catch (error) {
                console.error('获取玩家列表失败:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlayers();
    }, []);

    const handleBoFormatChange = (boFormat: string) => {
        onSettingsChange({
            ...settings,
            boFormat: boFormat as MatchSettingsType['boFormat']
        });
    };

    const handleTeamNameChange = (team: 'red' | 'blue', name: string) => {
        onSettingsChange({
            ...settings,
            [team === 'red' ? 'redTeamName' : 'blueTeamName']: name
        });
    };

    const handlePlayerChange = (team: 'red' | 'blue', player: Player | undefined) => {
        onSettingsChange({
            ...settings,
            [team === 'red' ? 'redPlayer' : 'bluePlayer']: player
        });
    };

    const handlePlayerDropdownChange = (team: 'red' | 'blue', playerId: string) => {
        const player = players.find(p => p.osuId === playerId);
        handlePlayerChange(team, player);
    };

    const getTeamColor = (team: 'red' | 'blue') => {
        return team === 'red' ? '#E93B66' : '#3BE9D8';
    };

    const handleClearStorage = () => {
        try {
            localStorage.removeItem('matchSettings');
            localStorage.removeItem('matchTeams');
            // 重置为默认设置
            onSettingsChange({
                boFormat: 'BO3',
                redTeamName: '',
                blueTeamName: '',
                redPlayer: undefined,
                bluePlayer: undefined
            });
            alert('本地存储数据已清除，请刷新页面以重置比分');
        } catch (error) {
            console.error('清除本地存储失败:', error);
        }
    };

    return (
        <div className="bg-[#3D3D3D] p-6 rounded-lg border-b-4 border-[#E93B66] mb-6">
            <h3 className="text-2xl font-bold text-white mb-6">比赛设置</h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* BO赛制选择 */}
                <div className="flex flex-col">
                    <label className="text-sm text-gray-200 mb-2 font-medium">BO赛制</label>
                    <Dropdown
                        options={[
                            { value: "BO3", label: "BO3 (先得2分)" },
                            { value: "BO5", label: "BO5 (先得3分)" },
                            { value: "BO7", label: "BO7 (先得4分)" },
                            { value: "BO9", label: "BO9 (先得5分)" },
                            { value: "BO11", label: "BO11 (先得6分)" }
                        ]}
                        value={settings.boFormat}
                        onChange={handleBoFormatChange}
                        darkMode={true}
                        minWidth="100%"
                    />
                </div>

                {/* 红队名称 */}
                <div className="flex flex-col">
                    <label className="text-sm text-gray-200 mb-2 font-medium">红队名称</label>
                    <input
                        type="text"
                        value={settings.redTeamName}
                        onChange={(e) => handleTeamNameChange('red', e.target.value)}
                        className="bg-[#2D2D2D] text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-[#E93B66] transition-colors"
                        placeholder="红队名称"
                    />
                </div>

                {/* 蓝队名称 */}
                <div className="flex flex-col">
                    <label className="text-sm text-gray-200 mb-2 font-medium">蓝队名称</label>
                    <input
                        type="text"
                        value={settings.blueTeamName}
                        onChange={(e) => handleTeamNameChange('blue', e.target.value)}
                        className="bg-[#2D2D2D] text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-[#E93B66] transition-colors"
                        placeholder="蓝队名称"
                    />
                </div>
            </div>

            {/* 玩家选择区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 红队玩家选择 */}
                <div className="flex flex-col">
                    <label className="text-sm text-gray-200 mb-2 font-medium" style={{ color: getTeamColor('red') }}>
                        红队玩家
                    </label>
                    <div className="flex gap-3">
                        {settings.redPlayer && (
                            <div className="flex items-center gap-2 bg-[#2D2D2D] p-2 rounded border" style={{ borderColor: getTeamColor('red') }}>
                                <img
                                    src={settings.redPlayer.avatar_url}
                                    alt={settings.redPlayer.username}
                                    width={32}
                                    height={32}
                                    className="rounded"
                                />
                                <span className="text-white text-sm">{settings.redPlayer.inGameName}</span>
                                <button
                                    onClick={() => handlePlayerChange('red', undefined)}
                                    className="text-xs text-gray-400 hover:text-white ml-2"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        <Dropdown
                            options={loading ? [] : [
                                { value: "", label: "选择红队玩家..." },
                                ...players.map(player => ({
                                    value: player.osuId,
                                    label: `${player.inGameName} (${player.username}) - ${Math.round(player.pp)}pp`
                                }))
                            ]}
                            value={settings.redPlayer?.osuId || ""}
                            onChange={(value) => handlePlayerDropdownChange('red', value)}
                            placeholder={loading ? "加载中..." : "选择红队玩家..."}
                            darkMode={true}
                            minWidth="100%"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* 蓝队玩家选择 */}
                <div className="flex flex-col">
                    <label className="text-sm text-gray-200 mb-2 font-medium" style={{ color: getTeamColor('blue') }}>
                        蓝队玩家
                    </label>
                    <div className="flex gap-3">
                        {settings.bluePlayer && (
                            <div className="flex items-center gap-2 bg-[#2D2D2D] p-2 rounded border" style={{ borderColor: getTeamColor('blue') }}>
                                <img
                                    src={settings.bluePlayer.avatar_url}
                                    alt={settings.bluePlayer.username}
                                    width={32}
                                    height={32}
                                    className="rounded"
                                />
                                <span className="text-white text-sm">{settings.bluePlayer.inGameName}</span>
                                <button
                                    onClick={() => handlePlayerChange('blue', undefined)}
                                    className="text-xs text-gray-400 hover:text-white ml-2"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        <Dropdown
                            options={loading ? [] : [
                                { value: "", label: "选择蓝队玩家..." },
                                ...players.map(player => ({
                                    value: player.osuId,
                                    label: `${player.inGameName} (${player.username}) - ${Math.round(player.pp)}pp`
                                }))
                            ]}
                            value={settings.bluePlayer?.osuId || ""}
                            onChange={(value) => handlePlayerDropdownChange('blue', value)}
                            placeholder={loading ? "加载中..." : "选择蓝队玩家..."}
                            darkMode={true}
                            minWidth="100%"
                            disabled={loading}
                        />
                    </div>
                </div>
            </div>

            {/* 清除存储按钮 */}
            <div className="mt-6 pt-4 border-t border-gray-600">
                <button
                    onClick={handleClearStorage}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                >
                    清除本地存储数据
                </button>
                <p className="text-xs text-gray-400 mt-2">
                    清除所有保存的比赛设置数据，恢复为默认值
                </p>
            </div>
        </div>
    );
}
