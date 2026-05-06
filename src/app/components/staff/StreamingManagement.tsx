"use client";

import Image from "next/image";
import { UserSession, UserPermissions } from "@/lib/permissions";
import { StaffRoomAssignment, AvailableRoom } from "./types";
import { Video, Mic, Flag, Calendar, Clock, XCircle, PlusCircle } from "lucide-react";

interface StreamingManagementProps {
  user: UserSession;
  permissions: UserPermissions;
  staffAssignments: StaffRoomAssignment[];
  staffAssignmentsLoading: boolean;
  availableRooms: AvailableRoom[];
  availableRoomsLoading: boolean;
  onApplyForRoom: (roomId: number, role: "referee" | "streamer" | "commentator") => void;
  onRevokeAssignment: (assignmentId: number, roleName: string) => void;
}

const ROLE_CONFIG: Record<string, { label: string; class: string; bg: string; icon: typeof Video }> = {
  referee: { label: "裁判", class: "bg-blue-100 text-blue-700 border-blue-200", bg: "bg-blue-50", icon: Flag },
  streamer: { label: "直播", class: "bg-purple-100 text-purple-700 border-purple-200", bg: "bg-purple-50", icon: Video },
  commentator: { label: "解说", class: "bg-emerald-100 text-emerald-700 border-emerald-200", bg: "bg-emerald-50", icon: Mic },
};

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  open: { label: "开放", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  in_progress: { label: "进行中", class: "bg-amber-100 text-amber-700 border-amber-200" },
  closed: { label: "关闭", class: "bg-red-100 text-red-600 border-red-200" },
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

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role];
  if (!cfg) return <span className="text-xs text-gray-500">{role}</span>;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${cfg.class}`}>
      <cfg.icon size={10} />
      {cfg.label}
    </span>
  );
}

function StaffAvatar({ url, name, size = 32 }: { url?: string; name: string; size?: number }) {
  return (
    <Image
      src={url || "/unknow.svg"}
      alt={name}
      width={size}
      height={size}
      className="rounded-full"
      onError={() => { }}
    />
  );
}

function StaffChip({
  a,
  showRole,
  onRevoke,
}: {
  a: StaffRoomAssignment;
  showRole?: boolean;
  onRevoke?: (assignmentId: number, roleName: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-1">
      <div className="flex items-center gap-1.5">
        <StaffAvatar url={a.staff_avatar_url} name={a.staff_username} size={20} />
        <div>
          <span className="text-xs text-gray-700 font-medium">{a.staff_username}</span>
          {showRole && <RoleBadge role={a.role} />}
        </div>
      </div>
      {onRevoke && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRevoke(a.id, ROLE_CONFIG[a.role]?.label || a.role);
          }}
          className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="撤销"
        >
          <XCircle size={11} />
        </button>
      )}
    </div>
  );
}

function RoleSection({
  assignments,
  roomId,
  role,
  onRevoke,
}: {
  assignments: StaffRoomAssignment[];
  roomId: number;
  role: string;
  onRevoke?: (assignmentId: number, roleName: string) => void;
}) {
  const cfg = ROLE_CONFIG[role];
  const filtered = assignments.filter(
    (a) => a.room_id === roomId && a.role === role && a.status === "confirmed",
  );
  return (
    <div className={`rounded-xl p-3 ${cfg?.bg || "bg-gray-50"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-medium">{cfg?.label || role}</span>
        <span className="text-xs text-gray-400 tabular-nums">{filtered.length}</span>
      </div>
      {filtered.length === 0 ? (
        <span className="text-xs text-gray-300">暂无</span>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filtered.map((a) => (
            <StaffChip key={a.id} a={a} onRevoke={onRevoke} />
          ))}
        </div>
      )}
    </div>
  );
}

function countStaffByRoom(assignments: StaffRoomAssignment[], roomId: number) {
  return {
    referee: assignments.filter((a) => a.room_id === roomId && a.role === "referee" && a.status === "confirmed").length,
    commentator: assignments.filter((a) => a.room_id === roomId && a.role === "commentator" && a.status === "confirmed").length,
    streamer: assignments.filter((a) => a.room_id === roomId && a.role === "streamer" && a.status === "confirmed").length,
  };
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gray-100" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-24 rounded bg-gray-100" />
          <div className="h-3 w-16 rounded bg-gray-100" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-32 rounded bg-gray-100" />
        <div className="h-3 w-20 rounded bg-gray-100" />
      </div>
    </div>
  );
}

export default function StreamingManagement({
  user,
  permissions,
  staffAssignments,
  staffAssignmentsLoading,
  availableRooms,
  availableRoomsLoading,
  onApplyForRoom,
  onRevokeAssignment,
}: StreamingManagementProps) {
  const isLoading = staffAssignmentsLoading || availableRoomsLoading;
  const myConfirmed = staffAssignments.filter(
    (a) => a.staff_osuId === user.osuId && a.status === "confirmed",
  );

  return (
    <div className="space-y-6">
      {!permissions.isadmin && myConfirmed.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">我已确认的房间</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myConfirmed.map((a) => (
              <div
                key={a.id}
                className="group relative bg-white border border-emerald-200 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">
                        {a.room?.room_name || `房间 ${a.room_id}`}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        R{a.room?.round_number} #{a.room?.match_number}
                      </div>
                    </div>
                    <RoleBadge role={a.role} />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                    <Clock size={12} className="text-gray-400" />
                    {formatDateTime(a.room?.match_datetime)}
                  </div>

                  <button
                    onClick={() => onRevokeAssignment(a.id, ROLE_CONFIG[a.role]?.label || a.role)}
                    className="w-full inline-flex items-center justify-center gap-1 py-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-100 rounded-lg transition-colors"
                  >
                    <XCircle size={12} />
                    退出
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 group-hover:h-1 bg-emerald-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-gray-800">
            {permissions.isadmin ? "Staff 房间管理" : "可申请的房间"}
          </h3>
          <span className="text-xs text-gray-400">{availableRooms.length} 个房间</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : availableRooms.length === 0 ? (
          <div className="flex justify-center items-center py-16 text-sm text-gray-400">暂无可用房间</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableRooms.map((room) => {
              const myApp = staffAssignments.find(
                (a) => a.staff_osuId === user.osuId && a.room_id === room.id && a.status === "confirmed",
              );
              const counts = countStaffByRoom(staffAssignments, room.id);
              return (
                <div
                  key={room.id}
                  className={`group relative bg-white border rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden ${myApp ? "border-emerald-200" : "border-gray-100"}`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800 text-sm truncate">{room.room_name}</span>
                          {room.match_type && (
                            <span className="text-xs text-gray-400 shrink-0">
                              {room.match_type === "solo" ? "Solo" : room.match_type === "team_vs" ? "Team VS" : "吃鸡"}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          R{room.round_number} #{room.match_number}
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 text-xs rounded-full border shrink-0 ${STATUS_MAP[room.status]?.class || ""}`}>
                        {STATUS_MAP[room.status]?.label || room.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                      <Calendar size={12} className="text-gray-400" />
                      {formatDateTime(room.match_datetime)}
                    </div>

                    {room.player1_username && room.player2_username ? (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-3 px-3 py-1.5 bg-gray-50 rounded-lg">
                        <span className="text-gray-400">对阵:</span>
                        {room.player1_username} vs {room.player2_username}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-300 mb-3 px-3 py-1.5 bg-gray-50 rounded-lg">对阵待定</div>
                    )}

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <RoleSection
                        assignments={staffAssignments}
                        roomId={room.id}
                        role="referee"
                        onRevoke={permissions.isadmin ? onRevokeAssignment : undefined}
                      />
                      <RoleSection
                        assignments={staffAssignments}
                        roomId={room.id}
                        role="commentator"
                        onRevoke={permissions.isadmin ? onRevokeAssignment : undefined}
                      />
                      <RoleSection
                        assignments={staffAssignments}
                        roomId={room.id}
                        role="streamer"
                        onRevoke={permissions.isadmin ? onRevokeAssignment : undefined}
                      />
                    </div>

                    {myApp ? (
                      <div className="flex items-center justify-center gap-2 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                        <RoleBadge role={myApp.role} />
                        <span className="text-xs text-emerald-600 font-medium">已加入</span>
                      </div>
                    ) : room.status === "open" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onApplyForRoom(room.id, "referee")}
                          disabled={counts.referee >= 2}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-white bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-40 transition-colors"
                        >
                          <PlusCircle size={10} />
                          裁判{counts.referee >= 2 ? "(满)" : ""}
                        </button>
                        <button
                          onClick={() => onApplyForRoom(room.id, "commentator")}
                          disabled={counts.commentator >= 2}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg disabled:opacity-40 transition-colors"
                        >
                          <PlusCircle size={10} />
                          解说{counts.commentator >= 2 ? "(满)" : ""}
                        </button>
                        <button
                          onClick={() => onApplyForRoom(room.id, "streamer")}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
                        >
                          <PlusCircle size={10} />
                          直播
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 group-hover:h-1 bg-[hsla(350,80%,55%,1)]" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
