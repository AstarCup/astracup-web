"use client";

import { useState, useEffect } from "react";
import { MatchSettings as MatchSettingsType, Player } from "../types/match";
import Image from "next/image";

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

    const handleBoFormatChange = (boFormat: MatchSettingsType['boFormat']) => {
        onSettingsChange({
            ...settings,
            boFormat
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

    const getTeamColor = (team: 'red' | 'blue') => {
        return team === 'red' ? '#E93B66' : '#3BE9D8';
    };

    return (
        <div className="bg-[#3D3D3D] p-6 rounded-lg border-b-4 border-[#E93B66] mb-6">
            <h3 className="text-2xl font-bold text-white mb-6">比赛设置</h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* BO赛制选择 */}
                <div className="flex flex-col">
                    <label className="text-sm text-gray-200 mb-2 font-medium">BO赛制</label>
                    <select
                        value={settings.boFormat}
                        onChange={(e) => handleBoFormatChange(e.target.value as MatchSettingsType['boFormat'])}
                        className="bg-[#2D2D2D] text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-[#E93B66] transition-colors"
                    >
                        <option value="BO3">BO3 (先得2分)</option>
                        <option value="BO5">BO5 (先得3分)</option>
                        <option value="BO7">BO7 (先得4分)</option>
                        <option value="BO9">BO9 (先得5分)</option>
                        <option value="BO11">BO11 (先得6分)</option>
                    </select>
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
                                <Image
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
                        <select
                            value={settings.redPlayer?.osuId || ''}
                            onChange={(e) => {
                                const playerId = e.target.value;
                                const player = players.find(p => p.osuId === playerId);
                                handlePlayerChange('red', player);
                            }}
                            className="flex-1 bg-[#2D2D2D] text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-[#E93B66] transition-colors"
                        >
                            <option value="">选择红队玩家...</option>
                            {loading ? (
                                <option value="">加载中...</option>
                            ) : (
                                players.map(player => (
                                    <option key={player.osuId} value={player.osuId}>
                                        {player.inGameName} ({player.username}) - {Math.round(player.pp)}pp
                                    </option>
                                ))
                            )}
                        </select>
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
                                <Image
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
                        <select
                            value={settings.bluePlayer?.osuId || ''}
                            onChange={(e) => {
                                const playerId = e.target.value;
                                const player = players.find(p => p.osuId === playerId);
                                handlePlayerChange('blue', player);
                            }}
                            className="flex-1 bg-[#2D2D2D] text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-[#3BE9D8] transition-colors"
                        >
                            <option value="">选择蓝队玩家...</option>
                            {loading ? (
                                <option value="">加载中...</option>
                            ) : (
                                players.map(player => (
                                    <option key={player.osuId} value={player.osuId}>
                                        {player.inGameName} ({player.username}) - {Math.round(player.pp)}pp
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
