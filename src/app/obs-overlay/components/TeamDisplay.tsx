"use client";

import { Team } from "../types/match";
import Image from "next/image";

interface TeamDisplayProps {
    team: Team;
    onScoreChange: (teamId: 'red' | 'blue', newScore: number) => void;
    winScore: number;
}

export default function TeamDisplay({ team, onScoreChange, winScore }: TeamDisplayProps) {
    const handleScoreClick = (event: React.MouseEvent) => {
        event.preventDefault(); // 防止右键菜单

        if (event.button === 0) { // 左键点击
            // 增加比分，但不能超过获胜分数
            if (team.score < winScore) {
                onScoreChange(team.id, team.score + 1);
            }
        } else if (event.button === 2) { // 右键点击
            // 减少比分，但不能低于0
            if (team.score > 0) {
                onScoreChange(team.id, team.score - 1);
            }
        }
    };

    const getTeamColor = (teamId: 'red' | 'blue') => {
        return teamId === 'red' ? '#E93B66' : '#0FAAE7ff';
    };

    const isWinning = team.score === winScore;

    return (
        <div
            className="flex flex-col items-center p-6 transition-all duration-300"
        // style={{
        //     borderColor: getTeamColor(team.id),
        //     backgroundColor: isWinning ? `${getTeamColor(team.id)}20` : '#00000080'
        // }}
        >
            <div className="flex items-center justify-between w-full relative">
                {/* 红队布局：头像 | 信息 | 比分 */}
                {team.id === 'red' && (
                    <>
                        {/* 头像 */}
                        {team.avatarUrl && (
                            <div className="w-32 h-32 border-4 overflow-hidden"
                                style={{ borderColor: getTeamColor(team.id) }}>
                                <img
                                    src={team.avatarUrl}
                                    alt={team.playerName}
                                    width={128}
                                    height={128}
                                    className="w-full object-cover"
                                />
                            </div>
                        )}
                        {/* 信息 */}
                        <div className="flex-1 px-8">
                            {/* 队伍名称
                            <h3
                                className="text-3xl font-bold text-left"
                                style={{ color: getTeamColor(team.id) }}
                            >
                                {team.name}
                            </h3> */}
                            <div className="">
                                {/* 玩家名称 */}
                                <div className="text-left">
                                    <p className="text-5xl font-bold bg-white" style={{ color: getTeamColor(team.id) }}>
                                        {team.playerName}
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-start items-start">
                                <div
                                    className="w-15 h-15 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                                    style={{
                                        backgroundColor: getTeamColor(team.id),
                                        boxShadow: isWinning ? `0 0 15px ${getTeamColor(team.id)}` : 'none'
                                    }}
                                    onMouseDown={handleScoreClick}
                                    onContextMenu={(e) => e.preventDefault()} // 禁用右键菜单
                                >
                                    <span className="text-4xl font-bold text-white drop-shadow-lg">
                                        {team.score}
                                    </span>
                                </div>
                                {/* 红队右边小方块 - 数量由比分决定 */}
                                <div className="flex gap-1">
                                    {Array.from({ length: team.score }).map((_, index) => (
                                        <div
                                            key={index}
                                            className="w-15 h-3"
                                            style={{
                                                backgroundColor: getTeamColor(team.id)
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* 比分 */}
                        <div>
                            {/* 获胜提示 */}
                            {/* {isWinning && (
                                <div className="animate-pulse text-center absolute -top-10 left-38">
                                    <div className="">
                                        <Image src='/icons/Winner.svg' alt="winner" width={180} height={100} />
                                    </div>
                                </div>
                            )} */}
                        </div>
                    </>
                )}

                {/* 蓝队布局：比分 | 信息 | 头像 */}
                {team.id === 'blue' && (
                    <>
                        {/* 比分 */}
                        <div>
                            {/* 获胜提示 */}
                            {/* {isWinning && (
                                <div className="animate-pulse text-center absolute -top-10 -right-38">
                                    <div className="">
                                        <Image src='/icons/Winner.svg' alt="winner" width={180} height={100} />
                                    </div>
                                </div>
                            )} */}
                        </div>
                        {/* 信息 */}
                        <div className="flex-1 px-8 justify-items-end-safe">

                            {/* 队伍名称
                            <h3
                                className="text-3xl font-bold text-right"
                                style={{ color: getTeamColor(team.id) }}
                            >
                                {team.name}
                            </h3> */}
                            <div className="bg-white">
                                {/* 玩家名称 */}
                                <div className="text-right">
                                    <p className="text-5xl font-bold" style={{ color: getTeamColor(team.id) }}>
                                        {team.playerName}
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end items-start">
                                {/* 蓝队左边小方块 - 数量由比分决定 */}
                                <div className="flex gap-1">
                                    {Array.from({ length: team.score }).map((_, index) => (
                                        <div
                                            key={index}
                                            className="w-15 h-3"
                                            style={{
                                                backgroundColor: getTeamColor(team.id)
                                            }}
                                        />
                                    ))}
                                </div>
                                <div
                                    className="w-15 h-15 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
                                    style={{
                                        backgroundColor: getTeamColor(team.id),
                                        boxShadow: isWinning ? `0 0 15px ${getTeamColor(team.id)}` : 'none'
                                    }}
                                    onMouseDown={handleScoreClick}
                                    onContextMenu={(e) => e.preventDefault()} // 禁用右键菜单
                                >
                                    <span className="text-4xl font-bold text-white drop-shadow-lg">
                                        {team.score}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {/* 头像 */}
                        {team.avatarUrl && (
                            <div className="w-32 h-32 border-4 overflow-hidden"
                                style={{ borderColor: getTeamColor(team.id) }}>
                                <img
                                    src={team.avatarUrl}
                                    alt={team.playerName}
                                    width={128}
                                    height={128}
                                    className="w-full object-cover"
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
