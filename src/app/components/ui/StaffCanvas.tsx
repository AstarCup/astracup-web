"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import localFont from 'next/font/local'

const CalSans = localFont({
    src: '../../font/CalSans-Regular.ttf',
})

interface StaffMember {
    name: string;
    osuId: string;
    avatarUrl: string;
    role: string;
    description: string;
    coverUrl?: string | null;
    isSpecial?: boolean;
}

interface StaffCanvasProps {
    staffMembers: StaffMember[];
    onStaffClick?: (member: StaffMember) => void;
}

export default function StaffCanvas({
    staffMembers,
    onStaffClick,
}: StaffCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const photoBoxRef = useRef<any>(null);

    useEffect(() => {
        if (!containerRef.current || staffMembers.length === 0) return;

        const photosDiv = document.createElement("div");
        photosDiv.className = `${CalSans.className} photos`;
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
      background-image: url("data:image/svg+xml,<svg id='patternId' width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'><defs><pattern id='a' patternUnits='userSpaceOnUse' width='75' height='75' patternTransform='scale(4) rotate(20)'><rect x='0' y='0' width='100%' height='100%' fill='hsla(210,16.7%,97.6%,1)'/><path d='M15.896-3.379a3.051 3.051 0 0 0-3.044 3.045 3.051 3.051 0 0 0 3.044 3.045A3.05 3.05 0 0 0 18.94-.334a3.05 3.05 0 0 0-3.043-3.045zm0 .764a2.275 2.275 0 0 1 2.282 2.281 2.275 2.275 0 0 1-2.282 2.281 2.275 2.275 0 0 1-2.28-2.281 2.275 2.275 0 0 1 2.28-2.281zm29.479 5.742a4.13 4.13 0 0 0-4.123 4.123 4.13 4.13 0 0 0 4.123 4.123 4.13 4.13 0 0 0 4.123-4.123 4.13 4.13 0 0 0-4.123-4.123zm0 1.03a3.086 3.086 0 0 1 3.094 3.093 3.086 3.086 0 0 1-3.094 3.094 3.086 3.086 0 0 1-3.094-3.094 3.086 3.086 0 0 1 3.094-3.094zM66.299 8.89c-3.73 0-6.78 3.048-6.78 6.779 0 3.73 3.05 6.777 6.78 6.777 3.73 0 6.777-3.046 6.777-6.777 0-3.73-3.047-6.78-6.777-6.78zm0 2.214a4.547 4.547 0 0 1 4.562 4.565 4.547 4.547 0 0 1-4.562 4.564 4.548 4.548 0 0 1-4.565-4.564 4.548 4.548 0 0 1 4.565-4.565zm-24.653 9.2a4.499 4.499 0 0 0-4.488 4.486 4.499 4.499 0 0 0 4.488 4.486 4.497 4.497 0 0 0 4.487-4.486 4.497 4.497 0 0 0-4.487-4.486zm0 1.46a3.014 3.014 0 0 1 3.026 3.026 3.014 3.014 0 0 1-3.026 3.025 3.014 3.014 0 0 1-3.025-3.025 3.014 3.014 0 0 1 3.025-3.025zm24.086 9.94A2.3 2.3 0 0 0 63.438 34a2.3 2.3 0 0 0 2.294 2.295A2.298 2.298 0 0 0 68.025 34a2.298 2.298 0 0 0-2.293-2.295zm0 .576c.953 0 1.72.766 1.72 1.719 0 .953-.767 1.719-1.72 1.719A1.714 1.714 0 0 1 64.014 34c0-.953.765-1.719 1.718-1.719zm-49.234 6.545c-2.952 0-5.363 2.413-5.363 5.365a5.376 5.376 0 0 0 5.363 5.364 5.376 5.376 0 0 0 5.363-5.364c0-2.952-2.41-5.365-5.363-5.365zm0 1.744c2.01 0 3.621 1.611 3.621 3.621s-1.61 3.621-3.621 3.621a3.608 3.608 0 0 1-3.621-3.62 3.608 3.608 0 0 1 3.621-3.622zm33.84 6.348a4.318 4.318 0 0 0-4.307 4.309 4.318 4.318 0 0 0 4.307 4.308 4.32 4.32 0 0 0 4.308-4.308 4.32 4.32 0 0 0-4.308-4.309zm0 1.3' fill='hsla(210,16.7%,97.6%,1)' fill-rule='evenodd'/></pattern></defs><rect width='100%' height='100%' fill='url(%23a)'/></svg>");
    `;

        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(photosDiv);

        const photosPerRow = 7;
        const rows = Math.ceil(staffMembers.length / photosPerRow);

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
                const staffIndex = row * photosPerRow + col;
                if (staffIndex >= staffMembers.length) break;

                const member = staffMembers[staffIndex];
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

                if (member.coverUrl) {
                    photosLinePhoto.style.backgroundImage = `url(${member.coverUrl})`;
                    photosLinePhoto.style.backgroundSize = 'cover';
                    photosLinePhoto.style.backgroundPosition = 'center';
                }
                photosLinePhoto.style.backgroundColor = '#1a1a1a23';
                photosLinePhoto.style.borderBottom = member.isSpecial ? '8px solid #3B7FE9' : '8px solid #E93B66';
                photosLinePhoto.style.boxSizing = 'border-box';

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

                if (member.avatarUrl) {
                    const avatarImg = document.createElement("img");
                    avatarImg.src = member.avatarUrl;
                    avatarImg.alt = member.name;
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
                    avatarDiv.textContent = member.name.charAt(0).toUpperCase();
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
                nameDiv.textContent = member.name;

                const roleDiv = document.createElement("div");
                roleDiv.style.cssText = `
          font-size: 32px;
          color: rgba(255, 255, 255, 0.85);
          position: absolute;
          font-weight: bold;
          top: 24px;
          right: 10px;
        `;
                roleDiv.textContent = member.role.split(' ')[0];

                const descriptionDiv = document.createElement("p");
                descriptionDiv.style.cssText = `
          font-size: 14em;
          color: #787e95ff;
          text-align: right;
          right: 10px;
          top: -18px;
          position: absolute;
        `;
                descriptionDiv.textContent = member.description;

                playerContent.appendChild(descriptionDiv);
                playerContent.appendChild(avatarDiv);
                playerContent.appendChild(nameDiv);
                playerContent.appendChild(roleDiv);

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

                const copyButton = document.createElement("button");
                copyButton.className = "action-button copy-button";
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
                    navigator.clipboard.writeText(member.osuId).then(() => {
                        copyText.textContent = "已复制!";
                        copyButton.style.background = " #48bb783c";
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

                const profileButton = document.createElement("button");
                profileButton.className = "action-button profile-button";
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
                profileButton.textContent = `${member.name}的osu!主页`;

                profileButton.addEventListener("click", (e) => {
                    e.stopPropagation();
                    window.open(`https://osu.ppy.sh/users/${member.osuId}`, "_blank");
                });

                profileButton.addEventListener("mouseenter", () => {
                    profileButton.style.transform = "translateY(-2px)";
                    profileButton.style.boxShadow = "0 4px 12px rgba(255, 107, 107, 0.4)";
                });

                profileButton.addEventListener("mouseleave", () => {
                    profileButton.style.transform = "translateY(0)";
                    profileButton.style.boxShadow = "0 2px 8px rgba(255, 107, 107, 0.3)";
                });

                buttonsContainer.appendChild(copyButton);
                buttonsContainer.appendChild(profileButton);
                playerContent.appendChild(buttonsContainer);

                photosLinePhoto.appendChild(playerContent);

                photosLinePhoto.addEventListener("click", () => {
                    if (photoBoxRef.current?.has_moved) return;
                    if (onStaffClick) {
                        onStaffClick(member);
                    } else {
                        window.open(`https://osu.ppy.sh/users/${member.osuId}`, "_blank");
                    }
                });

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
            has_moved: false,
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
                    this.has_moved = false;
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

                this.container.addEventListener("touchstart", (event: TouchEvent) => {
                    if (event.touches.length === 1) {
                        this.if_movable = true;
                        this.has_moved = false;
                        this.last_touch_x = event.touches[0].clientX;
                        this.last_touch_y = event.touches[0].clientY;
                        this.mouse_x = event.touches[0].clientX;
                        this.mouse_y = event.touches[0].clientY;
                    }
                }, { passive: true });

                this.container.addEventListener("touchmove", (event: TouchEvent) => {
                    if (event.touches.length === 1 && this.if_movable) {
                        event.preventDefault();
                        const touchX = event.touches[0].clientX;
                        const touchY = event.touches[0].clientY;
                        this.move(touchX, touchY);
                        this.last_touch_x = touchX;
                        this.last_touch_y = touchY;
                    }
                }, { passive: false });

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
                        ani: null as any
                    });
                });
            },
            move(x: number, y: number) {
                if (!this.if_movable) return;
                const distance_x = (x - this.mouse_x) / this.scale_nums;
                const distance_y = (y - this.mouse_y) / this.scale_nums;

                if (Math.abs(distance_x) > 2 || Math.abs(distance_y) > 2) {
                    this.has_moved = true;
                }

                this.line_data.forEach((line) => {
                    line.mov_x += distance_x;
                    line.mov_y += distance_y;

                    if (line.ani) line.ani.kill();
                    line.ani = gsap.to(line.node, {
                        transform: `translate(${line.mov_x}px,${line.mov_y}px)`,
                        duration: 0.3,
                        ease: 'power1.out'
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
    }, [staffMembers, onStaffClick]);

    return (
        <div
            ref={containerRef}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: "hidden",
                boxShadow: "inset 0 0 100px rgba(0, 0, 0, 0.5)",
            }}
        />
    );
}
