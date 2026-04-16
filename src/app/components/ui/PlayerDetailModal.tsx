"use client";

import { TournamentRegistration } from "@/lib/prisma-registrations";
import Image from "next/image";
import RadarChart from "./RadarChart";

interface PlayerDetailModalProps {
  player: TournamentRegistration | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PlayerDetailModal({
  player,
  isOpen,
  onClose,
}: PlayerDetailModalProps) {
  if (!isOpen || !player) return null;

  const formatRank = (rank: number | null) => {
    if (rank === null) return "未排名";
    return `#${rank.toLocaleString()}`;
  };

  const formatPP = (pp: number) => {
    return Math.round(pp).toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 模态框头部 */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-4">
            <Image
              src={player.avatar_url}
              alt={player.username}
              width={64}
              height={64}
              className="rounded-full outline outline-2 outline-[#E93B66]"
              onError={(e) => {
                e.currentTarget.src = "/default-avatar.png";
              }}
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                <a
                  href={`https://osu.ppy.sh/users/${player.osuId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600"
                >
                  {player.username}
                </a>
              </h2>
              <p className="text-gray-600">ID: {player.osuId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 模态框内容 */}
        <div className="p-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-2">PP</h3>
              <p className="text-3xl font-bold text-gray-900">
                {formatPP(player.pp)}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                全球排名
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {formatRank(player.global_rank)}
              </p>
            </div>
            {player.country_rank && (
              <div className="col-span-2 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  地区排名
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  {formatRank(player.country_rank)}
                  <span className="text-xl ml-2 text-gray-600">
                    {player.country}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* 技能评分雷达图 */}
          {(player.accuracy !== null ||
            player.stamina !== null ||
            player.firstSight !== null ||
            player.strategy !== null ||
            player.experience !== null ||
            (player.customKey && player.customValue !== null)) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                技能评分
              </h3>
              <div className="flex justify-center">
                <RadarChart
                  data={{
                    accuracy: player.accuracy || 0,
                    stamina: player.stamina || 0,
                    firstSight: player.firstSight || 0,
                    strategy: player.strategy || 0,
                    experience: player.experience || 0,
                  }}
                  customData={
                    player.customKey && player.customValue !== null
                      ? {
                          key: player.customKey,
                          value: player.customValue,
                        }
                      : undefined
                  }
                  width={400}
                  height={300}
                />
              </div>
            </div>
          )}

          {/* 技能评分详情 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              技能详情
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {player.accuracy !== null && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-700">准确度</h4>
                  <p className="text-2xl font-bold text-blue-900">
                    {player.accuracy.toFixed(1)}
                  </p>
                </div>
              )}
              {player.stamina !== null && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-green-700">耐力</h4>
                  <p className="text-2xl font-bold text-green-900">
                    {player.stamina.toFixed(1)}
                  </p>
                </div>
              )}
              {player.firstSight !== null && (
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-700">初见</h4>
                  <p className="text-2xl font-bold text-purple-900">
                    {player.firstSight.toFixed(1)}
                  </p>
                </div>
              )}
              {player.strategy !== null && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-700">策略</h4>
                  <p className="text-2xl font-bold text-yellow-900">
                    {player.strategy.toFixed(1)}
                  </p>
                </div>
              )}
              {player.experience !== null && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-red-700">经验</h4>
                  <p className="text-2xl font-bold text-red-900">
                    {player.experience.toFixed(1)}
                  </p>
                </div>
              )}
              {player.customKey && player.customValue !== null && (
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-indigo-700">
                    {player.customKey}
                  </h4>
                  <p className="text-2xl font-bold text-indigo-900">
                    {player.customValue.toFixed(1)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 审核状态 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              审核状态
            </h3>
            <div
              className={`inline-flex items-center px-4 py-2 rounded-full ${player.approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
            >
              {player.approved ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span className="font-medium">已审核通过</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  <span className="font-medium">待审核</span>
                </>
              )}
            </div>
          </div>

          {/* 报名信息 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              报名信息
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                报名时间:{" "}
                {new Date(player.registeredAt).toLocaleString("zh-CN")}
              </p>
              {player.updatedAt && (
                <p>
                  最后更新: {new Date(player.updatedAt).toLocaleString("zh-CN")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 模态框底部 */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
          <a
            href={`https://osu.ppy.sh/users/${player.osuId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#E93B66] text-white rounded-lg hover:bg-[#95E1D3] transition-colors"
          >
            查看osu!个人资料
          </a>
        </div>
      </div>
    </div>
  );
}
