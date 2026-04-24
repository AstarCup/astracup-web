"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { TournamentRegistration } from "@/lib/prisma-registrations";
import RadarChart from "@/app/components/ui/RadarChart";
import localFont from "next/font/local";

const Pacifico = localFont({
  src: "../../font/Pacifico-Regular.ttf",
});

interface UserManagementProps {
  registrations: TournamentRegistration[];
  registrationsLoading: boolean;
  processingUser: string | null;
  onFetchRegistrations: () => void;
  onApproveRegistration: (osuId: string, username: string) => void;
  onDeleteRegistration: (osuId: string, username: string) => void;
}

export default function UserManagement({
  registrations,
  registrationsLoading,
  processingUser,
  onFetchRegistrations,
  onApproveRegistration,
  onDeleteRegistration,
}: UserManagementProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const photoBoxRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [canvasReady, setCanvasReady] = useState(false);

  const pendingRegistrations = registrations.filter(
    (r) => r.registrationStatus !== "approved",
  );
  const approvedRegistrations = registrations.filter(
    (r) => r.registrationStatus === "approved",
  );

  const filteredPending = searchQuery
    ? pendingRegistrations.filter(
        (r) =>
          r.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.osuId.includes(searchQuery),
      )
    : pendingRegistrations;

  const filteredApproved = searchQuery
    ? approvedRegistrations.filter(
        (r) =>
          r.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.osuId.includes(searchQuery),
      )
    : approvedRegistrations;

  // Combine filtered lists, pending first then approved
  const displayPlayers = [...filteredPending, ...filteredApproved];

  const createDetailContent = (cardElement: HTMLElement, player: TournamentRegistration) => {
    const detailContent = document.createElement("div");
    detailContent.className = "detail-content";
    detailContent.style.cssText = `
      position: absolute;
      top: 0;
      left: 100%;
      width: 434em;
      height: 100%;
      background: rgba(255, 255, 255, 0.95);
      padding: 20em;
      border-radius: 10em;
      box-sizing: border-box;
      overflow-y: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
      opacity: 0;
      z-index: 1000;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      pointer-events: auto;
    `;

    const basicInfo = document.createElement("div");
    basicInfo.innerHTML = `
      <div style="display:flex;align-items:center;gap:12em;margin-bottom:12em;">
        <img src="${player.avatar_url || "/icons/unknow.svg"}" style="width:48em;height:48em;border-radius:50%;object-fit:cover;" />
        <div>
          <div style="font-size:18em;font-weight:bold;color:#333;">${player.username}</div>
          <div style="font-size:12em;color:#666;">ID: ${player.osuId}</div>
        </div>
      </div>
      <div style="font-size:12em;color:#666;line-height:1.6;">
        PP: ${Math.round(player.pp).toLocaleString()} | 
        排名: #${player.global_rank?.toLocaleString() || "N/A"} 
        ${player.country ? `(${player.country} #${player.country_rank?.toLocaleString() || "N/A"})` : ""}
        ${player.teamName ? `<br>队伍: ${player.teamName}` : ""}
      </div>
    `;

    const radarContainer = document.createElement("div");
    radarContainer.className = "radar-chart-container";
    radarContainer.style.cssText = `
      width: 100%;
      height: 150em;
      margin-top: 8em;
    `;

    detailContent.appendChild(basicInfo);
    detailContent.appendChild(radarContainer);
    cardElement.appendChild(detailContent);

    import("react-dom/client").then((ReactDOM) => {
      const root = ReactDOM.createRoot(radarContainer);
      root.render(
        <RadarChart
          accuracy={player.accuracy || 0}
          stamina={player.stamina || 0}
          firstSight={player.firstSight || 0}
          strategy={player.strategy || 0}
          experience={player.experience || 0}
          customData={player.customKey && player.customValue != null ? { key: player.customKey, value: player.customValue } : undefined}
          width={380}
        />,
      );

      (radarContainer as any)._reactRoot = root;
    });

    gsap.to(detailContent, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
    });

    return detailContent;
  };

  useEffect(() => {
    if (!containerRef.current || displayPlayers.length === 0) {
      setCanvasReady(false);
      return;
    }
    setCanvasReady(true);

    const container = containerRef.current;
    container.innerHTML = "";
    container.style.cssText = `
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      overflow: hidden;
      boxShadow: inset 0 0 100px rgba(0, 0, 0, 0.5);
    `;

    const photosDiv = document.createElement("div");
    photosDiv.style.cssText = `
      position: absolute;
      top: 0px; left: 0px; right: 0; bottom: 0;
      flex-direction: column;
      cursor: grab;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      touch-action: none;
      background-image: url("data:image/svg+xml,<svg id='patternId' width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'><defs><pattern id='a' patternUnits='userSpaceOnUse' width='75' height='75' patternTransform='scale(4) rotate(20)'><rect x='0' y='0' width='100%' height='100%' fill='hsla(210,16.7%,97.6%,1)'/><path d='M15.896-3.379a3.051 3.051 0 0 0-3.044 3.045 3.051 3.051 0 0 0 3.044 3.045A3.05 3.05 0 0 0 18.94-.334a3.05 3.05 0 0 0-3.043-3.045zm0 .764a2.275 2.275 0 0 1 2.282 2.281 2.275 2.275 0 0 1-2.282 2.281 2.275 2.275 0 0 1-2.28-2.281 2.275 2.275 0 0 1 2.28-2.281zm29.479 5.742a4.13 4.13 0 0 0-4.123 4.123 4.13 4.13 0 0 0 4.123 4.123 4.13 4.13 0 0 0 4.123-4.123 4.13 4.13 0 0 0-4.123-4.123zm0 1.03a3.086 3.086 0 0 1 3.094 3.093 3.086 3.086 0 0 1-3.094 3.094 3.086 3.086 0 0 1-3.094-3.094 3.086 3.086 0 0 1 3.094-3.094zM66.299 8.89c-3.73 0-6.78 3.048-6.78 6.779 0 3.73 3.05 6.777 6.78 6.777 3.73 0 6.777-3.046 6.777-6.777 0-3.73-3.047-6.78-6.777-6.78zm0 2.214a4.547 4.547 0 0 1 4.562 4.565 4.547 4.547 0 0 1-4.562 4.564 4.548 4.548 0 0 1-4.565-4.564 4.548 4.548 0 0 1 4.565-4.565zm-24.653 9.2a4.499 4.499 0 0 0-4.488 4.486 4.499 4.499 0 0 0 4.488 4.486 4.497 4.497 0 0 0 4.487-4.486 4.497 4.497 0 0 0-4.487-4.486zm0 1.46a3.014 3.014 0 0 1 3.026 3.026 3.014 3.014 0 0 1-3.026 3.025 3.014 3.014 0 0 1-3.025-3.025 3.014 3.014 0 0 1 3.025-3.025zm24.086 9.94A2.3 2.3 0 0 0 63.438 34a2.3 2.3 0 0 0 2.294 2.295A2.298 2.298 0 0 0 68.025 34a2.298 2.298 0 0 0-2.293-2.295zm0 .576c.953 0 1.72.766 1.72 1.719 0 .953-.767 1.719-1.72 1.719A1.714 1.714 0 0 1 64.014 34c0-.953.765-1.719 1.718-1.719zm-49.234 6.545c-2.952 0-5.363 2.413-5.363 5.365a5.376 5.376 0 0 0 5.363 5.364 5.376 5.376 0 0 0 5.363-5.364c0-2.952-2.41-5.365-5.363-5.365zm0 1.744c2.01 0 3.621 1.611 3.621 3.621s-1.61 3.621-3.621 3.621a3.608 3.608 0 0 1-3.621-3.62 3.608 3.608 0 0 1 3.621-3.622zm33.84 6.348a4.318 4.318 0 0 0-4.307 4.309 4.318 4.318 0 0 0 4.307 4.308 4.32 4.32 0 0 0 4.308-4.308 4.32 4.32 0 0 0-4.308-4.309zm0 1.398a2.9 2.9 0 0 1 2.91 2.91 2.9 2.9 0 0 1-2.91 2.91 2.898 2.898 0 0 1-2.908-2.91 2.898 2.898 0 0 1 2.908-2.91zm18.367 1.897A4.499 4.499 0 0 0 64.22 54.7a4.497 4.497 0 0 0 4.486 4.486 4.499 4.499 0 0 0 4.488-4.486 4.5 4.5 0 0 0-4.488-4.488zm0 1.463A3.014 3.014 0 0 1 71.73 54.7a3.014 3.014 0 0 1-3.025 3.026A3.014 3.014 0 0 1 65.68 54.7a3.014 3.014 0 0 1 3.025-3.025zm-36.771 1.92c-4.85 0-8.813 3.963-8.813 8.812 0 4.85 3.963 8.81 8.813 8.81 4.849 0 8.812-3.96 8.812-8.81 0-4.85-3.963-8.812-8.812-8.812zm0 2.892a5.897 5.897 0 0 1 5.918 5.92 5.896 5.896 0 0 1-5.918 5.918 5.896 5.896 0 0 1-5.918-5.918 5.897 5.897 0 0 1 5.918-5.92zM15.896 71.621a3.051 3.051 0 0 0-3.044 3.045 3.051 3.051 0 0 0 3.044 3.045 3.05 3.05 0 0 0 3.043-3.045 3.05 3.05 0 0 0-3.043-3.045zm0 .764a2.275 2.275 0 0 1 2.282 2.281 2.275 2.275 0 0 1-2.282 2.281 2.275 2.275 0 0 1-2.28-2.281 2.275 2.275 0 0 1 2.28-2.281z'  stroke-width='1' stroke='none' fill='hsla(210,13.8%,88.6%,1)'/><path d='M57.973.85a3.756 3.756 0 1 0 .067 7.512A3.756 3.756 0 0 0 57.973.85zM6.449 2.625a2.357 2.357 0 1 0 0 4.714 2.357 2.357 0 0 0 0-4.714Zm24.643 7.744a3.756 3.756 0 1 0 .067 7.512 3.756 3.756 0 0 0-.067-7.512zm-17.848 5.467a2.357 2.357 0 1 0 .175 4.71 2.357 2.357 0 0 0-.175-4.71zM-.25 23.363a2.136 2.136 0 1 0 0 4.274 2.136 2.136 0 1 0 0-4.274Zm75 0a2.136 2.136 0 1 0 0 4.274 2.136 2.136 0 1 0 0-4.274Zm-49.031 5.178a2.283 2.283 0 1 0 .054 4.566 2.283 2.283 0 0 0-.054-4.566zm30.404-1.512a1.473 1.473 0 1 0 0 2.946 1.473 1.473 0 0 0 0-2.946zm-9.525 9.088a2.578 2.578 0 1 0-.001 5.156 2.578 2.578 0 0 0 0-5.156zm-41.442.93a1.473 1.473 0 1 0-.003 2.946 1.473 1.473 0 0 0 .003-2.946zm62.455 3.314a1.473 1.473 0 1 0 .001 2.946 1.473 1.473 0 0 0 0-2.946zm-33.51 2.135a1.473 1.473 0 1 0-.003 2.946 1.473 1.473 0 0 0 .004-2.946ZM8.599 56.072a3.756 3.756 0 1 0 .067 7.512 3.756 3.756 0 0 0-.067-7.512zm40.49 7.658a2.357 2.357 0 1 0-.001 4.714 2.357 2.357 0 0 0 0-4.714zm22.129 5.833a2.136 2.136 0 1 0 .072 4.27 2.136 2.136 0 0 0-.072-4.27z'  stroke-width='1' stroke='none' fill='hsla(210,15.8%,92.5%,1)'/></pattern></defs><rect width='800%' height='800%' transform='translate(-508,-540)' fill='url(%23a)'/></svg>")
    `;

    container.appendChild(photosDiv);

    const photosPerRow = 14;
    const rows = Math.ceil(displayPlayers.length / photosPerRow);

    for (let row = 0; row < rows; row++) {
      const photosLine = document.createElement("div");
      photosLine.className = "photos_line";
      photosLine.style.cssText = `
        font-size: 1px;
        height: 342em;
        margin-bottom: 32em;
        flex-shrink: 0;
        display: flex;
        flex-direction: row;
      `;

      for (let col = 0; col < photosPerRow; col++) {
        const playerIndex = row * photosPerRow + col;
        if (playerIndex >= displayPlayers.length) break;

        const player = displayPlayers[playerIndex];
        const isApproved = player.registrationStatus === "approved";

        const photosLinePhoto = document.createElement("div");
        photosLinePhoto.className = "photos_line_photo";
        photosLinePhoto.style.cssText = `
          font-size: 1px;
          width: 234em;
          height: 100%;
          rotate: -3deg;
          margin-right: 36em;
          border-radius: 15em;
          overflow: visible;
          flex-shrink: 0;
          position: relative;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        `;

        const coverUrl = player.cover?.custom_url || player.cover?.url;
        if (coverUrl) {
          photosLinePhoto.style.backgroundImage = `url(${coverUrl})`;
          photosLinePhoto.style.backgroundSize = "cover";
          photosLinePhoto.style.backgroundPosition = "center";
        }
        photosLinePhoto.style.backgroundColor = "#1a1a1a23";
        photosLinePhoto.style.borderBottom = isApproved
          ? "8px solid #daf700ff"
          : "8px solid #666666";
        photosLinePhoto.style.boxSizing = "border-box";

        const playerContent = document.createElement("div");
        playerContent.style.cssText = `
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          color: white;
          padding: 20em;
          box-sizing: border-box;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 14em;
          position: relative;
          transition: transform 0.3s ease;
        `;

        const keychainImg = document.createElement("img");
        keychainImg.src = "/钥扣.svg";
        keychainImg.style.cssText = `
          position: absolute;
          top: 6px;
          left: -24px;
          width: 68px;
          height: 190px;
          pointer-events: none;
          object-fit: cover;
          z-index: 0;
        `;
        playerContent.appendChild(keychainImg);

        // Status watermark
        if (isApproved) {
          const approvedMark = document.createElement("p");
          approvedMark.className = `${Pacifico.className} approved_mark`;
          approvedMark.style.cssText = `
            font-size: 48px;
            color: #daf700ff;
            position: absolute;
            bottom: 34px;
            right: 10px;
            rotate: 6deg;
          `;
          approvedMark.textContent = "Approved";
          photosLinePhoto.appendChild(approvedMark);
        } else {
          const registrationsMark = document.createElement("p");
          registrationsMark.className = `${Pacifico.className} registrations_mark`;
          registrationsMark.style.cssText = `
            font-size: 32px;
            color: #dfe3e7ac;
            position: absolute;
            bottom: 34px;
            right: 10px;
            rotate: 6deg;
          `;
          registrationsMark.textContent = "待审核";
          photosLinePhoto.appendChild(registrationsMark);
        }

        // Avatar
        const avatarDiv = document.createElement("div");
        avatarDiv.style.cssText = `
          width: 60px;
          height: 60px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          bottom: 10px;
          right: 10px;
          z-index: 10;
        `;

        if (player.avatar_url) {
          const avatarImg = document.createElement("img");
          avatarImg.src = player.avatar_url;
          avatarImg.alt = player.username;
          avatarImg.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            pointer-events: none;
            user-select: none;
          `;
          avatarDiv.appendChild(avatarImg);
        } else {
          avatarDiv.style.cssText += `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 30em;
            color: white;
          `;
          avatarDiv.textContent = player.username.charAt(0).toUpperCase();
        }

        const nameDiv = document.createElement("div");
        nameDiv.style.cssText = `
          font-size: 24px;
          font-weight: bold;
          color: white;
          position: absolute;
          bottom: 10px;
          left: 10px;
          right: 10px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        `;
        nameDiv.textContent = player.username;

        const ppDiv = document.createElement("div");
        ppDiv.style.cssText = `
          font-size: 72px;
          color: rgba(255, 255, 255, 0.4);
          position: absolute;
          font-weight: bold;
          top: 24px;
          right: 10px;
        `;
        ppDiv.textContent = `${Math.round(player.pp)}`;

        const ppDiv2 = document.createElement("p");
        ppDiv2.style.cssText = `
          font-size: 24px;
          color: rgba(255, 255, 255, 0.4);
          position: absolute;
          top: 12px;
          right: 10px;
        `;
        ppDiv2.textContent = "pp";

        const playerGlobalRank = document.createElement("p");
        playerGlobalRank.style.cssText = `
          font-size: 14em;
          color: #787e95ff;
          text-align: right;
          right: 10px;
          top: -18px;
          position: absolute;
        `;
        playerGlobalRank.textContent = `Rank #${player.global_rank || "N/A"} ${player.country} #${player.country_rank || "N/A"}`;

        playerContent.appendChild(playerGlobalRank);
        playerContent.appendChild(ppDiv2);
        playerContent.appendChild(avatarDiv);
        playerContent.appendChild(nameDiv);
        playerContent.appendChild(ppDiv);

        // Action buttons container
        const buttonsContainer = document.createElement("div");
        buttonsContainer.className = "action-buttons-container";
        buttonsContainer.style.cssText = `
          display: flex;
          position: absolute;
          bottom: 80px;
          left: 10px;
          right: 10px;
          gap: 8px;
          z-index: 20;
          opacity: 0;
          transition: opacity 0.3s ease;
        `;

        // Copy osuID button
        const copyButton = document.createElement("button");
        copyButton.style.cssText = `
          flex: 1;
          position: absolute;
          padding: 8px 12px;
          top: -60px;
          left: -30px;
          background: #00000040;
          color: white;
          border: 2px solid;
          border-color: #d7d73fff;
          border-radius: 24px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        `;

        const clipboardIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        clipboardIcon.setAttribute("width", "14");
        clipboardIcon.setAttribute("height", "14");
        clipboardIcon.setAttribute("viewBox", "0 0 24 24");
        clipboardIcon.setAttribute("fill", "none");
        clipboardIcon.setAttribute("stroke", "currentColor");
        clipboardIcon.setAttribute("stroke-width", "2");
        clipboardIcon.setAttribute("stroke-linecap", "round");
        clipboardIcon.setAttribute("stroke-linejoin", "round");
        clipboardIcon.innerHTML = `<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>`;

        const copyText = document.createElement("span");
        copyText.textContent = "复制osuID";
        copyButton.appendChild(clipboardIcon);
        copyButton.appendChild(copyText);
        copyButton.addEventListener("click", (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(player.osuId).then(() => {
            copyText.textContent = "已复制!";
            copyButton.style.background = "#48bb783c";
            setTimeout(() => {
              copyText.textContent = "复制osuID";
              copyButton.style.background = "#00000040";
            }, 1500);
          });
        });
        copyButton.addEventListener("mouseenter", () => {
          copyButton.style.transform = "translateY(-2px)";
          copyButton.style.boxShadow = "0 4px 12px rgba(234, 227, 102, 0.4)";
        });
        copyButton.addEventListener("mouseleave", () => {
          copyButton.style.transform = "translateY(0)";
          copyButton.style.boxShadow = "0 2px 8px rgba(234, 227, 102, 0.3)";
        });

        // osu! profile button
        const profileButton = document.createElement("button");
        profileButton.style.cssText = `
          flex: 1;
          padding: 8px 12px;
          position: absolute;
          top: -10px;
          left: -30px;
          background: #00000040;
          border: 2px solid;
          border-color: #ff6b6b97;
          color: white;
          border-radius: 24px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
        `;
        profileButton.textContent = `${player.username}的osu!主页`;
        profileButton.addEventListener("click", (e) => {
          e.stopPropagation();
          window.open(`https://osu.ppy.sh/users/${player.osuId}`, "_blank");
        });
        profileButton.addEventListener("mouseenter", () => {
          profileButton.style.transform = "translateY(-2px)";
          profileButton.style.boxShadow = "0 4px 12px rgba(255, 107, 107, 0.4)";
        });
        profileButton.addEventListener("mouseleave", () => {
          profileButton.style.transform = "translateY(0)";
          profileButton.style.boxShadow = "0 2px 8px rgba(255, 107, 107, 0.3)";
        });

        // Admin buttons - fixed at top-right like profileButton
        const adminButtonsContainer = document.createElement("div");
        adminButtonsContainer.style.cssText = `
          display: flex;
          position: absolute;
          top: -60px;
          right: -30px;
          gap: 6px;
          z-index: 25;
        `;

        if (!isApproved) {
          const approveBtn = document.createElement("button");
          approveBtn.textContent = processingUser === player.osuId ? "审核中..." : "审核通过";
          approveBtn.style.cssText = `
            padding: 8px 14px;
            background: #00000040;
            border: 2px solid;
            border-color: #22c55e;
            color: white;
            border-radius: 24px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
            white-space: nowrap;
          `;
          approveBtn.addEventListener("mouseenter", () => {
            approveBtn.style.transform = "translateY(-2px)";
            approveBtn.style.boxShadow = "0 4px 12px rgba(34, 197, 94, 0.4)";
          });
          approveBtn.addEventListener("mouseleave", () => {
            approveBtn.style.transform = "translateY(0)";
            approveBtn.style.boxShadow = "0 2px 8px rgba(34, 197, 94, 0.3)";
          });
          approveBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            onApproveRegistration(player.osuId, player.username);
          });
          adminButtonsContainer.appendChild(approveBtn);
        }

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = processingUser === player.osuId ? "删除中..." : "删除";
        deleteBtn.style.cssText = `
          padding: 8px 14px;
          background: #00000040;
          border: 2px solid;
          border-color: #ff6b6b97;
          color: white;
          border-radius: 24px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
          white-space: nowrap;
        `;
        deleteBtn.addEventListener("mouseenter", () => {
          deleteBtn.style.transform = "translateY(-2px)";
          deleteBtn.style.boxShadow = "0 4px 12px rgba(255, 107, 107, 0.4)";
        });
        deleteBtn.addEventListener("mouseleave", () => {
          deleteBtn.style.transform = "translateY(0)";
          deleteBtn.style.boxShadow = "0 2px 8px rgba(255, 107, 107, 0.3)";
        });
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          onDeleteRegistration(player.osuId, player.username);
        });
        adminButtonsContainer.appendChild(deleteBtn);

        buttonsContainer.appendChild(copyButton);
        buttonsContainer.appendChild(profileButton);
        buttonsContainer.appendChild(adminButtonsContainer);
        playerContent.appendChild(buttonsContainer);

        photosLinePhoto.appendChild(playerContent);

        // Click to expand detail
        photosLinePhoto.addEventListener("click", (e) => {
          e.stopPropagation();

          const allCards = container.querySelectorAll(".photos_line_photo");
          allCards.forEach((otherCard) => {
            if (otherCard !== photosLinePhoto && otherCard.classList.contains("expanded")) {
              otherCard.classList.remove("expanded");
              (otherCard as HTMLElement).style.zIndex = "1";

              const detailContent = otherCard.querySelector(".detail-content");
              if (detailContent) {
                const radarChartContainer = detailContent.querySelector(".radar-chart-container");
                if (radarChartContainer && (radarChartContainer as any)._reactRoot) {
                  try {
                    (radarChartContainer as any)._reactRoot.unmount();
                  } catch (e) {
                    // ignore
                  }
                }
                gsap.to(detailContent, {
                  opacity: 0,
                  x: 100,
                  duration: 0.3,
                  onComplete: () => {
                    if (detailContent.parentNode) {
                      detailContent.parentNode.removeChild(detailContent);
                    }
                  },
                });
              }
            }
          });

          const isExpanded = photosLinePhoto.classList.contains("expanded");
          if (isExpanded) {
            photosLinePhoto.classList.remove("expanded");
            photosLinePhoto.style.zIndex = "1";
            const detailContent = photosLinePhoto.querySelector(".detail-content");
            if (detailContent) {
              const radarChartContainer = detailContent.querySelector(".radar-chart-container");
              if (radarChartContainer && (radarChartContainer as any)._reactRoot) {
                try {
                  (radarChartContainer as any)._reactRoot.unmount();
                } catch (e) {
                  // ignore
                }
              }
              gsap.to(detailContent, {
                opacity: 0,
                x: 100,
                duration: 0.3,
                onComplete: () => {
                  if (detailContent.parentNode) {
                    detailContent.parentNode.removeChild(detailContent);
                  }
                },
              });
            }
          } else {
            photosLinePhoto.classList.add("expanded");
            photosLinePhoto.style.zIndex = "100";
            const detailContent = createDetailContent(photosLinePhoto, player);
            gsap.fromTo(
              detailContent,
              { x: 100, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" },
            );
          }
        });

        // Hover effects
        photosLinePhoto.addEventListener("mouseenter", () => {
          gsap.to(playerContent, {
            scale: 1.03,
            duration: 0.1,
            ease: "power2.out",
          });
          buttonsContainer.style.opacity = "1";
        });
        photosLinePhoto.addEventListener("mouseleave", () => {
          gsap.to(playerContent, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
          });
          buttonsContainer.style.opacity = "0";
        });

        photosLine.appendChild(photosLinePhoto);
      }

      photosDiv.appendChild(photosLine);
    }

    // Drag interaction
    const photobox = {
      container: photosDiv,
      line_data: [] as any[],
      container_width: 0,
      container_height: 0,
      line_height: 0,
      if_movable: false,
      mouse_x: 0,
      mouse_y: 0,
      last_touch_x: 0,
      last_touch_y: 0,
      standard_width: 1440,
      scale_nums: 1,
      init() {
        this.resize();
        window.addEventListener("resize", () => {
          this.resize();
        });

        this.container.addEventListener("mousedown", (event: MouseEvent) => {
          this.if_movable = true;
          this.mouse_x = event.clientX;
          this.mouse_y = event.clientY;
          this.container.style.cursor = "grabbing";
        });
        this.container.addEventListener("mouseup", () => {
          this.if_movable = false;
          this.container.style.cursor = "grab";
        });
        this.container.addEventListener("mouseleave", () => {
          this.if_movable = false;
          this.container.style.cursor = "grab";
        });
        this.container.addEventListener("mousemove", (event: MouseEvent) => {
          this.move(event.clientX, event.clientY);
        });
        this.container.addEventListener(
          "touchstart",
          (event: TouchEvent) => {
            if (event.touches.length === 1) {
              this.if_movable = true;
              this.last_touch_x = event.touches[0].clientX;
              this.last_touch_y = event.touches[0].clientY;
              this.mouse_x = event.touches[0].clientX;
              this.mouse_y = event.touches[0].clientY;
            }
          },
          { passive: true },
        );
        this.container.addEventListener(
          "touchmove",
          (event: TouchEvent) => {
            if (event.touches.length === 1 && this.if_movable) {
              event.preventDefault();
              const touchX = event.touches[0].clientX;
              const touchY = event.touches[0].clientY;
              this.move(touchX, touchY);
              this.last_touch_x = touchX;
              this.last_touch_y = touchY;
            }
          },
          { passive: false },
        );
        this.container.addEventListener("touchend", () => {
          this.if_movable = false;
        });
        this.container.addEventListener("touchcancel", () => {
          this.if_movable = false;
        });
      },
      resize() {
        const lines = [...document.querySelectorAll(".photos_line")] as HTMLElement[];
        this.container_width = this.container.offsetWidth;
        this.container_height = this.container.offsetHeight;
        this.line_height = lines[0]?.offsetHeight || 0;
        this.scale_nums = document.body.offsetWidth / this.standard_width;
        gsap.set(lines, { transform: "translate(120px, 160px)" });
        this.line_data = [];
        lines.forEach((line) => {
          this.line_data.push({
            node: line,
            x: line.offsetLeft,
            y: line.offsetTop,
            mov_x: 0,
            mov_y: 0,
            ani: null as any,
          });
        });
      },
      move(x: number, y: number) {
        if (!this.if_movable) return;
        const distance_x = (x - this.mouse_x) / this.scale_nums;
        const distance_y = (y - this.mouse_y) / this.scale_nums;
        this.line_data.forEach((line) => {
          line.mov_x += distance_x;
          line.mov_y += distance_y;
          if (line.ani) line.ani.kill();
          line.ani = gsap.to(line.node, {
            transform: `translate(${line.mov_x}px,${line.mov_y}px)`,
            duration: 0.3,
            ease: "power1.out",
          });
        });
        this.mouse_x = x;
        this.mouse_y = y;
      },
    };

    photobox.init();
    photoBoxRef.current = photobox;

    return () => {
      if (photoBoxRef.current) {
        window.removeEventListener("resize", photoBoxRef.current.resize);
      }
    };
  }, [displayPlayers, processingUser, onApproveRegistration, onDeleteRegistration]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-white-extra border-b-4 border-highlight rounded-lg p-6">
        <h3 className="text-xl font-bold text-text mb-4 flex items-center">
          <span className="w-2 h-2 bg-highlight rounded-full mr-3"></span>
          用户注册审核管理
          <span className="ml-auto text-sm font-normal text-text-secondary">
            共 {registrations.length} 人 · 待审核 {pendingRegistrations.length} 人 · 已通过 {approvedRegistrations.length} 人
          </span>
        </h3>

        {/* Search bar */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="搜索用户名或ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-background/30 border border-action rounded-md text-text text-sm focus:border-highlight focus:outline-none"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Loading */}
        {registrationsLoading && (
          <div className="text-center py-8">
            <Image src="/icons/loading.svg" alt="loading" width={120} height={120} className="animate-spin" />
            <p className="text-text-secondary mt-2">正在加载注册数据...</p>
          </div>
        )}

        {/* Canvas area */}
        {!registrationsLoading && displayPlayers.length > 0 && (
          <div
            className="relative w-full overflow-hidden rounded-lg border border-action"
            style={{ height: "1800px" }}
          >
            <div
              ref={containerRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 text-text-secondary text-xs bg-background/60 px-3 py-1 rounded-full pointer-events-none">
              拖拽移动 · 点击卡片查看详情
            </div>
          </div>
        )}

        {/* Empty state */}
        {!registrationsLoading && displayPlayers.length === 0 && (
          <div className="bg-background/30 border border-action rounded-lg p-6 text-center">
            {searchQuery ? (
              <p className="text-text-secondary text-sm">没有匹配的用户</p>
            ) : registrations.length === 0 ? (
              <>
                <p className="text-text-secondary text-sm mb-3">暂无注册用户数据</p>
                <button
                  onClick={onFetchRegistrations}
                  className="px-4 py-2 bg-highlight text-text rounded-md hover:bg-highlight-secondary transition-colors text-sm"
                >
                  获取注册数据
                </button>
              </>
            ) : (
              <p className="text-text-secondary text-sm">没有匹配的用户</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}