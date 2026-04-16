"use client";

import { useState, useEffect } from "react";
import { TimerState } from "../types/match";
import Image from "next/image";

interface TimerDisplayProps {
  timerState: TimerState;
  eventName?: string;
  mapPoolVisible?: boolean;
}

// 图片URL - 请在此处替换为您想要的图片URL
const TIMER_IMAGE_URL =
  "https://vip.123pan.cn/1818470319/yk6baz03t0l000d7w33fz4u2bsqp82upDIYPBdF0DdDPBGxPDwivDa==.jpg";

export default function TimerDisplay({
  timerState,
  eventName = "",
  mapPoolVisible = false,
}: TimerDisplayProps) {
  const { remainingTime, isRunning } = timerState;
  const [displayText, setDisplayText] = useState<number | string>("");
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // 处理计时结束逻辑
  useEffect(() => {
    if (remainingTime === 0 && !isRunning) {
      if (!isFirstLoad) {
        setDisplayText("");

        // 3秒后清空文本
        const timeout = setTimeout(() => {
          setDisplayText("");
        }, 3000);

        return () => clearTimeout(timeout);
      } else {
        setDisplayText("");
      }
    } else if (remainingTime > 0) {
      // 计时器重新开始或有剩余时间时，显示数字
      setDisplayText(remainingTime);
      // 一旦开始计时，就不再是第一次加载
      setIsFirstLoad(false);
    } else {
      // 其他情况（计时器运行中且时间为0），清空文本
      setDisplayText("");
    }
  }, [remainingTime, isRunning, isFirstLoad]);

  // 组件加载后标记第一次加载完成
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFirstLoad(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // 根据显示内容设置颜色
  const getDisplayColor = () => {
    if (displayText === "时间到") {
      return "#FF4444"; // 时间到显示红色
    }
    if (typeof displayText === "number") {
      if (displayText <= 10) return "#FF4444"; // 红色，最后10秒
      if (displayText <= 30) return "#FFAA00"; // 橙色，最后30秒
    }
    return "#FFFFFF"; // 白色，正常时间
  };

  // 检查是否应该显示图片：剩余时间小于等于30秒且大于0秒
  const shouldShowImage = remainingTime <= 30 && remainingTime > 0;

  return (
    <div
      style={{
        position: "absolute",
        bottom: mapPoolVisible ? "40px" : "80px", // 图池显示时距离底部40px，隐藏时80px
        right: mapPoolVisible ? "40px" : "auto", // 图池显示时在右下角
        left: mapPoolVisible ? "auto" : "50%", // 图池显示时取消居中
        transform: mapPoolVisible ? "none" : "translateX(-50%)", // 图池显示时取消居中变换
        textAlign: "center",
        zIndex: 1000,
        pointerEvents: "none", // 确保不会干扰其他交互
      }}
    >
      {/* 事件名称显示 */}
      {eventName && (
        <div
          style={{
            fontSize: "40px",
            fontWeight: "bold",
            color: "#FFFFFF",
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
            marginBottom: "0px",
          }}
        >
          {eventName}
        </div>
      )}

      {/* 计时器显示 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
        }}
      >
        <div
          style={{
            fontSize: "120px",
            fontWeight: "bold",
            color: getDisplayColor(),
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
            // fontFamily: 'Audiowide, monospace',
            minHeight: "70px", // 确保高度一致
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {displayText}
        </div>

        {/* 图片显示 - 只在30秒以下显示 */}
        {/* {shouldShowImage && TIMER_IMAGE_URL && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Image
                            src={TIMER_IMAGE_URL}
                            alt="时间差不多喽"
                            width={400}
                            height={400}
                            style={{
                                borderRadius: '8px',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                                objectFit: 'cover'
                            }}
                            unoptimized={TIMER_IMAGE_URL.startsWith('http')}
                        />
                    </div>
                )} */}

        {/* 暂停标志 */}
        {!isRunning && remainingTime > 0 && (
          <div
            style={{
              fontSize: "60px",
              fontWeight: "bold",
              color: "#FFAA00",
              textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
              // fontFamily: 'Audiowide, monospace',
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            II
          </div>
        )}
      </div>

      {/* 使用CSS @font-face加载本地字体 */}
      {/* <style jsx>{`
                @font-face {
                    font-family: 'Audiowide';
                    src: url('/font/Audiowide-Regular.ttf') format('truetype');
                    font-weight: normal;
                    font-style: normal;
                    font-display: swap;
                }
            `}</style> */}
    </div>
  );
}
