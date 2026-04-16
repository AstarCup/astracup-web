"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UserSession } from "@/lib/permissions";
import { UserPermissions } from "@/lib/permissions";
import MatchScheduleSystem from "@/app/components/staff/MatchScheduleSystem";
import localFont from "next/font/local";
import type { MatchRoom } from "@prisma/client";

const audiowide = localFont({
  src: "../font/Audiowide-Regular.ttf",
  display: "auto",
});

interface Registration {
  osuId: string;
  username: string;
  inGameName: string;
  timezone: string;
  availability: string;
  registeredAt: string;
  avatar_url: string;
  pp: number;
  global_rank: number;
  country_rank: number;
  country: string;
  approved: boolean;
  approvedAt: string | null;
}

interface NextMatch {
  id: number;
  opponent: {
    osuId: string;
    username: string;
    avatar_url: string | null;
  };
  status: "available" | "scheduled" | "completed";
  scheduledRoom?: {
    id: number;
    room_name: string;
    round_number: number;
    match_date: string;
    match_time: string;
    match_number: number;
    max_participants: number;
  };
}

export default function PlayerInfoPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>({
    isMapSelector: false,
    isReplayTester: false,
    isAdmin: false,
    isStreamer: false,
    isReferee: false,
    isCommentator: false,
  });
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [nextMatch, setNextMatch] = useState<NextMatch | null>(null);
  const [requestingMatch, setRequestingMatch] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<MatchRoom[]>([]);
  const [showRoomSelection, setShowRoomSelection] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // 获取用户session
        const sessionResponse = await fetch("/api/session/get");
        const sessionData = await sessionResponse.json();

        const userSession = sessionData.data?.session;
        if (!sessionData.success || !userSession) {
          router.push("/register");
          return;
        }

        setUser(userSession);

        // 获取用户权限
        try {
          const permissionsResponse = await fetch(
            `/api/user-permissions?osuId=${userSession.osuId}`,
          );
          if (permissionsResponse.ok) {
            const permissionsData = await permissionsResponse.json();
            setPermissions(permissionsData.permissions);
          }
        } catch (error) {
          console.error("Failed to fetch user permissions:", error);
        }

        // 获取用户注册信息
        try {
          const registrationResponse = await fetch(
            `/api/user-registration?osuId=${userSession.osuId}`,
          );
          if (registrationResponse.ok) {
            const registrationData = await registrationResponse.json();
            setRegistration(registrationData.data?.registration || null);
          }
        } catch (registrationError) {
          console.error(
            "Failed to fetch user registration:",
            registrationError,
          );
        }

        // 获取下一轮对战信息
        try {
          const nextMatchResponse = await fetch("/api/player-next-match");
          if (nextMatchResponse.ok) {
            const nextMatchData = await nextMatchResponse.json();
            setNextMatch(nextMatchData.nextMatch);
          }
        } catch (nextMatchError) {
          console.error("Failed to fetch next match:", nextMatchError);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        router.push("/register");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // 格式化日期函数 - 使用本地化时间显示
  const formatDate = (dateString: string) => {
    // 调试日志：检查输入参数
    // console.log('[DEBUG PlayerInfo] formatDate 输入:', dateString);

    // 检查日期是否为空或无效
    if (
      !dateString ||
      dateString === "0000-00-00" ||
      dateString === "Invalid Date" ||
      dateString === "null"
    ) {
      // console.log('[DEBUG PlayerInfo] 日期为空或无效，返回"时间未定"');
      return "时间未定";
    }

    try {
      let date: Date;

      // 检查是否是ISO格式的日期时间字符串（包含T和Z）
      if (dateString.includes("T") && dateString.includes("Z")) {
        // 解析ISO格式的日期，但使用北京时间（UTC+8）
        // console.log('[DEBUG PlayerInfo] 检测到ISO格式日期:', dateString);
        date = new Date(dateString);
      } else {
        // 处理MySQL格式：DATE
        const dateTimeString = `${dateString}T00:00:00+08:00`;
        // console.log('[DEBUG PlayerInfo] MySQL格式日期字符串:', dateTimeString);
        date = new Date(dateTimeString);
      }

      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        console.warn("[DEBUG PlayerInfo] 无效的日期:", dateString);
        return "时间未定";
      }

      // 格式化日期，显示为中文格式
      const formattedDate = date.toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      // console.log('[DEBUG PlayerInfo] 格式化后的日期:', formattedDate);
      return formattedDate;
    } catch (error) {
      console.error("[DEBUG PlayerInfo] 日期格式化错误:", error, dateString);
      return "时间未定";
    }
  };

  // 格式化日期和时间字符串 - 使用本地化时间显示
  const formatDateTimeFromStrings = (
    dateString: string,
    timeString: string,
  ) => {
    // 调试日志：检查输入参数
    console.log("[DEBUG PlayerInfo] formatDateTimeFromStrings 输入:", {
      dateString,
      timeString,
    });

    // 检查日期是否为空或无效
    if (
      !dateString ||
      dateString === "0000-00-00" ||
      dateString === "Invalid Date" ||
      dateString === "null"
    ) {
      console.log('[DEBUG PlayerInfo] 日期为空或无效，返回"时间未定"');
      return "时间未定";
    }

    try {
      let date: Date;

      // 检查是否是ISO格式的日期时间字符串（包含T和Z）
      if (dateString.includes("T") && dateString.includes("Z")) {
        // 对于ISO格式的日期，我们直接解析它，但需要处理时区问题
        console.log("[DEBUG PlayerInfo] 检测到ISO格式日期:", dateString);

        // 解析ISO格式的日期
        const isoDate = new Date(dateString);
        console.log("[DEBUG PlayerInfo] 解析后的ISO日期对象:", isoDate);

        // 提取日期部分（YYYY-MM-DD）
        const datePart = dateString.split("T")[0];

        // 使用timeString中的时间，如果没有则使用默认时间
        const time =
          timeString &&
          timeString !== "00:00:00" &&
          timeString !== "Invalid Date" &&
          timeString !== "null"
            ? timeString
            : "00:00:00";

        // 创建新的日期时间字符串，使用北京时间（UTC+8）
        const dateTimeString = `${datePart}T${time}+08:00`;
        console.log(
          "[DEBUG PlayerInfo] 组合后的日期时间字符串:",
          dateTimeString,
        );
        date = new Date(dateTimeString);

        // 调试：检查解析后的日期
        console.log("[DEBUG PlayerInfo] 解析后的日期对象:", date);
        console.log("[DEBUG PlayerInfo] 解析后的UTC时间:", date.toISOString());
        console.log("[DEBUG PlayerInfo] 解析后的本地时间:", date.toString());
        console.log("[DEBUG PlayerInfo] 解析后的本地时间戳:", date.getTime());
      } else {
        // 处理MySQL格式：DATE + TIME
        // 处理空时间的情况，MySQL TIME 类型可能返回 '00:00:00'
        const time =
          timeString &&
          timeString !== "00:00:00" &&
          timeString !== "Invalid Date" &&
          timeString !== "null"
            ? timeString
            : "00:00:00";

        // 创建日期对象，MySQL DATE 格式为 'YYYY-MM-DD', TIME 格式为 'HH:MM:SS'
        const dateTimeString = `${dateString}T${time}+08:00`;
        console.log(
          "[DEBUG PlayerInfo] MySQL格式日期时间字符串:",
          dateTimeString,
        );
        date = new Date(dateTimeString);
      }

      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        console.warn(
          "[DEBUG PlayerInfo] 无效的日期时间:",
          dateString,
          timeString,
        );
        return "时间未定";
      }

      // 格式化日期时间，显示为中文格式
      const formattedDate = date.toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      console.log("[DEBUG PlayerInfo] 格式化后的日期时间:", formattedDate);
      return formattedDate;
    } catch (error) {
      console.error(
        "[DEBUG PlayerInfo] 日期格式化错误:",
        error,
        dateString,
        timeString,
      );
      return "时间未定";
    }
  };

  const formatRank = (rank: number | null) => {
    if (rank === null) return "未排名";
    return `#${rank.toLocaleString()}`;
  };

  const handleRequestMatch = async () => {
    if (!nextMatch) return;

    try {
      // 获取所有房间
      const roomsResponse = await fetch("/api/match-rooms");
      const roomsData = await roomsResponse.json();

      if (roomsData.success) {
        setAvailableRooms(roomsData.rooms);
        setShowRoomSelection(true);
      } else {
        alert("获取房间列表失败");
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      alert("获取房间列表时发生错误");
    }
  };

  const handleRoomSelect = async (roomId: number) => {
    if (!nextMatch) return;

    try {
      setRequestingMatch(true);
      setShowRoomSelection(false);

      // 立即显示预约中的状态和房间信息
      const selectedRoom = availableRooms.find((room) => room.id === roomId);
      if (selectedRoom) {
        setNextMatch((prev) =>
          prev
            ? {
                ...prev,
                status: "scheduled",
                scheduledRoom: {
                  id: selectedRoom.id,
                  room_name: selectedRoom.room_name,
                  round_number: selectedRoom.round_number,
                  match_date: selectedRoom.match_date,
                  match_time: selectedRoom.match_time,
                  match_number: selectedRoom.match_number,
                  max_participants: selectedRoom.max_participants,
                },
              }
            : null,
        );
      }

      const response = await fetch("/api/match-schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchup_id: nextMatch.id,
          room_id: roomId,
          send_notification: true, // 发送消息通知对手
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        // 刷新下一轮对战信息
        const nextMatchResponse = await fetch("/api/player-next-match");
        if (nextMatchResponse.ok) {
          const nextMatchData = await nextMatchResponse.json();
          setNextMatch(nextMatchData.nextMatch);
        }
      } else {
        alert(`预约失败: ${data.error}`);
        // 预约失败时恢复原始状态
        setNextMatch((prev) =>
          prev
            ? {
                ...prev,
                status: "available",
                scheduledRoom: undefined,
              }
            : null,
        );
      }
    } catch (error) {
      console.error("Error requesting match:", error);
      alert("预约对战时发生错误");
      // 发生错误时恢复原始状态
      setNextMatch((prev) =>
        prev
          ? {
              ...prev,
              status: "available",
              scheduledRoom: undefined,
            }
          : null,
      );
    } finally {
      setRequestingMatch(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">未登录</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center relative min-h-screen">
      {/* Main Content */}
      {/* 玩家cover */}
      {user.cover && (
        <div className="mb-6 relative w-full max-w-4xl">
          <Image
            src={user.cover.custom_url || user.cover.url}
            alt={`${user.username}的封面`}
            width={1024}
            height={320}
            className="w-full h-80 object-cover"
            onError={(e) => {
              // 如果cover加载失败，隐藏这个元素
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
      )}
      <div className="relative z-10 w-full max-w-4xl mx-auto pb-8 -mt-6">
        <div className="space-y-6">
          <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-8 shadow-2xl">
            {/* 用户基本信息 */}
            <div className="mb-8 pb-6">
              {/* 头像和用户名在一行 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Image
                    src={user.avatar_url}
                    alt={user.username}
                    width={80}
                    height={80}
                    className="rounded-full outline outline-2 outline-[#E93B66] mr-6"
                    onError={(e) => {
                      e.currentTarget.src = "/default-avatar.png";
                    }}
                  />
                  <h2 className="text-3xl font-bold text-white">
                    {user.username}
                  </h2>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-4 py-2 transition-colors duration-200 font-medium border-b-4 border-[#3BE9D8] hover:border-[#E93B66]"
                  title="登出"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {/* 下方flex信息显示 */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col items-start">
                  <span className="text-gray-100 mb-1">PP</span>
                  <span
                    className={`${audiowide.className} text-3xl text-white`}
                  >
                    {user.pp?.toFixed(0) || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-gray-100 mb-1">全球排名</span>
                  <span
                    className={`${audiowide.className} text-3xl text-white`}
                  >
                    {formatRank(user.global_rank)}
                  </span>
                </div>
                {user.country_rank && (
                  <div className="col-span-2 flex flex-col items-start mt-2">
                    <span className="text-gray-100 mb-1">地区排名</span>
                    <span
                      className={`${audiowide.className} text-3xl text-white`}
                    >
                      {formatRank(user.country_rank)}{" "}
                      <a className="text-xl">{user.country}</a>
                    </span>
                  </div>
                )}
                {!user.country_rank && (
                  <div className="col-span-2 flex flex-col items-start mt-2">
                    <span className="text-gray-100 mb-1">地区</span>
                    <span
                      className={`${audiowide.className} text-3xl text-white`}
                    >
                      {user.country || "未知"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 下一轮对战信息 */}
            {nextMatch && (
              <div className="mb-8 pb-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  下一轮对战
                </h3>
                <div className="bg-[#3D3D3D80] backdrop-blur-sm border-b-4 border-[#E93B66] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white">对战对手</h4>
                      <p className="text-gray-300">
                        与 {nextMatch.opponent.username} 的比赛
                      </p>
                      {(nextMatch.status === "scheduled" || requestingMatch) &&
                        nextMatch.scheduledRoom && (
                          <div className="mt-2 p-3 bg-[#2d2d2d] border border-[#3BE9D8]">
                            <p className="text-[#3BE9D8] font-medium text-sm">
                              {requestingMatch ? "房间预约中..." : "房间已预约"}
                            </p>
                            <div className="text-xs text-gray-300 mt-1 space-y-1">
                              <p>房间: {nextMatch.scheduledRoom.room_name}</p>
                              <p>
                                轮次: 第{nextMatch.scheduledRoom.round_number}轮
                              </p>
                              <p>
                                时间:{" "}
                                {formatDateTimeFromStrings(
                                  nextMatch.scheduledRoom.match_date,
                                  nextMatch.scheduledRoom.match_time,
                                )}
                              </p>
                              <p>
                                房间号: {nextMatch.scheduledRoom.match_number}
                              </p>
                            </div>
                          </div>
                        )}
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          requestingMatch
                            ? "bg-yellow-600 text-white"
                            : nextMatch.status === "available"
                              ? "bg-green-600 text-white"
                              : nextMatch.status === "scheduled"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-600 text-white"
                        }`}
                      >
                        {requestingMatch
                          ? "预约中"
                          : nextMatch.status === "available"
                            ? "可预约"
                            : nextMatch.status === "scheduled"
                              ? "已预约"
                              : "已完成"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-8">
                    {/* 当前玩家 */}
                    <div className="text-center">
                      <Image
                        src={user.avatar_url}
                        alt={user.username}
                        width={60}
                        height={60}
                        className="rounded-full mx-auto mb-2 outline outline-2 outline-[#E93B66]"
                        onError={(e) => {
                          e.currentTarget.src = "/default-avatar.png";
                        }}
                      />
                      <p className="text-white font-medium">{user.username}</p>
                      <p className="text-gray-400 text-sm">你</p>
                    </div>

                    {/* VS */}
                    <div className="text-white text-2xl font-bold">VS</div>

                    {/* 对手 */}
                    <div className="text-center">
                      <Image
                        src={
                          nextMatch.opponent.avatar_url || "/default-avatar.png"
                        }
                        alt={nextMatch.opponent.username}
                        width={60}
                        height={60}
                        className="rounded-full mx-auto mb-2 outline outline-2 outline-[#3BE9D8]"
                        onError={(e) => {
                          e.currentTarget.src = "/default-avatar.png";
                        }}
                      />
                      <p className="text-white font-medium">
                        {nextMatch.opponent.username}
                      </p>
                      <p className="text-gray-400 text-sm">对手</p>
                    </div>
                  </div>

                  {nextMatch.status === "available" && (
                    <div className="mt-4 text-center">
                      <button
                        className="bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-6 py-2 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed border-b-4 border-[#3BE9D8] hover:border-[#E93B66]"
                        onClick={handleRequestMatch}
                        disabled={requestingMatch}
                      >
                        {requestingMatch ? "预约中..." : "预约对战"}
                      </button>
                    </div>
                  )}

                  {/* 房间选择界面 */}
                  {showRoomSelection && (
                    <div className="mt-6">
                      <h4 className="text-white font-medium mb-4 text-center">
                        选择比赛房间
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                        {availableRooms.map((room) => (
                          <div
                            key={room.id}
                            className="bg-[#2d2d2d] backdrop-blur-sm p-4 border border-[#E93B66] hover:border-[#3BE9D8] transition-colors cursor-pointer"
                            onClick={() => handleRoomSelect(room.id)}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <h5 className="text-white font-bold text-lg">
                                {room.room_name}
                              </h5>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  room.status === "open"
                                    ? "bg-green-600 text-white"
                                    : room.status === "full"
                                      ? "bg-red-600 text-white"
                                      : "bg-gray-600 text-white"
                                }`}
                              >
                                {room.status === "open"
                                  ? "可预约"
                                  : room.status === "full"
                                    ? "已满"
                                    : "关闭"}
                              </span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-300">
                              <div className="flex justify-between">
                                <span>轮次:</span>
                                <span className="text-white">
                                  第{room.round_number}轮
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>日期:</span>
                                <span className="text-white">
                                  {formatDate(room.match_date)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>时间:</span>
                                <span className="text-white">
                                  {formatDateTimeFromStrings(
                                    room.match_date,
                                    room.match_time,
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>房间号:</span>
                                <span className="text-white">
                                  {room.match_number}
                                </span>
                              </div>
                            </div>

                            <button
                              className="w-full mt-3 bg-[#E93B66] hover:bg-[#3BE9D8] text-white py-2 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed border-b-4 border-[#3BE9D8] hover:border-[#E93B66]"
                              disabled={
                                requestingMatch || room.status !== "open"
                              }
                            >
                              {requestingMatch ? "预约中..." : "选择此房间"}
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => setShowRoomSelection(false)}
                          className="bg-[#3D3D3D] hover:bg-[#E93B66] text-white px-6 py-2  transition-colors border-b-4 border-[#E93B66] hover:border-[#3BE9D8]"
                          disabled={requestingMatch}
                        >
                          取消选择
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 比赛预约系统 */}
            <div className="">
              <MatchScheduleSystem userOsuId={user.osuId} isAdmin={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
