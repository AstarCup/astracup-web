"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
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
  cover_url: string | null;
  cover_custom_url: string | null;
}

const MATCH_TYPE_LABELS: Record<string, string> = {
  solo: "Solo",
  team_vs: "Team VS",
  battle_royale: "吃鸡",
};

export default function Schedule() {
  const roomsRef = useRef<RoomWithSchedules[]>([]);
  const playerInfoMapRef = useRef<Record<string, PlayerInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [joiningRoomId, setJoiningRoomId] = useState<number | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [roomCount, setRoomCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const photoboxRef = useRef<any>(null);
  const linesRef = useRef<HTMLElement[]>([]);

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

      const regRes = await fetch(`/api/user-registration?osuId=${osuId}`);
      const regData = await regRes.json();
      if (regData.success && regData.data?.user) {
        setUserStatus(regData.data.user.registrationStatus);
      }
    } catch {}
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
              avatar_url: u.avatar_url || `https://a.ppy.sh/${osuId}`,
              pp: u.pp ?? 0,
              global_rank: u.global_rank ?? null,
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
          cover_url: null,
          cover_custom_url: null,
        };
      }),
    );
    const map: Record<string, PlayerInfo> = {};
    results.forEach((p) => {
      map[p.osuId] = p;
    });
    playerInfoMapRef.current = { ...playerInfoMapRef.current, ...map };
  };

  const visibleRooms = (
    rooms: RoomWithSchedules[],
  ): RoomWithSchedules[] => {
    return rooms.filter((r) => {
      if (r.match_type === "battle_royale") return true;
      return r.schedules.length > 0;
    });
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/match-rooms?withSchedules=true");
      const data = await response.json();
      if (data.success) {
        const roomList: RoomWithSchedules[] = data.rooms || [];
        roomsRef.current = roomList;
        const visible = visibleRooms(roomList);
        setRoomCount(visible.length);

        const allOsuIds: string[] = [];
        roomList.forEach((room) => {
          room.schedules.forEach((s) => {
            if (s.player1_osuId && s.player1_osuId !== "TBD")
              allOsuIds.push(s.player1_osuId);
            if (s.player2_osuId && s.player2_osuId !== "TBD")
              allOsuIds.push(s.player2_osuId);
          });
        });
        let battlePlayers = 0;
        roomList.forEach((r) => {
          if (r.match_type === "battle_royale") battlePlayers += r.schedules.length;
        });
        setTotalPlayers(battlePlayers);

        if (allOsuIds.length > 0) {
          await fetchPlayerInfo(allOsuIds);
        }
        buildCanvas(visible);
      } else {
        setError(data.error || "获取房间数据失败");
      }
    } catch (err) {
      setError("网络错误，请稍后重试");
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
    } catch {
      alert("网络错误，请稍后重试");
    } finally {
      setJoiningRoomId(null);
    }
  };

  /* ───── Canvas 构建 ───── */

  const buildCanvas = (rooms: RoomWithSchedules[]) => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // 清理旧的拖拽监听
    if (photoboxRef.current) {
      window.removeEventListener("resize", photoboxRef.current.resize);
      photoboxRef.current = null;
    }

    container.innerHTML = "";

    const photosDiv = document.createElement("div");
    photosDiv.className = "photos";
    photosDiv.style.cssText = `
      position:absolute;top:0;left:0;right:0;bottom:0;
      display:flex;flex-direction:column;
      cursor:grab;user-select:none;
      touch-action:none;
    `;
    container.appendChild(photosDiv);

    const lines: HTMLElement[] = [];

    rooms.forEach((room, roomIdx) => {
      const row = document.createElement("div");
      row.className = "photos_line";
      row.style.cssText = `
        height:300px;margin-bottom:24px;flex-shrink:0;
        display:flex;flex-direction:row;align-items:stretch;padding:10px 0;
      `;

      /* ── 房间信息面板 ── */
      const infoPanel = document.createElement("div");
      infoPanel.style.cssText = `
        width:280px;height:100%;flex-shrink:0;
        display:flex;flex-direction:column;justify-content:center;
        padding:24px;box-sizing:border-box;
        background:rgba(255,255,255,0.06);border-radius:16px;
        margin-right:20px;color:white;
      `;

      const typeBadge = document.createElement("span");
      typeBadge.style.cssText = `
        font-size:12px;padding:2px 8px;border-radius:999px;
        background:rgba(233,59,102,0.3);color:#E93B66;
        display:inline-block;width:fit-content;margin-bottom:8px;
      `;
      typeBadge.textContent =
        MATCH_TYPE_LABELS[room.match_type] || room.match_type;

      const roomName = document.createElement("p");
      roomName.style.cssText = `
        font-size:22px;font-weight:700;color:white;margin:0 0 4px;
      `;
      roomName.textContent = room.room_name;

      const roomMeta = document.createElement("p");
      roomMeta.style.cssText = `font-size:13px;color:rgba(255,255,255,0.5);margin:0 0 2px;`;
      const dt = new Date(room.match_datetime).toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      roomMeta.textContent = `第${room.round_number}轮 · 第${room.match_number}场 · ${dt}`;

      const statusLine = document.createElement("p");
      statusLine.style.cssText = `font-size:12px;color:rgba(255,255,255,0.4);margin:0;`;
      statusLine.textContent =
        room.status === "open"
          ? "开放中"
          : room.status === "closed"
            ? "已关闭"
            : room.status;

      infoPanel.appendChild(typeBadge);
      infoPanel.appendChild(roomName);
      infoPanel.appendChild(roomMeta);
      infoPanel.appendChild(statusLine);

      const emptySpace = document.createElement("div");
      emptySpace.style.cssText = `flex:1;`;

      /* ── 加入按钮 (仅 battle_royale 空房间) ── */
      if (
        room.match_type === "battle_royale" &&
        room.schedules.length === 0 &&
        userStatus === "approved"
      ) {
        const joinBtn = document.createElement("button");
        joinBtn.style.cssText = `
          margin-top:12px;padding:8px 16px;font-size:14px;font-weight:600;
          border:none;border-radius:8px;cursor:pointer;
          background:#E93B66;color:white;
        `;
        joinBtn.textContent = "加入大乱斗";
        joinBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          handleJoinRoom(room.id);
        });
        infoPanel.appendChild(joinBtn);
      } else if (
        room.match_type === "battle_royale" &&
        room.schedules.length > 0
      ) {
        const count = document.createElement("p");
        count.style.cssText = `margin-top:12px;font-size:13px;color:rgba(255,255,255,0.6);`;
        count.textContent = `${room.schedules.length}/${room.max_participants} 人`;
        infoPanel.appendChild(count);
      }

      infoPanel.appendChild(emptySpace);
      row.appendChild(infoPanel);

      /* ── 卡片区域 ── */
      if (room.match_type === "battle_royale") {
        room.schedules.forEach((s) => {
          const card = createPlayerCard(s.player1_osuId, s.player1_username);
          row.appendChild(card);
        });
      } else {
        room.schedules.forEach((s) => {
          const card = createMatchCard(s);
          row.appendChild(card);
        });
      }

      photosDiv.appendChild(row);
      lines.push(row);
    });

    linesRef.current = lines;

    /* ── GSAP 拖拽 ── */
    setupDrag(photosDiv, lines);
  };

  const createPlayerCard = (osuId: string, username: string) => {
    const info = playerInfoMapRef.current[osuId];
    const coverUrl = info?.cover_url || info?.cover_custom_url;

    const card = document.createElement("a");
    card.href = `https://osu.ppy.sh/users/${osuId}`;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.style.cssText = `
      width:180px;height:100%;margin-right:20px;flex-shrink:0;
      border-radius:15px;overflow:hidden;position:relative;cursor:pointer;
      box-sizing:border-box;
      border-bottom:6px solid rgba(255,255,255,0.3);
      background-color:#1a1a1a;
    `;
    if (coverUrl) {
      card.style.backgroundImage = `url(${coverUrl})`;
      card.style.backgroundSize = "cover";
      card.style.backgroundPosition = "center";
    }

    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position:absolute;inset:0;background:rgba(0,0,0,0.25);
      border-radius:14px;display:flex;flex-direction:column;
    `;

    // Rank
    if (info?.global_rank) {
      const rank = document.createElement("p");
      rank.style.cssText = `
        position:absolute;top:8px;right:8px;font-size:11px;margin:0;
        color:rgba(255,255,255,0.55);text-shadow:0 1px 2px rgba(0,0,0,0.8);
      `;
      rank.textContent = `#${info.global_rank.toLocaleString()}`;
      overlay.appendChild(rank);
    }

    // PP
    const pp = document.createElement("p");
    pp.style.cssText = `
      position:absolute;top:24px;right:8px;font-size:36px;font-weight:700;margin:0;
      color:rgba(255,255,255,0.25);text-shadow:0 1px 2px rgba(0,0,0,0.4);
    `;
    pp.textContent = info ? String(Math.round(info.pp)) : "";
    overlay.appendChild(pp);

    // Username
    const name = document.createElement("p");
    name.style.cssText = `
      position:absolute;bottom:10px;left:10px;right:56px;margin:0;
      font-size:14px;font-weight:700;color:white;
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
      text-shadow:0 1px 3px rgba(0,0,0,0.8);
    `;
    name.textContent = username;
    overlay.appendChild(name);

    // Avatar
    const avatar = document.createElement("img");
    avatar.src = info?.avatar_url || `https://a.ppy.sh/${osuId}`;
    avatar.alt = username;
    avatar.style.cssText = `
      position:absolute;bottom:6px;right:6px;
      width:42px;height:42px;border-radius:50%;object-fit:cover;
    `;
    overlay.appendChild(avatar);

    card.appendChild(overlay);

    // Hover scale
    card.addEventListener("mouseenter", () => {
      gsap.to(overlay, { scale: 1.03, duration: 0.1, ease: "power2.out" });
    });
    card.addEventListener("mouseleave", () => {
      gsap.to(overlay, { scale: 1, duration: 0.3, ease: "power2.out" });
    });

    return card;
  };

  const createMatchCard = (schedule: MatchSchedule) => {
    const p1Info = playerInfoMapRef.current[schedule.player1_osuId];
    const p2Info = playerInfoMapRef.current[schedule.player2_osuId];

    const card = document.createElement("div");
    card.style.cssText = `
      width:320px;height:100%;margin-right:20px;flex-shrink:0;
      border-radius:15px;overflow:hidden;position:relative;
      box-sizing:border-box;background:#1a1a1a;
      border-bottom:6px solid rgba(255,255,255,0.3);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
    `;

    // VS 比分
    const vs = document.createElement("div");
    vs.style.cssText = `
      display:flex;align-items:center;gap:16px;color:white;
    `;

    const p1Block = document.createElement("div");
    p1Block.style.cssText = `
      display:flex;flex-direction:column;align-items:center;gap:8px;
    `;
    const p1Avatar = document.createElement("img");
    p1Avatar.src =
      p1Info?.avatar_url ||
      (schedule.player1_osuId !== "TBD"
        ? `https://a.ppy.sh/${schedule.player1_osuId}`
        : "/unknow.svg");
    p1Avatar.style.cssText = `width:48px;height:48px;border-radius:50%;object-fit:cover;`;
    const p1Name = document.createElement("span");
    p1Name.style.cssText = `font-size:13px;font-weight:600;color:white;`;
    p1Name.textContent = schedule.player1_username;
    p1Block.appendChild(p1Avatar);
    p1Block.appendChild(p1Name);

    const scoreBlock = document.createElement("div");
    scoreBlock.style.cssText = `
      display:flex;align-items:center;gap:6px;font-size:32px;font-weight:700;
    `;
    const red = document.createElement("span");
    red.style.cssText = `color:#ef4444;`;
    red.textContent = String(schedule.red_score);
    const colon = document.createElement("span");
    colon.style.cssText = `color:rgba(255,255,255,0.4);`;
    colon.textContent = ":";
    const blue = document.createElement("span");
    blue.style.cssText = `color:#3b82f6;`;
    blue.textContent = String(schedule.blue_score);
    scoreBlock.appendChild(red);
    scoreBlock.appendChild(colon);
    scoreBlock.appendChild(blue);

    const p2Block = document.createElement("div");
    p2Block.style.cssText = `
      display:flex;flex-direction:column;align-items:center;gap:8px;
    `;
    const p2Avatar = document.createElement("img");
    p2Avatar.src =
      p2Info?.avatar_url ||
      (schedule.player2_osuId !== "TBD"
        ? `https://a.ppy.sh/${schedule.player2_osuId}`
        : "/unknow.svg");
    p2Avatar.style.cssText = `width:48px;height:48px;border-radius:50%;object-fit:cover;`;
    const p2Name = document.createElement("span");
    p2Name.style.cssText = `font-size:13px;font-weight:600;color:white;`;
    p2Name.textContent = schedule.player2_username;
    p2Block.appendChild(p2Avatar);
    p2Block.appendChild(p2Name);

    vs.appendChild(p1Block);
    vs.appendChild(scoreBlock);
    vs.appendChild(p2Block);
    card.appendChild(vs);

    // 状态标签
    const statusText = document.createElement("p");
    statusText.style.cssText = `
      margin-top:12px;font-size:11px;color:rgba(255,255,255,0.5);
    `;
    const sMap: Record<string, string> = {
      pending: "未确认",
      confirmed: "已确认",
      completed: "已完成",
      cancelled: "已取消",
    };
    statusText.textContent = sMap[schedule.status] || schedule.status;
    card.appendChild(statusText);

    return card;
  };

  const setupDrag = (photosDiv: HTMLElement, lines: HTMLElement[]) => {
    let ifMovable = false;
    let mouseX = 0;
    let mouseY = 0;
    const standardWidth = 1440;
    const lineData = lines.map((node) => ({
      node,
      x: node.offsetLeft,
      y: node.offsetTop,
      movX: 0,
      movY: 0,
      ani: null as gsap.core.Tween | null,
    }));

    const resize = () => {
      const scale = document.body.offsetWidth / standardWidth;
      gsap.set(lines, { transform: `translate(120px, 160px)` });
      lineData.forEach((l) => {
        l.movX = 0;
        l.movY = 0;
      });
    };

    const move = (x: number, y: number) => {
      if (!ifMovable) return;
      const scale = document.body.offsetWidth / standardWidth;
      const dx = (x - mouseX) / scale;
      const dy = (y - mouseY) / scale;
      lineData.forEach((l) => {
        l.movX += dx;
        l.movY += dy;
        if (l.ani) l.ani.kill();
        l.ani = gsap.to(l.node, {
          transform: `translate(${l.movX}px,${l.movY}px)`,
          duration: 0.3,
          ease: "power1.out",
        });
      });
      mouseX = x;
      mouseY = y;
    };

    photosDiv.addEventListener("mousedown", (e) => {
      ifMovable = true;
      mouseX = e.clientX;
      mouseY = e.clientY;
      photosDiv.style.cursor = "grabbing";
    });
    photosDiv.addEventListener("mouseup", () => {
      ifMovable = false;
      photosDiv.style.cursor = "grab";
    });
    photosDiv.addEventListener("mouseleave", () => {
      ifMovable = false;
      photosDiv.style.cursor = "grab";
    });
    photosDiv.addEventListener("mousemove", (e) => move(e.clientX, e.clientY));

    photosDiv.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        ifMovable = true;
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
      }
    }, { passive: true });
    photosDiv.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1 && ifMovable) {
        e.preventDefault();
        move(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });
    photosDiv.addEventListener("touchend", () => { ifMovable = false; });

    resize();
    window.addEventListener("resize", resize);

    photoboxRef.current = { photosDiv, lineData, resize, move };

    return () => {
      window.removeEventListener("resize", resize);
    };
  };

  /* ───── 渲染 ───── */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white text-lg">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400 text-lg">错误: {error}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* 叠加信息 */}
      <div className="absolute top-24 right-6 text-right z-[2]">
        <p className="text-white/70 text-sm">
          {roomCount} 个房间 · {totalPlayers} 名玩家
        </p>
      </div>

      {/* Canvas 容器 */}
      <div
        className="absolute -top-20 inset-0 z-[1]"
        ref={containerRef}
        style={{
          boxShadow: "inset 0 0 100px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      />
    </div>
  );
}
