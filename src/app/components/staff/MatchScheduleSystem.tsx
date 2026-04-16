"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface MatchRoom {
  id: number;
  room_name: string;
  round_number: number;
  match_date: string;
  match_time: string;
  match_number: number;
  max_participants: number;
  status: "open" | "full" | "closed";
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface MatchSchedule {
  id: number;
  room_id: number;
  player1_osuId: string;
  player1_username: string;
  player1_avatar_url?: string;
  player2_osuId: string;
  player2_username: string;
  player2_avatar_url?: string;
  red_player_osuId?: string;
  blue_player_osuId?: string;
  red_score: number;
  blue_score: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  replay_link?: string;
  match_link?: string;
  stream_link?: string;
  referee_osuId?: string;
  referee_username?: string;
  commentator_osuId?: string;
  commentator_username?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  room?: MatchRoom;
}

interface ApprovedPlayer {
  osuId: string;
  username: string;
  inGameName: string;
  avatar_url: string;
  pp: number;
  global_rank: number;
  country_rank: number;
  country: string;
}

interface PlayerMatchup {
  id: number;
  room_id: number;
  player1_osuId: string;
  player1_username: string;
  player1_avatar_url?: string;
  player2_osuId: string;
  player2_username: string;
  player2_avatar_url?: string;
  status: "available" | "scheduled" | "completed";
  created_by: string;
  created_at: string;
  updated_at: string;
  room?: MatchRoom;
}

interface MatchScheduleSystemProps {
  userOsuId: string;
  isAdmin: boolean;
}

export default function MatchScheduleSystem({
  userOsuId,
  isAdmin,
}: MatchScheduleSystemProps) {
  const [schedules, setSchedules] = useState<MatchSchedule[]>([]);
  const [rooms, setRooms] = useState<MatchRoom[]>([]);
  const [matchups, setMatchups] = useState<PlayerMatchup[]>([]);
  const [approvedPlayers, setApprovedPlayers] = useState<ApprovedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showMatchupModal, setShowMatchupModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [formData, setFormData] = useState({
    matchup_id: "",
  });
  const [roomFormData, setRoomFormData] = useState({
    room_name: "",
    round_number: "",
    match_date: "",
    match_time: "",
    match_number: "",
    max_participants: "2",
    description: "",
  });
  const [matchupFormData, setMatchupFormData] = useState({
    player1_osuId: "",
    player1_username: "",
    player2_osuId: "",
    player2_username: "",
  });

  // 编辑比赛相关状态
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MatchSchedule | null>(
    null,
  );
  const [editFormData, setEditFormData] = useState({
    red_score: "",
    blue_score: "",
    match_link: "",
    replay_link: "",
    stream_link: "",
    status: "pending",
  });
  const [updatingSchedule, setUpdatingSchedule] = useState(false);

  useEffect(() => {
    fetchSchedules();
    fetchRooms();
    if (isAdmin) {
      fetchApprovedPlayers();
      fetchAllMatchups(); // 获取所有玩家对战列表
    }
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/match-schedules");
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/match-rooms");
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    }
  };

  const fetchAllMatchups = async () => {
    try {
      const response = await fetch("/api/player-matchups");
      if (response.ok) {
        const data = await response.json();
        setMatchups(data.matchups || []);
      }
    } catch (error) {
      console.error("Failed to fetch matchups:", error);
    }
  };

  const fetchApprovedPlayers = async () => {
    try {
      const response = await fetch("/api/approved-players");
      if (response.ok) {
        const data = await response.json();
        setApprovedPlayers(data.players || []);
      }
    } catch (error) {
      console.error("Failed to fetch approved players:", error);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/match-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({ matchup_id: "" });
        fetchSchedules();
        alert("比赛预约创建成功！");
      } else {
        const error = await response.json();
        alert(error.error || "创建失败");
      }
    } catch (error) {
      console.error("Failed to create schedule:", error);
      alert("创建失败");
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/match-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomFormData),
      });

      if (response.ok) {
        setShowRoomModal(false);
        setRoomFormData({
          room_name: "",
          round_number: "",
          match_date: "",
          match_time: "",
          match_number: "",
          max_participants: "2",
          description: "",
        });
        fetchRooms();
        alert("比赛房间创建成功！");
      } else {
        const error = await response.json();
        alert(error.error || "创建失败");
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("创建失败，请重试");
    }
  };

  const handleCreateMatchup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/player-matchups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(matchupFormData),
      });

      if (response.ok) {
        setShowMatchupModal(false);
        setMatchupFormData({
          player1_osuId: "",
          player1_username: "",
          player2_osuId: "",
          player2_username: "",
        });
        fetchAllMatchups();
        alert("玩家对战创建成功！");
      } else {
        const error = await response.json();
        alert(error.error || "创建失败");
      }
    } catch (error) {
      console.error("Error creating matchup:", error);
      alert("创建失败，请重试");
    }
  };

  const handleDeleteRoom = async (roomId: number, roomName: string) => {
    if (
      !confirm(
        `确定要删除房间 "${roomName}" 吗？\n\n注意：删除房间将同时删除该房间的所有比赛预约！`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/match-rooms/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roomId }),
      });

      if (response.ok) {
        fetchRooms();
        fetchSchedules();
        alert("房间删除成功！");
      } else {
        const error = await response.json();
        alert(error.error || "删除失败");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("删除失败，请重试");
    }
  };

  const handleDeleteMatchup = async (
    matchupId: number,
    player1: string,
    player2: string,
  ) => {
    if (!confirm(`确定要删除对战 "${player1} vs ${player2}" 吗？`)) {
      return;
    }

    try {
      const response = await fetch("/api/player-matchups/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: matchupId }),
      });

      if (response.ok) {
        fetchAllMatchups();
        alert("对战删除成功！");
      } else {
        const error = await response.json();
        alert(error.error || "删除失败");
      }
    } catch (error) {
      console.error("Error deleting matchup:", error);
      alert("删除失败，请重试");
    }
  };

  const handleUpdateStatus = async (
    scheduleId: number,
    status: MatchSchedule["status"],
  ) => {
    try {
      const response = await fetch("/api/match-schedules/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: scheduleId, status }),
      });

      if (response.ok) {
        fetchSchedules();
        alert("更新成功！");
      } else {
        const error = await response.json();
        alert(error.error || "更新失败");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("更新失败");
    }
  };

  const getStatusText = (status: MatchSchedule["status"]) => {
    switch (status) {
      case "pending":
        return "待确认";
      case "confirmed":
        return "已确认";
      case "completed":
        return "已完成";
      case "cancelled":
        return "已取消";
      default:
        return status;
    }
  };

  const getStatusColor = (status: MatchSchedule["status"]) => {
    switch (status) {
      case "pending":
        return "text-yellow-400";
      case "confirmed":
        return "text-green-400";
      case "completed":
        return "text-blue-400";
      case "cancelled":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getMatchupStatusText = (status: PlayerMatchup["status"]) => {
    switch (status) {
      case "available":
        return "可预约";
      case "scheduled":
        return "已预约";
      case "completed":
        return "已完成";
      default:
        return status;
    }
  };

  const getMatchupStatusColor = (status: PlayerMatchup["status"]) => {
    switch (status) {
      case "available":
        return "text-green-400";
      case "scheduled":
        return "text-blue-400";
      case "completed":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  const isUserInMatch = (schedule: MatchSchedule) => {
    return (
      schedule.player1_osuId === userOsuId ||
      schedule.player2_osuId === userOsuId
    );
  };

  const isUserInMatchup = (matchup: PlayerMatchup) => {
    return (
      matchup.player1_osuId === userOsuId || matchup.player2_osuId === userOsuId
    );
  };

  // 检查用户是否可以确认比赛
  // 用户必须是比赛的参与者（player1或player2）且不是比赛的创建者
  const canUserConfirmMatch = (schedule: MatchSchedule) => {
    return (
      (schedule.player1_osuId === userOsuId ||
        schedule.player2_osuId === userOsuId) &&
      schedule.created_by !== userOsuId
    );
  };

  // 打开编辑模态框
  const openEditModal = (schedule: MatchSchedule) => {
    setEditingSchedule(schedule);
    setEditFormData({
      red_score: schedule.red_score?.toString() || "",
      blue_score: schedule.blue_score?.toString() || "",
      match_link: schedule.match_link || "",
      replay_link: schedule.replay_link || "",
      stream_link: schedule.stream_link || "",
      status: schedule.status,
    });
    setShowEditModal(true);
  };

  // 关闭编辑模态框
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingSchedule(null);
    setEditFormData({
      red_score: "",
      blue_score: "",
      match_link: "",
      replay_link: "",
      stream_link: "",
      status: "pending",
    });
  };

  // 更新比赛信息
  const handleUpdateSchedule = async () => {
    if (!editingSchedule) return;

    setUpdatingSchedule(true);
    try {
      const updateData = {
        id: editingSchedule.id,
        red_score: editFormData.red_score
          ? parseInt(editFormData.red_score)
          : undefined,
        blue_score: editFormData.blue_score
          ? parseInt(editFormData.blue_score)
          : undefined,
        match_link: editFormData.match_link || undefined,
        replay_link: editFormData.replay_link || undefined,
        stream_link: editFormData.stream_link || undefined,
        status: editFormData.status,
      };

      const response = await fetch("/api/match-schedules/update-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        fetchSchedules();
        closeEditModal();
      } else {
        alert("更新失败: " + result.error);
      }
    } catch (error) {
      console.error("更新比赛信息失败:", error);
      alert("更新失败，请重试");
    } finally {
      setUpdatingSchedule(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Image
          src="/icons/loading.svg"
          alt="loading"
          width={120}
          height={120}
          className="animate-spin"
        />
        加载中...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 比赛预约列表 */}
      <div className="space-y-4">
        {schedules.length === 0 ? (
          <div className="text-center py-8 text-white">暂无比赛预约</div>
        ) : (
          schedules.map((schedule) => (
            <div key={schedule.id} className="p-4 ">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-lg font-bold text-white">
                    {schedule.room?.room_name || `房间 ${schedule.room_id}`}
                  </h4>
                  <p className="text-gray-400">
                    第{schedule.room?.round_number || "?"}轮 - 场次
                    {schedule.room?.match_number || "?"}
                  </p>
                  <p className="text-gray-400">
                    {(() => {
                      if (!schedule.room?.match_date) return "时间未定";
                      const dateStr = schedule.room.match_date;
                      const timeStr = schedule.room?.match_time || "00:00:00";

                      // 调试日志
                      // console.log('[DEBUG MatchScheduleSystem] 时间格式化输入:', { dateStr, timeStr });

                      try {
                        let date: Date;

                        // 检查是否是ISO格式的日期时间字符串（包含T和Z）
                        if (dateStr.includes("T") && dateStr.includes("Z")) {
                          // 对于ISO格式的日期，我们直接解析它，但需要处理时区问题
                          // console.log('[DEBUG MatchScheduleSystem] 检测到ISO格式日期:', dateStr);

                          // 提取日期部分（YYYY-MM-DD）
                          const datePart = dateStr.split("T")[0];

                          // 使用timeString中的时间，如果没有则使用默认时间
                          const time =
                            timeStr &&
                            timeStr !== "00:00:00" &&
                            timeStr !== "Invalid Date" &&
                            timeStr !== "null"
                              ? timeStr
                              : "00:00:00";

                          // 创建新的日期时间字符串，使用北京时间（UTC+8）
                          const dateTimeString = `${datePart}T${time}+08:00`;
                          // console.log('[DEBUG MatchScheduleSystem] 组合后的日期时间字符串:', dateTimeString);
                          date = new Date(dateTimeString);

                          // 调试：检查解析后的日期
                          // console.log('[DEBUG MatchScheduleSystem] 解析后的日期对象:', date);
                          // console.log('[DEBUG MatchScheduleSystem] 解析后的UTC时间:', date.toISOString());
                          // console.log('[DEBUG MatchScheduleSystem] 解析后的本地时间:', date.toString());
                        } else {
                          // 处理MySQL格式：DATE + TIME
                          // 处理空时间的情况，MySQL TIME 类型可能返回 '00:00:00'
                          const time =
                            timeStr &&
                            timeStr !== "00:00:00" &&
                            timeStr !== "Invalid Date" &&
                            timeStr !== "null"
                              ? timeStr
                              : "00:00:00";

                          // 创建日期对象，MySQL DATE 格式为 'YYYY-MM-DD', TIME 格式为 'HH:MM:SS'
                          const dateTimeString = `${dateStr}T${time}+08:00`;
                          // console.log('[DEBUG MatchScheduleSystem] MySQL格式日期时间字符串:', dateTimeString);
                          date = new Date(dateTimeString);
                        }

                        // 检查日期是否有效
                        if (isNaN(date.getTime())) {
                          console.warn(
                            "[DEBUG MatchScheduleSystem] 无效的日期时间:",
                            dateStr,
                            timeStr,
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

                        // console.log('[DEBUG MatchScheduleSystem] 格式化后的日期时间:', formattedDate);
                        return formattedDate;
                      } catch (error) {
                        console.error(
                          "[DEBUG MatchScheduleSystem] 日期格式化错误:",
                          error,
                          dateStr,
                          timeStr,
                        );
                        return "时间格式错误";
                      }
                    })()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-sm rounded ${getStatusColor(schedule.status)}`}
                >
                  {getStatusText(schedule.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-sm text-gray-400">红方</p>
                  <div className="flex items-center gap-3 mt-2">
                    {schedule.player1_avatar_url && (
                      <Image
                        src={schedule.player1_avatar_url}
                        alt={`${schedule.player1_username} avatar`}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full border-2 border-red-500"
                        onError={() => {}}
                      />
                    )}
                    <div>
                      <p className="text-white font-medium">
                        {schedule.player1_username}
                      </p>
                      <p className="text-xs text-gray-500">
                        ID: {schedule.player1_osuId}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-sm text-gray-400">蓝方</p>
                  <div className="flex items-center gap-3 mt-2">
                    {schedule.player2_avatar_url && (
                      <Image
                        src={schedule.player2_avatar_url}
                        alt={`${schedule.player2_username} avatar`}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full border-2 border-blue-500"
                        onError={() => {}}
                      />
                    )}
                    <div>
                      <p className="text-white font-medium">
                        {schedule.player2_username}
                      </p>
                      <p className="text-xs text-gray-500">
                        ID: {schedule.player2_osuId}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 比赛详细信息 */}
              <div className="text-sm text-gray-400 space-y-2 mb-4">
                {schedule.red_score !== undefined &&
                  schedule.blue_score !== undefined && (
                    <div>
                      比分:{" "}
                      <span className="text-white font-medium">
                        {schedule.red_score} - {schedule.blue_score}
                      </span>
                    </div>
                  )}
                {schedule.match_link && (
                  <div>
                    房间链接:{" "}
                    <a
                      href={schedule.match_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      点击进入
                    </a>
                  </div>
                )}
                {schedule.stream_link && (
                  <div>
                    直播链接:{" "}
                    <a
                      href={schedule.stream_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      观看直播
                    </a>
                  </div>
                )}
                {schedule.replay_link && (
                  <div>
                    回放链接:{" "}
                    <a
                      href={schedule.replay_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 underline"
                    >
                      观看回放
                    </a>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                {canUserConfirmMatch(schedule) &&
                  schedule.status === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          handleUpdateStatus(schedule.id, "confirmed")
                        }
                        className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
                      >
                        确认参加
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateStatus(schedule.id, "cancelled")
                        }
                        className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm"
                      >
                        取消预约
                      </button>
                    </>
                  )}

                {/* 创建者只能取消预约，不能确认 */}
                {isUserInMatch(schedule) &&
                  schedule.status === "pending" &&
                  schedule.created_by === userOsuId && (
                    <button
                      onClick={() =>
                        handleUpdateStatus(schedule.id, "cancelled")
                      }
                      className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      取消预约
                    </button>
                  )}

                {isAdmin && schedule.status === "confirmed" && (
                  <button
                    onClick={() => handleUpdateStatus(schedule.id, "completed")}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  >
                    标记完成
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() => openEditModal(schedule)}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-sm"
                  >
                    编辑比赛信息
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() =>
                      handleDeleteRoom(
                        schedule.room_id,
                        schedule.room?.room_name || `房间 ${schedule.room_id}`,
                      )
                    }
                    className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm"
                  >
                    删除房间
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 编辑比赛信息模态框 */}
      {showEditModal && editingSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">编辑比赛信息</h3>
            <p className="text-gray-400 text-sm mb-4">
              {editingSchedule.player1_username} vs{" "}
              {editingSchedule.player2_username}
            </p>

            <div className="space-y-4">
              {/* 比分 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    红方比分
                  </label>
                  <input
                    type="number"
                    value={editFormData.red_score}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        red_score: e.target.value,
                      }))
                    }
                    className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    蓝方比分
                  </label>
                  <input
                    type="number"
                    value={editFormData.blue_score}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        blue_score: e.target.value,
                      }))
                    }
                    className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* 链接 */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  osu!房间链接
                </label>
                <input
                  type="url"
                  value={editFormData.match_link}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      match_link: e.target.value,
                    }))
                  }
                  className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="https://osu.ppy.sh/mp/..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  直播链接
                </label>
                <input
                  type="url"
                  value={editFormData.stream_link}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      stream_link: e.target.value,
                    }))
                  }
                  className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="https://twitch.tv/... 或 https://bilibili.com/..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  回放链接
                </label>
                <input
                  type="url"
                  value={editFormData.replay_link}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      replay_link: e.target.value,
                    }))
                  }
                  className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="https://..."
                />
              </div>

              {/* 状态 */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  比赛状态
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="w-full bg-[#1a1a1a] border border-gray-600 rounded px-3 py-2 text-white"
                >
                  <option value="pending">待确认</option>
                  <option value="confirmed">已确认</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdateSchedule}
                disabled={updatingSchedule}
                className="px-4 py-2 bg-[#E93B66] hover:bg-[#d6335e] text-white rounded transition-colors disabled:opacity-50"
              >
                {updatingSchedule ? "更新中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
