"use client";

import React, { useState } from "react";
import Image from "next/image";
import WinnerCard from "../components/ui/WinnerCard";
import winnersData from "@/config/winners.json";
import { usePageTitle } from "@/lib/usePageTitle";

interface Winner {
  playerName: string;
  osuId: string;
  country: string;
  avatarUrl: string;
  teamName?: string;
  achievement?: string;
  resultImage: string;
}

interface Season {
  seasonId: string;
  year: string;
  description: string;
  winners: {
    first: Winner;
    second: Winner;
    third: Winner;
  };
  matchDate: string;
  totalParticipants: number;
  status?: string;
}

const getSeasonName = (seasonId: string): string => {
  const num = parseInt(seasonId.replace("s", ""));
  const chineseNum = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  return `第${chineseNum[num] || num}届`;
};

export default function Photos() {
  usePageTitle("/photos");

  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const seasons = winnersData.seasons as Season[];

  const filteredSeasons =
    selectedSeason === "all"
      ? seasons
      : seasons.filter((season) => season.seasonId === selectedSeason);

  return (
    <div className="min-h-screen pb-20 text-text">
      <div className="py-16 mb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-text mb-4">荣誉榜</h1>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              记录每一届 AstarCup 的冠亚季军得主，见证传奇的诞生
            </p>
            <div className="mt-6 flex justify-center items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-text-secondary">总赛季数</span>
                <span className="bg-action text-text font-bold px-3 py-1">
                  {seasons.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <div className="bg-white dark:bg-white-extra p-6 border-b-4 border-pink-400">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedSeason("all")}
                className={`px-4 py-2 font-semibold transition-colors ${selectedSeason === "all"
                  ? "bg-highlight text-white"
                  : "bg-action text-text hover:bg-highlight-secondary"
                  }`}
              >
                全部赛季
              </button>
              {seasons.map((season) => (
                <button
                  key={season.seasonId}
                  onClick={() => setSelectedSeason(season.seasonId)}
                  className={`px-4 py-2 font-semibold transition-colors ${selectedSeason === season.seasonId
                    ? "bg-highlight text-white"
                    : "bg-action text-text hover:bg-highlight-secondary"
                    } ${season.status === "ongoing" ? "relative" : ""}`}
                >
                  {getSeasonName(season.seasonId)}
                  {season.status === "ongoing" && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredSeasons.map((season) => (
          <div key={season.seasonId} className="mb-16">
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <h2 className="text-3xl sm:text-4xl font-bold text-text mr-0 sm:mr-4 mb-2 sm:mb-0">
                    {getSeasonName(season.seasonId)}
                  </h2>
                  <div className="flex items-center gap-4">
                    <span className="text-xl sm:text-2xl text-text-secondary">
                      ({season.year})
                    </span>
                    {season.status === "open" && (
                      <span className="bg-green-500 text-white text-sm px-3 py-1 rounded-full animate-pulse">
                        进行中
                      </span>
                    )}
                    {season.status === "close" && (
                      <span className="bg-gray-500 text-white text-sm px-3 py-1 rounded-full">
                        已结束
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-left lg:text-right text-text-secondary space-y-1">
                  <div className="text-sm sm:text-base">
                    比赛日期: {season.matchDate}
                  </div>
                  <div className="text-sm sm:text-base">
                    参赛人数: {season.totalParticipants} 人
                  </div>
                </div>
              </div>

              <p className="text-text-secondary text-base sm:text-lg mb-6">
                {season.description}
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-8">
              <div className="order-2 md:order-1 transform md:scale-90 w-full md:w-auto md:min-w-[280px] flex-shrink-0">
                <WinnerCard
                  winner={season.winners.second}
                  rank={2}
                  seasonName={getSeasonName(season.seasonId)}
                />
              </div>

              <div className="order-1 md:order-2 transform md:scale-110 relative z-10 w-full md:w-auto md:min-w-[320px] flex-shrink-0">
                <WinnerCard
                  winner={season.winners.first}
                  rank={1}
                  seasonName={getSeasonName(season.seasonId)}
                />
              </div>

              <div className="order-3 md:order-3 transform md:scale-90 w-full md:w-auto md:min-w-[280px] flex-shrink-0">
                <WinnerCard
                  winner={season.winners.third}
                  rank={3}
                  seasonName={getSeasonName(season.seasonId)}
                />
              </div>
            </div>

            {filteredSeasons.indexOf(season) < filteredSeasons.length - 1 && (
              <div className="mt-16 border-t border-action"></div>
            )}
          </div>
        ))}

        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-white to-white-extra dark:from-white-extra dark:to-action p-8 border-b-4 border-pink-400">
            <h3 className="text-3xl font-bold text-text mb-4">
              成为传说的一部分
            </h3>
            <p className="text-text-secondary mb-6 max-w-3xl mx-auto text-lg">
              每一位获奖者都是 AstarCup
              历史的见证者。他们的名字将永远刻在荣誉榜上，
              激励着更多选手追求卓越，成就自己的传奇故事。
            </p>
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <div className="text-3xl text-yellow-400 mb-2">
                  <Image src="/icons/1.svg" alt="1" width={48} height={48} />
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl text-text-secondary mb-2">
                  <Image src="/icons/2.svg" alt="2" width={48} height={48} />
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl text-amber-600 mb-2">
                  <Image src="/icons/3.svg" alt="3" width={48} height={48} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
