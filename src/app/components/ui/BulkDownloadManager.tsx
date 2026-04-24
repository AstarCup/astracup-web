"use client";
import { useState, useEffect } from "react";
import { X, Minus, Expand } from "lucide-react";

interface DownloadItem {
  sid: string;
  bid: string;
  artist: string;
  title: string;
  status: "pending" | "downloading" | "completed" | "failed";
  progress: number;
  error?: string;
}

interface BulkDownloadManagerProps {
  isOpen: boolean;
  onClose: () => void;
  items: DownloadItem[];
  onStartDownload: (source: "nerinyan" | "sayobot" | "osu") => void;
  onCancelDownload: () => void;
  isDownloading?: boolean;
  overallProgress?: number;
}

export default function BulkDownloadManager({
  isOpen,
  onClose,
  items,
  onStartDownload,
  onCancelDownload,
  isDownloading = false,
  overallProgress = 0,
}: BulkDownloadManagerProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const completedCount = items.filter(
    (item) => item.status === "completed",
  ).length;
  const failedCount = items.filter((item) => item.status === "failed").length;
  const totalCount = items.length;
  const allDone = overallProgress === 100;

  useEffect(() => {
    if (allDone && !isDownloading) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [allDone, isDownloading, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isDownloading) {
      onCancelDownload();
    }
    onClose();
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 min-w-72">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-800">
            批量下载
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(false)}
              className="text-gray-500 hover:text-gray-700"
              title="展开"
            >
              <Expand size={18} />
            </button>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
              title="关闭"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>
              {completedCount}/{totalCount}
              {failedCount > 0 && ` (失败 ${failedCount})`}
            </span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                allDone ? "bg-green-500" : "bg-[#E93B66]"
              }`}
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">批量下载管理器</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleMinimize}
              className="text-gray-500 hover:text-gray-700"
              title="最小化"
            >
              <Minus size={22} />
            </button>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
              title="关闭"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              进度: {completedCount}/{totalCount}
            </span>
            {failedCount > 0 && (
              <span className="text-sm text-red-600">失败: {failedCount}</span>
            )}
            <span className="text-sm text-gray-600">
              {Math.round(overallProgress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                allDone ? "bg-green-500" : "bg-[#E93B66]"
              }`}
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.sid}
              className="flex items-center justify-between p-3 bg-gray-50"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {item.artist} - {item.title}
                </div>
                <div className="text-xs text-gray-500">
                  SID: {item.sid} | BID: {item.bid}
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <div className="text-xs text-gray-500 min-w-[60px] text-right">
                  {item.status === "pending" && "等待中"}
                  {item.status === "downloading" && "下载中"}
                  {item.status === "completed" && "完成"}
                  {item.status === "failed" && "失败"}
                </div>
                <div className="w-16 bg-gray-200 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      item.status === "completed"
                        ? "bg-green-500"
                        : item.status === "failed"
                          ? "bg-red-500"
                          : "bg-[#E93B66]"
                    }`}
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
                {item.error && (
                  <div
                    className="text-xs text-red-500 max-w-32 truncate"
                    title={item.error}
                  >
                    {item.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {isDownloading && (
              <span className="text-xs text-gray-500">
                下载源: Sayobot
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            {isDownloading && (
              <button
                onClick={onCancelDownload}
                className="px-4 py-2 text-gray-600 border border-gray-300 hover:bg-gray-50"
              >
                取消下载
              </button>
            )}
            {!isDownloading && !allDone && (
              <button
                onClick={() => onStartDownload("sayobot")}
                disabled={totalCount === 0}
                className="px-4 py-2 bg-[#E93B66] text-white hover:bg-[#95E1D3] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                开始下载
              </button>
            )}
            {allDone && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700"
              >
                完成
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
