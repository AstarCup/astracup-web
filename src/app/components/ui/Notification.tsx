"use client";
import { useState, useEffect } from "react";

export interface NotificationProps {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}

interface NotificationItemProps extends NotificationProps {
  onRemove: (id: string) => void;
}

const NotificationItem = ({
  id,
  type,
  message,
  duration = 5000,
  onRemove,
}: NotificationItemProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 设置定时器，在 duration - 400ms 时开始退出动画
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 400); // 提前 400ms 开始退出动画

    // 设置定时器，在 duration 时完全移除
    const removeTimer = setTimeout(() => {
      onRemove(id);
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [id, duration, onRemove]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg
            width="64"
            height="64"
            viewBox="0 0 127 134"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g transform="matrix(0.7732080221176147,-0.6341524720191956,0.6341524720191956,0.7732080221176147,-38.14878702824126,28.896186462911373)">
              <path
                d="M35.53194416552734,73.68402860048828L24.137657165527344,67.78363800048828L21.325157165527344,108.15644100048829L87.90547916552734,109.08979000048828L83.53194416552734,93.68402900048828L30.902305565527342,96.47846200048828L35.53194416552734,73.68402860048828Z"
                fill="#79C96B"
                fill-opacity="1"
              />
            </g>
            <g transform="matrix(0.7732080221176147,-0.6341524720191956,0.6341524720191956,0.7732080221176147,-36.37186281164759,29.458653222362045)">
              <path
                d="M36,65.58056640625L23,65.58056640625L23,98.58056640625L86.991699,107.40185540625001L84,85.58056640625L31.3703613,88.37500040625L36,65.58056640625Z"
                fill="#79C96B"
                fill-opacity="1"
              />
            </g>
          </svg>
        );
      case "error":
        return (
          <svg
            width="64"
            height="64"
            viewBox="0 0 127 134"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g transform="matrix(0.7071067690849304,-0.7071067690849304,0.7071067690849304,0.7071067690849304,-45.83634058161266,29.344884277863514)">
              <path
                d="M53.50423717498779,73.53134153710937L45.03402217498779,70.00180053710938L37.96029217498779,98.98739653710938L16.042811374987792,98.99349953710937L12.504237174987793,114.53134153710937L39.016932174987794,117.01815753710937L41.50423717498779,143.53134153710937L57.04281117498779,139.99349953710936L56.69832917498779,117.72543353710938L86.0340221749878,111.00180053710938L82.5042371749878,102.53134153710937L57.048426174987796,98.98666353710938L53.50423717498779,73.53134153710937Z"
                fill="#E93B66"
                fill-opacity="1"
              />
            </g>
            <g transform="matrix(0.7071067690849304,-0.7071067690849304,0.7071067690849304,0.7071067690849304,-43.3345821146213,30.376179551676614)">
              <path
                d="M56,67.49755859375L44,67.49755859375L40.456055,92.95361359374999L15,96.49755859375L15,108.49755859375L41.512695,110.98437459375L44,137.49755859375L56,137.49755859375L59.194092,111.69165059375L85,108.49755859375L85,96.49755859375L59.544189,92.95288059375L56,67.49755859375Z"
                fill="#E93B66"
                fill-opacity="1"
              />
            </g>
          </svg>
        );
      case "warning":
        return (
          <svg
            width="64"
            height="64"
            viewBox="0 0 127 134"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              <path
                d="M60,35L75.5,32.5L71.5,83L57.5,80L60,35ZM60,91.5L70.5,87L72.5,101L57.5,101L60,91.5Z"
                fill="#F8D211"
                fill-opacity="1"
              />
            </g>
            <g>
              <path
                d="M57.5,32L75.5,32L69,80L57.5,80L57.5,32ZM57.5,88.5L70.5,86.5L70.5,97L57.5,100.5L57.5,88.5Z"
                fill="#F8D211"
                fill-opacity="1"
              />
            </g>
          </svg>
        );
      case "info":
      default:
        return (
          <svg
            width="64"
            height="64"
            viewBox="0 0 127 134"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              <path
                d="M54,34L74,34L74,41.5L74,49L54,49L54,34ZM54,54L74,54L74,103L54,103L54,54Z"
                fill="#3BB8E9"
                fill-opacity="1"
              />
            </g>
            <g style={{ opacity: 0.10000000149011612 }}>
              <path
                d="M48,40L65.5,35.5L70.5,51.5L51.5,56.5L48,40ZM50,67.5L65.5,64.5L75.5,105.5L63.5,110.5L50,67.5Z"
                fill="#FFFFFF"
                fill-opacity="1"
              />
            </g>
            <g style={{ opacity: 0.20000000298023224 }}>
              <path
                d="M51,38L71,35L71,49.5L51,53L51,38ZM51,58L71,58L77.5,101.5L56.5,108L51,58Z"
                fill="#FFFFFF"
                fill-opacity="1"
              />
            </g>
          </svg>
        );
    }
  };

  const getStyles = () => {
    switch (type) {
      case "success":
        return "bg-[#3d3d3d] text-white border-green-200";
      case "error":
        return "bg-[#3d3d3d] text-white border-red-200";
      case "warning":
        return "bg-[#3d3d3d] text-white border-yellow-200";
      case "info":
      default:
        return "bg-[#3d3d3d] text-white border-blue-200";
    }
  };

  return (
    <div
      className={`
                ${getStyles()}
                flex flex-col items-center gap-2 px-6 py-4 border border-b-4 shadow-lg
                min-w-[200px] max-w-[300px]
                transform transition-all duration-500
                hover:scale-105 hover:shadow-xl
                ${isExiting ? "notification-slide-out" : "notification-slide-in"}
            `}
    >
      <span className="text-2xl font-bold icon-pulse">{getIcon()}</span>
      <span className="text-sm font-medium text-center leading-tight animate-fade-in">
        {message}
      </span>
    </div>
  );
};

export const NotificationContainer = () => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  };

  // 全局通知管理器
  useEffect(() => {
    const handleAddNotification = (event: CustomEvent<NotificationProps>) => {
      setNotifications((prev) => [...prev, event.detail]);
    };

    window.addEventListener(
      "add-notification",
      handleAddNotification as EventListener,
    );

    return () => {
      window.removeEventListener(
        "add-notification",
        handleAddNotification as EventListener,
      );
    };
  }, []);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-3 pointer-events-none"
      style={{ zIndex: 9999 }}
    >
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationItem {...notification} onRemove={removeNotification} />
        </div>
      ))}
    </div>
  );
};

// 全局通知函数
export const showNotification = (
  type: NotificationProps["type"],
  message: string,
  duration: number = 2000,
) => {
  const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const notification: NotificationProps = {
    id,
    type,
    message,
    duration,
  };

  // 触发自定义事件
  window.dispatchEvent(
    new CustomEvent("add-notification", { detail: notification }),
  );
};

// 便捷函数
export const showSuccess = (message: string, duration?: number) =>
  showNotification("success", message, duration);

export const showError = (message: string, duration?: number) =>
  showNotification("error", message, duration);

export const showInfo = (message: string, duration?: number) =>
  showNotification("info", message, duration);

export const showWarning = (message: string, duration?: number) =>
  showNotification("warning", message, duration);
