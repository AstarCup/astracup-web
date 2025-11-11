"use client";

import { useState, useEffect } from "react";
import MatchSettings from "./components/MatchSettings";
import TeamDisplay from "./components/TeamDisplay";
import TimerDisplay from "./components/TimerDisplay";
import MapPoolGrid from "./components/MapPoolGrid";
import RollDisplay from "./components/RollDisplay";
import { Team, MatchSettings as MatchSettingsType, TimerState, RollState, RefereeState, BO_FORMAT_WIN_SCORE } from "./types/match";
import { BeatmapCard, BanPickState, MapPoolSettings } from "./types/banpick";
import Image from "next/image";

export default function ObsOverlay() {
    // 使用函数初始化状态，确保从localStorage加载数据
    const [settings, setSettings] = useState<MatchSettingsType>(() => {
        try {
            const savedSettings = localStorage.getItem('matchSettings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                console.log('初始化设置数据:', parsedSettings);
                return parsedSettings;
            }
        } catch (error) {
            console.error('初始化设置数据失败:', error);
        }
        // 默认值
        return {
            matchInfo: '',
            boFormat: 'BO9',
            redTeamName: '红队',
            blueTeamName: '蓝队'
        };
    });

    const [teams, setTeams] = useState<Team[]>(() => {
        try {
            const savedTeams = localStorage.getItem('matchTeams');
            if (savedTeams) {
                const parsedTeams = JSON.parse(savedTeams);
                console.log('初始化队伍数据:', parsedTeams);
                return parsedTeams;
            }
        } catch (error) {
            console.error('初始化队伍数据失败:', error);
        }
        // 默认值
        return [
            {
                id: 'red',
                name: '红队',
                score: 0,
                playerName: '红队玩家',
                avatarUrl: undefined
            },
            {
                id: 'blue',
                name: '蓝队',
                score: 0,
                playerName: '蓝队玩家',
                avatarUrl: undefined
            }
        ];
    });

    // 计时器状态
    const [timerState, setTimerState] = useState<TimerState>(() => {
        try {
            const savedTimerState = localStorage.getItem('timerState');
            if (savedTimerState) {
                const parsedTimerState = JSON.parse(savedTimerState);
                console.log('初始化计时器数据:', parsedTimerState);
                return parsedTimerState;
            }
        } catch (error) {
            console.error('初始化计时器数据失败:', error);
        }
        // 默认值
        return {
            remainingTime: 0,
            isRunning: false
        };
    });

    // Ban/Pick状态
    const [banPickState, setBanPickState] = useState<BanPickState>(() => {
        try {
            const savedBanPickState = localStorage.getItem('banPickState');
            if (savedBanPickState) {
                const parsedState = JSON.parse(savedBanPickState);
                console.log('初始化Ban/Pick状态:', parsedState);
                return parsedState;
            }
        } catch (error) {
            console.error('初始化Ban/Pick状态失败:', error);
        }
        // 默认值
        return {
            currentTeam: 'red',
            currentAction: 'ban',
            remainingBans: { red: 2, blue: 2 },
            remainingPicks: { red: 2, blue: 2 },
            history: []
        };
    });

    // 图池设置
    const [mapPoolSettings, setMapPoolSettings] = useState<MapPoolSettings>(() => {
        try {
            const savedMapPoolSettings = localStorage.getItem('mapPoolSettings');
            if (savedMapPoolSettings) {
                const parsedSettings = JSON.parse(savedMapPoolSettings);
                console.log('初始化图池设置:', parsedSettings);
                return parsedSettings;
            }
        } catch (error) {
            console.error('初始化图池设置失败:', error);
        }
        // 默认值 - 图池默认隐藏
        return {
            season: 's1',
            category: 'qualification',
            visible: false
        };
    });

    // Roll点状态
    const [rollState, setRollState] = useState<RollState>(() => {
        try {
            const savedRollState = localStorage.getItem('rollState');
            if (savedRollState) {
                const parsedRollState = JSON.parse(savedRollState);
                console.log('初始化Roll点状态:', parsedRollState);
                return parsedRollState;
            }
        } catch (error) {
            console.error('初始化Roll点状态失败:', error);
        }
        // 默认值
        return {
            isRolling: false,
            isVisible: false,
            redRoll: 0,
            blueRoll: 0,
            winner: null,
            resultText: '',
            showResult: false,
            history: []
        };
    });

    // 裁判表状态
    const [refereeState, setRefereeState] = useState<RefereeState>(() => {
        try {
            const savedRefereeState = localStorage.getItem('refereeState');
            if (savedRefereeState) {
                const parsedRefereeState = JSON.parse(savedRefereeState);
                console.log('初始化裁判表状态:', parsedRefereeState);
                return parsedRefereeState;
            }
        } catch (error) {
            console.error('初始化裁判表状态失败:', error);
        }
        // 默认值
        return {
            refereeText: '',
            nextAction: 'ban',
            nextTeam: null,
            availableMaps: [],
            history: []
        };
    });

    // 图池数据
    const [beatmaps, setBeatmaps] = useState<BeatmapCard[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // 保存设置到本地存储
    useEffect(() => {
        const saveSettingsToStorage = () => {
            try {
                console.log('保存设置到本地存储:', settings);
                localStorage.setItem('matchSettings', JSON.stringify(settings));
                console.log('设置保存成功');
            } catch (error) {
                console.error('保存设置到本地存储失败:', error);
            }
        };

        saveSettingsToStorage();
    }, [settings]);

    // 保存队伍数据到本地存储
    useEffect(() => {
        const saveTeamsToStorage = () => {
            try {
                console.log('保存队伍数据到本地存储:', teams);
                localStorage.setItem('matchTeams', JSON.stringify(teams));
                console.log('队伍数据保存成功');
            } catch (error) {
                console.error('保存队伍数据到本地存储失败:', error);
            }
        };

        saveTeamsToStorage();
    }, [teams]);

    // 保存计时器状态到本地存储
    useEffect(() => {
        const saveTimerStateToStorage = () => {
            try {
                console.log('保存计时器状态到本地存储:', timerState);
                localStorage.setItem('timerState', JSON.stringify(timerState));
                console.log('计时器状态保存成功');
            } catch (error) {
                console.error('保存计时器状态到本地存储失败:', error);
            }
        };

        saveTimerStateToStorage();
    }, [timerState]);

    // 保存Ban/Pick状态到本地存储
    useEffect(() => {
        const saveBanPickStateToStorage = () => {
            try {
                console.log('保存Ban/Pick状态到本地存储:', banPickState);
                localStorage.setItem('banPickState', JSON.stringify(banPickState));
                console.log('Ban/Pick状态保存成功');
            } catch (error) {
                console.error('保存Ban/Pick状态到本地存储失败:', error);
            }
        };

        saveBanPickStateToStorage();
    }, [banPickState]);

    // 保存图池设置到本地存储
    useEffect(() => {
        const saveMapPoolSettingsToStorage = () => {
            try {
                console.log('保存图池设置到本地存储:', mapPoolSettings);
                localStorage.setItem('mapPoolSettings', JSON.stringify(mapPoolSettings));
                console.log('图池设置保存成功');
            } catch (error) {
                console.error('保存图池设置到本地存储失败:', error);
            }
        };

        saveMapPoolSettingsToStorage();
    }, [mapPoolSettings]);

    // 保存Roll点状态到本地存储
    useEffect(() => {
        const saveRollStateToStorage = () => {
            try {
                console.log('保存Roll点状态到本地存储:', rollState);
                localStorage.setItem('rollState', JSON.stringify(rollState));
                console.log('Roll点状态保存成功');
            } catch (error) {
                console.error('保存Roll点状态到本地存储失败:', error);
            }
        };

        saveRollStateToStorage();
    }, [rollState]);

    // 保存裁判表状态到本地存储
    useEffect(() => {
        const saveRefereeStateToStorage = () => {
            try {
                console.log('保存裁判表状态到本地存储:', refereeState);
                localStorage.setItem('refereeState', JSON.stringify(refereeState));
                console.log('裁判表状态保存成功');
            } catch (error) {
                console.error('保存裁判表状态到本地存储失败:', error);
            }
        };

        saveRefereeStateToStorage();
    }, [refereeState]);

    // 计算获胜所需分数
    const winScore = BO_FORMAT_WIN_SCORE[settings.boFormat];

    // 更新队伍信息
    useEffect(() => {
        setTeams(prev => prev.map(team => {
            const isRed = team.id === 'red';
            const player = isRed ? settings.redPlayer : settings.bluePlayer;
            return {
                ...team,
                name: isRed ? settings.redTeamName : settings.blueTeamName,
                playerName: player?.inGameName || (isRed ? '红队玩家' : '蓝队玩家'),
                avatarUrl: player?.avatar_url || undefined,
                player: player
            };
        }));
    }, [settings.redTeamName, settings.blueTeamName, settings.redPlayer, settings.bluePlayer]);

    const handleScoreChange = (teamId: 'red' | 'blue', newScore: number) => {
        setTeams(prev => prev.map(team =>
            team.id === teamId ? { ...team, score: newScore } : team
        ));
    };

    const resetScores = () => {
        setTeams(prev => prev.map(team => ({ ...team, score: 0 })));
    };

    // Ban/Pick状态管理函数
    const handleTeamChange = (team: 'red' | 'blue') => {
        setBanPickState(prev => ({ ...prev, currentTeam: team }));
    };

    const handleActionChange = (action: 'ban' | 'pick') => {
        setBanPickState(prev => ({ ...prev, currentAction: action }));
    };

    const handleSeasonChange = (season: string) => {
        setMapPoolSettings(prev => ({ ...prev, season }));
    };

    const handleCategoryChange = (category: string) => {
        setMapPoolSettings(prev => ({ ...prev, category }));
    };

    const handleBeatmapLeftClick = (beatmap: BeatmapCard) => {
        // 允许重复操作同一个谱面，不检查状态
        const { currentTeam, currentAction } = banPickState;

        console.log(`操作调试: beatmapId=${beatmap.beatmapId}, team=${currentTeam}, action=${currentAction}, currentHistory=`, banPickState.history);

        if (currentAction === 'ban') {
            // 更新谱面状态
            setBeatmaps(prev => {
                const updated = prev.map(b =>
                    b.id === beatmap.id
                        ? { ...b, status: 'banned' as const, bannedBy: currentTeam }
                        : b
                );
                console.log(`Ban操作后谱面状态:`, updated.find(b => b.id === beatmap.id));
                return updated;
            });

            // 更新ban/pick状态（不限制次数）
            setBanPickState(prev => {
                const newHistory = [
                    ...prev.history,
                    {
                        team: currentTeam,
                        action: 'ban' as const,
                        beatmapId: beatmap.beatmapId,
                        modSlot: beatmap.slot, // 添加mod位信息
                        timestamp: Date.now()
                    }
                ];
                console.log(`Ban操作后历史记录:`, newHistory);
                console.log(`历史记录长度: ${newHistory.length}`);
                return {
                    ...prev,
                    history: newHistory
                };
            });
        } else if (currentAction === 'pick') {
            // 更新谱面状态
            setBeatmaps(prev => {
                const updated = prev.map(b =>
                    b.id === beatmap.id
                        ? { ...b, status: 'picked' as const, pickedBy: currentTeam }
                        : b
                );
                console.log(`Pick操作后谱面状态:`, updated.find(b => b.id === beatmap.id));
                return updated;
            });

            // 更新ban/pick状态（不限制次数）
            setBanPickState(prev => {
                const newHistory = [
                    ...prev.history,
                    {
                        team: currentTeam,
                        action: 'pick' as const,
                        beatmapId: beatmap.beatmapId,
                        modSlot: beatmap.slot, // 添加mod位信息
                        timestamp: Date.now()
                    }
                ];
                console.log(`Pick操作后历史记录:`, newHistory);
                console.log(`历史记录长度: ${newHistory.length}`);
                return {
                    ...prev,
                    history: newHistory
                };
            });
        }
    };

    const handleBeatmapRightClick = (beatmap: BeatmapCard) => {
        if (beatmap.status === 'available') return;

        // 取消操作
        const { bannedBy, pickedBy } = beatmap;

        if (bannedBy) {
            // 恢复ban
            setBeatmaps(prev => prev.map(b =>
                b.id === beatmap.id
                    ? { ...b, status: 'available', bannedBy: undefined }
                    : b
            ));

            // 只删除最新的ban记录，而不是所有记录
            setBanPickState(prev => {
                const historyForBeatmap = prev.history.filter(record =>
                    record.team === bannedBy && record.action === 'ban' && record.beatmapId === beatmap.beatmapId
                );

                if (historyForBeatmap.length === 0) return prev;

                // 找到最新的记录并删除它
                const latestRecord = historyForBeatmap[historyForBeatmap.length - 1];
                const latestIndex = prev.history.findIndex(record =>
                    record.team === latestRecord.team &&
                    record.action === latestRecord.action &&
                    record.beatmapId === latestRecord.beatmapId &&
                    record.timestamp === latestRecord.timestamp
                );

                if (latestIndex === -1) return prev;

                const newHistory = [...prev.history];
                newHistory.splice(latestIndex, 1);

                return {
                    ...prev,
                    history: newHistory
                };
            });
        } else if (pickedBy) {
            // 恢复pick
            setBeatmaps(prev => prev.map(b =>
                b.id === beatmap.id
                    ? { ...b, status: 'available', pickedBy: undefined }
                    : b
            ));

            // 只删除最新的pick记录，而不是所有记录
            setBanPickState(prev => {
                const historyForBeatmap = prev.history.filter(record =>
                    record.team === pickedBy && record.action === 'pick' && record.beatmapId === beatmap.beatmapId
                );

                if (historyForBeatmap.length === 0) return prev;

                // 找到最新的记录并删除它
                const latestRecord = historyForBeatmap[historyForBeatmap.length - 1];
                const latestIndex = prev.history.findIndex(record =>
                    record.team === latestRecord.team &&
                    record.action === latestRecord.action &&
                    record.beatmapId === latestRecord.beatmapId &&
                    record.timestamp === latestRecord.timestamp
                );

                if (latestIndex === -1) return prev;

                const newHistory = [...prev.history];
                newHistory.splice(latestIndex, 1);

                return {
                    ...prev,
                    history: newHistory
                };
            });
        }
    };

    const resetBanPickState = () => {
        // 重置所有谱面状态
        setBeatmaps(prev => prev.map(beatmap => ({
            ...beatmap,
            status: 'available',
            bannedBy: undefined,
            pickedBy: undefined
        })));

        // 重置ban/pick状态
        setBanPickState({
            currentTeam: 'red',
            currentAction: 'ban',
            remainingBans: { red: 2, blue: 2 },
            remainingPicks: { red: 2, blue: 2 },
            history: []
        });
    };

    // 加载图池数据
    useEffect(() => {
        const fetchMapPoolData = async () => {
            if (!mapPoolSettings.season || !mapPoolSettings.category) return;

            setIsLoading(true);
            try {
                const response = await fetch(
                    `/api/map-selections?season=${mapPoolSettings.season}&category=${mapPoolSettings.category}&approved=true`
                );

                if (response.ok) {
                    const data = await response.json();
                    const approvedMaps = data.selections || [];

                    // 转换为BeatmapCard格式
                    const convertedBeatmaps: BeatmapCard[] = approvedMaps.map((map: any) => ({
                        id: map.id,
                        beatmapId: map.beatmapId,
                        beatmapsetId: map.beatmapsetId,
                        title: map.title,
                        artist: map.artist,
                        version: map.version,
                        creator: map.creator,
                        selectedMods: map.selectedMods,
                        modPosition: map.modPosition,
                        slot: `${map.selectedMods}${map.modPosition}`,
                        coverUrl: map.coverUrl || `https://assets.ppy.sh/beatmaps/${map.beatmapsetId}/covers/cover.jpg`,
                        starRating: map.starRating,
                        status: 'available'
                    }));

                    setBeatmaps(convertedBeatmaps);
                }
            } catch (error) {
                console.error('获取图池数据失败:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMapPoolData();
    }, [mapPoolSettings.season, mapPoolSettings.category]);

    // 根据历史记录恢复卡片状态
    useEffect(() => {
        if (beatmaps.length === 0) return;

        // 检查是否需要更新谱面状态
        const needsUpdate = beatmaps.some(beatmap => {
            const historyForBeatmap = banPickState.history.filter(
                record => record.beatmapId === beatmap.beatmapId
            );

            if (historyForBeatmap.length === 0) {
                return beatmap.status !== 'available' || beatmap.bannedBy !== undefined || beatmap.pickedBy !== undefined;
            }

            const latestRecord = historyForBeatmap[historyForBeatmap.length - 1];

            if (latestRecord.action === 'ban') {
                return beatmap.status !== 'banned' || beatmap.bannedBy !== latestRecord.team || beatmap.pickedBy !== undefined;
            } else if (latestRecord.action === 'pick') {
                return beatmap.status !== 'picked' || beatmap.pickedBy !== latestRecord.team || beatmap.bannedBy !== undefined;
            }

            return false;
        });

        if (!needsUpdate) return;

        // 根据历史记录恢复卡片状态
        const updatedBeatmaps: BeatmapCard[] = beatmaps.map(beatmap => {
            // 查找该谱面的历史记录
            const historyForBeatmap = banPickState.history.filter(
                record => record.beatmapId === beatmap.beatmapId
            );

            if (historyForBeatmap.length === 0) {
                return { ...beatmap, status: 'available' as const, bannedBy: undefined, pickedBy: undefined };
            }

            // 获取最新的操作记录
            const latestRecord = historyForBeatmap[historyForBeatmap.length - 1];

            if (latestRecord.action === 'ban') {
                return { ...beatmap, status: 'banned' as const, bannedBy: latestRecord.team, pickedBy: undefined };
            } else if (latestRecord.action === 'pick') {
                return { ...beatmap, status: 'picked' as const, pickedBy: latestRecord.team, bannedBy: undefined };
            }

            return beatmap;
        });

        setBeatmaps(updatedBeatmaps);
    }, [beatmaps, banPickState.history]);

    // 更新裁判表中的可用图池列表
    useEffect(() => {
        if (beatmaps.length === 0) return;

        // 获取所有可用的图池槽位（未被ban或pick的）
        const availableMaps = beatmaps
            .filter(beatmap => beatmap.status === 'available')
            .map(beatmap => beatmap.slot)
            .sort((a, b) => {
                // 排序：先按mod类型，再按数字
                const modA = a.replace(/\d+$/, '');
                const modB = b.replace(/\d+$/, '');
                const numA = parseInt(a.replace(/[^\d]/g, '')) || 0;
                const numB = parseInt(b.replace(/[^\d]/g, '')) || 0;

                if (modA !== modB) {
                    return modA.localeCompare(modB);
                }
                return numA - numB;
            });

        // 只有当可用图池发生变化时才更新状态
        if (JSON.stringify(availableMaps) !== JSON.stringify(refereeState.availableMaps)) {
            setRefereeState(prev => ({
                ...prev,
                availableMaps
            }));
        }
    }, [beatmaps, banPickState.history, refereeState.availableMaps]);

    return (
        <div style={{
            minHeight: '100vh',
            color: 'white',
            overflow: 'hidden',
            margin: 0,
            padding: 0
        }}>
            {/* 固定2K分辨率容器 */}
            <div
                style={{
                    width: '2560px',
                    height: '1440px',
                    backgroundColor: 'transparent', // 支持OBS透明背景
                    overflow: 'hidden',
                    margin: '0 auto',
                    position: 'relative'
                }}
            >
                {/* 队伍显示区域 */}
                <div style={{
                    display: 'flex',
                    marginTop: '20px' // mt-40 对应 160px
                }}>
                    {/* 红队 */}
                    <div style={{
                        flex: '2',
                        display: 'flex',
                        justifyContent: 'flex-start'
                    }}>
                        <TeamDisplay
                            team={teams.find(t => t.id === 'red')!}
                            onScoreChange={handleScoreChange}
                            winScore={winScore}
                        />
                    </div>

                    {/* 比分分隔线 */}
                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: '1'
                    }}>
                        <div style={{
                            fontSize: '2.25rem',
                            fontWeight: 'bold',
                            color: '#9ca3af',
                            marginBottom: '1rem'
                        }}>
                            <Image src='AstarCup.svg' alt="AstarCup" width={400} height={200} />
                        </div>
                        <div style={{
                            fontSize: '1.5rem',
                            color: 'black',
                            backgroundColor: 'white',
                            padding: '0.25rem 0.5rem',
                            fontWeight: 'bold',
                        }}>
                            {settings.matchInfo} BO{settings.boFormat.slice(2)} (抢{winScore}分)
                        </div>

                    </div>

                    {/* 蓝队 */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        flex: '2'
                    }}>
                        <TeamDisplay
                            team={teams.find(t => t.id === 'blue')!}
                            onScoreChange={handleScoreChange}
                            winScore={winScore}
                        />
                    </div>
                </div>

                {/* 计时器显示 */}
                <TimerDisplay timerState={timerState} mapPoolVisible={mapPoolSettings.visible} />

                {/* 图池显示区域 */}
                {mapPoolSettings.visible && (
                    <div style={{
                        marginTop: '40px',
                        padding: '0 40px'
                    }}>
                        {isLoading ? (
                            <div className="text-center text-white text-lg py-8">
                                正在加载图池数据...
                            </div>
                        ) : (
                            <MapPoolGrid
                                beatmaps={beatmaps}
                                onBeatmapLeftClick={handleBeatmapLeftClick}
                                onBeatmapRightClick={handleBeatmapRightClick}
                                banPickHistory={banPickState.history}
                            />
                        )}
                    </div>
                )}

            </div>
            {/* Roll点显示 */}
            <RollDisplay rollState={rollState} />

            {/* 设置面板 */}
            <div style={{ marginTop: '160px' }}>
                <MatchSettings
                    settings={settings}
                    onSettingsChange={setSettings}
                    timerState={timerState}
                    onTimerStateChange={setTimerState}
                    banPickState={banPickState}
                    onBanPickStateChange={setBanPickState}
                    mapPoolSettings={mapPoolSettings}
                    onMapPoolSettingsChange={setMapPoolSettings}
                    onResetBanPick={resetBanPickState}
                    rollState={rollState}
                    onRollStateChange={setRollState}
                    refereeState={refereeState}
                    onRefereeStateChange={setRefereeState}
                    teams={teams}
                    onScoreChange={handleScoreChange}
                />
            </div>
        </div>
    );
}
