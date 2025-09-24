"use client";
import { useState, useEffect, useCallback } from 'react';
import { showSuccess, showError, showInfo } from './Notification';

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

    const completedCount = items.filter(item => item.status === 'completed').length;
    const failedCount = items.filter(item => item.status === 'failed').length;
    const totalCount = items.length;

    useEffect(() => {
        if (totalCount > 0) {
            const progress = (completedCount / totalCount) * 100;
            setOverallProgress(progress);
        }
    }, [completedCount, totalCount]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">批量下载管理器</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
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
                </div>

                {/* 下载列表 */}
                <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                    {items.map((item, index) => (
                        <div key={item.sid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            取消下载
                        </button>
                        <button
                            onClick={() => onStartDownload(downloadSource)}
                            disabled={isDownloading || totalCount === 0}
                            className="px-4 py-2 bg-[#E93B66] text-white rounded-lg hover:bg-[#95E1D3] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDownloading ? '下载中...' : `开始下载 (${downloadSource === 'sayobot' ? 'Sayobot' : 'osu官方'})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}