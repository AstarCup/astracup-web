"use client";

import { Team } from "../types/match";
import Image from "next/image";

interface VictoryDisplayProps {
  team: Team;
}

export default function VictoryDisplay({ team }: VictoryDisplayProps) {
  const getTeamColor = (teamId: "red" | "blue") => {
    return teamId === "red" ? "#E93B66" : "#0FAAE7ff";
  };

  return (
    <div
      className="flex flex-col items-center justify-center p-12"
      style={{
        width: "2560px",
        height: "1440px",
        backgroundColor: "transparent",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 1000,
      }}
    >
      {/* 胜利队伍信息 */}
      <div className="flex items-center justify-center gap-16">
        {/* 头像 */}
        {team.avatarUrl && (
          <div
            className="w-64 h-64 border-8 overflow-hidden rounded-lg"
            style={{ borderColor: getTeamColor(team.id) }}
          >
            <img
              src={team.avatarUrl}
              alt={team.playerName}
              width={256}
              height={256}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* 玩家名称 */}
        <div className="text-center flex-col">
          {/* WINNER 标题 */}
          <div className="">
            <div className="text-8xl font-bold text-white drop-shadow-lg text-center">
              WINNER
            </div>
          </div>
          <div
            className="text-7xl font-bold bg-white shadow-2xl"
            style={{ color: getTeamColor(team.id) }}
          >
            {team.playerName}
          </div>
        </div>
      </div>

      {/* 装饰性元素 */}
      <div className="mt-16">
        <div
          className="w-32 h-4 rounded-full"
          style={{ backgroundColor: getTeamColor(team.id) }}
        />
      </div>
    </div>
  );
}
