"use client";

import { useState, useEffect } from "react";
import { MatchSettings as MatchSettingsType, Player, TimerState, RollState, RefereeState, Team, VictoryState } from "../types/match";
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
    rollState: RollState;
    onRollStateChange: (rollState: RollState) => void;
    refereeState: RefereeState;
    onRefereeStateChange: (refereeState: RefereeState) => void;
    teams: Team[];
    onScoreChange: (teamId: 'red' | 'blue', newScore: number) => void;
    victoryState: VictoryState;
    onVictoryStateChange: (victoryState: VictoryState) => void;
}

type TabType = 'match' | 'timer' | 'banpick' | 'roll' | 'referee' | 'victory';

export default function MatchSettings({
    settings,
    onSettingsChange,
    timerState,
    onTimerStateChange,
    banPickState,
    onBanPickStateChange,
    mapPoolSettings,
    onMapPoolSettingsChange,
    onResetBanPick,
    rollState,
    onRollStateChange,
    refereeState,
    onRefereeStateChange,
    teams,
    onScoreChange,
    victoryState,
    onVictoryStateChange
}: MatchSettingsProps) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('match');
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

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

    // Roll点控制函数
    const startRoll = () => {
        // 生成随机数（1-100）
        const redRoll = Math.floor(Math.random() * 100) + 1;
        const blueRoll = Math.floor(Math.random() * 100) + 1;

        // 判断获胜队伍
        let winner: 'red' | 'blue';
        let resultText: string;

        if (redRoll > blueRoll) {
            winner = 'red';
            resultText = `红方 ${redRoll} : ${blueRoll} 蓝方 | 由红方${settings.redPlayer?.inGameName || '红方玩家'}决定ban/pick顺序`;
        } else if (blueRoll > redRoll) {
            winner = 'blue';
            resultText = `红方 ${redRoll} : ${blueRoll} 蓝方 | 由蓝方${settings.bluePlayer?.inGameName || '蓝方玩家'}决定ban/pick顺序`;
        } else {
            // 平局，重新roll
            winner = redRoll >= blueRoll ? 'red' : 'blue';
            resultText = `红方 ${redRoll} : ${blueRoll} 蓝方 | 平局，重新roll点`;
        }

        const newHistory = [
            ...rollState.history,
            {
                redRoll,
                blueRoll,
                winner,
                timestamp: Date.now(),
                resultText
            }
        ];

        // 1. 点击roll点 -> 开始滚动动画，并立即更新历史记录
        onRollStateChange({
            ...rollState,
            isRolling: true,
            isVisible: true,
            showResult: false,
            redRoll: 0,
            blueRoll: 0,
            winner: null,
            resultText: '',
            history: newHistory  // 立即更新历史记录
        });

        // 2. 2秒后结束滚动动画 -> 展示结果5秒
        setTimeout(() => {
            onRollStateChange({
                ...rollState,
                isRolling: false,
                isVisible: true,
                showResult: true,
                redRoll,
                blueRoll,
                winner,
                resultText,
                history: newHistory
            });

            // 3. 5秒后隐藏，保持历史记录
            setTimeout(() => {
                onRollStateChange({
                    ...rollState,
                    isVisible: false,
                    showResult: false,
                    isRolling: false,
                    redRoll: 0,
                    blueRoll: 0,
                    winner: null,
                    resultText: '',
                    history: newHistory  // 保持历史记录
                });
            }, 5000);
        }, 2000);
    };

    const clearRollHistory = () => {
        onRollStateChange({
            ...rollState,
            history: []
        });
    };

    // 复制结果文本到剪贴板
    const copyResultText = (text: string, recordId: string) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                // 设置复制成功状态
                setCopiedStates(prev => ({
                    ...prev,
                    [recordId]: true
                }));

                // 2秒后恢复原文本
                setTimeout(() => {
                    setCopiedStates(prev => ({
                        ...prev,
                        [recordId]: false
                    }));
                }, 2000);
            }).catch(() => {
                // 如果现代API失败，使用传统方法
                copyToClipboardFallback(text);
            });
        } else {
            // 使用传统方法
            copyToClipboardFallback(text);
        }
    };

    const copyToClipboardFallback = (text: string) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('复制失败:', err);
        }
        document.body.removeChild(textArea);
    };

    // 裁判表功能函数
    const handleScoreChangeWithHistory = (teamId: 'red' | 'blue', newScore: number) => {
        const oldScore = teams.find(t => t.id === teamId)?.score || 0;
        onScoreChange(teamId, newScore);

        // 记录分数变化历史
        const historyEntry = {
            type: 'score' as const,
            team: teamId,
            content: `${teamId === 'red' ? '红队' : '蓝队'}得分 ${oldScore} → ${newScore}`,
            timestamp: Date.now(),
            details: {
                oldScore,
                newScore
            }
        };

        onRefereeStateChange({
            ...refereeState,
            history: [...refereeState.history, historyEntry]
        });
    };


    const handleNextActionChange = (action: 'pick' | 'ban') => {
        onRefereeStateChange({
            ...refereeState,
            nextAction: action
        });
    };

    const clearRefereeHistory = () => {
        onRefereeStateChange({
            ...refereeState,
            history: []
        });
    };

    // 计算NextPick/NextBan逻辑
    const calculateNextAction = () => {
        // 如果没有历史操作，检查roll点
        if (banPickState.history.length === 0) {
            if (rollState.history.length > 0) {
                const lastRoll = rollState.history[rollState.history.length - 1];
                return {
                    nextAction: refereeState.nextAction || 'ban',
                    nextTeam: lastRoll.winner
                };
            }
            return { nextAction: null, nextTeam: null };
        }

        // 根据历史操作判断下一个操作
        const lastAction = banPickState.history[banPickState.history.length - 1];
        const nextTeam = lastAction.team === 'red' ? 'blue' : 'red';

        // 直接使用用户设置的下一个操作类型
        return {
            nextAction: refereeState.nextAction || 'ban',
            nextTeam
        };
    };

    // 生成裁判话语文本
    const generateRefereeText = () => {
        const redTeam = teams.find(t => t.id === 'red');
        const blueTeam = teams.find(t => t.id === 'blue');
        const { nextAction, nextTeam } = calculateNextAction();

        let nextPickBanText = '';
        if (nextAction && nextTeam) {
            const nextPlayerName = nextTeam === 'red' ? redTeam?.playerName : blueTeam?.playerName;
            nextPickBanText = ` | Next${nextAction === 'pick' ? 'Pick' : 'Ban'}: ${nextPlayerName}`;
        } else {
            nextPickBanText = ' | NextPick/NextBan: 等待Roll点结果';
        }

        // 生成剩余可操作图池，按照 NM HD HR DT LZ TB 顺序排序
        const sortedAvailableMaps = sortAvailableMaps(refereeState.availableMaps);
        const availableMaps = sortedAvailableMaps.join(' ');

        return `${redTeam?.playerName} ${redTeam?.score} : ${blueTeam?.score} ${blueTeam?.playerName}${nextPickBanText} | 剩余可操作图池: ${availableMaps}`;
    };

    // 排序函数：按照 NM HD HR DT LZ TB 顺序排序
    const sortAvailableMaps = (maps: string[]) => {
        const order = ['NM', 'HD', 'HR', 'DT', 'LZ', 'TB'];
        return [...maps].sort((a, b) => {
            const indexA = order.findIndex(item => a.includes(item));
            const indexB = order.findIndex(item => b.includes(item));
            return indexA - indexB;
        });
    };

    const { nextAction, nextTeam } = calculateNextAction();
    const refereeDisplayText = generateRefereeText();
    const redTeam = teams.find(t => t.id === 'red');
    const blueTeam = teams.find(t => t.id === 'blue');

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
                    onClick={() => setActiveTab('roll')}
                    className={`px-4 py-2 text-2xl font-medium transition-colors ${activeTab === 'roll'
                        ? 'text-white border-b-2 border-[#E93B66]'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Roll点控制
                </button>
                <button
                    onClick={() => setActiveTab('banpick')}
                    className={`px-4 py-2 text-2xl font-medium transition-colors ${activeTab === 'banpick'
                        ? 'text-white border-b-2 border-[#E93B66]'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    图池设置
                </button>
                <button
                    onClick={() => setActiveTab('referee')}
                    className={`px-4 py-2 text-2xl font-medium transition-colors ${activeTab === 'referee'
                        ? 'text-white border-b-2 border-[#E93B66]'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    裁判表 Ban/Pick控制
                </button>
                <button
                    onClick={() => setActiveTab('victory')}
                    className={`px-4 py-2 text-2xl font-medium transition-colors ${activeTab === 'victory'
                        ? 'text-white border-b-2 border-[#E93B66]'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    胜利页面控制
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
                        <div>
                            {/* obs信息输入 */}
                            {/* osu match link输入 */}
                        </div>
                    </div>
                    {/* 清除存储按钮 */}
                    <div className="mt-6 pt-4 border-t border-gray-600">
                        <button
                            onClick={handleClearStorage}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-2xl transition-colors"
                        >
                            重置所有
                        </button>
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
                            className="px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded text-5xl transition-colors font-bold"
                        >
                            准备阶段 5分钟
                        </button>
                        <button
                            onClick={() => startTimer(600)}
                            className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-5xl transition-colors font-bold"
                        >
                            玩家入场 10分钟
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => startTimer(120)}
                            className="px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded text-5xl transition-colors font-bold"
                        >
                            选择图池 120秒
                        </button>
                        <button
                            onClick={() => startTimer(180)}
                            className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded text-5xl transition-colors font-bold"
                        >
                            申请延时 3分钟
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="number"
                            placeholder="输入秒数"
                            min="1"
                            max="3600"
                            className="px-4 py-4 bg-[#2D2D2D] text-white border border-gray-600 rounded text-5xl focus:outline-none focus:border-[#E93B66] transition-colors"
                            id="customTimeInput"
                        />
                        <button
                            onClick={() => {
                                const input = document.getElementById('customTimeInput') as HTMLInputElement;
                                const seconds = parseInt(input.value);
                                if (seconds && seconds > 0 && seconds <= 3600) {
                                    startTimer(seconds);
                                    input.value = '';
                                }
                            }}
                            className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded text-5xl transition-colors font-bold"
                        >
                            自定义时间开始
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={toggleTimer}
                            className={`px-6 py-4 rounded text-5xl transition-colors font-bold ${timerState.isRunning
                                ? 'bg-yellow-600 hover:bg-yellow-700'
                                : 'bg-green-600 hover:bg-green-700'
                                } text-white`}
                        >
                            {timerState.isRunning ? '暂停' : '继续'}
                        </button>
                        <button
                            onClick={clearTimer}
                            className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded text-5xl transition-colors font-bold"
                        >
                            清除
                        </button>
                    </div>
                </div>
            ) : activeTab === 'roll' ? (
                /* Roll点控制面板 */
                <div className="space-y-6">
                    <div className="flex gap-4" >
                        {/* 开始Roll点按钮 */}
                        <div className="flex justify-center">
                            <button
                                onClick={startRoll}
                                disabled={rollState.isRolling}
                                className={`px-8 py-6 rounded-lg text-3xl font-bold transition-colors ${rollState.isRolling
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-[#E93B66] to-[#3BE9D8] hover:from-[#ff4d7a] hover:to-[#4df9e8] text-white shadow-lg'
                                    }`}
                            >
                                {rollState.isRolling ? 'Roll点中...' : '开始Roll点'}
                            </button>
                        </div>
                        {/* 当前状态显示 */}
                        <div className="text-center">
                            <div className="text-3xl text-gray-200 mb-4">
                                状态: {rollState.isRolling ? 'Roll点中...' : rollState.showResult ? '显示结果' : '准备就绪'}
                            </div>
                            {rollState.history.length > 0 && (
                                <div className="text-xl text-gray-400">
                                    历史记录: {rollState.history.length} 次
                                </div>
                            )}
                        </div>
                    </div>
                    {/* 历史记录显示 */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-2xl text-gray-200 font-medium">Roll点历史记录</label>
                            {rollState.history.length > 0 && (
                                <button
                                    onClick={clearRollHistory}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xl transition-colors"
                                >
                                    清除历史
                                </button>
                            )}
                        </div>
                        <div className="bg-gray-700/50 p-4 rounded">
                            {rollState.history.length === 0 ? (
                                <div className="text-gray-400 text-lg text-center">暂无Roll点记录</div>
                            ) : (
                                rollState.history.slice().reverse().map((record, index) => (
                                    <div key={index} className="text-white text-6xl mb-3 p-3 bg-gray-600/30 rounded">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={record.winner === 'red' ? 'text-red-400' : 'text-blue-400'}>
                                                {record.winner === 'red' ? '红方roll点大' : '蓝方roll点大'}
                                            </span>
                                            <span className="text-gray-400 text-2xl">
                                                {new Date(record.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <div className="flex">
                                            <div className="text-gray-300 mb-2">
                                                {record.resultText}
                                            </div>
                                            <button
                                                onClick={() => copyResultText(record.resultText, `record-${record.timestamp}`)}
                                                className={`px-3 py-1 text-white text-5xl transition-colors ${copiedStates[`record-${record.timestamp}`]
                                                    ? 'bg-green-600 hover:bg-green-700'
                                                    : 'bg-blue-600 hover:bg-blue-700'
                                                    }`}
                                            >
                                                {copiedStates[`record-${record.timestamp}`] ? '复制成功' : '复制结果'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            ) : activeTab === 'referee' ? (
                /* 裁判表控制面板 */
                <div className="space-y-6">
                    {/* 队伍和操作类型选择 */}
                    <div className="grid grid-cols-3 gap-6 mb-6">
                        {/* 当前操作队伍 */}
                        <div className="flex flex-col">
                            <label className="text-4xl text-gray-200 mb-3 font-medium">当前操作队伍</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onBanPickStateChange({ ...banPickState, currentTeam: 'red' })}
                                    className={`flex-1 px-4 py-3 rounded-lg text-4xl font-bold transition-colors ${banPickState.currentTeam === 'red'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    红队
                                </button>
                                <button
                                    onClick={() => onBanPickStateChange({ ...banPickState, currentTeam: 'blue' })}
                                    className={`flex-1 px-4 py-3 rounded-lg text-4xl font-bold transition-colors ${banPickState.currentTeam === 'blue'
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
                            <label className="text-4xl text-gray-200 mb-3 font-medium">当前操作类型</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onBanPickStateChange({ ...banPickState, currentAction: 'ban' })}
                                    className={`flex-1 px-4 py-3 rounded-lg text-4xl font-bold transition-colors ${banPickState.currentAction === 'ban'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    Ban
                                </button>
                                <button
                                    onClick={() => onBanPickStateChange({ ...banPickState, currentAction: 'pick' })}
                                    className={`flex-1 px-4 py-3 rounded-lg text-4xl font-bold transition-colors ${banPickState.currentAction === 'pick'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    Pick
                                </button>
                            </div>
                        </div>
                        {/* 显示/隐藏图池 */}
                        <div className="flex flex-col">
                            <label className="text-4xl text-gray-200 mb-3 font-medium">图池显示</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onMapPoolSettingsChange({ ...mapPoolSettings, visible: true })}
                                    className={`flex-1 px-4 py-3 rounded-lg text-4xl font-bold transition-colors ${mapPoolSettings.visible
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    显示
                                </button>
                                <button
                                    onClick={() => onMapPoolSettingsChange({ ...mapPoolSettings, visible: false })}
                                    className={`flex-1 px-4 py-3 rounded-lg text-4xl font-bold transition-colors ${!mapPoolSettings.visible
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    隐藏
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 分数控制 */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        {/* 红队分数控制 */}
                        <div className="flex flex-col">
                            <label className="text-4xl text-gray-200 mb-3 font-medium" style={{ color: getTeamColor('red') }}>
                                红队分数
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleScoreChangeWithHistory('red', (teams.find(t => t.id === 'red')?.score || 0) - 1)}
                                    className="flex-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded text-4xl font-bold transition-colors"
                                >
                                    -1
                                </button>
                                <div className="flex-1 text-center bg-gray-700 text-white text-4xl font-bold py-3 rounded">
                                    {teams.find(t => t.id === 'red')?.score || 0}
                                </div>
                                <button
                                    onClick={() => handleScoreChangeWithHistory('red', (teams.find(t => t.id === 'red')?.score || 0) + 1)}
                                    className="flex-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded text-4xl font-bold transition-colors"
                                >
                                    +1
                                </button>
                            </div>
                        </div>

                        {/* 蓝队分数控制 */}
                        <div className="flex flex-col">
                            <label className="text-4xl text-gray-200 mb-3 font-medium" style={{ color: getTeamColor('blue') }}>
                                蓝队分数
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleScoreChangeWithHistory('blue', (teams.find(t => t.id === 'blue')?.score || 0) - 1)}
                                    className="flex-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-4xl font-bold transition-colors"
                                >
                                    -1
                                </button>
                                <div className="flex-1 text-center bg-gray-700 text-white text-4xl font-bold py-3 rounded">
                                    {teams.find(t => t.id === 'blue')?.score || 0}
                                </div>
                                <button
                                    onClick={() => handleScoreChangeWithHistory('blue', (teams.find(t => t.id === 'blue')?.score || 0) + 1)}
                                    className="flex-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-4xl font-bold transition-colors"
                                >
                                    +1
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 裁判话语显示 */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-4xl text-gray-200 font-medium">裁判话语</label>
                            <button
                                onClick={() => copyResultText(refereeDisplayText, 'referee-text')}
                                className={`px-4 py-2 text-white rounded text-4xl transition-colors ${copiedStates['referee-text']
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {copiedStates['referee-text'] ? '复制成功' : '复制裁判话语'}
                            </button>
                        </div>
                        <div className="bg-gray-700/50 p-4 rounded">
                            <div className="text-white text-6xl break-words">
                                {refereeDisplayText}
                            </div>
                        </div>
                    </div>



                    {/* NextPick/NextBan显示 */}
                    <div className="mb-6">
                        <label className="text-4xl text-gray-200 mb-3 font-medium">下一步操作</label>
                        <div className="bg-gray-700/50 p-4 rounded">
                            <div className="text-white text-4xl">
                                {nextAction && nextTeam ? (
                                    <div>
                                        <span className={nextTeam === 'red' ? 'text-red-400' : 'text-blue-400'}>
                                            {nextTeam === 'red' ? `红队${redTeam?.playerName}` : `蓝队${blueTeam?.playerName}`}
                                        </span>
                                        <span className="mx-2">
                                            {nextAction === 'pick' ? 'Pick' : 'Ban'}
                                        </span>
                                        <span className="text-gray-300">
                                            | 剩余可操作图池: {sortAvailableMaps(refereeState.availableMaps).join(' ')}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-gray-400">
                                        等待Roll点结果或操作历史...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* NextPick/NextBan控制 */}
                    <div className="mb-6">
                        <label className="text-2xl text-gray-200 mb-3 font-medium">下一步操作类型</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleNextActionChange('pick')}
                                className={`flex-1 px-4 py-3 rounded-lg text-2xl font-bold transition-colors ${refereeState.nextAction === 'pick'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                NextPick
                            </button>
                            <button
                                onClick={() => handleNextActionChange('ban')}
                                className={`flex-1 px-4 py-3 rounded-lg text-2xl font-bold transition-colors ${refereeState.nextAction === 'ban'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                NextBan
                            </button>
                        </div>
                    </div>
                    {/* 操作历史 */}
                    <div className="mb-6">
                        <label className="text-4xl text-gray-200 mb-3 font-medium">操作历史</label>
                        <div className="bg-gray-700/50 p-4 rounded max-h-32 overflow-y-auto">
                            {banPickState.history.length === 0 ? (
                                <div className="text-gray-400 text-4xl">暂无操作记录</div>
                            ) : (
                                banPickState.history.slice(-5).reverse().map((record, index) => (
                                    <div key={index} className="text-white text-4xl mb-2">
                                        <span className={record.team === 'red' ? 'text-red-400' : 'text-blue-400'}>
                                            {record.team === 'red' ? '红队' : '蓝队'}
                                        </span>
                                        <span className="mx-2">
                                            {record.action === 'ban' ? 'Ban' : 'Pick'}
                                        </span>
                                        <span className="text-gray-300">
                                            {record.modSlot}
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
                    {/* 分数历史记录 */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-2xl text-gray-200 font-medium">分数历史记录</label>
                            {refereeState.history.length > 0 && (
                                <button
                                    onClick={clearRefereeHistory}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xl transition-colors"
                                >
                                    清除历史
                                </button>
                            )}
                        </div>
                        <div className="bg-gray-700/50 p-4 rounded max-h-48 overflow-y-auto">
                            {refereeState.history.length === 0 ? (
                                <div className="text-gray-400 text-4xl text-center">暂无分数记录</div>
                            ) : (
                                refereeState.history.slice().reverse().map((record, index) => (
                                    <div key={index} className="text-white text-4xl mb-3 p-3 bg-gray-600/30 rounded">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={record.type === 'score' ? (record.team === 'red' ? 'text-red-400' : 'text-blue-400') : 'text-green-400'}>
                                                {record.type === 'score' ? '分数变化' : '裁判话语'}
                                            </span>
                                            <span className="text-gray-400 text-3xl">
                                                {new Date(record.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <div className="text-gray-300">
                                            {record.content}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ) : activeTab === 'victory' ? (
                /* 胜利页面控制面板 */
                <div className="space-y-6">
                    {/* 当前状态显示 */}
                    <div className="text-center">
                        <div className="text-3xl text-gray-200 mb-4">
                            当前状态: {victoryState.isVisible ? '显示胜利页面' : '隐藏胜利页面'}
                        </div>
                        {victoryState.winner && (
                            <div className="text-xl text-gray-400">
                                获胜队伍: {victoryState.winner === 'red' ? '红队' : '蓝队'}
                            </div>
                        )}
                    </div>

                    {/* 胜利队伍选择 */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="flex flex-col">
                            <label className="text-4xl text-gray-200 mb-3 font-medium">选择获胜队伍</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onVictoryStateChange({
                                        ...victoryState,
                                        winner: 'red'
                                    })}
                                    className={`flex-1 px-4 py-3 rounded-lg text-4xl font-bold transition-colors ${victoryState.winner === 'red'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    红队胜利
                                </button>
                                <button
                                    onClick={() => onVictoryStateChange({
                                        ...victoryState,
                                        winner: 'blue'
                                    })}
                                    className={`flex-1 px-4 py-3 rounded-lg text-4xl font-bold transition-colors ${victoryState.winner === 'blue'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    蓝队胜利
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 显示控制 */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="flex flex-col">
                            <label className="text-4xl text-gray-200 mb-3 font-medium">胜利页面显示</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onVictoryStateChange({
                                        ...victoryState,
                                        isVisible: true,
                                        hideScorePanel: true
                                    })}
                                    className={`flex-1 px-4 py-3 rounded-lg text-4xl font-bold transition-colors ${victoryState.isVisible
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    显示胜利页面
                                </button>
                                <button
                                    onClick={() => onVictoryStateChange({
                                        ...victoryState,
                                        isVisible: false,
                                        hideScorePanel: false
                                    })}
                                    className={`flex-1 px-4 py-3 rounded-lg text-4xl font-bold transition-colors ${!victoryState.isVisible
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    隐藏胜利页面
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 快速操作按钮 */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => onVictoryStateChange({
                                isVisible: true,
                                winner: 'red',
                                hideScorePanel: true
                            })}
                            className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded text-5xl transition-colors font-bold"
                        >
                            红队胜利
                        </button>
                        <button
                            onClick={() => onVictoryStateChange({
                                isVisible: true,
                                winner: 'blue',
                                hideScorePanel: true
                            })}
                            className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded text-5xl transition-colors font-bold"
                        >
                            蓝队胜利
                        </button>
                    </div>

                    {/* 重置按钮 */}
                    <div className="flex justify-end">
                        <button
                            onClick={() => onVictoryStateChange({
                                isVisible: false,
                                winner: null,
                                hideScorePanel: false
                            })}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded text-2xl transition-colors font-bold"
                        >
                            重置胜利状态
                        </button>
                    </div>
                </div>
            ) : (
                /* Ban/Pick控制面板 */
                <div className="space-y-6">

                    {/* 图池设置 */}
                    <div className="grid grid-cols-3 gap-6 mb-6">
                        {/* 赛季选择 */}
                        <div className="flex flex-col">
                            <label className="text-4xl text-gray-200 mb-2 font-medium">赛季</label>
                            <Dropdown
                                options={[
                                    { value: 's1', label: '第1赛季' }
                                ]}
                                value={mapPoolSettings.season}
                                onChange={(value) => onMapPoolSettingsChange({ ...mapPoolSettings, season: value })}
                                darkMode={true}
                                minWidth="25rem"
                                fontSize={"text-4xl"}
                            />
                        </div>

                        {/* 类别选择 */}
                        <div className="flex flex-col">
                            <label className="text-4xl text-gray-200 mb-2 font-medium">类别</label>
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
                                minWidth="25rem"
                                fontSize={"text-4xl"}
                            />
                        </div>

                        {/* 显示/隐藏图池 */}
                        <div className="flex flex-col">
                            <label className="text-4xl text-gray-200 mb-3 font-medium">图池显示</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onMapPoolSettingsChange({ ...mapPoolSettings, visible: true })}
                                    className={`flex-1 px-4 py-3 rounded-lg text-4xl font-bold transition-colors ${mapPoolSettings.visible
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    显示
                                </button>
                                <button
                                    onClick={() => onMapPoolSettingsChange({ ...mapPoolSettings, visible: false })}
                                    className={`flex-1 px-4 py-3 rounded-lg text-4xl font-bold transition-colors ${!mapPoolSettings.visible
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    隐藏
                                </button>
                            </div>
                        </div>
                    </div>


                </div>
            )}


        </div>
    );
}
