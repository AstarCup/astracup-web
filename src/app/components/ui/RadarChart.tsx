"use client";

import { useEffect, useRef } from "react";

interface RadarChartProps {
    accuracy: number;
    stamina: number;
    firstSight: number;
    strategy: number;
    experience: number;
    customData?: {
        key: string;
        value: number;
    };
    width?: number;
    height?: number;
}

export default function RadarChart({
    accuracy = 0,
    stamina = 0,
    firstSight = 0,
    strategy = 0,
    experience = 0,
    customData,
    width = 300,
    height = 300,
}: RadarChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 获取设备像素比
        const dpr = window.devicePixelRatio || 1;

        // 设置画布实际尺寸
        const actualWidth = width * dpr;
        const actualHeight = height * dpr;

        // 设置画布显示尺寸
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.width = actualWidth;
        canvas.height = actualHeight;

        // 缩放上下文以匹配像素比
        ctx.scale(dpr, dpr);

        // 清除画布
        ctx.clearRect(0, 0, width, height);

        // 中心点（使用显示尺寸）
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.4;

        const baseSkills = [
            { label: "准度", key: "accuracy", value: accuracy },
            { label: "体力", key: "stamina", value: stamina },
            { label: "初见力", key: "firstSight", value: firstSight },
            { label: "策略", key: "strategy", value: strategy },
            { label: "经验", key: "experience", value: experience },
        ];

        const skills = [...baseSkills];
        if (customData && customData.key && customData.value !== undefined) {
            skills.push({ label: customData.key, key: "custom", value: customData.value });
        }

        // 绘制网格
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 1;
        ctx.fillStyle = "#f9fafb";

        // 绘制6个同心多边形（包含超过10的范围）
        for (let level = 1; level <= 6; level++) {
            ctx.beginPath();
            const levelRadius = (radius * level) / 6;

            for (let i = 0; i < skills.length; i++) {
                const angle = (Math.PI * 2 * i) / skills.length - Math.PI / 2;
                const x = centerX + Math.cos(angle) * levelRadius;
                const y = centerY + Math.sin(angle) * levelRadius;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.stroke();
        }

        // 绘制轴线
        ctx.strokeStyle = "#d1d5db";
        ctx.lineWidth = 1;

        for (let i = 0; i < skills.length; i++) {
            const angle = (Math.PI * 2 * i) / skills.length - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.stroke();

            // 绘制技能标签
            const labelX = centerX + Math.cos(angle) * (radius + 20);
            const labelY = centerY + Math.sin(angle) * (radius + 20);

            ctx.fillStyle = "#374151";
            ctx.font = "bold 11px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(skills[i].label, labelX, labelY);
        }

        // 绘制数据点
        const points = skills.map((skill, i) => {
            const value = skill.value || 0;
            // 计算最大值用于归一化
            const maxValue = 10; // 基准最大值
            const normalizedValue = Math.max(value, 0) / maxValue; // 归一化，允许大于10
            const angle = (Math.PI * 2 * i) / skills.length - Math.PI / 2;
            const pointRadius = radius * Math.min(normalizedValue, 1.5); // 限制最大半径为1.5倍，避免过大
            return {
                x: centerX + Math.cos(angle) * pointRadius,
                y: centerY + Math.sin(angle) * pointRadius,
                value: value,
            };
        });

        // 绘制数据区域
        ctx.fillStyle = "rgba(246, 212, 59, 0.3)";
        ctx.strokeStyle = "#f6c43bff";
        ctx.lineWidth = 2;

        ctx.beginPath();
        points.forEach((point, i) => {
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 绘制数据点
        ctx.fillStyle = "#f6c43bff";
        points.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // 绘制数值标签
        ctx.fillStyle = "#1f2937";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        points.forEach((point, i) => {
            const angle = (Math.PI * 2 * i) / skills.length - Math.PI / 2;
            const labelRadius = radius * 0.9;
            const labelX = centerX + Math.cos(angle) * labelRadius;
            const labelY = centerY + Math.sin(angle) * labelRadius;
            ctx.fillText(point.value.toFixed(1), labelX, labelY);
        });
    }, [accuracy, stamina, firstSight, strategy, experience, customData, width, height]);

    return (
        <div className="flex flex-col items-center">
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="rounded-lg"
            />
        </div>
    );
}
