"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import MainCard from "../components/ui/MainCard";
import type { MatchRoom, MatchSchedule } from "@prisma/client";

interface RoomWithSchedules extends MatchRoom {
  schedules: MatchSchedule[];
}

interface PlayerInfo {
  osuId: string;
  username: string;
  avatar_url: string;
  pp: number;
  global_rank: number | null;
  country_rank: number | null;
  country: string;
  cover_url: string | null;
  cover_custom_url: string | null;
}

export default function Schedule() {
  const [rooms, setRooms] = useState<RoomWithSchedules[]>([]);
  const [playerInfoMap, setPlayerInfoMap] = useState<
    Record<string, PlayerInfo>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userOsuId, setUserOsuId] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [joiningRoomId, setJoiningRoomId] = useState<number | null>(null);

  useEffect(() => {
    fetchRooms();
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const sessionRes = await fetch("/api/session/get");
      const sessionData = await sessionRes.json();
      const osuId = sessionData?.data?.session?.osuId;
      if (!osuId) return;
      setUserOsuId(osuId);

      const regRes = await fetch(`/api/user-registration?osuId=${osuId}`);
      const regData = await regRes.json();
      if (regData.success && regData.data?.user) {
        setUserStatus(regData.data.user.registrationStatus);
      }
    } catch (err) {
      console.error("Error checking user:", err);
    }
  };

  const fetchPlayerInfo = async (osuIds: string[]) => {
    const unique = [...new Set(osuIds)];
    const results = await Promise.all(
      unique.map(async (osuId) => {
        try {
          const res = await fetch(`/api/user-registration?osuId=${osuId}`);
          const data = await res.json();
          if (data.success && data.data?.user) {
            const u = data.data.user;
            return {
              osuId,
              username: u.username,
              avatar_url:
                u.avatar_url || `https://a.ppy.sh/${osuId}`,
              pp: u.pp ?? 0,
              global_rank: u.global_rank ?? null,
              country_rank: u.country_rank ?? null,
              country: u.country ?? "",
              cover_url: u.cover_url ?? null,
              cover_custom_url: u.cover_custom_url ?? null,
            };
          }
        } catch {}
        return {
          osuId,
          username: "",
          avatar_url: `https://a.ppy.sh/${osuId}`,
          pp: 0,
          global_rank: null,
          country_rank: null,
          country: "",
          cover_url: null,
          cover_custom_url: null,
        };
      }),
    );
    const map: Record<string, PlayerInfo> = {};
    results.forEach((p) => {
      map[p.osuId] = p;
    });
    setPlayerInfoMap((prev) => ({ ...prev, ...map }));
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/match-rooms?withSchedules=true");
      const data = await response.json();

      if (data.success) {
        const roomList = data.rooms || [];
        setRooms(roomList);

        // 收集所有需要获取头像的玩家 osuId
        const allOsuIds: string[] = [];
        roomList.forEach((room: RoomWithSchedules) => {
          room.schedules.forEach((s) => {
            if (s.player1_osuId && s.player1_osuId !== "TBD")
              allOsuIds.push(s.player1_osuId);
            if (s.player2_osuId && s.player2_osuId !== "TBD")
              allOsuIds.push(s.player2_osuId);
          });
        });
        if (allOsuIds.length > 0) {
          fetchPlayerInfo(allOsuIds);
        }
      } else {
        setError(data.error || "获取房间数据失败");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
      console.error("Error fetching match rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: number) => {
    try {
      setJoiningRoomId(roomId);
      const response = await fetch("/api/join-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomId }),
      });
      const data = await response.json();

      if (data.success) {
        await fetchRooms();
      } else {
        alert(data.error || "加入房间失败");
      }
    } catch (err) {
      alert("网络错误，请稍后重试");
      console.error("Error joining room:", err);
    } finally {
      setJoiningRoomId(null);
    }
  };

  const formatDateTime = (dateStr: Date | string) => {
    try {
      return new Date(dateStr).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateStr);
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "开放中";
      case "full":
        return "已满";
      case "closed":
        return "已关闭";
      default:
        return status;
    }
  };

  const scheduleStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "未确认";
      case "confirmed":
        return "已确认";
      case "completed":
        return "已完成";
      case "cancelled":
        return "已取消";
      default:
        return "未知";
    }
  };

  if (loading) {
    return (
      <MainCard>
        <h1 className="text-4xl font-bold mb-4 text-gray-600">比赛房间</h1>
        <p className="text-gray-400">加载中...</p>
      </MainCard>
    );
  }

  if (error) {
    return (
      <MainCard>
        <h1 className="text-4xl font-bold mb-4 text-gray-600">比赛房间</h1>
        <p className="text-red-500">错误: {error}</p>
      </MainCard>
    );
  }

  return (
    <MainCard>
      <h1 className="text-4xl font-bold mb-6 text-gray-600">比赛房间</h1>

      {rooms.length === 0 ? (
        <p className="text-gray-400 text-center py-12">暂无比赛房间</p>
      ) : (
        <div className="space-y-6">
          {rooms.map((room) => {
            // solo房间必须有 PlayerMatchup 安排才能显示
            if (
              room.match_type !== "battle_royale" &&
              room.schedules.length === 0
            )
              return null;

            return (
            <div
              key={room.id}
              className="bg-gray-100 rounded-lg overflow-hidden"
            >
              {/* 房间头部 */}
              <div className="px-6 py-4 flex items-center justify-between bg-gray-200">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-gray-800">
                    {room.room_name}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {statusLabel(room.status)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>第 {room.round_number} 轮</span>
                  <span>第 {room.match_number} 场</span>
                  <span>{formatDateTime(room.match_datetime)}</span>
                  <span className="uppercase">{room.match_type}</span>
                </div>
              </div>

              {/* 比赛列表 */}
              <div className="px-6 py-4">
                {room.match_type === "battle_royale" &&
                room.schedules.length === 0 ? (
                  <div className="py-4 text-center">
                    {userStatus === "approved" ? (
                      <button
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={joiningRoomId === room.id}
                        className="bg-[#E93B66] text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50"
                      >
                        {joiningRoomId === room.id
                          ? "加入中..."
                          : "加入大乱斗"}
                      </button>
                    ) : (
                      <p className="text-gray-400 text-sm">暂无玩家加入</p>
                    )}
                  </div>
                ) : room.match_type === "battle_royale" ? (
                  <div>
                    <p className="text-sm text-gray-400 mb-4 px-1">
                      已加入 {room.schedules.length} 人
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {room.schedules.map((schedule) => {
                        const info = playerInfoMap[schedule.player1_osuId];
                        const coverUrl =
                          info?.cover_url || info?.cover_custom_url;
                        return (
                          <a
                            key={schedule.id}
                            href={`https://osu.ppy.sh/users/${schedule.player1_osuId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer group"
                            style={{
                              width: "180px",
                              height: "260px",
                              ...(coverUrl
                                ? {
                                    backgroundImage: `url(${coverUrl})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                  }
                                : { backgroundColor: "#1a1a1a" }),
                            }}
                          >
                            {/* 暗色叠加层 */}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                            {/* 排名 */}
                            {info?.global_rank && (
                              <p
                                className="absolute top-2 right-2 text-xs text-white/60"
                                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                              >
                                #{info.global_rank.toLocaleString()}
                              </p>
                            )}

                            {/* PP */}
                            <p
                              className="absolute top-6 right-2 font-bold text-white/40"
                              style={{
                                fontSize: "2rem",
                                textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                              }}
                            >
                              {info ? Math.round(info.pp) : ""}
                            </p>

                            {/* 用户名 */}
                            <p
                              className="absolute bottom-3 left-3 right-16 text-sm font-bold text-white truncate"
                              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                            >
                              {schedule.player1_username}
                            </p>

                            {/* 头像 */}
                            <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full overflow-hidden">
                              <Image
                                src={
                                  info?.avatar_url ||
                                  `https://a.ppy.sh/${schedule.player1_osuId}`
                                }
                                alt={schedule.player1_username}
                                width={40}
                                height={40}
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {room.schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between bg-white rounded-lg px-6 py-4 border border-gray-200"
                      >
                        {/* 选手对阵 */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 min-w-36 justify-end">
                            <span className="text-gray-800 font-medium text-lg">
                              {schedule.player1_username}
                            </span>
                            <Image
                              src={
                                playerInfoMap[schedule.player1_osuId]
                                  ?.avatar_url ||
                                `https://a.ppy.sh/${schedule.player1_osuId}`
                              }
                              alt={schedule.player1_username}
                              width={28}
                              height={28}
                              className="rounded-full"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-red-500">
                              {schedule.red_score}
                            </span>
                            <span className="text-gray-400 text-lg">:</span>
                            <span className="text-2xl font-bold text-blue-500">
                              {schedule.blue_score}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 min-w-36">
                            <Image
                              src={
                                playerInfoMap[schedule.player2_osuId]
                                  ?.avatar_url ||
                                `https://a.ppy.sh/${schedule.player2_osuId}`
                              }
                              alt={schedule.player2_username}
                              width={28}
                              height={28}
                              className="rounded-full"
                            />
                            <span className="text-gray-800 font-medium text-lg">
                              {schedule.player2_username}
                            </span>
                          </div>
                        </div>

                        {/* 状态和链接 */}
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-gray-500">
                            {scheduleStatusLabel(schedule.status)}
                          </span>
                          {schedule.stream_link && (
                            <a
                              href={schedule.stream_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:opacity-80 transition-opacity"
                            >
                              <Image
                                src="/icons/bilibili-live-sm.svg"
                                alt="直播"
                                width={36}
                                height={36}
                              />
                            </a>
                          )}
                          {schedule.match_link && (
                            <a
                              href={schedule.match_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:opacity-80 transition-opacity"
                            >
                              <Image
                                src="/icons/osu-match-sm.svg"
                                alt="比赛链接"
                                width={36}
                                height={36}
                              />
                            </a>
                          )}
                          {schedule.replay_link && (
                            <a
                              href={schedule.replay_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-[#E93B66] hover:underline font-medium"
                            >
                              回放
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {room.description && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-gray-400">{room.description}</p>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Challonge 对阵表 */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-600">
          比赛对阵表
        </h2>
        <iframe
          src="https://challonge.com/zh_CN/af6qbeto/module"
          width="100%"
          height="800"
          className="rounded-lg"
        />
      </div>
    </MainCard>
  );
}
