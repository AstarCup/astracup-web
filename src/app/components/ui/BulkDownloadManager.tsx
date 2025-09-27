"use client";
import { useState, useEffect } from 'react';

interface DownloadItem {
    sid: string;
    bid: string;
    artist: string;
    title: string;
    status: 'pending' | 'downloading' | 'completed' | 'failed';
    progress: number;
    error?: string;
}

interface BulkDownloadManagerProps {
    isOpen: boolean;
    onClose: () => void;
    items: DownloadItem[];
    onStartDownload: (source: 'sayobot' | 'osu') => void;
    onCancelDownload: () => void;
    isDownloading?: boolean;
}

export default function BulkDownloadManager({
    isOpen,
    onClose,
    items,
    onStartDownload,
    onCancelDownload,
    isDownloading = false
}: BulkDownloadManagerProps) {
    const [overallProgress, setOverallProgress] = useState(0);
    const [downloadSource, setDownloadSource] = useState<'sayobot' | 'osu'>('sayobot');
    const [isMinimized, setIsMinimized] = useState(false);
    const [downloadSpeed, setDownloadSpeed] = useState(0);
    const [eta, setEta] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [lastProgressUpdate, setLastProgressUpdate] = useState<number>(0);

    const completedCount = items.filter(item => item.status === 'completed').length;
    const failedCount = items.filter(item => item.status === 'failed').length;
    const downloadingCount = items.filter(item => item.status === 'downloading').length;
    const totalCount = items.length;

    useEffect(() => {
        if (!isDownloading) {
            // 下载停止时重置速度和ETA
            setDownloadSpeed(0);
            setEta(null);
            setStartTime(null);
            setLastProgressUpdate(0);
        }
    }, [isDownloading]);

    const formatSpeed = (speed: number) => {
        if (speed < 1) {
            return `${(speed * 60).toFixed(1)}%/min`;
        } else {
            return `${speed.toFixed(1)}%/s`;
        }
    };

    const formatEta = (etaSeconds: number) => {
        if (etaSeconds < 60) {
            return `${Math.round(etaSeconds)}s`;
        } else if (etaSeconds < 3600) {
            return `${Math.round(etaSeconds / 60)}m`;
        } else {
            return `${Math.round(etaSeconds / 3600)}h`;
        }
    };

    if (!isOpen) return null;

    // 最小化视图
    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 min-w-80 max-w-xs">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800 truncate">批量下载进行中</span>
                    <div className="flex space-x-1 flex-shrink-0">
                        <button
                            onClick={() => setIsMinimized(false)}
                            className="text-gray-500 hover:text-gray-700 text-lg leading-none"
                            title="恢复"
                        >
                            ⬜
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-lg leading-none ml-1"
                            title="关闭"
                        >
                            ×
                        </button>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-gray-600">
                        <span>进度: {completedCount}/{totalCount}</span>
                        <span>{Math.round(overallProgress)}%</span>
                        {failedCount > 0 && (
                            <span className="text-red-600">失败: {failedCount}</span>
                        )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${overallProgress === 100 ? 'bg-green-500' : 'bg-[#E93B66]'
                                }`}
                            style={{ width: `${overallProgress}%` }}
                        ></div>
                    </div>
                    {isDownloading && downloadSpeed > 0 && (
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>速度: {formatSpeed(downloadSpeed)}</span>
                            {eta && <span>剩余: {formatEta(eta)}</span>}
                        </div>
                    )}
                    {overallProgress === 100 ? (
                        <div className="text-center">
                            <span className="text-xs text-green-600 font-medium">下载完成</span>
                        </div>
                    ) : isDownloading ? (
                        <div className="flex justify-between items-center">
                            <button
                                onClick={onCancelDownload}
                                className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                取消下载
                            </button>
                            <span className="text-xs text-gray-500">
                                {downloadSource === 'sayobot' ? 'Sayobot' : 'osu官方'}
                            </span>
                        </div>
                    ) : (
                        <div className="text-center">
                            <span className="text-xs text-gray-500">等待开始</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 完整视图
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white  p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">批量下载管理器</h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="text-gray-500 hover:text-gray-700 text-lg"
                            title="最小化"
                        >
                            ⬜
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* 总体进度 */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">
                            总体进度: {completedCount}/{totalCount} ({Math.round(overallProgress)}%)
                        </span>
                        {failedCount > 0 && (
                            <span className="text-sm text-red-600">
                                失败: {failedCount}
                            </span>
                        )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-[#E93B66] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${overallProgress}%` }}
                        ></div>
                    </div>
                    {isDownloading && downloadSpeed > 0 && (
                        <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                            <span>下载速度: {formatSpeed(downloadSpeed)}</span>
                            {eta && <span>预计剩余时间: {formatEta(eta)}</span>}
                        </div>
                    )}
                </div>

                {/* 下载列表 */}
                <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                    {items.map((item, index) => (
                        <div key={item.sid} className="flex items-center justify-between p-3 bg-gray-50 ">
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
                                    {item.status === 'pending' && '等待中'}
                                    {item.status === 'downloading' && '下载中'}
                                    {item.status === 'completed' && '完成'}
                                    {item.status === 'failed' && '失败'}
                                </div>
                                <div className="w-16 bg-gray-200 rounded-full h-1">
                                    <div
                                        className={`h-1 rounded-full transition-all duration-300 ${item.status === 'completed' ? 'bg-green-500' :
                                            item.status === 'failed' ? 'bg-red-500' :
                                                'bg-[#E93B66]'
                                            }`}
                                        style={{ width: `${item.progress}%` }}
                                    ></div>
                                </div>
                                {item.error && (
                                    <div className="text-xs text-red-500 max-w-32 truncate" title={item.error}>
                                        {item.error}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-between items-center">
                    {/* 下载源选择器 */}
                    <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">下载源:</label>
                        <select
                            value={downloadSource}
                            onChange={(e) => setDownloadSource(e.target.value as 'sayobot' | 'osu')}
                            className="px-2 py-1 bg-gray-100 text-gray-800 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={isDownloading}
                        >
                            <option value="sayobot">Sayobot</option>
                            <option value="osu">osu官方</option>
                        </select>
                    </div>
                    {/* 按钮区域 */}
                    <div className="flex space-x-3">
                        <button
                            onClick={onCancelDownload}
                            disabled={!isDownloading}
                            className="px-4 py-2 text-gray-600 border border-gray-300  hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            取消下载
                        </button>
                        <button
                            onClick={() => onStartDownload(downloadSource)}
                            disabled={isDownloading || totalCount === 0}
                            className="px-4 py-2 bg-[#E93B66] text-white  hover:bg-[#95E1D3] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDownloading ? '下载中...' : `开始下载 (${downloadSource === 'sayobot' ? 'Sayobot' : 'osu官方'})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}