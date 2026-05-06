"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Calendar, Edit3, Trash2, Check, XCircle, ExternalLink, Plus } from "lucide-react";
import { showSuccess, showError } from "@/app/components/ui/Notification";

interface MatchRoom {
  id: number;
  room_name: string;
  round_number: number;
  match_datetime: string;
  match_type: string;
  match_number: number;
  status: string;
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
  red_score: number;
  blue_score: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  match_link?: string;
  stream_link?: string;
  replay_link?: string;
  created_by: string;
  created_at: string;
  room?: MatchRoom;
}

interface ApprovedPlayer {
  osuId: string;
  username: string;
  avatar_url: string;
  pp: number;
  global_rank: number | null;
  country_rank: number | null;
  country: string;
}

interface MatchScheduleManagementProps {
  userOsuId: string;
  isAdmin: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  pending: { label: "待确认", class: "bg-amber-100 text-amber-700 border-amber-200" },
  confirmed: { label: "已确认", class: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "已完成", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cancelled: { label: "已取消", class: "bg-red-100 text-red-600 border-red-200" },
};

const MATCH_TYPE_LABEL: Record<string, string> = {
  solo: "Solo",
  team_vs: "Team VS",
  battle_royale: "吃鸡",
};

function formatDateTime(dt: string | undefined) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return <span className="text-xs text-gray-500">{status}</span>;
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${cfg.class}`}>
      {cfg.label}
    </span>
  );
}

function PlayerAvatar({ player, size = 32 }: { player: { avatar_url: string; username: string }; size?: number }) {
  return (
    <Image
      src={player.avatar_url || "/unknow.svg"}
      alt={player.username}
      width={size}
      height={size}
      className="rounded-full"
      onError={() => { }}
    />
  );
}

function PlayerSearchDropdown({
  players,
  selected,
  excludeIds,
  search,
  setSearch,
  onSelect,
}: {
  players: ApprovedPlayer[];
  selected: ApprovedPlayer[];
  excludeIds: string[];
  search: string;
  setSearch: (v: string) => void;
  onSelect: (p: ApprovedPlayer) => void;
}) {
  const allExcluded = new Set([...excludeIds, ...selected.map((p) => p.osuId)]);
  const filtered = players.filter(
    (p) => !allExcluded.has(p.osuId) && (search ? p.username.toLowerCase().includes(search.toLowerCase()) || p.osuId.includes(search) : true)
  );

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-[hsla(350,80%,55%,0.5)] focus:ring-1 focus:ring-[hsla(350,80%,55%,0.2)] focus:outline-none transition-colors"
        placeholder="搜索选手..."
      />
      {filtered.length > 0 && (
        <div className="mt-1 border border-gray-200 rounded-lg bg-white max-h-44 overflow-y-auto shadow-sm">
          {filtered.slice(0, 30).map((p) => (
            <button
              key={p.osuId}
              onClick={() => { onSelect(p); setSearch(""); }}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
            >
              <PlayerAvatar player={p} size={32} />
              <div>
                <div className="text-sm font-medium text-gray-800">{p.username}</div>
                <div className="text-xs text-gray-400">
                  {p.country} · {(p.pp ?? 0).toFixed(0)}pp
                  {p.global_rank && ` · #${p.global_rank}`}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {search && filtered.length === 0 && (
        <p className="mt-1 text-xs text-gray-400">无匹配选手</p>
      )}
    </div>
  );
}

function EditModal({
  schedule,
  onClose,
  onSave,
  saving,
}: {
  schedule: MatchSchedule;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    red_score: schedule.red_score?.toString() || "",
    blue_score: schedule.blue_score?.toString() || "",
    match_link: schedule.match_link || "",
    stream_link: schedule.stream_link || "",
    replay_link: schedule.replay_link || "",
    status: schedule.status,
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-gray-800">编辑比赛信息</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle size={18} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {schedule.player1_username} vs {schedule.player2_username}
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">红方比分</label>
              <input type="number" value={form.red_score} onChange={(e) => setForm((p) => ({ ...p, red_score: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-[hsla(350,80%,55%,0.5)] focus:ring-1 focus:ring-[hsla(350,80%,55%,0.2)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">蓝方比分</label>
              <input type="number" value={form.blue_score} onChange={(e) => setForm((p) => ({ ...p, blue_score: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-[hsla(350,80%,55%,0.5)] focus:ring-1 focus:ring-[hsla(350,80%,55%,0.2)] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">osu!房间链接</label>
            <input type="url" value={form.match_link} onChange={(e) => setForm((p) => ({ ...p, match_link: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-[hsla(350,80%,55%,0.5)] focus:ring-1 focus:ring-[hsla(350,80%,55%,0.2)] focus:outline-none"
              placeholder="https://osu.ppy.sh/mp/..." />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">直播链接</label>
            <input type="url" value={form.stream_link} onChange={(e) => setForm((p) => ({ ...p, stream_link: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-[hsla(350,80%,55%,0.5)] focus:ring-1 focus:ring-[hsla(350,80%,55%,0.2)] focus:outline-none"
              placeholder="https://twitch.tv/..." />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">回放链接</label>
            <input type="url" value={form.replay_link} onChange={(e) => setForm((p) => ({ ...p, replay_link: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-[hsla(350,80%,55%,0.5)] focus:ring-1 focus:ring-[hsla(350,80%,55%,0.2)] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">状态</label>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-[hsla(350,80%,55%,0.5)] focus:ring-1 focus:ring-[hsla(350,80%,55%,0.2)] focus:outline-none">
              <option value="pending">待确认</option>
              <option value="confirmed">已确认</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">取消</button>
          <button onClick={() => onSave(form)} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-[hsla(350,80%,55%,1)] hover:bg-[hsla(350,80%,50%,1)] rounded-lg disabled:opacity-50 transition-colors">
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MatchScheduleManagement({
  userOsuId,
  isAdmin,
}: MatchScheduleManagementProps) {
  const [matchRooms, setMatchRooms] = useState<MatchRoom[]>([]);
  const [matchSchedules, setMatchSchedules] = useState<MatchSchedule[]>([]);
  const [approvedPlayers, setApprovedPlayers] = useState<ApprovedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [team1Players, setTeam1Players] = useState<ApprovedPlayer[]>([]);
  const [team2Players, setTeam2Players] = useState<ApprovedPlayer[]>([]);
  const [playerSearch, setPlayerSearch] = useState("");

  const [editingSchedule, setEditingSchedule] = useState<MatchSchedule | null>(null);
  const [updatingSchedule, setUpdatingSchedule] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const selectedRoom = useMemo(
    () => matchRooms.find((r) => r.id === selectedRoomId) || null,
    [matchRooms, selectedRoomId],
  );

  const selectedType = selectedRoom?.match_type || "solo";

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsRes, schedulesRes, playersRes] = await Promise.all([
        fetch("/api/match-rooms"),
        fetch("/api/match-schedules"),
        fetch("/api/approved-players"),
      ]);
      const roomsData = await roomsRes.json();
      const schedulesData = await schedulesRes.json();
      const playersData = await playersRes.json();

      if (roomsData.success) setMatchRooms(roomsData.rooms || []);
      if (schedulesData.success) setMatchSchedules(schedulesData.schedules || []);
      if (playersData.success) setApprovedPlayers(playersData.players || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      showError("获取数据失败");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedRoomId(null);
    setTeam1Players([]);
    setTeam2Players([]);
    setPlayerSearch("");
  };

  const handleCreateSchedule = async () => {
    if (!selectedRoomId) { showError("请选择房间"); return; }
    if (team1Players.length === 0) { showError("请选择选手"); return; }
    if ((selectedType === "solo" || selectedType === "team_vs") && team2Players.length === 0) {
      showError("请选择对方选手");
      return;
    }

    const player1Names = team1Players.map((p) => p.username).join(", ");
    const player2Names = team2Players.map((p) => p.username).join(", ");
    const player1Ids = team1Players.map((p) => p.osuId).join(",");
    const player2Ids = team2Players.map((p) => p.osuId).join(",");

    const player1Username = selectedType === "battle_royale" ? player1Names : player1Names || "待定";
    const player2Username = selectedType === "battle_royale" ? "吃鸡模式" : player2Names || "待定";
    const player1OsuId = selectedType === "battle_royale" ? player1Ids : player1Ids;
    const player2OsuId = selectedType === "battle_royale" ? "royale" : player2Ids;

    setCreating(true);
    try {
      const res = await fetch("/api/match-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: selectedRoomId,
          player1_osuId: player1OsuId,
          player1_username: player1Username,
          player2_osuId: player2OsuId,
          player2_username: player2Username,
          status: "pending",
          is_admin_create: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("比赛预约创建成功");
        setShowCreateModal(false);
        resetForm();
        fetchData();
      } else {
        showError(data.error || "创建失败");
      }
    } catch {
      showError("创建失败");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (scheduleId: number, status: string) => {
    try {
      const res = await fetch("/api/match-schedules/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: scheduleId, status }),
      });
      if (res.ok) {
        fetchData();
      } else {
        const e = await res.json();
        showError(e.error || "更新失败");
      }
    } catch {
      showError("更新失败");
    }
  };

  const handleUpdateSchedule = async (data: Record<string, unknown>) => {
    if (!editingSchedule) return;
    setUpdatingSchedule(true);
    try {
      const res = await fetch("/api/match-schedules/update-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSchedule.id,
          red_score: data.red_score ? parseInt(data.red_score as string) : undefined,
          blue_score: data.blue_score ? parseInt(data.blue_score as string) : undefined,
          match_link: data.match_link || undefined,
          stream_link: data.stream_link || undefined,
          replay_link: data.replay_link || undefined,
          status: data.status,
        }),
      });
      const result = await res.json();
      if (result.success) {
        fetchData();
        setEditingSchedule(null);
      } else {
        showError("更新失败: " + result.error);
      }
    } catch {
      showError("更新失败");
    } finally {
      setUpdatingSchedule(false);
    }
  };

  const handleDeleteRoom = async (roomId: number, roomName: string) => {
    if (!confirm(`确定要删除房间 "${roomName}" 吗？\n\n将同时删除该房间的所有比赛预约！`)) return;
    try {
      const res = await fetch("/api/match-rooms/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roomId }),
      });
      if (res.ok) {
        fetchData();
      } else {
        const e = await res.json();
        showError(e.error || "删除失败");
      }
    } catch {
      showError("删除失败");
    }
  };

  const canConfirm = (s: MatchSchedule) =>
    (s.player1_osuId === userOsuId || s.player2_osuId === userOsuId || s.player1_osuId?.includes(userOsuId) || s.player2_osuId?.includes(userOsuId)) && s.created_by !== userOsuId;

  const isInMatch = (s: MatchSchedule) =>
    s.player1_osuId === userOsuId || s.player2_osuId === userOsuId || s.player1_osuId?.includes(userOsuId) || s.player2_osuId?.includes(userOsuId);

  const openCreateModal = () => { setShowCreateModal(true); resetForm(); };

  const parsePlayers = (names: string, ids: string) => {
    const nameArr = names ? names.split(", ").filter(Boolean) : [];
    const idArr = ids ? ids.split(",").filter(Boolean) : [];
    return nameArr.map((name, i) => ({ name, id: idArr[i] || "?" }));
  };

  const player1List = (s: MatchSchedule) => parsePlayers(s.player1_username, s.player1_osuId);
  const player2List = (s: MatchSchedule) => parsePlayers(s.player2_username, s.player2_osuId);

  const isBattleRoyale = (s: MatchSchedule) =>
    s.player2_osuId === "royale" || s.room?.match_type === "battle_royale";

  const isTeamVs = (s: MatchSchedule) =>
    (s.player1_osuId?.includes(",") || s.player2_osuId?.includes(",")) || s.room?.match_type === "team_vs";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-800">比赛预约管理</h3>
          <span className="text-xs text-gray-400">{matchSchedules.length} 场</span>
        </div>
        {isAdmin && (
          <button onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[hsla(350,80%,55%,1)] hover:bg-[hsla(350,80%,50%,1)] rounded-lg transition-colors">
            <Plus size={16} />
            创建预约
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Image src="/icons/loading.svg" alt="loading" width={32} height={32} className="animate-spin" />
          <span className="ml-2 text-sm text-gray-400">加载中...</span>
        </div>
      ) : matchSchedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <p className="text-sm">暂无比赛预约</p>
          {isAdmin && (
            <button onClick={openCreateModal} className="mt-2 text-sm text-[hsla(350,80%,55%,1)] hover:underline">
              创建第一个预约
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {matchSchedules.map((s) => {
            const p1s = player1List(s);
            const p2s = player2List(s);
            const bry = isBattleRoyale(s);

            return (
              <div key={s.id}
                className="group relative bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-800 text-sm">
                          {s.room?.room_name || `房间 ${s.room_id}`}
                        </h4>
                        {s.room?.match_type && (
                          <span className="text-xs text-gray-400">{MATCH_TYPE_LABEL[s.room.match_type] || s.room.match_type}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>R{s.room?.round_number || "?"} #{s.room?.match_number || "?"}</span>
                        <div className="flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDateTime(s.room?.match_datetime)}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>

                  {bry ? (
                    <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                      <div className="text-xs text-gray-400 mb-2">选手 ({p1s.length}人)</div>
                      <div className="flex flex-wrap gap-2">
                        {p1s.map((p, i) => (
                          <div key={i} className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-full pl-0.5 pr-2.5 py-0.5">
                            <Image src="/unknow.svg" alt={p.name} width={22} height={22} className="rounded-full" />
                            <span className="text-xs text-gray-700">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                        <div className="text-xs text-red-400 mb-2 font-medium">红方</div>
                        <div className="flex flex-wrap gap-1.5">
                          {p1s.map((p, i) => (
                            <div key={i} className="flex items-center gap-1 bg-white/70 rounded-full pl-0.5 pr-2 py-0.5">
                              <Image src="/unknow.svg" alt={p.name} width={18} height={18} className="rounded-full" />
                              <span className="text-xs text-gray-700">{p.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                        <div className="text-xs text-blue-400 mb-2 font-medium">蓝方</div>
                        <div className="flex flex-wrap gap-1.5">
                          {p2s.map((p, i) => (
                            <div key={i} className="flex items-center gap-1 bg-white/70 rounded-full pl-0.5 pr-2 py-0.5">
                              <Image src="/unknow.svg" alt={p.name} width={18} height={18} className="rounded-full" />
                              <span className="text-xs text-gray-700">{p.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {(s.red_score !== undefined && s.blue_score !== undefined && (s.red_score > 0 || s.blue_score > 0)) && (
                    <div className="mb-3 px-3 py-2 bg-gray-50 rounded-lg text-center">
                      <span className="text-xs text-gray-400">比分 </span>
                      <span className="text-sm font-bold text-gray-800 tabular-nums">{s.red_score} - {s.blue_score}</span>
                    </div>
                  )}

                  {(s.match_link || s.stream_link || s.replay_link) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {s.match_link && (
                        <a href={s.match_link} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors">
                          <ExternalLink size={10} />房间
                        </a>
                      )}
                      {s.stream_link && (
                        <a href={s.stream_link} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 transition-colors">
                          <ExternalLink size={10} />直播
                        </a>
                      )}
                      {s.replay_link && (
                        <a href={s.replay_link} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 transition-colors">
                          <ExternalLink size={10} />回放
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                    {canConfirm(s) && s.status === "pending" && (
                      <>
                        <button onClick={() => handleUpdateStatus(s.id, "confirmed")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors">
                          <Check size={12} />确认参加
                        </button>
                        <button onClick={() => handleUpdateStatus(s.id, "cancelled")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
                          <XCircle size={12} />取消预约
                        </button>
                      </>
                    )}

                    {isInMatch(s) && s.status === "pending" && s.created_by === userOsuId && (
                      <button onClick={() => handleUpdateStatus(s.id, "cancelled")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
                        <XCircle size={12} />取消预约
                      </button>
                    )}

                    {isAdmin && s.status === "confirmed" && (
                      <button onClick={() => handleUpdateStatus(s.id, "completed")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
                        <Check size={12} />标记完成
                      </button>
                    )}

                    {isAdmin && (
                      <button onClick={() => setEditingSchedule(s)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors">
                        <Edit3 size={12} />编辑信息
                      </button>
                    )}

                    {isAdmin && (
                      <button onClick={() => handleDeleteRoom(s.room_id, s.room?.room_name || `房间 ${s.room_id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-100 rounded-lg transition-colors">
                        <Trash2 size={12} />删除
                      </button>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 group-hover:h-1 bg-[hsla(350,80%,55%,1)]" />
              </div>
            )
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-800">创建比赛预约</h3>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <XCircle size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">选择房间 *</label>
                <select
                  value={selectedRoomId || ""}
                  onChange={(e) => {
                    const id = e.target.value ? parseInt(e.target.value) : null;
                    setSelectedRoomId(id);
                    setTeam1Players([]);
                    setTeam2Players([]);
                    setPlayerSearch("");
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:border-[hsla(350,80%,55%,0.5)] focus:ring-1 focus:ring-[hsla(350,80%,55%,0.2)] focus:outline-none transition-colors"
                >
                  <option value="">请选择房间</option>
                  {matchRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.room_name} (R{room.round_number} #{room.match_number}) - {MATCH_TYPE_LABEL[room.match_type] || room.match_type}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRoomId && (
                <>
                  {selectedType === "battle_royale" ? (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-medium text-gray-700">选手列表 *</label>
                        <span className="text-xs text-gray-400">{team1Players.length} 人已选</span>
                      </div>
                      <PlayerSearchDropdown
                        players={approvedPlayers}
                        selected={team1Players}
                        excludeIds={[]}
                        search={playerSearch}
                        setSearch={setPlayerSearch}
                        onSelect={(p) => setTeam1Players((prev) => [...prev, p])}
                      />
                      {team1Players.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {team1Players.map((p) => (
                            <div key={p.osuId} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full pl-0.5 pr-2.5 py-1">
                              <PlayerAvatar player={p} size={24} />
                              <span className="text-xs text-gray-700 font-medium">{p.username}</span>
                              <button onClick={() => setTeam1Players((prev) => prev.filter((x) => x.osuId !== p.osuId))}
                                className="text-gray-400 hover:text-red-500 transition-colors">
                                <XCircle size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-sm font-medium text-gray-700">
                            {selectedType === "team_vs" ? "红方队员" : "选手1"} *
                          </label>
                          <span className="text-xs text-gray-400">{team1Players.length}{selectedType === "team_vs" ? " 人" : ""}</span>
                        </div>
                        <PlayerSearchDropdown
                          players={approvedPlayers}
                          selected={team1Players}
                          excludeIds={team2Players.map((p) => p.osuId)}
                          search={playerSearch}
                          setSearch={setPlayerSearch}
                          onSelect={(p) => setTeam1Players((prev) => [...prev, p])}
                        />
                        {team1Players.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {team1Players.map((p) => (
                              <div key={p.osuId} className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-full pl-0.5 pr-2.5 py-1">
                                <PlayerAvatar player={p} size={24} />
                                <span className="text-xs text-gray-700 font-medium">{p.username}</span>
                                <button onClick={() => setTeam1Players((prev) => prev.filter((x) => x.osuId !== p.osuId))}
                                  className="text-gray-400 hover:text-red-500 transition-colors">
                                  <XCircle size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-sm font-medium text-gray-700">
                            {selectedType === "team_vs" ? "蓝方队员" : "选手2"} *
                          </label>
                          <span className="text-xs text-gray-400">{team2Players.length}{selectedType === "team_vs" ? " 人" : ""}</span>
                        </div>
                        {selectedType === "solo" && team2Players.length >= 1 ? (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                            <PlayerAvatar player={team2Players[0]} size={36} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{team2Players[0].username}</p>
                              <p className="text-xs text-gray-400">
                                {team2Players[0].country} · {(team2Players[0].pp ?? 0).toFixed(0)}pp
                                {team2Players[0].global_rank && ` · #${team2Players[0].global_rank}`}
                              </p>
                            </div>
                            <button onClick={() => setTeam2Players([])}
                              className="text-gray-400 hover:text-red-500 transition-colors">
                              <XCircle size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <PlayerSearchDropdown
                              players={approvedPlayers}
                              selected={team2Players}
                              excludeIds={team1Players.map((p) => p.osuId)}
                              search={playerSearch}
                              setSearch={setPlayerSearch}
                              onSelect={(p) => setTeam2Players((prev) => [...prev, p])}
                            />
                            {team2Players.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {team2Players.map((p) => (
                                  <div key={p.osuId} className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full pl-0.5 pr-2.5 py-1">
                                    <PlayerAvatar player={p} size={24} />
                                    <span className="text-xs text-gray-700 font-medium">{p.username}</span>
                                    <button onClick={() => setTeam2Players((prev) => prev.filter((x) => x.osuId !== p.osuId))}
                                      className="text-gray-400 hover:text-red-500 transition-colors">
                                      <XCircle size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                取消
              </button>
              <button onClick={handleCreateSchedule}
                disabled={creating || !selectedRoomId || team1Players.length === 0 || (selectedType !== "battle_royale" && team2Players.length === 0)}
                className="px-4 py-2 text-sm font-medium text-white bg-[hsla(350,80%,55%,1)] hover:bg-[hsla(350,80%,50%,1)] rounded-lg disabled:opacity-50 transition-colors">
                {creating ? "创建中..." : "创建预约"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSchedule && (
        <EditModal
          schedule={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onSave={handleUpdateSchedule}
          saving={updatingSchedule}
        />
      )}
    </div>
  );
}
