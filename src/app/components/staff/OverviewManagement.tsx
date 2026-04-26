"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  Users,
  UserCheck,
  DoorOpen,
  Layers,
  Video,
  Star,
  Clock,
  ChevronDown,
  Settings,
  Shield,
  Eye,
  EyeOff,
  UserPlus,
  Flag,
} from "lucide-react";
import gsap from "gsap";
import { UserSession, UserPermissions } from "@/lib/permissions";
import { TournamentRegistration } from "@/lib/prisma-registrations";

interface OverviewManagementProps {
  user: UserSession;
  permissions: UserPermissions;
  registrations: TournamentRegistration[];
}

interface MappoolStageStat {
  category: string;
  label: string;
  avgStarRating: number;
  avgStarRatingTesting: number;
  avgStarRatingPending: number;
  avgLength: number;
  avgLengthTesting: number;
  avgLengthPending: number;
  count: number;
  testingCount: number;
  pendingCount: number;
}

interface TournamentSettingsDisplay {
  currentSeason: string;
  currentSeasonStage: string;
  minPp: string;
  maxPp: string;
  registrationEnabled: boolean;
  mappoolVisible: boolean;
  adminCount: number;
}

interface DashboardStats {
  approvedPlayers: number;
  matchRooms: number;
  mappoolSeasons: number;
  replayCount: number;
  totalRegistrations: number;
  totalSchedules: number;
  seasonMappoolStats: Record<string, MappoolStageStat[]>;
  tournamentSettings: TournamentSettingsDisplay;
}

const statCards = [
  {
    key: "totalRegistrations" as const,
    label: "注册玩家",
    subtitle: "总注册人数",
    icon: Users,
    color: "hsla(350, 80%, 55%, 1)",
    bg: "hsla(350, 80%, 55%, 0.08)",
    border: "hsla(350, 80%, 55%, 0.25)",
  },
  {
    key: "approvedPlayers" as const,
    label: "已过审玩家",
    subtitle: "已审核通过",
    icon: UserCheck,
    color: "hsla(175, 70%, 50%, 1)",
    bg: "hsla(175, 70%, 50%, 0.08)",
    border: "hsla(175, 70%, 50%, 0.25)",
  },
  {
    key: "matchRooms" as const,
    label: "比赛房间",
    subtitle: "总房间数量",
    icon: DoorOpen,
    color: "hsla(260, 60%, 65%, 1)",
    bg: "hsla(260, 60%, 65%, 0.08)",
    border: "hsla(260, 60%, 65%, 0.25)",
  },
  {
    key: "mappoolSeasons" as const,
    label: "图池赛季",
    subtitle: "可用赛季图池",
    icon: Layers,
    color: "hsla(40, 90%, 50%, 1)",
    bg: "hsla(40, 90%, 50%, 0.08)",
    border: "hsla(40, 90%, 50%, 0.25)",
  },
  {
    key: "replayCount" as const,
    label: "已回收Replay",
    subtitle: "已上传回放",
    icon: Video,
    color: "hsla(160, 65%, 50%, 1)",
    bg: "hsla(160, 65%, 50%, 0.08)",
    border: "hsla(160, 65%, 50%, 0.25)",
  },
];

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gray-100" />
        <div className="h-5 w-20 rounded bg-gray-100" />
      </div>
      <div className="h-10 w-16 rounded bg-gray-100 mb-2" />
      <div className="h-4 w-24 rounded bg-gray-100" />
    </div>
  );
}

export default function OverviewManagement({
  user,
  permissions,
  registrations,
}: OverviewManagementProps) {
  const [stats, setStats] = useState<DashboardStats>({
    approvedPlayers: 0,
    matchRooms: 0,
    mappoolSeasons: 0,
    replayCount: 0,
    totalRegistrations: registrations.length,
    totalSchedules: 0,
    seasonMappoolStats: {},
    tournamentSettings: {
      currentSeason: "s1",
      currentSeasonStage: "registration",
      minPp: "0",
      maxPp: "7000",
      registrationEnabled: false,
      mappoolVisible: false,
      adminCount: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(
    new Set(),
  );
  const cardsRef = useRef<HTMLDivElement>(null);
  const hasMappoolStats =
    Object.keys(stats.seasonMappoolStats).length > 0;

  const toggleSeason = (season: string) => {
    setExpandedSeasons((prev) => {
      const next = new Set(prev);
      if (next.has(season)) {
        next.delete(season);
      } else {
        next.add(season);
      }
      return next;
    });
  };

  const formatLength = (seconds: number) => {
    if (!isFinite(seconds) || seconds <= 0) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.round(seconds % 60);
    return `${min}:${String(sec).padStart(2, "0")}`;
  };

  const formatStar = (val: number) =>
    isFinite(val) ? `${val.toFixed(2)}★` : "—";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/staff/stats");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (result.success) {
          setStats((prev) => ({ ...prev, ...result.data }));
          const seasons = Object.keys(result.data.seasonMappoolStats || {});
          if (seasons.length > 0) {
            setExpandedSeasons(new Set([seasons[seasons.length - 1]]));
          }
        } else {
          throw new Error(result.error || "未知错误");
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError(err instanceof Error ? err.message : "获取统计数据失败");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    if (cardsRef.current && !loading) {
      gsap.fromTo(
        cardsRef.current.querySelectorAll(".stat-card"),
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.06,
          ease: "power2.out",
        },
      );
    }
  }, [loading]);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsla(350,80%,55%,0.04),_transparent_50%)]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[hsla(350,80%,55%,0.03)] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />

        <div className="relative p-6 flex items-center gap-5">
          <Image
            src={user.avatar_url}
            alt={user.username}
            width={64}
            height={64}
            className="rounded-full ring-2 ring-[hsla(350,80%,55%,0.3)]"
            onError={() => { }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[var(--color-text-secondary)] mb-0.5">
              欢迎回来
            </p>
            <h2 className="text-xl font-bold text-gray-800 truncate">
              {user.username}
            </h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {permissions.isadmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-[hsla(350,80%,55%,0.1)] text-[hsla(350,80%,55%,1)] border border-[hsla(350,80%,55%,0.2)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsla(350,80%,55%,1)]" />
                  管理员
                </span>
              )}
              {permissions.isplayer && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-[hsla(175,70%,50%,0.1)] text-[hsla(175,70%,50%,1)] border border-[hsla(175,70%,50%,0.2)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsla(175,70%,50%,1)]" />
                  选手
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div ref={cardsRef}>
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            获取统计数据失败: {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))
            : statCards.map(
              ({ key, label, subtitle, icon: Icon, color, bg, border }) => (
                <div
                  key={key}
                  className="stat-card group relative overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                  style={{ borderColor: border }}
                >
                  <div className="relative p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-300"
                        style={{ backgroundColor: bg }}
                      >
                        <Icon
                          size={20}
                          style={{ color }}
                          className="transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                      <h4 className="font-semibold text-gray-700 text-sm">
                        {label}
                      </h4>
                    </div>

                    <p
                      className="text-3xl font-bold tabular-nums mb-1"
                      style={{ color }}
                    >
                      {stats[key]}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {subtitle}
                    </p>
                  </div>

                  <div
                    className="absolute bottom-0 left-0 right-0 h-1 transition-all duration-300 group-hover:h-1.5"
                    style={{ backgroundColor: color }}
                  />
                </div>
              ),
            )}
        </div>
      </div>

      {!loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings
              size={18}
              className="text-[hsla(260,60%,65%,1)]"
            />
            <h3 className="text-lg font-bold text-gray-800">
              比赛设置
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="group relative overflow-hidden rounded-xl border border-[hsla(40,90%,50%,0.2)] bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="relative p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[hsla(40,90%,50%,0.08)]">
                    <Flag size={16} className="text-[hsla(40,90%,50%,1)]" />
                  </div>
                  <span className="font-semibold text-gray-700 text-sm">
                    当前赛季
                  </span>
                </div>
                <p className="text-2xl font-bold text-[hsla(40,90%,50%,1)]">
                  {stats.tournamentSettings.currentSeason}
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 group-hover:h-1 bg-[hsla(40,90%,50%,1)]" />
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-[hsla(260,60%,65%,0.2)] bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="relative p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[hsla(260,60%,65%,0.08)]">
                    <Star size={16} className="text-[hsla(260,60%,65%,1)]" />
                  </div>
                  <span className="font-semibold text-gray-700 text-sm">
                    赛季阶段
                  </span>
                </div>
                <p className="text-2xl font-bold text-[hsla(260,60%,65%,1)]">
                  {stats.tournamentSettings.currentSeasonStage}
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 group-hover:h-1 bg-[hsla(260,60%,65%,1)]" />
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-[hsla(175,70%,50%,0.2)] bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="relative p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[hsla(175,70%,50%,0.08)]">
                    <UserPlus
                      size={16}
                      className="text-[hsla(175,70%,50%,1)]"
                    />
                  </div>
                  <span className="font-semibold text-gray-700 text-sm">
                    PP 限制
                  </span>
                </div>
                <p className="text-2xl font-bold tabular-nums text-[hsla(175,70%,50%,1)]">
                  {stats.tournamentSettings.minPp} –{" "}
                  {stats.tournamentSettings.maxPp}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  最低 – 最高
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 group-hover:h-1 bg-[hsla(175,70%,50%,1)]" />
            </div>

            <div className="group relative overflow-hidden rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
              style={{
                borderColor: stats.tournamentSettings.registrationEnabled
                  ? "hsla(160,65%,50%,0.2)"
                  : "hsla(0,80%,55%,0.2)",
              }}
            >
              <div className="relative p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{
                      backgroundColor: stats.tournamentSettings.registrationEnabled
                        ? "hsla(160,65%,50%,0.08)"
                        : "hsla(0,80%,55%,0.08)",
                    }}
                  >
                    {stats.tournamentSettings.registrationEnabled ? (
                      <UserPlus size={16} className="text-[hsla(160,65%,50%,1)]" />
                    ) : (
                      <UserPlus size={16} className="text-[hsla(0,80%,55%,1)]" />
                    )}
                  </div>
                  <span className="font-semibold text-gray-700 text-sm">
                    报名状态
                  </span>
                </div>
                <p className="text-2xl font-bold"
                  style={{
                    color: stats.tournamentSettings.registrationEnabled
                      ? "hsla(160,65%,50%,1)"
                      : "hsla(0,80%,55%,1)",
                  }}
                >
                  {stats.tournamentSettings.registrationEnabled
                    ? "开放"
                    : "关闭"}
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 group-hover:h-1"
                style={{
                  backgroundColor: stats.tournamentSettings.registrationEnabled
                    ? "hsla(160,65%,50%,1)"
                    : "hsla(0,80%,55%,1)",
                }}
              />
            </div>

            <div className="group relative overflow-hidden rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
              style={{
                borderColor: stats.tournamentSettings.mappoolVisible
                  ? "hsla(40,90%,50%,0.2)"
                  : "hsla(0,0%,60%,0.2)",
              }}
            >
              <div className="relative p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{
                      backgroundColor: stats.tournamentSettings.mappoolVisible
                        ? "hsla(40,90%,50%,0.08)"
                        : "hsla(0,0%,60%,0.08)",
                    }}
                  >
                    {stats.tournamentSettings.mappoolVisible ? (
                      <Eye size={16} className="text-[hsla(40,90%,50%,1)]" />
                    ) : (
                      <EyeOff size={16} className="text-gray-400" />
                    )}
                  </div>
                  <span className="font-semibold text-gray-700 text-sm">
                    图池展示
                  </span>
                </div>
                <p className="text-2xl font-bold"
                  style={{
                    color: stats.tournamentSettings.mappoolVisible
                      ? "hsla(40,90%,50%,1)"
                      : "hsla(0,0%,60%,1)",
                  }}
                >
                  {stats.tournamentSettings.mappoolVisible ? "开启" : "关闭"}
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 group-hover:h-1"
                style={{
                  backgroundColor: stats.tournamentSettings.mappoolVisible
                    ? "hsla(40,90%,50%,1)"
                    : "hsla(0,0%,60%,1)",
                }}
              />
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-[hsla(350,80%,55%,0.2)] bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="relative p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[hsla(350,80%,55%,0.08)]">
                    <Shield
                      size={16}
                      className="text-[hsla(350,80%,55%,1)]"
                    />
                  </div>
                  <span className="font-semibold text-gray-700 text-sm">
                    管理员数量
                  </span>
                </div>
                <p className="text-2xl font-bold tabular-nums text-[hsla(350,80%,55%,1)]">
                  {stats.tournamentSettings.adminCount}
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 group-hover:h-1 bg-[hsla(350,80%,55%,1)]" />
            </div>
          </div>
        </div>
      )}

      {!loading && hasMappoolStats && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star size={18} className="text-[hsla(40,90%,50%,1)]" />
            <h3 className="text-lg font-bold text-gray-800">
              图池各阶段统计
            </h3>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.seasonMappoolStats)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([season, stages]) => {
                const isExpanded = expandedSeasons.has(season);
                return (
                  <div
                    key={season}
                    className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={() => toggleSeason(season)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <span className="font-semibold text-gray-800 text-sm">
                        赛季 {season}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                          }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                          {stages.map((stage) => (
                            <div
                              key={stage.category}
                              className="group relative overflow-hidden rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                              style={{
                                borderColor: "hsla(40,90%,50%,0.2)",
                              }}
                            >
                              <div className="relative p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[hsla(40,90%,50%,0.08)]">
                                    <Star
                                      size={16}
                                      className="text-[hsla(40,90%,50%,1)]"
                                    />
                                  </div>
                                  <span className="font-semibold text-gray-700 text-sm">
                                    {stage.label}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div>
                                    <p className="text-2xl font-bold tabular-nums text-[hsla(40,90%,50%,1)]">
                                      {formatStar(stage.avgStarRating)}
                                    </p>
                                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                                      已过审 · {stage.count}图
                                    </p>
                                  </div>
                                  {stage.testingCount > 0 && (
                                    <>
                                      <span className="text-gray-300 text-lg">/</span>
                                      <div>
                                        <p className="text-2xl font-bold tabular-nums text-[hsla(30,85%,45%,1)]">
                                          {formatStar(stage.avgStarRatingTesting)}
                                        </p>
                                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                                          测图中 · {stage.testingCount}图
                                        </p>
                                      </div>
                                    </>
                                  )}
                                  {stage.pendingCount > 0 && (
                                    <>
                                      <span className="text-gray-300 text-lg">/</span>
                                      <div>
                                        <p className="text-2xl font-bold tabular-nums text-[hsla(260,60%,65%,1)]">
                                          {formatStar(stage.avgStarRatingPending)}
                                        </p>
                                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                                          待审核 · {stage.pendingCount}图
                                        </p>
                                      </div>
                                    </>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Clock size={14} className="text-gray-400 shrink-0" />
                                    <span className="text-sm text-gray-600 tabular-nums">
                                      {formatLength(stage.avgLength)}
                                    </span>
                                  </div>
                                  {stage.testingCount > 0 && (
                                    <>
                                      <span className="text-gray-300">/</span>
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <Clock size={14} className="text-[hsla(30,85%,45%,1)] shrink-0" />
                                        <span className="text-sm text-[hsla(30,85%,45%,1)] tabular-nums">
                                          {formatLength(stage.avgLengthTesting)}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                  {stage.pendingCount > 0 && (
                                    <>
                                      <span className="text-gray-300">/</span>
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <Clock size={14} className="text-[hsla(260,60%,65%,1)] shrink-0" />
                                        <span className="text-sm text-[hsla(260,60%,65%,1)] tabular-nums">
                                          {formatLength(stage.avgLengthPending)}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 group-hover:h-1 bg-[hsla(40,90%,50%,1)]" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
