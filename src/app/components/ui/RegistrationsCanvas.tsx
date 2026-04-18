"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TournamentRegistration } from "@/lib/prisma-registrations";
import Image from "next/image";

interface RegistrationsCanvasProps {
    registrations: TournamentRegistration[];
    onPlayerClick: (player: TournamentRegistration) => void;
}

interface CanvasPosition {
    x: number;
    y: number;
}

interface PlayerPosition {
    x: number;
    y: number;
    radius: number;
    player: TournamentRegistration;
}

export default function RegistrationsCanvas({
    registrations,
    onPlayerClick,
}: RegistrationsCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [position, setPosition] = useState<CanvasPosition>({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [playerPositions, setPlayerPositions] = useState<PlayerPosition[]>([]);
    const [hoveredPlayer, setHoveredPlayer] =
        useState<TournamentRegistration | null>(null);
    const [hoverPosition, setHoverPosition] = useState<CanvasPosition>({
        x: 0,
        y: 0,
    });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<CanvasPosition>({ x: 0, y: 0 });
    const [velocity, setVelocity] = useState<CanvasPosition>({ x: 0, y: 0 });
    const [lastDragTime, setLastDragTime] = useState<number>(0);
    const [lastDragPosition, setLastDragPosition] = useState<CanvasPosition>({
        x: 0,
        y: 0,
    });

    // 初始化画布尺寸
    useEffect(() => {
        const updateCanvasSize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setCanvasSize({ width, height: height - 100 }); // 留出一些空间给控制栏
            }
        };

        updateCanvasSize();
        window.addEventListener("resize", updateCanvasSize);
        return () => window.removeEventListener("resize", updateCanvasSize);
    }, []);

    // 计算无限画布布局（自由排列，类似作品画廊）
    useEffect(() => {
        if (registrations.length === 0 || canvasSize.width === 0) return;

        const positions: PlayerPosition[] = [];
        const playerRadius = 50;
        const spacingX = playerRadius * 3;
        const spacingY = playerRadius * 2.5;

        // 计算网格布局
        const itemsPerRow = Math.max(3, Math.floor(canvasSize.width / spacingX));
        const startX = canvasSize.width / 2 - ((itemsPerRow - 1) * spacingX) / 2;
        const startY = canvasSize.height / 2;

        for (let i = 0; i < registrations.length; i++) {
            const row = Math.floor(i / itemsPerRow);
            const col = i % itemsPerRow;

            // 交错排列，奇数行向右偏移
            const offsetX = row % 2 === 0 ? 0 : spacingX / 2;

            const x = startX + col * spacingX + offsetX;
            const y = startY + row * spacingY;

            positions.push({
                x,
                y,
                radius: playerRadius,
                player: registrations[i],
            });
        }

        setPlayerPositions(positions);
    }, [registrations, canvasSize]);

    // 绘制画布
    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 获取设备像素比
        const dpr = window.devicePixelRatio || 1;

        // 设置画布实际尺寸
        const actualWidth = canvasSize.width * dpr;
        const actualHeight = canvasSize.height * dpr;

        // 设置画布显示尺寸
        canvas.style.width = `${canvasSize.width}px`;
        canvas.style.height = `${canvasSize.height}px`;
        canvas.width = actualWidth;
        canvas.height = actualHeight;

        // 缩放上下文以匹配像素比
        ctx.scale(dpr, dpr);

        // 清除画布
        ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

        // 保存当前状态
        ctx.save();

        // 应用变换（平移和缩放）
        ctx.translate(position.x, position.y);
        ctx.scale(scale, scale);

        // 绘制画布背景（无限画布模式）
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(-position.x, -position.y, canvasSize.width * 2, canvasSize.height * 2);

        // 绘制网格背景（浅色）
        const gridSize = 50;
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 0.5;

        // 水平线
        for (let y = -position.y; y < canvasSize.height * 2; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(-position.x, y);
            ctx.lineTo(-position.x + canvasSize.width * 2, y);
            ctx.stroke();
        }

        // 垂直线
        for (let x = -position.x; x < canvasSize.width * 2; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, -position.y);
            ctx.lineTo(x, -position.y + canvasSize.height * 2);
            ctx.stroke();
        }

        // 绘制玩家头像
        playerPositions.forEach((playerPos) => {
            const x = playerPos.x;
            const y = playerPos.y;
            const radius = playerPos.radius;

            // 绘制头像背景（圆形）
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);

            // 根据审核状态设置颜色
            if (playerPos.player.registrationStatus === 'approved') {
                ctx.fillStyle = "rgba(34, 197, 94, 0.2)"; // 绿色 - 已审核
                ctx.strokeStyle = "#22c55e";
            } else {
                ctx.fillStyle = "rgba(107, 114, 128, 0.2)"; // 灰色 - 未审核
                ctx.strokeStyle = "#6b7280";
            }

            ctx.fill();
            ctx.lineWidth = 2;
            ctx.stroke();

            // 绘制玩家PP值
            ctx.fillStyle = "#1f2937";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`${Math.round(playerPos.player.pp)}pp`, x, y + radius + 20);

            // 绘制玩家排名（如果有）
            if (playerPos.player.global_rank) {
                ctx.fillStyle = "#6b7280";
                ctx.font = "10px sans-serif";
                ctx.fillText(
                    `#${playerPos.player.global_rank.toLocaleString()}`,
                    x,
                    y + radius + 35,
                );
            }
        });

        // 恢复状态
        ctx.restore();

        // 绘制悬停提示
        if (hoveredPlayer && hoverPosition) {
            const tooltipX = hoverPosition.x + 10;
            const tooltipY = hoverPosition.y + 10;

            // 绘制工具提示背景
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.beginPath();
            ctx.roundRect(tooltipX, tooltipY, 200, 100, 8);
            ctx.fill();

            // 绘制工具提示文本
            ctx.fillStyle = "white";
            ctx.font = "bold 14px sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText(hoveredPlayer.username, tooltipX + 10, tooltipY + 10);

            ctx.font = "12px sans-serif";
            ctx.fillText(
                `PP: ${Math.round(hoveredPlayer.pp)}`,
                tooltipX + 10,
                tooltipY + 35,
            );

            if (hoveredPlayer.global_rank) {
                ctx.fillText(
                    `全球排名: #${hoveredPlayer.global_rank.toLocaleString()}`,
                    tooltipX + 10,
                    tooltipY + 55,
                );
            }

            ctx.fillText(
                `国家: ${hoveredPlayer.country}`,
                tooltipX + 10,
                tooltipY + 75,
            );
        }
    }, [
        canvasSize,
        position,
        scale,
        playerPositions,
        hoveredPlayer,
        hoverPosition,
    ]);

    // 重绘画布
    useEffect(() => {
        drawCanvas();
    }, [drawCanvas]);

    // 处理鼠标事件
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        // 获取设备像素比
        const dpr = window.devicePixelRatio || 1;

        // 将鼠标坐标转换为画布逻辑坐标（考虑设备像素比）
        const canvasX = (e.clientX - rect.left) / dpr;
        const canvasY = (e.clientY - rect.top) / dpr;

        // 检查是否点击了玩家头像
        const clickedPlayer = playerPositions.find((pos) => {
            // 考虑画布平移和缩放
            const playerX = (pos.x + position.x) * scale;
            const playerY = (pos.y + position.y) * scale;
            const distance = Math.sqrt(
                (canvasX - playerX) ** 2 + (canvasY - playerY) ** 2,
            );
            return distance <= pos.radius * scale;
        });

        if (clickedPlayer) {
            // 左键点击查看详情
            onPlayerClick(clickedPlayer.player);
            return;
        }

        // 开始拖拽画布
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        setVelocity({ x: 0, y: 0 });
        setLastDragTime(Date.now());
        setLastDragPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        // 获取设备像素比
        const dpr = window.devicePixelRatio || 1;

        // 将鼠标坐标转换为画布逻辑坐标（考虑设备像素比）
        const canvasX = (e.clientX - rect.left) / dpr;
        const canvasY = (e.clientY - rect.top) / dpr;

        // 检查悬停
        const hovered = playerPositions.find((pos) => {
            // 考虑画布平移和缩放
            const playerX = (pos.x + position.x) * scale;
            const playerY = (pos.y + position.y) * scale;
            const distance = Math.sqrt(
                (canvasX - playerX) ** 2 + (canvasY - playerY) ** 2,
            );
            return distance <= pos.radius * scale;
        });

        if (hovered) {
            setHoveredPlayer(hovered.player);
            setHoverPosition({ x: e.clientX, y: e.clientY });
        } else {
            setHoveredPlayer(null);
        }

        // 处理拖拽画布
        if (isDragging) {
            const now = Date.now();
            const deltaTime = now - lastDragTime;

            if (deltaTime > 0) {
                // 计算速度（使用平滑处理）
                const smoothingFactor = 0.7; // 平滑因子
                const newVelocity = {
                    x: velocity.x * smoothingFactor + (1 - smoothingFactor) * (e.clientX - lastDragPosition.x) / deltaTime,
                    y: velocity.y * smoothingFactor + (1 - smoothingFactor) * (e.clientY - lastDragPosition.y) / deltaTime,
                };
                setVelocity(newVelocity);
            }

            setLastDragTime(now);
            setLastDragPosition({ x: e.clientX, y: e.clientY });

            // 更新位置
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);

        // 开始惯性滚动
        if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
            startInertialScroll();
        } else {
            // 检查是否需要弹性回弹
            checkAndApplyElasticBounce();
        }
    };

    const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
    };

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.5, Math.min(3, scale * delta));
        setScale(newScale);
    };

    // 惯性滚动（无限画布优化版）
    const startInertialScroll = useCallback(() => {
        let lastTime = Date.now();
        let animationId: number;
        let currentVelocity = { ...velocity };

        const animate = () => {
            const now = Date.now();
            const deltaTime = Math.min(now - lastTime, 32); // 限制最大deltaTime为32ms
            lastTime = now;

            // 应用摩擦力（速度越快，摩擦力越小）
            const speed = Math.sqrt(currentVelocity.x * currentVelocity.x + currentVelocity.y * currentVelocity.y);
            const friction = Math.max(0.85, 0.98 - speed * 0.001); // 动态摩擦力

            let newVelocity = {
                x: currentVelocity.x * friction,
                y: currentVelocity.y * friction,
            };

            // 更新位置
            setPosition((prev) => ({
                x: prev.x + newVelocity.x * deltaTime,
                y: prev.y + newVelocity.y * deltaTime,
            }));

            // 更新速度
            currentVelocity = newVelocity;
            setVelocity(newVelocity);

            // 检查是否需要弹性回弹
            checkAndApplyElasticBounce();

            // 继续动画或停止
            if (Math.abs(newVelocity.x) > 0.05 || Math.abs(newVelocity.y) > 0.05) {
                animationId = requestAnimationFrame(animate);
            } else {
                // 最终检查弹性回弹
                checkAndApplyElasticBounce();
                setVelocity({ x: 0, y: 0 });
            }
        };

        animationId = requestAnimationFrame(animate);

        // 清理函数
        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [velocity]);

    // 检查并应用弹性回弹（无限画布模式）
    const checkAndApplyElasticBounce = useCallback(() => {
        // 无限画布模式：只在画布边缘有弹性回弹，而不是基于玩家位置
        const edgeMargin = 100; // 边缘弹性回弹的边距
        const bounceStrength = 0.3; // 弹性回弹强度

        let needsBounce = false;
        let targetX = position.x;
        let targetY = position.y;

        // 计算画布中心
        const centerX = canvasSize.width / 2;
        const centerY = canvasSize.height / 2;

        // 计算可见区域相对于画布中心的位置
        const visibleCenterX = -position.x + canvasSize.width / 2;
        const visibleCenterY = -position.y + canvasSize.height / 2;

        // 检查是否需要弹性回弹（基于画布边缘）
        // 如果可见区域中心离画布中心太远，则弹回
        const maxDistanceFromCenter = Math.max(canvasSize.width, canvasSize.height) * 2;
        const distanceFromCenter = Math.sqrt(
            Math.pow(visibleCenterX - centerX, 2) +
            Math.pow(visibleCenterY - centerY, 2)
        );

        if (distanceFromCenter > maxDistanceFromCenter) {
            needsBounce = true;

            // 计算弹回方向（朝向画布中心）
            const directionX = centerX - visibleCenterX;
            const directionY = centerY - visibleCenterY;
            const directionLength = Math.sqrt(directionX * directionX + directionY * directionY);

            // 归一化方向向量
            const normalizedX = directionX / directionLength;
            const normalizedY = directionY / directionLength;

            // 计算弹回目标位置
            const bounceDistance = Math.min(distanceFromCenter - maxDistanceFromCenter, maxDistanceFromCenter * 0.5);
            targetX = position.x + normalizedX * bounceDistance * bounceStrength;
            targetY = position.y + normalizedY * bounceDistance * bounceStrength;
        }

        if (needsBounce) {
            // 使用弹性动画弹回
            const startX = position.x;
            const startY = position.y;
            const startTime = Date.now();
            const duration = 300; // 300ms

            const animateBounce = () => {
                const now = Date.now();
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // 使用缓动函数
                const easeOut = 1 - Math.pow(1 - progress, 3);

                setPosition({
                    x: startX + (targetX - startX) * easeOut,
                    y: startY + (targetY - startY) * easeOut,
                });

                if (progress < 1) {
                    requestAnimationFrame(animateBounce);
                }
            };

            requestAnimationFrame(animateBounce);
        }
    }, [position, canvasSize]);

    const handleResetView = () => {
        // 重置视图到初始状态（无限画布模式）
        setPosition({ x: 0, y: 0 });
        setScale(1);
        setVelocity({ x: 0, y: 0 });

        // 重新计算玩家位置
        if (registrations.length === 0 || canvasSize.width === 0) return;

        const positions: PlayerPosition[] = [];
        const playerRadius = 50;
        const spacingX = playerRadius * 3;
        const spacingY = playerRadius * 2.5;

        // 计算网格布局
        const itemsPerRow = Math.max(3, Math.floor(canvasSize.width / spacingX));
        const startX = canvasSize.width / 2 - ((itemsPerRow - 1) * spacingX) / 2;
        const startY = canvasSize.height / 2;

        for (let i = 0; i < registrations.length; i++) {
            const row = Math.floor(i / itemsPerRow);
            const col = i % itemsPerRow;

            // 交错排列，奇数行向右偏移
            const offsetX = row % 2 === 0 ? 0 : spacingX / 2;

            const x = startX + col * spacingX + offsetX;
            const y = startY + row * spacingY;

            positions.push({
                x,
                y,
                radius: playerRadius,
                player: registrations[i],
            });
        }

        setPlayerPositions(positions);
    };

    return (
        <div className="flex flex-col h-full">
            {/* 控制栏 */}
            <div className="mb-4 flex justify-between items-center bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600">
                    共 {registrations.length} 名玩家 | 拖拽无限画布 | 滚轮缩放 |
                    点击头像查看详情 | 边缘弹性回弹
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleResetView}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        重置视图
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            -
                        </button>
                        <span className="text-sm">缩放: {(scale * 100).toFixed(0)}%</span>
                        <button
                            onClick={() => setScale(Math.min(3, scale + 0.1))}
                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>

            {/* 画布容器 */}
            <div
                ref={containerRef}
                className="flex-1 bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
            >
                <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onContextMenu={handleContextMenu}
                    onWheel={handleWheel}
                    className="cursor-default"
                />
            </div>

            {/* 图例 */}
            <div className="mt-4 flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-500/20"></div>
                    <span>已审核通过</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-500 bg-gray-500/20"></div>
                    <span>待审核</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-500/20"></div>
                    <span>无限画布网格</span>
                </div>
            </div>
        </div>
    );
}
