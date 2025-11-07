"use client";

import { useState, useEffect } from "react";
import MatchSettings from "./components/MatchSettings";
import TeamDisplay from "./components/TeamDisplay";
import { Team, MatchSettings as MatchSettingsType, BO_FORMAT_WIN_SCORE } from "./types/match";
import Image from "next/image";

export default function ObsOverlay() {
    const [settings, setSettings] = useState<MatchSettingsType>({
        boFormat: 'BO9',
        redTeamName: '红队',
        blueTeamName: '蓝队'
    });

    const [teams, setTeams] = useState<Team[]>([
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
    ]);

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
        <div className="min-h-screen bg-black text-white">
            {/* 固定2K分辨率容器 */}
            <div
                className="mx-auto relative"
                style={{
                    width: '2560px',
                    height: '1440px',
                    backgroundColor: 'transparent' // 支持OBS透明背景
                }}
            >
                {/* 队伍显示区域 */}
                <div className="flex mt-40">
                    {/* 红队 */}
                    <div className="flex-2 flex justify-start">
                        <TeamDisplay
                            team={teams.find(t => t.id === 'red')!}
                            onScoreChange={handleScoreChange}
                            winScore={winScore}
                        />
                    </div>

                    {/* 比分分隔线 */}
                    <div className="relative flex flex-col items-center justify-center flex-1">
                        <div className="text-4xl font-bold text-gray-400 mb-4">
                            <Image src='AstaraCup.svg' alt="AstraCup" width={400} height={200} />
                        </div>
                        <div className="text-lg text-black bg-white">
                            BO{settings.boFormat.slice(2)} (先得{winScore}分)
                        </div>
                        {/* <button
                            onClick={resetScores}
                            className="mt-4 px-6 py-2 bg-[#E93B66] text-white rounded hover:bg-[#3BE9D8] transition-colors"
                        >
                            重置比分
                        </button> */}
                    </div>

                    {/* 蓝队 */}
                    <div className="flex justify-end flex-2">
                        <TeamDisplay
                            team={teams.find(t => t.id === 'blue')!}
                            onScoreChange={handleScoreChange}
                            winScore={winScore}
                        />
                    </div>
                </div>


                {/* 设置面板 */}
                <div className="mt-40">
                    <MatchSettings
                        settings={settings}
                        onSettingsChange={setSettings}
                    />
                </div>
            </div>


        </div>
    );
}
