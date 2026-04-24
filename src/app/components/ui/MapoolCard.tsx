"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import JSZip from "jszip";
import { showSuccess, showError, showInfo } from "./Notification";

interface MapPoolRow {
  Slot?: string;
  BID?: string;
  SID?: string;
  MapInfo?: string;
  artist?: string;
  title?: string;
  version?: string;
  _Creator?: string;
  SR?: string;
  BPM?: string;
  HitLength?: string;
  coverUrl?: string;
  starRating?: number;
  approved?: boolean;
  maxCombo?: number;
  [key: string]: any;
}

interface MapoolCardProps {
  data: MapPoolRow[];
}

const MOD_BORDER_COLORS: Record<string, string> = {
  NM: "#888888ff",
  HD: "#eab308",
  HR: "#ef4444",
  DT: "#ca92ffff",
  FM: "#8cecb0ff",
  LZ: "#adcdffff",
  TB: "#280505ff",
};

const MOD_BG_COLORS: Record<string, string> = {
  NM: "rgba(218, 228, 248, 0.9)",
  HD: "rgba(234,179,8,0.9)",
  HR: "rgba(239,68,68,0.9)",
  DT: "rgba(168,85,247,0.9)",
  FM: "rgba(21,128,61,0.9)",
  LZ: "rgba(59,130,246,0.9)",
  TB: "rgba(0,0,0,0.9)",
};

const getMod = (slot: string) => slot?.replace(/\d+/g, "") || "NM";

function createProgressOverlay(card: HTMLElement) {
  const existing = card.querySelector(".card-progress-overlay") as HTMLElement;
  if (existing) return existing;

  const overlay = document.createElement("div");
  overlay.className = "card-progress-overlay";
  overlay.style.cssText = `
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    z-index: 50; background: rgba(0,0,0,0.5);
    border-radius: 14px; pointer-events: none;
  `;

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "100");
  svg.setAttribute("height", "100");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.style.transform = "rotate(-90deg)";

  const bgCircle = document.createElementNS(svgNS, "circle");
  bgCircle.setAttribute("cx", "50");
  bgCircle.setAttribute("cy", "50");
  bgCircle.setAttribute("r", "40");
  bgCircle.setAttribute("fill", "none");
  bgCircle.setAttribute("stroke", "rgba(255,255,255,0.15)");
  bgCircle.setAttribute("stroke-width", "6");

  const fgCircle = document.createElementNS(svgNS, "circle");
  fgCircle.setAttribute("cx", "50");
  fgCircle.setAttribute("cy", "50");
  fgCircle.setAttribute("r", "40");
  fgCircle.setAttribute("fill", "none");
  fgCircle.setAttribute("stroke", "#E93B66");
  fgCircle.setAttribute("stroke-width", "6");
  fgCircle.setAttribute("stroke-linecap", "round");
  fgCircle.setAttribute("stroke-dasharray", `${2 * Math.PI * 40}`);
  fgCircle.setAttribute("stroke-dashoffset", `${2 * Math.PI * 40}`);
  fgCircle.id = "progress-ring";

  svg.appendChild(bgCircle);
  svg.appendChild(fgCircle);

  const text = document.createElement("span");
  text.className = "progress-text";
  text.style.cssText = `
    position: absolute; color: white; font-size: 18px;
    font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  `;
  text.textContent = "0%";

  overlay.appendChild(svg);
  overlay.appendChild(text);
  card.appendChild(overlay);
  return overlay;
}

function updateProgressOverlay(card: HTMLElement, progress: number) {
  const overlay = card.querySelector(".card-progress-overlay") as HTMLElement;
  if (!overlay) return;
  const ring = overlay.querySelector("#progress-ring") as SVGCircleElement;
  const text = overlay.querySelector(".progress-text") as HTMLElement;
  if (ring) {
    const circumference = 2 * Math.PI * 40;
    ring.setAttribute("stroke-dashoffset", String(circumference - (progress / 100) * circumference));
  }
  if (text) text.textContent = `${Math.round(progress)}%`;
}

function removeProgressOverlay(card: HTMLElement) {
  const overlay = card.querySelector(".card-progress-overlay") as HTMLElement;
  if (overlay) overlay.remove();
}

async function downloadBeatmapBlob(
  sid: string,
  signal: AbortSignal,
  source = "sayobot"
): Promise<Blob> {
  const response = await fetch(
    `/api/download-beatmap?sid=${sid}&source=${source}`,
    {
      method: "GET",
      headers: { "Cache-Control": "no-cache" },
      signal,
    }
  );

  if (!response.ok) {
    let errorText = "";
    try {
      const errorData = await response.json();
      errorText = errorData.error || `HTTP ${response.status}`;
    } catch {
      errorText = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorText);
  }

  const blob = await response.blob();
  if (blob.size < 1000) {
    throw new Error(`文件大小异常: ${blob.size} bytes`);
  }
  return blob;
}

export default function MapoolCard({ data }: MapoolCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const photoBoxRef = useRef<any>(null);
  const abortMapRef = useRef<Map<number, AbortController>>(new Map());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const bulkAbortRef = useRef<AbortController | null>(null);

  const circleRadius = 80;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * circleRadius;
  const offset = circumference - (overallProgress / 100) * circumference;

  const startSingleDownload = useCallback(
    (idx: number) => {
      const item = data[idx];
      if (!item) return;
      const controller = new AbortController();
      abortMapRef.current.set(idx, controller);
      const card = document.querySelector(
        `[data-card-index="${idx}"]`
      ) as HTMLElement;
      if (!card) return;

      showInfo(`开始下载: ${item.artist} - ${item.title}`);

      createProgressOverlay(card);
      updateProgressOverlay(card, 5);

      downloadBeatmapBlob(item.SID || "", controller.signal)
        .then((blob) => {
          updateProgressOverlay(card, 90);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `beatmap_${item.SID}.osz`;
          a.style.display = "none";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          updateProgressOverlay(card, 100);
          setTimeout(() => removeProgressOverlay(card), 600);
          showSuccess(`下载完成: ${item.artist} - ${item.title}`);
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          removeProgressOverlay(card);
          showError(`下载失败: ${item.artist} - ${item.title}\n${err.message}`);
        })
        .finally(() => {
          abortMapRef.current.delete(idx);
        });
    },
    [data]
  );

  const cancelSingleDownload = useCallback((idx: number) => {
    const ctrl = abortMapRef.current.get(idx);
    if (ctrl) {
      ctrl.abort();
      abortMapRef.current.delete(idx);
      const card = document.querySelector(
        `[data-card-index="${idx}"]`
      ) as HTMLElement;
      if (card) removeProgressOverlay(card);
    }
  }, []);

  const startBulkDownload = useCallback(async () => {
    const controller = new AbortController();
    bulkAbortRef.current = controller;
    setIsBulkDownloading(true);
    setOverallProgress(0);

    const zip = new JSZip();
    let successCount = 0;
    let failCount = 0;

    try {
      for (let i = 0; i < data.length; i++) {
        if (controller.signal.aborted) {
          showInfo("下载已被用户取消");
          break;
        }

        const item = data[i];
        const card = document.querySelector(
          `[data-card-index="${i}"]`
        ) as HTMLElement;

        const progress = Math.round((i / data.length) * 100);
        setOverallProgress(progress);

        if (card) {
          createProgressOverlay(card);
          updateProgressOverlay(card, 5);
        }

        try {
          const blob = await downloadBeatmapBlob(
            item.SID || "",
            controller.signal
          );

          if (card) updateProgressOverlay(card, 70);

          const contentDisposition = ""; // not available in blob mode
          let filename = `beatmap_${item.SID}.osz`;

          zip.file(filename, blob);
          successCount++;

          if (card) {
            updateProgressOverlay(card, 100);
            setTimeout(() => removeProgressOverlay(card), 400);
          }

          if (i < data.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            showInfo("下载已被用户取消");
            break;
          }
          console.error(`Failed to download ${item.SID}:`, error);
          if (card) removeProgressOverlay(card);
          failCount++;
        }
      }

      setOverallProgress(100);

      if (successCount > 0) {
        const zipBlob = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        });

        if (zipBlob.size === 0) {
          throw new Error("生成的ZIP文件为空");
        }

        const url = window.URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `beatmaps_${Date.now()}.zip`;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showSuccess(
          `批量下载完成！成功: ${successCount}, 失败: ${failCount}\nZIP文件大小: ${(zipBlob.size / 1024 / 1024).toFixed(2)} MB`
        );
      } else {
        showError("所有谱面下载都失败了，请检查网络连接");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        showInfo("批量下载已被用户取消");
      } else {
        console.error("Bulk download process error:", error);
        showError("批量下载过程中出现严重错误");
      }
    } finally {
      setIsBulkDownloading(false);
      bulkAbortRef.current = null;
    }
  }, [data]);

  const cancelAllDownloads = useCallback(() => {
    if (bulkAbortRef.current) {
      bulkAbortRef.current.abort();
      bulkAbortRef.current = null;
    }
    for (const [idx, ctrl] of abortMapRef.current) {
      ctrl.abort();
      const card = document.querySelector(
        `[data-card-index="${idx}"]`
      ) as HTMLElement;
      if (card) removeProgressOverlay(card);
    }
    abortMapRef.current.clear();
    setIsBulkDownloading(false);
  }, []);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const photosDiv = document.createElement("div");
    photosDiv.className = "photos";
    photosDiv.style.cssText = `
      position: absolute;
      top: 0px;
      left: 0px;
      right: 0;
      bottom: 0;
      flex-direction: column;
      cursor: grab;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      touch-action: none;
    `;

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(photosDiv);

    const groupedByMod: Record<string, MapPoolRow[]> = {};
    data.forEach((map) => {
      const mod = getMod(map.Slot || "");
      if (!groupedByMod[mod]) groupedByMod[mod] = [];
      groupedByMod[mod].push(map);
    });

    let flatIdx = 0;

    for (const [mod, maps] of Object.entries(groupedByMod)) {
      const photosLine = document.createElement("div");
      photosLine.className = "photos_line";
      photosLine.dataset.mod = mod;
      photosLine.style.cssText = `
        font-size: 1px;
        height: 342px;
        margin-bottom: 32px;
        flex-shrink: 0;
        display: flex;
        flex-direction: row;
      `;

      const borderColor = MOD_BORDER_COLORS[mod] || "#3b82f6";
      const badgeBg = MOD_BG_COLORS[mod] || "rgba(59,130,246,0.9)";

      const modLabel = document.createElement("div");
      modLabel.style.cssText = `
        font-size: 86px;
        font-weight: 700;
        color: ${borderColor};
        display: flex;
        align-items: flex-start;
        justify-content: flex-end;
        writing-mode: vertical-rl;
        padding: 8px 4px;
        flex-shrink: 0;
        width: 30px;
        text-orientation: mixed;
        letter-spacing: 2px;
      `;
      modLabel.textContent = mod;
      photosLine.appendChild(modLabel);

      for (let col = 0; col < maps.length; col++) {
        const map = maps[col];
        const cardIdx = flatIdx++;

        const photosLinePhoto = document.createElement("div");
        photosLinePhoto.className = "photos_line_photo";
        photosLinePhoto.dataset.cardIndex = String(cardIdx);
        photosLinePhoto.style.cssText = `
          font-size: 1px;
          width: 634px;
          height: 100%;
          rotate: -3deg;
          margin-right: 36px;
          border-radius: 15px;
          overflow: visible;
          flex-shrink: 0;
          position: relative;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        `;

        if (map.coverUrl) {
          photosLinePhoto.style.backgroundImage = `url(${map.coverUrl})`;
          photosLinePhoto.style.backgroundSize = "cover";
          photosLinePhoto.style.backgroundPosition = "center";
        }
        photosLinePhoto.style.backgroundColor = "#1a1a1a";
        photosLinePhoto.style.borderBottom = `8px solid ${borderColor}`;
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
          padding: 20px;
          box-sizing: border-box;
          background: rgba(0, 0, 0, 0.25);
          border-radius: 14px;
          position: relative;
          transition: transform 0.3s ease;
        `;

        const modBadge = document.createElement("div");
        modBadge.style.cssText = `
          position: absolute;
          bottom: 12px;
          right: 12px;
          font-size: 48px;
          font-weight: 700;
          color: ${badgeBg};
          z-index: 2;
        `;
        modBadge.textContent = map.Slot || "";

        if (parseInt(map.BID || "0") < 0) {
          const originalBadge = document.createElement("div");
          originalBadge.style.cssText = `
            position: absolute;
            top: 12px;
            right: 12px;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 20px;
            font-weight: 700;
            color: white;
            background: rgba(219,39,119,0.9);
            z-index: 2;
          `;
          originalBadge.textContent = "原创";
          playerContent.appendChild(originalBadge);
        }

        const topStats = document.createElement("div");
        topStats.style.cssText = `
          position: absolute;
          bottom: 12px;
          left: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          z-index: 2;
        `;

        const attrRow1 = [
          { label: "CS", value: map._CS || map.CS },
          { label: "AR", value: map._AR || map.AR },
          { label: "OD", value: map._OD || map.OD },
          { label: "HP", value: map.hp },
        ];

        const attrRow2 = [
          { label: "BPM", value: map.BPM },
          { label: "time", value: map.HitLength },
          { label: "★", value: map.starRating },
        ];

        const createTag = ({ label, value }: { label: string; value: any }) => {
          if (value === undefined || value === null || value === "") return null;
          const tag = document.createElement("span");
          tag.style.cssText = `
            padding: 2px 6px;
            border-radius: 14px;
            font-size: 24px;
            background: rgba(255, 255, 255);
            line-height: 1.4;
          `;
          const labelSpan = document.createElement("span");
          labelSpan.style.cssText = `color: #94a3b8; font-size: 14px;`;
          labelSpan.textContent = label;
          const valueSpan = document.createElement("span");
          valueSpan.style.cssText = `color: ${borderColor}; margin-left: 2px;`;
          valueSpan.textContent = String(value);
          tag.appendChild(labelSpan);
          tag.appendChild(valueSpan);
          return tag;
        };

        const row1Div = document.createElement("div");
        row1Div.style.cssText = `display: flex; gap: 4px;`;
        attrRow1.forEach((item) => {
          const tag = createTag(item);
          if (tag) row1Div.appendChild(tag);
        });

        const row2Div = document.createElement("div");
        row2Div.style.cssText = `display: flex; gap: 4px; margin-top: 4px;`;
        attrRow2.forEach((item) => {
          const tag = createTag(item);
          if (tag) row2Div.appendChild(tag);
        });

        topStats.appendChild(row2Div);
        topStats.appendChild(row1Div);

        playerContent.appendChild(topStats);

        const topInfo = document.createElement("div");
        topInfo.style.cssText = `
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          z-index: 2;
        `;

        const mapName = document.createElement("div");
        mapName.style.cssText = `
          font-size: 32px;
          font-weight: 700;
          color: white;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-shadow: 1px 1px 3px rgba(0,0,0,0.6);
        `;
        mapName.textContent = `${map.artist} - ${map.title}`;

        const versionEl = document.createElement("div");
        versionEl.style.cssText = `
          font-size: 15px;
          color: rgba(255,255,255,0.8);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
          margin-top: 1px;
        `;
        versionEl.textContent = `[${map.version}] by ${map._Creator || ""}`;

        topInfo.appendChild(mapName);
        topInfo.appendChild(versionEl);

        const bottomInfo = document.createElement("div");
        bottomInfo.style.cssText = `
          position: absolute;
          bottom: 68px;
          left: 12px;
          right: 12px;
          z-index: 2;
        `;

        playerContent.appendChild(topInfo);
        playerContent.appendChild(modBadge);
        playerContent.appendChild(bottomInfo);

        const buttonsContainer = document.createElement("div");
        buttonsContainer.style.cssText = `
          position: absolute;
          bottom: 78px;
          right: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          z-index: 20;
          opacity: 0;
          transition: opacity 0.3s ease;
        `;

        const selectedByUsername = document.createElement("div");
        selectedByUsername.style.cssText = `
          font-size: 15px;
          color: rgba(255,255,255,0.8);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
          margin-top: 1px;
        `;
        selectedByUsername.textContent = `冤家${map.selectedByUsername || ""}`;
        buttonsContainer.appendChild(selectedByUsername);

        const openButton = document.createElement("button");
        openButton.style.cssText = `
          width: 170px;
          padding: 6px 0;
          background: rgba(0,0,0,0.5);
          color: white;
          border: 2px solid rgba(255,255,255,0.6);
          border-radius: 20px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
        `;
        openButton.textContent = "谱面详情";
        openButton.addEventListener("click", (e) => {
          e.stopPropagation();
          const bid = parseInt(map.BID || "0");
          if (bid > 0) {
            window.open(`https://osu.ppy.sh/beatmaps/${map.BID}`, "_blank");
          }
        });
        openButton.addEventListener("mouseenter", () => {
          openButton.style.background = "rgba(255,255,255,0.25)";
        });
        openButton.addEventListener("mouseleave", () => {
          openButton.style.background = "rgba(0,0,0,0.5)";
        });

        const copyButton = document.createElement("button");
        copyButton.style.cssText = `
          width: 170px;
          padding: 6px 0;
          background: rgba(0,0,0,0.5);
          color: white;
          border: 2px solid rgba(255,255,255,0.6);
          border-radius: 20px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
        `;
        copyButton.textContent = `复制BID: ${map.BID}`;
        copyButton.addEventListener("click", (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(map.BID || "").then(() => {
            copyButton.textContent = "已复制!";
            copyButton.style.background = "rgba(34,197,94,0.6)";
            copyButton.style.borderColor = "#22c55e";
            setTimeout(() => {
              copyButton.textContent = `复制BID: ${map.BID}`;
              copyButton.style.background = "rgba(0,0,0,0.5)";
              copyButton.style.borderColor = "rgba(255,255,255,0.6)";
            }, 1500);
          });
        });
        copyButton.addEventListener("mouseenter", () => {
          copyButton.style.background = "rgba(255,255,255,0.25)";
        });
        copyButton.addEventListener("mouseleave", () => {
          copyButton.style.background = "rgba(0,0,0,0.5)";
        });

        const downloadBtn = document.createElement("button");
        downloadBtn.style.cssText = `
          width: 170px;
          padding: 6px 0;
          background: rgba(233,59,102,0.4);
          color: white;
          border: 2px solid rgba(233,59,102,0.7);
          border-radius: 20px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
        `;
        downloadBtn.textContent = "下载";
        downloadBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const existingCtrl = abortMapRef.current.get(cardIdx);
          if (existingCtrl) {
            cancelSingleDownload(cardIdx);
          } else {
            startSingleDownload(cardIdx);
          }
        });
        downloadBtn.addEventListener("mouseenter", () => {
          downloadBtn.style.background = "rgba(233,59,102,0.6)";
        });
        downloadBtn.addEventListener("mouseleave", () => {
          downloadBtn.style.background = "rgba(233,59,102,0.4)";
        });

        buttonsContainer.appendChild(openButton);
        buttonsContainer.appendChild(copyButton);
        buttonsContainer.appendChild(downloadBtn);
        playerContent.appendChild(buttonsContainer);

        photosLinePhoto.appendChild(playerContent);

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
          { passive: true }
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
          { passive: false }
        );

        this.container.addEventListener("touchend", () => {
          this.if_movable = false;
        });

        this.container.addEventListener("touchcancel", () => {
          this.if_movable = false;
        });
      },
      resize() {
        const lines = [
          ...document.querySelectorAll(".photos_line"),
        ] as HTMLElement[];
        this.container_width = this.container.offsetWidth;
        this.container_height = this.container.offsetHeight;
        this.line_height = lines[0]?.offsetHeight || 0;
        this.scale_nums = document.body.offsetWidth / this.standard_width;

        gsap.set(lines, {
          transform: `translate(120px, 160px)`,
        });
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
  }, [data, startSingleDownload, cancelSingleDownload]);

  const hasActiveDownloads = () =>
    isBulkDownloading || abortMapRef.current.size > 0;

  return (
    <div className="relative">
      <div className="flex justify-end mb-3">
        <button
          onClick={hasActiveDownloads() ? cancelAllDownloads : startBulkDownload}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${hasActiveDownloads()
            ? "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30"
            : "bg-[#E93B66]/20 text-[#E93B66] border-[#E93B66]/40 hover:bg-[#E93B66]/30"
            }`}
        >
          {hasActiveDownloads() ? "取消全部下载" : "一键下载图池"}
        </button>
      </div>

      <div className="relative">
        <div
          ref={containerRef}
          style={{
            position: "relative",
            width: "100%",
            height: "2600px",
            overflow: "hidden",
            borderRadius: "12px",
            boxShadow: "inset 0 0 60px rgba(0, 0, 0, 0.3)",
          }}
        />

        {isBulkDownloading && (
          <div className="absolute inset-0 flex items-start justify-center pt-12 z-50 pointer-events-none bg-black/60">
            <div className="relative flex items-center justify-center">
              <svg width="200" height="200" className="transform -rotate-90">
                <circle
                  cx="100"
                  cy="100"
                  r={circleRadius}
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={strokeWidth}
                />
                <circle
                  cx="100"
                  cy="100"
                  r={circleRadius}
                  fill="none"
                  stroke="#E93B66"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  className="transition-all duration-300 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-2xl font-bold drop-shadow-lg">
                  {overallProgress}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
