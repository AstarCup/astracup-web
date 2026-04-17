"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { TournamentRegistration } from "@/lib/prisma-registrations";
import RadarChart from "./RadarChart";

interface InfiniteScrollCanvasProps {
  registrations: TournamentRegistration[];
  onPlayerClick?: (player: TournamentRegistration) => void;
}

export default function InfiniteScrollCanvas({
  registrations,
  onPlayerClick,
}: InfiniteScrollCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const photoBoxRef = useRef<any>(null);

  const createDetailContent = (cardElement: HTMLElement, player: TournamentRegistration) => {
    const detailContent = document.createElement("div");
    detailContent.className = "detail-content";
    detailContent.style.cssText = `
      position: absolute;
      top: 0;
      left: 100%;
      width: 234em;
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

    const playerGlobalRank = document.createElement("p");
    playerGlobalRank.style.cssText = `
      font-size: 14em;
      color: #232323ff;
    `;
    playerGlobalRank.textContent = `Rank #${player.global_rank || "N/A"}`;

    const playerCountryRank = document.createElement("p");
    playerCountryRank.style.cssText = `
      font-size: 14em;
      color: #232323ff;
    `;
    playerCountryRank.textContent = `地区排名 ${player.country_rank || "N/A"} ${player.country}`;

    basicInfo.appendChild(playerGlobalRank);
    basicInfo.appendChild(playerCountryRank);

    const radarContainer = document.createElement("div");
    radarContainer.className = "radar-chart-container";
    radarContainer.style.cssText = `
      width: 100%;
      height: 150em;
      margin-top: 16em;
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
          customData={player.customKey && player.customValue !== undefined ? { key: player.customKey, value: player.customValue } : undefined}
        />
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
    if (!containerRef.current || registrations.length === 0) return;

    const photosDiv = document.createElement("div");
    photosDiv.className = "photos";
    photosDiv.style.cssText = `
      position: absolute;
      flex-direction: column;
      overflow: hidden;
      cursor: pointer;
      width: 100%;
      height: 100%;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    `;

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(photosDiv);

    const photosPerRow = 7;
    const rows = Math.ceil(registrations.length / photosPerRow);

    for (let row = 0; row < rows; row++) {
      const photosLine = document.createElement("div");
      photosLine.className = "photos_line";
      photosLine.style.cssText = `
        font-size: 1px;
        height: 342em;
        margin-bottom: 48em;
        flex-shrink: 0;
        display: flex;
        rotate: -3deg;
        flex-direction: row;
      `;

      for (let col = 0; col < photosPerRow; col++) {
        const playerIndex = row * photosPerRow + col;
        if (playerIndex >= registrations.length) break;

        const player = registrations[playerIndex];
        const photosLinePhoto = document.createElement("div");
        photosLinePhoto.className = "photos_line_photo";
        photosLinePhoto.style.cssText = `
          font-size: 1px;
          width: 234em;
          height: 100%;
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
          photosLinePhoto.style.backgroundSize = 'cover';
          photosLinePhoto.style.backgroundPosition = 'center';
        }
        photosLinePhoto.style.backgroundColor = player.approved ? '#daf700ff' : '#666666';

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

        const avatarDiv = document.createElement("div");
        avatarDiv.style.cssText = `
          width: 20px;
          height: 20px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          top: 10px;
          left: 10px;
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
          font-size: 12px;
          color: rgba(255, 255, 255, 0.9);
          position: absolute;
          bottom: 30px;
          left: 10px;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        `;
        ppDiv.textContent = `${Math.round(player.pp)}pp`;

        playerContent.appendChild(avatarDiv);
        playerContent.appendChild(nameDiv);
        playerContent.appendChild(ppDiv);
        photosLinePhoto.appendChild(playerContent);

        photosLinePhoto.addEventListener("click", (e) => {
          e.stopPropagation();

          const allCards = document.querySelectorAll(".photos_line_photo");
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
                    // console.log("Error unmounting React root:", e);
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
                  }
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
                  // console.log("Error unmounting React root:", e);
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
                }
              });
            }
          } else {
            photosLinePhoto.classList.add("expanded");
            photosLinePhoto.style.zIndex = "100";

            const detailContent = createDetailContent(photosLinePhoto, player);

            gsap.fromTo(detailContent,
              { x: 100, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
            );
          }
        });

        photosLinePhoto.addEventListener("mouseenter", () => {
          gsap.to(playerContent, {
            scale: 1.03,
            duration: 0.1,
            ease: "power2.out",
          });
        });

        photosLinePhoto.addEventListener("mouseleave", () => {
          gsap.to(playerContent, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
          });
        });

        photosLine.appendChild(photosLinePhoto);
      }

      photosDiv.appendChild(photosLine);
    }

    const photobox = {
      container: photosDiv,
      img_data: [] as any[],
      container_width: 0,
      container_height: 0,
      photo_width: 0,
      photo_height: 0,
      if_movable: false,
      mouse_x: 0,
      mouse_y: 0,
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
        });
        this.container.addEventListener("mouseup", () => {
          this.if_movable = false;
        });
        this.container.addEventListener("mouseleave", () => {
          this.if_movable = false;
        });
        this.container.addEventListener("mousemove", (event: MouseEvent) => {
          this.move(event.clientX, event.clientY);
        });
      },
      resize() {
        const imgs = [...document.querySelectorAll(".photos_line_photo")] as HTMLElement[];
        this.container_width = this.container.offsetWidth;
        this.container_height = this.container.offsetHeight;
        this.photo_width = imgs[0]?.offsetWidth || 0;
        this.photo_height = imgs[0]?.offsetHeight || 0;
        this.scale_nums = document.body.offsetWidth / this.standard_width;
        this.container.style.transform = `scale(${this.scale_nums})`;
        gsap.to(imgs, {
          transform: `translate(0,0)`,
          duration: 0,
          ease: 'power4.out'
        });
        this.img_data = [];
        imgs.forEach((img) => {
          this.img_data.push({
            node: img,
            x: img.offsetLeft,
            y: img.offsetTop,
            mov_x: 0,
            mov_y: 0,
            ani: null as any
          });
        });
      },
      move(x: number, y: number) {
        if (!this.if_movable) return;
        const distance_x = (x - this.mouse_x) / this.scale_nums;
        const distance_y = (y - this.mouse_y) / this.scale_nums;

        this.img_data.forEach((img) => {
          img.mov_x += distance_x;
          img.mov_y += distance_y;

          if (img.ani) img.ani.kill();
          img.ani = gsap.to(img.node, {
            transform: `translate(${img.mov_x}px,${img.mov_y}px)`,
            duration: 0.5,
            ease: 'power4.out'
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
        const container = photoBoxRef.current.container;
        container.removeEventListener("mousedown", photoBoxRef.current.init);
        container.removeEventListener("mouseup", photoBoxRef.current.init);
        container.removeEventListener("mouseleave", photoBoxRef.current.init);
        container.removeEventListener("mousemove", photoBoxRef.current.init);
        window.removeEventListener("resize", photoBoxRef.current.init);
      }
    };
  }, [registrations]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    />
  );
}
