"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Check, X, User, Users } from "lucide-react";
import { MatchRoom } from "./types";

interface RoomManagementProps {
  rooms: MatchRoom[];
  roomsLoading: boolean;
  deletingRoomId: number | null;
  onDeleteRoom: (roomId: number) => void;
  onCreateRoom: (roomData: {
    room_name: string;
    round_number: number;
    match_datetime: string;
    match_type: string;
    match_number: number;
    max_participants: number;
    description: string;
  }) => void;
}

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  open: { label: "开放", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  in_progress: { label: "进行中", class: "bg-amber-100 text-amber-700 border-amber-200" },
  closed: { label: "关闭", class: "bg-red-100 text-red-600 border-red-200" },
};

const MATCH_TYPE_OPTIONS = [
  { value: "solo", label: "Solo", icon: User },
  { value: "team_vs", label: "Team VS", icon: Users },
  { value: "battle_royale", label: "吃鸡", icon: Users },
];

function inputClass(wide = false) {
  return `w-full ${wide ? "min-w-[120px]" : "min-w-[60px]"} px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md text-gray-800 focus:border-[hsla(350,80%,55%,0.5)] focus:ring-1 focus:ring-[hsla(350,80%,55%,0.2)] focus:outline-none placeholder:text-gray-400 transition-colors`;
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function MatchTypeBadge({ type }: { type: string }) {
  const opt = MATCH_TYPE_OPTIONS.find((o) => o.value === type);
  if (!opt) return <span className="text-xs text-gray-500">{type}</span>;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border bg-gray-100 text-gray-600 border-gray-200">
      <opt.icon size={10} />
      {opt.label}
    </span>
  );
}

export default function RoomManagement({
  rooms,
  roomsLoading,
  deletingRoomId,
  onDeleteRoom,
  onCreateRoom,
}: RoomManagementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    room_name: "",
    round_number: 1,
    match_datetime: "",
    match_type: "solo",
    match_number: 1,
    max_participants: 2,
    description: "",
  });

  const handleDeleteRoom = (roomId: number) => {
    if (!confirm("确定要删除这个比赛房间吗？此操作不可撤销。")) return;
    onDeleteRoom(roomId);
  };

  const handleStartEdit = () => {
    setFormData({
      room_name: "",
      round_number: 1,
      match_datetime: "",
      match_type: "solo",
      match_number: rooms.length > 0 ? Math.max(...rooms.map((r) => r.match_number)) + 1 : 1,
      max_participants: 2,
      description: "",
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      room_name: "",
      round_number: 1,
      match_datetime: "",
      match_type: "solo",
      match_number: 1,
      max_participants: 2,
      description: "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.room_name || !formData.match_datetime) return;
    setCreating(true);
    try {
      await onCreateRoom(formData);
      handleCancelEdit();
    } finally {
      setCreating(false);
    }
  };

  const updateForm = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">比赛房间管理</h3>
        {!isEditing && (
          <button
            onClick={handleStartEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[hsla(350,80%,55%,1)] hover:bg-[hsla(350,80%,50%,1)] rounded-lg transition-colors"
          >
            <Plus size={16} />
            添加房间
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {roomsLoading ? (
          <div className="flex justify-center items-center py-16">
            <Image
              src="/icons/loading.svg"
              alt="loading"
              width={32}
              height={32}
              className="animate-spin"
            />
            <span className="ml-2 text-sm text-gray-400">加载中...</span>
          </div>
        ) : rooms.length === 0 && !isEditing ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <p className="text-sm">暂无比赛房间</p>
            <button
              onClick={handleStartEdit}
              className="mt-2 text-sm text-[hsla(350,80%,55%,1)] hover:underline"
            >
              创建第一个房间
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left py-3 px-3 font-medium text-gray-500">房间名称</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-500 w-14">轮次</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-500 w-14">编号</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-500 w-20">类型</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">比赛时间</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-500 w-14">人数</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-500 w-20">状态</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-500 w-14">预约</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-500 w-14">操作</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr
                    key={room.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-gray-800 truncate max-w-40">
                        {room.room_name}
                      </div>
                      {room.description && (
                        <div className="text-xs text-[var(--color-text-secondary)] truncate max-w-40 mt-0.5">
                          {room.description}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center text-gray-600 tabular-nums">
                      {room.round_number}
                    </td>
                    <td className="py-2.5 px-3 text-center text-gray-600 tabular-nums">
                      {room.match_number}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <MatchTypeBadge type={room.match_type || "solo"} />
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">
                      {formatDateTime(room.match_datetime)}
                    </td>
                    <td className="py-2.5 px-3 text-center text-gray-600 tabular-nums">
                      {room.max_participants}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${STATUS_MAP[room.status]?.class || ""}`}
                      >
                        {STATUS_MAP[room.status]?.label || room.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {room.schedules && room.schedules.length > 0 ? (
                        <span className="text-xs text-gray-500">
                          {room.schedules.length}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        disabled={deletingRoomId === room.id}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        title="删除房间"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}

                {isEditing && (
                  <tr className="border-b border-gray-50 bg-[hsla(350,80%,55%,0.03)]">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={formData.room_name}
                        onChange={(e) => updateForm("room_name", e.target.value)}
                        className={inputClass(true)}
                        placeholder="房间名称 *"
                      />
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => updateForm("description", e.target.value)}
                        className={`${inputClass(true)} mt-1`}
                        placeholder="描述（可选）"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="1"
                        value={formData.round_number}
                        onChange={(e) => updateForm("round_number", parseInt(e.target.value) || 1)}
                        className={inputClass()}
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="1"
                        value={formData.match_number}
                        onChange={(e) => updateForm("match_number", parseInt(e.target.value) || 1)}
                        className={inputClass()}
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <select
                        value={formData.match_type}
                        onChange={(e) => updateForm("match_type", e.target.value)}
                        className={inputClass(false)}
                      >
                        {MATCH_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="datetime-local"
                        value={formData.match_datetime}
                        onChange={(e) => updateForm("match_datetime", e.target.value)}
                        className={inputClass(true)}
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="2"
                        max="16"
                        value={formData.max_participants}
                        onChange={(e) => updateForm("max_participants", parseInt(e.target.value) || 2)}
                        className={inputClass()}
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full border bg-gray-100 text-gray-500 border-gray-200">
                        新
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-xs text-gray-300">—</span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={handleSubmit}
                          disabled={creating || !formData.room_name || !formData.match_datetime}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="保存"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={creating}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          title="取消"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
