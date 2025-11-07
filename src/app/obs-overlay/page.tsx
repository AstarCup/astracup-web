"use client";

import { useState, useEffect } from "react";
import MatchSettings from "./components/MatchSettings";
import TeamDisplay from "./components/TeamDisplay";
import { Team, MatchSettings as MatchSettingsType, BO_FORMAT_WIN_SCORE } from "./types/match";
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
                    marginTop: '160px' // mt-40 对应 160px
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
                            <Image src='AstaraCup.svg' alt="AstraCup" width={400} height={200} />
                        </div>
                        <div style={{
                            fontSize: '1.5rem',
                            color: 'black',
                            backgroundColor: 'white',
                            padding: '0.25rem 0.5rem',
                            fontWeight: 'bold',
                        }}>
                            {settings.matchInfo} BO{settings.boFormat.slice(2)} (先得{winScore}分)
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

                {/* 设置面板 */}
                <div style={{ marginTop: '160px' }}>
                    <MatchSettings
                        settings={settings}
                        onSettingsChange={setSettings}
                    />
                </div>
            </div>
        </div>
    );
}
