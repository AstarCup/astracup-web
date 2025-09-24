"use client";
import Image from "next/image";
import { useState } from "react";
import { showSuccess, showError, showInfo } from '../components/Notification';
import ContextMenu from './ContextMenu';
import BulkDownloadManager from './BulkDownloadManager';
import JSZip from 'jszip';

interface DownloadItem {
    sid: string;
    bid: string;
    artist: string;
    title: string;
    status: 'pending' | 'downloading' | 'completed' | 'failed';
    progress: number;
    error?: string;
}

interface MapoolTableProps {
    data: any[];
    title: string;
    downloadUrl?: string;
    onRowClick?: (row: any, index: number) => void;
    onRowRightClick?: (row: any, index: number) => void;
    showUploadJump?: boolean; // 是否显示跳转到上传区域的选项
}

export default function MapoolTable({ data, title, downloadUrl, onRowRightClick, showUploadJump = false }: MapoolTableProps) {
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        position: { x: number; y: number };
        row: any;
        index: number;
    } | null>(null);

    // 批量下载状态
    const [bulkDownloadItems, setBulkDownloadItems] = useState<DownloadItem[]>([]);
    const [showBulkDownloadManager, setShowBulkDownloadManager] = useState(false);
    const [isBulkDownloading, setIsBulkDownloading] = useState(false);

    // 准备批量下载
    const prepareBulkDownload = () => {
        const items: DownloadItem[] = data.map(row => ({
            sid: row.SID,
            bid: row.BID,
            artist: row.artist || 'Unknown Artist',
            title: row.title || row.MapInfo || 'Unknown Title',
            status: 'pending',
            progress: 0
        }));

        setBulkDownloadItems(items);
        setShowBulkDownloadManager(true);
    };

    // 开始批量下载
    const startBulkDownload = async () => {
        if (bulkDownloadItems.length === 0) return;

        setIsBulkDownloading(true);
        const zip = new JSZip();
        let successCount = 0;
        let failCount = 0;

        try {
            // 逐个下载谱面，添加延迟避免并发过多
            for (let i = 0; i < bulkDownloadItems.length; i++) {
                const item = bulkDownloadItems[i];

                try {
                    // 更新当前项目状态为下载中
                    setBulkDownloadItems(prev => prev.map((prevItem, idx) =>
                        idx === i ? { ...prevItem, status: 'downloading', progress: 10 } : prevItem
                    ));

                    console.log(`Downloading beatmap ${i + 1}/${bulkDownloadItems.length}:`, item.sid, item.bid);

                    const response = await fetch(`/api/download-beatmap?sid=${item.sid}`, {
                        method: 'GET',
                        headers: {
                            'Cache-Control': 'no-cache',
                        },
                    });

                    if (!response.ok) {
                        // 尝试读取错误信息
                        let errorText = '';
                        try {
                            const errorData = await response.json();
                            errorText = errorData.error || `HTTP ${response.status}`;
                        } catch {
                            errorText = `HTTP ${response.status}: ${response.statusText}`;
                        }
                        throw new Error(errorText);
                    }

                    const blob = await response.blob();
                    console.log(`Downloaded ${item.sid}, size: ${blob.size} bytes`);

                    // 检查文件大小，如果太小可能是错误
                    if (blob.size < 1000) { // 小于1KB可能是错误
                        throw new Error(`文件大小异常: ${blob.size} bytes`);
                    }

                    // 获取文件名
                    const contentDisposition = response.headers.get('content-disposition');
                    let filename = `beatmap_${item.sid}.osz`;
                    if (contentDisposition) {
                        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                        if (filenameMatch && filenameMatch[1]) {
                            filename = filenameMatch[1].replace(/['"]/g, '');
                        }
                    }

                    // 添加到ZIP
                    zip.file(filename, blob);

                    // 更新状态为完成
                    setBulkDownloadItems(prev => prev.map((prevItem, idx) =>
                        idx === i ? { ...prevItem, status: 'completed', progress: 100 } : prevItem
                    ));

                    successCount++;

                    // 添加小延迟避免请求过于频繁
                    if (i < bulkDownloadItems.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms延迟
                    }

                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : '未知错误';
                    console.error(`Failed to download ${item.sid}:`, errorMessage);

                    // 更新状态为失败
                    setBulkDownloadItems(prev => prev.map((prevItem, idx) =>
                        idx === i ? { ...prevItem, status: 'failed', error: errorMessage, progress: 0 } : prevItem
                    ));

                    failCount++;
                }
            }

            // 生成ZIP文件并下载
            if (successCount > 0) {
                console.log('Generating ZIP file...');

                // 更新UI显示正在生成ZIP
                setBulkDownloadItems(prev => prev.map(item =>
                    item.status === 'completed' ? { ...item, status: 'downloading' as const, progress: 50 } : item
                ));

                const zipBlob = await zip.generateAsync({
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: { level: 6 }
                });

                console.log('ZIP file generated, size:', zipBlob.size, 'bytes');

                // 创建下载链接
                const url = window.URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `beatmaps_${Date.now()}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                // 更新所有完成的项目状态
                setBulkDownloadItems(prev => prev.map(item =>
                    item.status === 'completed' || item.status === 'downloading' ? { ...item, status: 'completed' as const, progress: 100 } : item
                ));

                showSuccess(`批量下载完成！成功: ${successCount}, 失败: ${failCount}`);
            } else {
                showError('所有谱面下载都失败了，请检查网络连接');
            }

        } catch (error) {
            console.error('Bulk download process error:', error);
            showError('批量下载过程中出现严重错误');
        } finally {
            setIsBulkDownloading(false);
        }
    };

    // 取消批量下载
    const cancelBulkDownload = () => {
        setIsBulkDownloading(false);
        setBulkDownloadItems([]);
        setShowBulkDownloadManager(false);
        showInfo('批量下载已取消');
    };

    // 生成右击菜单项
    const getContextMenuItems = (row: any, index: number) => {
        const items = [
            {
                label: '跳转到 osu! 谱面',
                icon: '🔗',
                onClick: () => {
                    window.open(`https://osu.ppy.sh/beatmaps/${row.BID}`, '_blank');
                }
            },
            {
                label: '下载谱面 (Sayobot)',
                icon: '⬇️',
                onClick: async () => {
                    try {
                        const downloadUrl = `/api/download-beatmap?sid=${row.SID}`;
                        console.log('开始下载谱面:', {
                            sid: row.SID,
                            bid: row.BID,
                            url: downloadUrl
                        });

                        // 创建一个隐藏的链接来触发下载
                        const a = document.createElement('a');
                        a.href = downloadUrl;
                        a.download = `${row.artist} - ${row.title}.osz`;
                        a.style.display = 'none';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);

                        console.log('下载请求已发送');
                        showSuccess('谱面下载开始');

                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : '未知错误';
                        const errorDetails = `下载过程中出现错误: ${errorMessage}`;
                        console.error('下载错误详情:', {
                            error: error,
                            message: errorMessage,
                            sid: row.SID,
                            bid: row.BID,
                            stack: error instanceof Error ? error.stack : undefined
                        });
                        showError(`${errorDetails}\n谱面ID: ${row.SID}, BID: ${row.BID}\n请检查网络连接或稍后重试`);
                    }
                }
            },
            {
                label: '复制谱面ID (BID)',
                icon: '📋',
                onClick: () => {
                    navigator.clipboard.writeText(row.BID);
                    showInfo('BID 已复制到剪贴板');
                }
            }
        ];

        // 如果是测图页面，添加跳转到上传区域的选项
        if (showUploadJump && onRowRightClick) {
            items.push({
                label: '跳转到上传卡片',
                icon: '📤',
                onClick: () => {
                    onRowRightClick(row, index);
                }
            });
        }

        return items;
    };

    return (
        <div className="mb-20">
            <div className="flex justify-between items-start mb-0">
                <h1 className="text-xl font-bold text-white">{title}</h1>
                <div className="flex space-x-3">
                    {/* 批量下载按钮 */}
                    <button
                        onClick={prepareBulkDownload}
                        disabled={data.length === 0}
                        className="px-5 py-3 bg-[#95E1D3] text-white hover:bg-[#E93B66] transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        title="下载当前表格中的所有谱面"
                    >
                        📦 批量下载 ({data.length})
                    </button>
                    {/* {downloadUrl && (
                        <a
                            href={downloadUrl}
                            className="px-5 py-3 bg-[#E93B66] text-white hover:bg-[#95E1D3] transition font-bold"
                        >
                            图包下载 MAPPAK DOWNLOAD
                        </a>
                    )} */}
                </div>
            </div>
            <div className="overflow-x-auto relative">
                <table className="table-fixed min-w-[1800px]">
                    <thead>
                        <tr className="sticky top-0 bg-white z-10">
                            <th className="w-10 flex-1">MOD</th>
                            <th className="text-left w-16 flex-1">BID</th>
                            <th className="text-left w-13 flex-2">封面</th>
                            <th className="text-left w-80 flex-5">歌曲名</th>
                            <th className="text-left w-15 flex-1">谱师</th>
                            <th className="text-left w-15 flex-1">星级</th>
                            <th className="text-left w-10 flex-1">CS</th>
                            <th className="text-left w-10 flex-1">AR</th>
                            <th className="text-left w-10 flex-1">OD</th>
                            <th className="text-left w-10 flex-1">BPM</th>
                            <th className="text-left w-10 flex-1">时长</th>
                            <th className="w-40 flex-none">备注</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => {
                            let bgClass = "";
                            let slotClass = "";
                            if (row.Slot?.includes("NM")) {
                                bgClass = "bg-white";
                                slotClass = "bg-gray-200 p-2 text-center font-bold";
                            } else if (row.Slot?.includes("HD")) {
                                bgClass = "text-yellow-500";
                                slotClass = "bg-yellow-300 p-2 text-black text-center font-bold";
                            } else if (row.Slot?.includes("HR")) {
                                bgClass = "text-red-500";
                                slotClass = "bg-red-400 p-2 text-white text-center font-bold";
                            } else if (row.Slot?.includes("DT")) {
                                bgClass = "text-purple-500";
                                slotClass = "bg-purple-400 p-2 text-white text-center font-bold";
                            } else if (row.Slot?.includes("FM")) {
                                bgClass = "text-green-700";
                                slotClass = "bg-green-700 p-2 text-white text-center font-bold";
                            } else if (row.Slot?.includes("LZ")) {
                                bgClass = "text-blue-500";
                                slotClass = "bg-blue-400 p-2 text-white text-center font-bold";
                            } else if (row.Slot?.includes("TB")) {
                                bgClass = "text-grey-500";
                                slotClass = "bg-black p-2 text-white text-center font-bold";
                            }
                            return (
                                <tr
                                    key={idx}
                                    className={`${bgClass} cursor-pointer hover:bg-gray-100`}
                                    onContextMenu={(e) => {
                                        e.preventDefault(); // 阻止默认右键菜单
                                        setContextMenu({
                                            visible: true,
                                            position: { x: e.clientX, y: e.clientY },
                                            row,
                                            index: idx
                                        });
                                    }}
                                >
                                    <td className="text-center"><a className={slotClass}>{row.Slot}</a></td>
                                    <td
                                        className="cursor-pointer text-[#E93B66] hover:underline relative group"
                                        title="点击复制BID"
                                        onClick={() => {
                                            navigator.clipboard.writeText(row.BID);
                                            showInfo('BID 已复制到剪贴板');
                                            setTimeout(() => setCopiedIdx(null), 1000);
                                        }}
                                        style={{ position: 'relative' }}
                                    >
                                        {row.BID}
                                        <span
                                            className="pointer-events-none select-none absolute opacity-0 group-hover:opacity-100 text-xs font-bold text-[#E93B66]"
                                            style={{
                                                zIndex: 1,
                                                right: 0,
                                                bottom: 0,
                                                padding: '2px 8px',
                                                background: 'rgba(255,255,255,1)',
                                                borderTopLeftRadius: '0px',
                                                transition: 'opacity 0.2s',
                                                opacity: copiedIdx === idx ? 1 : undefined,
                                            }}
                                        >
                                        </span>
                                    </td>
                                    <td className="overflow-hidden">
                                        <Image
                                            src={`https://assets.ppy.sh/beatmaps/${row.SID}/covers/cover.jpg`}
                                            alt="Cover"
                                            width={75}
                                            height={48}
                                            className="w-19 h-12 object-cover"
                                            unoptimized
                                        />
                                    </td>
                                    <td><a
                                        href={`https://osu.ppy.sh/beatmaps/${row.BID}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-left hover:underline bg-white"
                                    >
                                        {row.MapInfo}
                                    </a></td>
                                    <td>{row._Creator}</td>
                                    <td title="Star 星数">{row.SR}★</td>
                                    <td title={`原生CS: ${row._CS}`}>{row.CS}</td>
                                    <td title={`原生AR: ${row._AR}`}>{row.AR}</td>
                                    <td title={`原生OD: ${row._OD}`}>{row.OD}</td>
                                    <td title="BPM">{Math.round(row.BPM)}</td>
                                    <td>{row.HitLength}</td>
                                    <td>{row.Notes || "-"}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* 右击菜单 */}
            {contextMenu?.visible && (
                <ContextMenu
                    items={getContextMenuItems(contextMenu.row, contextMenu.index)}
                    position={contextMenu.position}
                    onClose={() => setContextMenu(null)}
                />
            )}

            {/* 批量下载管理器 */}
            <BulkDownloadManager
                isOpen={showBulkDownloadManager}
                onClose={() => setShowBulkDownloadManager(false)}
                items={bulkDownloadItems}
                onStartDownload={startBulkDownload}
                onCancelDownload={cancelBulkDownload}
                isDownloading={isBulkDownloading}
            />
        </div>
    );
}