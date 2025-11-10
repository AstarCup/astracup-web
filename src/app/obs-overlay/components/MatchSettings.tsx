"use client";

import { useState, useEffect } from "react";
import { MatchSettings as MatchSettingsType, Player, TimerState } from "../types/match";
import { BanPickState, MapPoolSettings } from "../types/banpick";
import Image from "next/image";
import Dropdown, { DropdownOption } from "@/app/components/ui/Dropdown";

interface MatchSettingsProps {
    settings: MatchSettingsType;
    onSettingsChange: (settings: MatchSettingsType) => void;
    timerState: TimerState;
    onTimerStateChange: (timerState: TimerState) => void;
    banPickState: BanPickState;
    onBanPickStateChange: (banPickState: BanPickState) => void;
    mapPoolSettings: MapPoolSettings;
    onMapPoolSettingsChange: (mapPoolSettings: MapPoolSettings) => void;
    onResetBanPick: () => void;
}

type TabType = 'match' | 'timer' | 'banpick';

export default function MatchSettings({
    settings,
    onSettingsChange,
    timerState,
    onTimerStateChange,
    banPickState,
    onBanPickStateChange,
    mapPoolSettings,
    onMapPoolSettingsChange,
    onResetBanPick
}: MatchSettingsProps) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('match');

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

    // 计时器逻辑
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (timerState.isRunning && timerState.remainingTime > 0) {
            interval = setInterval(() => {
                onTimerStateChange({
                    ...timerState,
                    remainingTime: timerState.remainingTime - 1
                });
            }, 1000);
        } else if (timerState.remainingTime === 0 && timerState.isRunning) {
            // 计时结束
            onTimerStateChange({
                ...timerState,
                isRunning: false
            });
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [timerState, onTimerStateChange]);

    const handleMatchInfoChange = (matchInfo: string) => {
        onSettingsChange({
            ...settings,
            matchInfo
        });
    };

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
            localStorage.removeItem('timerState');
            // 重置为默认设置
            onSettingsChange({
                matchInfo: '',
                boFormat: 'BO3',
                redTeamName: '',
                blueTeamName: '',
                redPlayer: undefined,
                bluePlayer: undefined
            });
            // 重置计时器
            onTimerStateChange({
                remainingTime: 0,
                isRunning: false
            });
            alert('本地存储数据已清除，请刷新页面以重置比分和计时器');
        } catch (error) {
            console.error('清除本地存储失败:', error);
        }
    };

    // 计时器控制函数
    const startTimer = (seconds: number) => {
        onTimerStateChange({
            remainingTime: seconds,
            isRunning: true
        });
    };

    const toggleTimer = () => {
        onTimerStateChange({
            ...timerState,
            isRunning: !timerState.isRunning
        });
    };

    const clearTimer = () => {
        onTimerStateChange({
            remainingTime: 0,
            isRunning: false
        });
    };

    // 清除阶段名称（当点击清除按钮时）
    const handleClearTimer = () => {
        clearTimer();
        // 这里可以添加清除阶段名称的逻辑，但需要从父组件传递
    };

    return (
        <div className="bg-[#3D3D3D] p-6 rounded-lg border-b-4 border-[#E93B66] mb-6 w-[50%]">
            {/* Tab切换 */}
            <div className="flex mb-6 border-b border-gray-600">
                <button
                    onClick={() => setActiveTab('match')}
                    className={`px-4 py-2 text-2xl font-medium transition-colors ${activeTab === 'match'
                        ? 'text-white border-b-2 border-[#E93B66]'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    比赛设置
                </button>
                <button
                    onClick={() => setActiveTab('timer')}
                    className={`px-4 py-2 text-2xl font-medium transition-colors ${activeTab === 'timer'
                        ? 'text-white border-b-2 border-[#E93B66]'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    计时器控制
                </button>
                <button
                    onClick={() => setActiveTab('banpick')}
                    className={`px-4 py-2 text-2xl font-medium transition-colors ${activeTab === 'banpick'
                        ? 'text-white border-b-2 border-[#E93B66]'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Ban/Pick控制
                </button>
            </div>

            {activeTab === 'match' ? (
                <>
                    {/* 比赛信息 */}
                    <div className="mb-6 text-4xl">
                        <label className="text-gray-200 mb-2 font-medium">比赛信息</label>
                        <input
                            type="text"
                            value={settings.matchInfo || ''}
                            onChange={(e) => handleMatchInfoChange(e.target.value)}
                            className="w-full bg-[#2D2D2D] text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-[#E93B66] transition-colors"
                            placeholder="输入比赛信息，如：Ro16 #1"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* BO赛制选择 */}
                        <div className="flex flex-col">
                            <label className="text-2xl text-gray-200 mb-2 font-medium">BO赛制</label>
                            <Dropdown
                                options={[
                                    { value: "BO9", label: "BO9 (一轮)" },
                                    { value: "BO11", label: "BO11 (二 三轮)" },
                                    { value: "BO13", label: "BO13 (四 五轮)" },
                                ]}
                                value={settings.boFormat}
                                onChange={handleBoFormatChange}
                                darkMode={true}
                                minWidth="20rem"
                                fontSize={"text-4xl"}
                            />
                        </div>
                    </div>

                    {/* 玩家选择区域 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 红队玩家选择 */}
                        <div className="flex flex-col">
                            <label className="text-2xl text-gray-200 mb-2 font-medium" style={{ color: getTeamColor('red') }}>
                                红队玩家
                            </label>
                            <div className="flex gap-3 text-2xl">
                                <Dropdown
                                    options={loading ? [] : [
                                        { value: "", label: "选择红队玩家..." },
                                        ...players.map(player => ({
                                            value: player.osuId,
                                            label: `${player.inGameName}`
                                        }))
                                    ]}
                                    value={settings.redPlayer?.osuId || ""}
                                    onChange={(value) => handlePlayerDropdownChange('red', value)}
                                    placeholder={loading ? "加载中..." : "选择红队玩家..."}
                                    darkMode={true}
                                    minWidth="35rem"
                                    maxHeight="30rem"
                                    disabled={loading}
                                    fontSize={"text-4xl"}
                                />
                            </div>
                        </div>

                        {/* 蓝队玩家选择 */}
                        <div className="flex flex-col">
                            <label className="text-2xl text-gray-200 mb-2 font-medium" style={{ color: getTeamColor('blue') }}>
                                蓝队玩家
                            </label>
                            <div className="flex gap-3">
                                <Dropdown
                                    options={loading ? [] : [
                                        { value: "", label: "选择蓝队玩家..." },
                                        ...players.map(player => ({
                                            value: player.osuId,
                                            label: `${player.inGameName}`
                                        }))
                                    ]}
                                    value={settings.bluePlayer?.osuId || ""}
                                    onChange={(value) => handlePlayerDropdownChange('blue', value)}
                                    placeholder={loading ? "加载中..." : "选择蓝队玩家..."}
                                    darkMode={true}
                                    minWidth="35rem"
                                    maxHeight="30rem"
                                    disabled={loading}
                                    fontSize={"text-4xl"}
                                />
                            </div>
                        </div>
                    </div>
                </>
            ) : activeTab === 'timer' ? (
                /* 计时器控制面板 */
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="text-3xl text-gray-200 mb-4">当前计时: {timerState.remainingTime}秒</div>
                        <div className="text-xl text-gray-400">
                            状态: {timerState.isRunning ? '运行中' : '已暂停'}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => startTimer(300)}
                            className="px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded text-2xl transition-colors font-bold"
                        >
                            准备阶段 5分钟
                        </button>
                        <button
                            onClick={() => startTimer(600)}
                            className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-2xl transition-colors font-bold"
                        >
                            玩家入场 10分钟
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => startTimer(120)}
                            className="px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded text-2xl transition-colors font-bold"
                        >
                            选择图池 120秒
                        </button>
                        <button
                            onClick={() => startTimer(180)}
                            className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded text-2xl transition-colors font-bold"
                        >
                            申请延时 3分钟
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={toggleTimer}
                            className={`px-6 py-4 rounded text-2xl transition-colors font-bold ${timerState.isRunning
                                ? 'bg-yellow-600 hover:bg-yellow-700'
                                : 'bg-green-600 hover:bg-green-700'
                                } text-white`}
                        >
                            {timerState.isRunning ? '暂停' : '继续'}
                        </button>
                        <button
                            onClick={clearTimer}
                            className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded text-2xl transition-colors font-bold"
                        >
                            清除
                        </button>
                    </div>
                </div>
            ) : (
                /* Ban/Pick控制面板 */
                <div className="space-y-6">
                    {/* 队伍和操作类型选择 */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        {/* 当前操作队伍 */}
                        <div className="flex flex-col">
                            <label className="text-2xl text-gray-200 mb-3 font-medium">当前操作队伍</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onBanPickStateChange({ ...banPickState, currentTeam: 'red' })}
                                    className={`flex-1 px-4 py-3 rounded-lg text-2xl font-bold transition-colors ${banPickState.currentTeam === 'red'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    红队
                                </button>
                                <button
                                    onClick={() => onBanPickStateChange({ ...banPickState, currentTeam: 'blue' })}
                                    className={`flex-1 px-4 py-3 rounded-lg text-2xl font-bold transition-colors ${banPickState.currentTeam === 'blue'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    蓝队
                                </button>
                            </div>
                        </div>

                        {/* 当前操作类型 */}
                        <div className="flex flex-col">
                            <label className="text-2xl text-gray-200 mb-3 font-medium">当前操作类型</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onBanPickStateChange({ ...banPickState, currentAction: 'ban' })}
                                    className={`flex-1 px-4 py-3 rounded-lg text-2xl font-bold transition-colors ${banPickState.currentAction === 'ban'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    Ban
                                </button>
                                <button
                                    onClick={() => onBanPickStateChange({ ...banPickState, currentAction: 'pick' })}
                                    className={`flex-1 px-4 py-3 rounded-lg text-2xl font-bold transition-colors ${banPickState.currentAction === 'pick'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    Pick
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 图池设置 */}
                    <div className="grid grid-cols-3 gap-6 mb-6">
                        {/* 赛季选择 */}
                        <div className="flex flex-col">
                            <label className="text-2xl text-gray-200 mb-2 font-medium">赛季</label>
                            <Dropdown
                                options={[
                                    { value: 's1', label: '第1赛季' }
                                ]}
                                value={mapPoolSettings.season}
                                onChange={(value) => onMapPoolSettingsChange({ ...mapPoolSettings, season: value })}
                                darkMode={true}
                                minWidth="12rem"
                                fontSize={"text-xl"}
                            />
                        </div>

                        {/* 类别选择 */}
                        <div className="flex flex-col">
                            <label className="text-2xl text-gray-200 mb-2 font-medium">类别</label>
                            <Dropdown
                                options={[
                                    { value: 'qualification', label: 'QUA' },
                                    { value: 'ro32', label: 'RO32' },
                                    { value: 'ro16', label: 'RO16' },
                                    { value: 'quarterfinals', label: 'QF' },
                                    { value: 'semifinals', label: 'SF' },
                                    { value: 'finals', label: 'F' },
                                    { value: 'grandfinals', label: 'GF' }
                                ]}
                                value={mapPoolSettings.category}
                                onChange={(value) => onMapPoolSettingsChange({ ...mapPoolSettings, category: value })}
                                darkMode={true}
                                minWidth="8rem"
                                fontSize={"text-xl"}
                            />
                        </div>

                        {/* 显示/隐藏图池 */}
                        <div className="flex flex-col">
                            <label className="text-2xl text-gray-200 mb-3 font-medium">图池显示</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onMapPoolSettingsChange({ ...mapPoolSettings, visible: true })}
                                    className={`flex-1 px-4 py-3 rounded-lg text-2xl font-bold transition-colors ${mapPoolSettings.visible
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    显示
                                </button>
                                <button
                                    onClick={() => onMapPoolSettingsChange({ ...mapPoolSettings, visible: false })}
                                    className={`flex-1 px-4 py-3 rounded-lg text-2xl font-bold transition-colors ${!mapPoolSettings.visible
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    隐藏
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 操作历史 */}
                    <div className="mb-6">
                        <label className="text-2xl text-gray-200 mb-3 font-medium">操作历史</label>
                        <div className="bg-gray-700/50 p-4 rounded max-h-32 overflow-y-auto">
                            {banPickState.history.length === 0 ? (
                                <div className="text-gray-400 text-lg">暂无操作记录</div>
                            ) : (
                                banPickState.history.slice(-5).reverse().map((record, index) => (
                                    <div key={index} className="text-white text-lg mb-2">
                                        <span className={record.team === 'red' ? 'text-red-400' : 'text-blue-400'}>
                                            {record.team === 'red' ? '红队' : '蓝队'}
                                        </span>
                                        <span className="mx-2">
                                            {record.action === 'ban' ? 'Ban' : 'Pick'}
                                        </span>
                                        <span className="text-gray-300">
                                            #{record.beatmapId}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 重置按钮 */}
                    <div className="flex justify-end">
                        <button
                            onClick={onResetBanPick}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded text-2xl transition-colors font-bold"
                        >
                            重置Ban/Pick状态
                        </button>
                    </div>
                </div>
            )}

            {/* 清除存储按钮 */}
            <div className="mt-6 pt-4 border-t border-gray-600">
                <button
                    onClick={handleClearStorage}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-2xl transition-colors"
                >
                    重置所有
                </button>
            </div>
        </div>
    );
}
