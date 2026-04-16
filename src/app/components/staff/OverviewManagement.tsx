"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { UserSession } from "@/lib/permissions";
import { UserPermissions } from "@/lib/permissions";
import { TournamentRegistration } from "@/lib/prisma-registrations";

interface OverviewManagementProps {
  user: UserSession;
  permissions: UserPermissions;
  registrations: TournamentRegistration[];
}

export default function OverviewManagement({
  user,
  permissions,
  registrations,
}: OverviewManagementProps) {
  const [approvedPlayersCount, setApprovedPlayersCount] = useState<number>(0);
  const [matchRoomsCount, setMatchRoomsCount] = useState<number>(0);
  const [mappoolCount, setMappoolCount] = useState<number>(0);
  const [replayCount, setReplayCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 获取已过审玩家数
        const approvedResponse = await fetch("/api/approved-players");
        if (approvedResponse.ok) {
          const approvedData = await approvedResponse.json();
          setApprovedPlayersCount(approvedData.players?.length || 0);
        }

        // 获取比赛房间数
        const roomsResponse = await fetch("/api/match-rooms");
        if (roomsResponse.ok) {
          const roomsData = await roomsResponse.json();
          setMatchRoomsCount(roomsData.rooms?.length || 0);
        }

        // 获取图池数量（统计所有season的图池）
        const seasons = ["s1", "s2", "s3", "s4", "s5"];
        let totalMappools = 0;
        for (const season of seasons) {
          try {
            const mappoolResponse = await fetch(
              `/api/mappool?season=${season}`,
            );
            if (mappoolResponse.ok) {
              const mappoolData = await mappoolResponse.json();
              if (mappoolData && Object.keys(mappoolData).length > 0) {
                totalMappools++;
              }
            }
          } catch (error) {
            // 忽略单个season的错误
          }
        }
        setMappoolCount(totalMappools);

        // 获取已回收replay数（从match-schedules获取）
        const schedulesResponse = await fetch("/api/match-schedules");
        if (schedulesResponse.ok) {
          const schedulesData = await schedulesResponse.json();
          const replayCount =
            schedulesData.schedules?.filter(
              (schedule: any) => schedule.replay_link,
            )?.length || 0;
          setReplayCount(replayCount);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);
  return (
    <div className="space-y-6">
      {/* 管理员信息卡片 */}
      {/* Cover 背景图 */}
      {user.cover?.url && (
        <div className="relative mb-4 overflow-hidden">
          <Image
            src={user.cover.url}
            alt={`${user.username} cover`}
            width={600}
            height={200}
            className="w-full h-48 object-cover"
            onError={() => {}}
          />
          {/* 渐变遮罩，让文字更清晰 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
      )}
      <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
        <div className="flex items-center mb-4">
          <Image
            src={user.avatar_url}
            alt={user.username}
            width={60}
            height={60}
            className="rounded-full outline outline-2 outline-[#E93B66] mr-4"
            onError={() => {}}
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              {user.username}
            </h2>
            <div className="flex flex-wrap gap-2">
              {/* 权限组标签 */}
              {permissions.isAdmin && (
                <span className="px-3 py-1 bg-red-800/80 text-white text-sm border border-red-700 font-medium">
                  管理员
                </span>
              )}
              {permissions.isMapSelector && (
                <span className="px-3 py-1 bg-blue-800/80 text-white text-sm border border-blue-700 font-medium">
                  选图组
                </span>
              )}
              {permissions.isReplayTester && (
                <span className="px-3 py-1 bg-green-800/80 text-white text-sm border border-green-700 font-medium">
                  测图组
                </span>
              )}
              {permissions.isStreamer && (
                <span className="px-3 py-1 bg-purple-800/80 text-white text-sm border border-purple-700 font-medium">
                  直播组
                </span>
              )}
              {permissions.isReferee && (
                <span className="px-3 py-1 bg-orange-800/80 text-white text-sm border border-orange-700 font-medium">
                  裁判组
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 数据统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center">
            <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
            注册玩家
          </h4>
          <div className="text-3xl font-bold text-[#3BE9D8]">
            {registrations.length}
          </div>
          <p className="text-gray-400 text-sm mt-2">总注册人数</p>
        </div>

        <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center">
            <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
            已过审玩家
          </h4>
          <div className="text-3xl font-bold text-[#3BE9D8]">
            {loading ? "..." : approvedPlayersCount}
          </div>
          <p className="text-gray-400 text-sm mt-2">已审核通过人数</p>
        </div>

        <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center">
            <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
            比赛房间
          </h4>
          <div className="text-3xl font-bold text-[#3BE9D8]">
            {loading ? "..." : matchRoomsCount}
          </div>
          <p className="text-gray-400 text-sm mt-2">总房间数量</p>
        </div>

        <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center">
            <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
            图池数量
          </h4>
          <div className="text-3xl font-bold text-[#3BE9D8]">
            {loading ? "..." : mappoolCount}
          </div>
          <p className="text-gray-400 text-sm mt-2">可用赛季图池</p>
        </div>

        <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center">
            <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
            已回收Replay
          </h4>
          <div className="text-3xl font-bold text-[#3BE9D8]">
            {loading ? "..." : replayCount}
          </div>
          <p className="text-gray-400 text-sm mt-2">已上传回放数</p>
        </div>
      </div>
    </div>
  );
}
