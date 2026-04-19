"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import winnersData from "@/config/winners.json";


interface Position {
  x: number;
  y: number;
  rotate: number;
}

interface WinnerCard {
  id: string;
  playerName: string;
  osuId: string;
  avatarUrl: string;
  rank: number;
  country: string;
  season: string;
  position: Position;
  frameStyle: string;
}

interface Photo {
  id: string;
  imageUrl: string;
  caption: string;
  season: string;
  position: Position;
  frameStyle: string;
}

interface Season {
  seasonId: string;
  year: string;
  description: string;
  matchDate: string;
  totalParticipants: number;
  status?: string;
}

interface WinnersData {
  cards: WinnerCard[];
  photos: Photo[];
  seasons: Season[];
}

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        bgGradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
        borderColor: "#fbbf24",
        textColor: "#fbbf24",
        title: "1ST",
        frameBorder: "8px solid #fbbf24",
        frameShadow: "0 0 20px rgba(251, 191, 36, 0.5)",
      };
    case 2:
      return {
        bgGradient: "linear-gradient(135deg, #d1d5db 0%, #9ca3af 50%, #6b7280 100%)",
        borderColor: "#9ca3af",
        textColor: "#9ca3af",
        title: "2ND",
        frameBorder: "8px solid #9ca3af",
        frameShadow: "0 0 20px rgba(156, 163, 175, 0.5)",
      };
    case 3:
      return {
        bgGradient: "linear-gradient(135deg, #d97706 0%, #b45309 50%, #92400e 100%)",
        borderColor: "#d97706",
        textColor: "#d97706",
        title: "3RD",
        frameBorder: "8px solid #d97706",
        frameShadow: "0 0 20px rgba(217, 119, 6, 0.5)",
      };
    default:
      return {
        bgGradient: "linear-gradient(135deg, #4b5563 0%, #374151 50%, #1f2937 100%)",
        borderColor: "#4b5563",
        textColor: "#9ca3af",
        title: "--",
        frameBorder: "8px solid #4b5563",
        frameShadow: "0 0 20px rgba(75, 85, 99, 0.5)",
      };
  }
};

const getFrameStyle = (style: string) => {
  switch (style) {
    case "gold":
      return {
        border: "12px solid",
        borderImage: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706) 1",
        background: "linear-gradient(135deg, #fef3c7, #fde68a)",
        shadow: "0 8px 32px rgba(251, 191, 36, 0.3)",
      };
    case "silver":
      return {
        border: "12px solid",
        borderImage: "linear-gradient(135deg, #e5e7eb, #9ca3af, #6b7280) 1",
        background: "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
        shadow: "0 8px 32px rgba(156, 163, 175, 0.3)",
      };
    case "bronze":
      return {
        border: "12px solid",
        borderImage: "linear-gradient(135deg, #fcd34d, #d97706, #92400e) 1",
        background: "linear-gradient(135deg, #fef3c7, #fde68a)",
        shadow: "0 8px 32px rgba(217, 119, 6, 0.3)",
      };
    case "classic":
      return {
        border: "10px solid #ffffffff",
        background: "#ffffff",
        shadow: "0 8px 32px rgba(44, 24, 16, 0.5), inset 0 0 30px rgba(255,255,255,0.1)",
      };
    default:
      return {
        border: "10px solid #cbd5e1",
        background: "#f8fafc",
        shadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
      };
  }
};

interface WinnersCanvasProps {
  showControls?: boolean;
  defaultSeason?: string;
  height?: string;
}

export default function WinnersCanvas({
  showControls = true,
  defaultSeason = "s1",
  height = "100vh"
}: WinnersCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>(defaultSeason);
  const data = winnersData as WinnersData;

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.innerHTML = "";

    const filteredCards = data.cards.filter(card => card.season === selectedSeason);
    const filteredPhotos = data.photos.filter(photo => photo.season === selectedSeason);

    filteredCards.forEach((card) => {
      const rankStyle = getRankStyle(card.rank);
      const isPending = card.playerName === "TBD";

      const cardElement = document.createElement("div");
      cardElement.className = "winner-card";
      cardElement.style.cssText = `
        position: absolute;
        left: ${card.position.x}px;
        top: ${card.position.y}px;
        transform: rotate(${card.position.rotate}deg);
        width: 280px;
        padding: 20px;
        cursor: pointer;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        z-index: ${10 - card.rank};
      `;

      const content = document.createElement("div");
      content.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
      `;

      const avatarContainer = document.createElement("div");
      avatarContainer.style.cssText = `
        position: relative;
        margin-bottom: 15px;
        padding: 4px;
        border-radius: 50%;
        background: ${rankStyle.bgGradient};
      `;

      const avatar = document.createElement("img");
      avatar.src = isPending ? "/icons/unknow.svg" : card.avatarUrl || "/icons/unknow.svg";
      avatar.alt = card.playerName;
      avatar.style.cssText = `
        width: 100px;
        height: 100px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid white;
      `;
      avatar.onerror = () => { avatar.src = "/icons/unknow.svg"; };

      const countryBadge = document.createElement("div");
      countryBadge.style.cssText = `
        position: absolute;
        bottom: -5px;
        right: -5px;
        width: 30px;
        height: 30px;
        background: #f1f5f9;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: bold;
        color: #475569;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      `;
      countryBadge.textContent = card.country;

      avatarContainer.appendChild(avatar);
      if (!isPending) {
        avatarContainer.appendChild(countryBadge);
      }

      const titleDiv = document.createElement("div");
      titleDiv.style.cssText = `
        font-size: 80px;
        position: absolute;
        shadow: ${rankStyle.frameShadow};
        top: -50px;
        left: 0px;
        transform: rotate(${card.position.rotate}deg);
        font-weight: bold;
        color: ${rankStyle.textColor};
        margin-bottom: 5px;
      `;
      titleDiv.textContent = rankStyle.title;

      const nameDiv = document.createElement("div");
      nameDiv.style.cssText = `
        font-size: 36px;
        position: absolute;
        bottom: -12px;
        left: 12px;
        color: #1e293b;
        margin-bottom: 8px;
        text-align: center;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      `;
      nameDiv.textContent = card.playerName;

      const osuIdDiv = document.createElement("div");
      osuIdDiv.style.cssText = `
        display: flex;
        position: absolute;
        bottom: -30px;
        right: 12px;
        align-items: center;
        justify-content: center;
        background: #f1f5f9;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
      `;
      const osuIdLabel = document.createElement("span");

      osuIdLabel.style.cssText = `color: #94a3b8; margin-right: 5px;`;
      osuIdLabel.textContent = "osu! ID:";
      const osuIdValue = document.createElement("span");
      osuIdValue.style.cssText = `color: #475569; font-weight: 600;`;
      osuIdValue.textContent = card.osuId;
      osuIdDiv.appendChild(osuIdLabel);
      osuIdDiv.appendChild(osuIdValue);

      content.appendChild(avatarContainer);
      content.appendChild(titleDiv);
      content.appendChild(nameDiv);
      content.appendChild(osuIdDiv);
      cardElement.appendChild(content);
      canvas.appendChild(cardElement);

      cardElement.addEventListener("click", () => {
        if (card.osuId !== "00000000") {
          window.open(`https://osu.ppy.sh/users/${card.osuId}`, "_blank");
        }
      });

      cardElement.addEventListener("mouseenter", () => {
        gsap.to(cardElement, {
          scale: 1.08,
          rotation: 0,
          duration: 0.3,
          ease: "power2.out",
          zIndex: 100,
        });
      });

      cardElement.addEventListener("mouseleave", () => {
        gsap.to(cardElement, {
          scale: 1,
          rotation: card.position.rotate,
          duration: 0.3,
          ease: "power2.out",
          zIndex: 10 - card.rank,
        });
      });
    });

    filteredPhotos.forEach((photo) => {
      const frameStyle = getFrameStyle(photo.frameStyle);

      const photoFrame = document.createElement("div");
      photoFrame.className = "photo-frame";
      photoFrame.style.cssText = `
        position: absolute;
        left: ${photo.position.x}px;
        top: ${photo.position.y}px;
        transform: rotate(${photo.position.rotate}deg);
        background: ${frameStyle.background};
        padding: 20px;
        border-radius: 8px;
        box-shadow: ${frameStyle.shadow};
        cursor: pointer;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      `;

      const innerFrame = document.createElement("div");

      const img = document.createElement("img");
      img.src = photo.imageUrl;
      img.alt = photo.caption;
      img.style.cssText = `
        width: 300px;
        height: 100%;
        object-fit: cover;
        display: block;
        border-radius: 2px;
      `;
      img.onerror = () => {
        img.src = "/icons/unknow.svg";
        img.style.width = "300px";
        img.style.height = "200px";
      };

      const caption = document.createElement("div");
      caption.style.cssText = `
        text-align: center;
        margin-top: 12px;
        font-size: 14px;
        color: #475569;
        font-weight: 500;
      `;
      caption.textContent = photo.caption;

      innerFrame.appendChild(img);
      photoFrame.appendChild(innerFrame);
      photoFrame.appendChild(caption);
      canvas.appendChild(photoFrame);

      photoFrame.addEventListener("mouseenter", () => {
        gsap.to(photoFrame, {
          scale: 1.05,
          rotation: 0,
          boxShadow: `${frameStyle.shadow}, 0 25px 50px rgba(0, 0, 0, 0.3)`,
          duration: 0.3,
          ease: "power2.out",
        });
      });

      photoFrame.addEventListener("mouseleave", () => {
        gsap.to(photoFrame, {
          scale: 1,
          rotation: photo.position.rotate,
          boxShadow: frameStyle.shadow,
          duration: 0.3,
          ease: "power2.out",
        });
      });
    });

    const allItems = canvas.querySelectorAll(".winner-card, .photo-frame");
    allItems.forEach((item, index) => {
      gsap.fromTo(item,
        { opacity: 0, scale: 0.8, y: 50 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, delay: index * 0.1, ease: "back.out(1.7)" }
      );
    });
  }, [data.cards, data.photos, selectedSeason]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: height,
        minHeight: "800px",
        overflow: "hidden",
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          overflow: "auto",
        }}
      >
        <div
          ref={canvasRef}
          style={{
            position: "relative",
            width: "1400px",
            height: "800px",
            margin: "0 auto",
          }}
        />
      </div>

      {showControls && (
        <div
          style={{
            position: "absolute",
            top: "80px",
            right: "20px",
            zIndex: 2,
          }}
        >
          <div className="bg-black/40 dark:bg-black/40 p-3 rounded-full">
            <div className="flex flex-wrap gap-2 justify-end">
              {data.seasons.map((season) => (
                <button
                  key={season.seasonId}
                  onClick={() => setSelectedSeason(season.seasonId)}
                  className={`px-3 py-1.5 text-sm font-semibold transition-colors rounded-full ${selectedSeason === season.seasonId
                    ? "bg-highlight text-gray-600"
                    : "bg-transparent text-white hover:bg-highlight-secondary hover:text-gray-600"
                    } ${season.status === "ongoing" ? "relative" : ""}`}
                >
                  第{season.seasonId.replace("s", "")}届
                  {season.status === "open" && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
