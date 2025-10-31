"use client";
import Image from "next/image";
import { useState } from "react";
import { showSuccess, showError, showInfo } from './Notification';
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
    uploadedUsers?: { [key: string]: string[] }; // 上传用户数据 { mapId: [username, ...] }
    season?: string; // 当前赛季
    category?: string; // 当前类别
}

export default function MapoolTable({ data, title, downloadUrl, onRowRightClick, showUploadJump = false, uploadedUsers = {}, season, category }: MapoolTableProps) {
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        position: { x: number; y: number };
        row: any;
        index: number;
    } | null>(null);

    // 详细信息卡片状态
    const [detailCard, setDetailCard] = useState<{
        visible: boolean;
        position: { x: number; y: number };
        row: any;
    } | null>(null);

    // 批量下载状态
    const [bulkDownloadItems, setBulkDownloadItems] = useState<DownloadItem[]>([]);
    const [showBulkDownloadManager, setShowBulkDownloadManager] = useState(false);
    const [isBulkDownloading, setIsBulkDownloading] = useState(false);
    const [downloadSpeed, setDownloadSpeed] = useState(0);
    const [eta, setEta] = useState<number | null>(null);
    const [overallProgress, setOverallProgress] = useState(0);
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    // 准备批量下载 (原有的API批量下载)
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
    const startBulkDownload = async (source: 'nerinyan' | 'sayobot' | 'osu') => {
        if (bulkDownloadItems.length === 0) return;

        // 创建新的AbortController用于取消请求
        const controller = new AbortController();
        setAbortController(controller);

        setIsBulkDownloading(true);
        const zip = new JSZip();
        let successCount = 0;
        let failCount = 0;

        try {

            // 记录开始时间
            const startTime = Date.now();
            let lastProgressUpdate = 0;

            // 逐个下载谱面，添加延迟避免并发过多
            for (let i = 0; i < bulkDownloadItems.length; i++) {
                // 检查是否已取消
                if (controller.signal.aborted) {
                    console.log('Download cancelled by user');
                    showInfo('下载已被用户取消');
                    break;
                }

                const item = bulkDownloadItems[i];

                try {
                    // 更新当前项目状态为下载中
                    setBulkDownloadItems(prev => prev.map((prevItem, idx) =>
                        idx === i ? { ...prevItem, status: 'downloading', progress: 10 } : prevItem
                    ));

                    // 更新整体进度
                    const newOverallProgress = ((i) / bulkDownloadItems.length) * 100;
                    // 更新BulkDownloadManager中的整体进度状态

                    console.log(`Downloading beatmap ${i + 1}/${bulkDownloadItems.length}:`, item.sid, item.bid);

                    // 计算下载速度和ETA
                    const currentTime = Date.now();
                    const elapsedTime = (currentTime - startTime) / 1000; // 秒
                    const progressRatio = (i + 1) / bulkDownloadItems.length;

                    if (elapsedTime > 0 && progressRatio > 0) {
                        // 计算下载速度 (items per second)
                        const speed = (i + 1) / elapsedTime;

                        // 计算剩余时间 (seconds)
                        const remainingItems = bulkDownloadItems.length - (i + 1);
                        const etaSeconds = remainingItems / speed;

                        // 更新状态
                        setDownloadSpeed(speed);
                        setEta(etaSeconds);
                    }

                    // 更新整体进度状态
                    setOverallProgress(newOverallProgress);

                    const response = await fetch(`/api/download-beatmap?sid=${item.sid}&source=${source}`, {
                        method: 'GET',
                        headers: {
                            'Cache-Control': 'no-cache',
                        },
                        signal: controller.signal // 添加signal用于取消请求
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
                    // 检查是否是取消操作导致的错误
                    if (error instanceof Error && error.name === 'AbortError') {
                        console.log('Download cancelled by user');
                        showInfo('下载已被用户取消');
                        break;
                    }

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

                try {
                    const zipBlob = await zip.generateAsync({
                        type: 'blob',
                        compression: 'DEFLATE',
                        compressionOptions: { level: 6 }
                    });

                    console.log('ZIP file generated, size:', zipBlob.size, 'bytes');

                    if (zipBlob.size === 0) {
                        throw new Error('生成的ZIP文件为空');
                    }

                    // 创建下载链接
                    const url = window.URL.createObjectURL(zipBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `beatmaps_${Date.now()}.zip`;
                    a.style.display = 'none';

                    // 确保元素被添加到DOM中
                    document.body.appendChild(a);

                    // 触发下载
                    try {
                        a.click();
                        console.log('Download triggered successfully');
                    } catch (clickError) {
                        console.error('Failed to trigger download:', clickError);
                        // 备用方案：直接打开URL
                        window.open(url, '_blank');
                    }

                    // 清理
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);

                    // 更新所有完成的项目状态
                    setBulkDownloadItems(prev => prev.map(item =>
                        item.status === 'completed' || item.status === 'downloading' ? { ...item, status: 'completed' as const, progress: 100 } : item
                    ));

                    showSuccess(`批量下载完成！成功: ${successCount}, 失败: ${failCount}\nZIP文件大小: ${(zipBlob.size / 1024 / 1024).toFixed(2)} MB`);

                } catch (zipError) {
                    console.error('ZIP generation failed:', zipError);
                    showError(`ZIP文件生成失败: ${zipError instanceof Error ? zipError.message : '未知错误'}`);
                    return;
                }

            } else {
                showError('所有谱面下载都失败了，请检查网络连接');
            }

        } catch (error) {
            // 检查是否是取消操作导致的错误
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Bulk download cancelled by user');
                showInfo('批量下载已被用户取消');
            } else {
                console.error('Bulk download process error:', error);
                showError('批量下载过程中出现严重错误');
            }
        } finally {
            setIsBulkDownloading(false);
            setAbortController(null);
        }
    };

    // 测试单个下载
    const testSingleDownload = async (sid: string, source: 'nerinyan' | 'sayobot' | 'osu') => {
        try {
            console.log('Testing single download for SID:', sid, 'source:', source);
            const response = await fetch(`/api/download-beatmap?sid=${sid}&source=${source}`, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });

            console.log('Test response:', {
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                contentLength: response.headers.get('content-length'),
                contentType: response.headers.get('content-type'),
            });

            if (response.ok) {
                const blob = await response.blob();
                console.log('Test blob size:', blob.size, 'bytes');
                return { success: true, size: blob.size };
            } else {
                const errorText = await response.text();
                console.error('Test failed:', errorText);
                return { success: false, error: errorText };
            }
        } catch (error) {
            console.error('Test error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    };

    // 取消批量下载
    const cancelBulkDownload = () => {
        // 如果有正在进行的请求，取消它
        if (abortController) {
            abortController.abort();
            setAbortController(null);
        }

        setIsBulkDownloading(false);
        setBulkDownloadItems([]);
        setShowBulkDownloadManager(false);
        showInfo('批量下载已取消');
    };

    // 处理鼠标悬停事件
    const handleMouseEnter = (e: React.MouseEvent, row: any) => {
        setDetailCard({
            visible: true,
            position: { x: e.clientX + 10, y: e.clientY + 10 },
            row
        });
    };

    // 处理鼠标离开事件
    const handleMouseLeave = () => {
        setDetailCard(null);
    };

    // 格式化时间长度
    const formatLength = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // 格式化日期时间
    const formatDateTime = (dateTimeString: string) => {
        try {
            return new Date(dateTimeString).toLocaleString('zh-CN');
        } catch (error) {
            console.error('日期格式化错误:', error, dateTimeString);
            return '时间格式错误';
        }
    };

    // 获取mod颜色class
    const getModColorClass = (mod: string): string => {
        switch (mod) {
            case 'NM': return 'bg-gray-500';
            case 'HD': return 'bg-yellow-500';
            case 'HR': return 'bg-red-500';
            case 'DT': return 'bg-purple-500';
            case 'EZ': return 'bg-green-500';
            case 'LZ': return 'bg-gray-600';
            case 'TB': return 'bg-black';
            case 'FM': return 'bg-blue-500';
            default: return 'bg-blue-500';
        }
    };

    // 生成右击菜单项
    const getContextMenuItems = (row: any, index: number) => {
        const items = [
            // 工具相关
            {
                label: '复制谱面ID (BID)',
                icon: '/icons/copy.svg',
                onClick: () => {
                    navigator.clipboard.writeText(row.BID);
                    showInfo('BID 已复制到剪贴板');
                },
                type: 'item' as const
            },
            // 导航相关
            {
                label: '跳转到 osu! 谱面',
                icon: '/icons/link.svg',
                onClick: () => {
                    window.open(`https://osu.ppy.sh/beatmaps/${row.BID}`, '_blank');
                },
                type: 'item' as const
            },
            {
                label: '从osu中打开',
                icon: '/icons/share.svg',
                onClick: () => {
                    window.open(`osu://b/${row.BID}`, '_blank');
                    showInfo('已在osu客户端中打开谱面');
                },
                type: 'item' as const
            },
            // 分隔符
            { type: 'separator' as const, label: '' },
            // 下载相关
            {
                label: '下载谱面 (Nerinyan)',
                icon: '/icons/download-sayobot.svg',
                onClick: () => {
                    const downloadUrl = `https://api.nerinyan.moe/d/${row.SID}`;

                    // 直接跳转到Nerinyan下载链接，让浏览器处理下载
                    window.open(downloadUrl, '_blank');
                    showSuccess('已开始从Nerinyan下载');
                },
                type: 'item' as const
            },
            {
                label: 'osu官方下载',
                icon: '/icons/download.svg',
                onClick: () => {
                    const downloadUrl = `https://osu.ppy.sh/beatmapsets/${row.SID}/download`;
                    // 跳转到osu官方下载链接
                    window.open(downloadUrl, '_blank');
                    showSuccess('已开始从osu官方下载');
                },
                type: 'item' as const
            }
            // 分隔符

        ];

        // 如果是测图页面，添加跳转到上传区域的选项
        if (showUploadJump && onRowRightClick) {
            items.push(
                // 分隔符
                { type: 'separator' as const, label: '' },
                // 页面导航
                {
                    label: '跳转到上传卡片',
                    icon: '/icons/corner-right-down-fill.svg',
                    onClick: () => {
                        onRowRightClick(row, index);
                    },
                    type: 'item' as const
                }
            );
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
                        className="px-4 py-3 bg-[#7B68EE] text-white hover:bg-[#95E1D3] transition font-bold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        title="打开批量下载管理器"
                    >
                        图池批量下载 ({data.length})
                    </button>

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
                            let slotText = row.Slot || "";

                            // 处理自定义mod名称和DT倍率
                            if (row.customModName && row.Slot?.startsWith("LZ")) {
                                slotText = `LZ${row.Slot.match(/\d+/)?.[0] || ''}`;
                                // -${row.customModName}
                            } else if (row.customDTRate && row.customDTRate !== 1.5 && row.Slot?.startsWith("DT")) {
                                slotText = `DT${row.Slot.match(/\d+/)?.[0] || ''}`;
                                // -${Number(row.customDTRate).toFixed(1)}x
                            }

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
                            // 检查是否有上传
                            const hasUploads = season && category && uploadedUsers[`${season}/${category}/${row.BID}`]?.length > 0;

                            return (
                                <tr
                                    key={idx}
                                    className={`${bgClass} cursor-pointer hover:bg-gray-100 ${hasUploads ? 'bg-green-50' : ''}`}
                                    onMouseEnter={(e) => handleMouseEnter(e, row)}
                                    onMouseLeave={handleMouseLeave}
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
                                    <td className="text-center relative">
                                        <a className={slotClass}>{row.Slot}</a>
                                        {/* 自定义mod名称气泡 - 显示在右上角 */}
                                        {(row.customModName || (row.customDTRate && row.customDTRate !== 1.5)) && (
                                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full min-w-4 h-4 flex items-center justify-center font-bold shadow-md">
                                                {row.customModName ? row.customModName : `${Number(row.customDTRate).toFixed(1)}x`}
                                            </div>
                                        )}
                                    </td>
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
                downloadSpeed={downloadSpeed}
                eta={eta}
                overallProgress={overallProgress}
            />

            {/* 详细信息卡片 */}
            {detailCard?.visible && detailCard.row && (
                <div
                    className="fixed shadow-lg max-w-sm transition-all duration-200"
                    style={{
                        left: detailCard.position.x,
                        top: detailCard.position.y,
                    }}
                >
                    <div className={`border p-4 shadow-sm hover:shadow-md transition-all duration-200 border-gray-300 bg-white`}>
                        {/* 头部：封面和基本信息 */}
                        <div className="flex items-start gap-3 mb-3">
                            <div className="relative">
                                <Image
                                    src={`https://assets.ppy.sh/beatmaps/${detailCard.row.SID}/covers/cover.jpg`}
                                    alt="Beatmap cover"
                                    width={512}
                                    height={512}
                                    className="w-24 h-19 object-cover rounded"
                                    unoptimized
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getModColorClass(detailCard.row.Slot?.replace(/\d+/g, '') || 'NM')}`}>
                                        {detailCard.row.customModName && detailCard.row.Slot?.startsWith("LZ") ?
                                            (detailCard.row.customModName && detailCard.row.customModName.trim() !== '' ?
                                                `LZ${detailCard.row.Slot.match(/\d+/)?.[0] || ''}-${detailCard.row.customModName}` :
                                                `LZ${detailCard.row.Slot.match(/\d+/)?.[0] || ''}`) :
                                            detailCard.row.customDTRate && detailCard.row.customDTRate !== 1.5 && detailCard.row.Slot?.startsWith("DT") ?
                                                ((detailCard.row.customDTRate && detailCard.row.customDTRate !== 1.5) ?
                                                    `DT${detailCard.row.Slot.match(/\d+/)?.[0] || ''}-${Number(detailCard.row.customDTRate).toFixed(1)}倍` :
                                                    `DT${detailCard.row.Slot.match(/\d+/)?.[0] || ''}`) :
                                                detailCard.row.Slot || 'NM1'
                                        }
                                    </span>
                                </div>

                                <h3 className="font-bold text-sm truncate" title={detailCard.row.title || detailCard.row.MapInfo}>
                                    {detailCard.row.title || detailCard.row.MapInfo}
                                </h3>
                                <p className="font-bold text-xs text-gray-600">by {detailCard.row.creator || detailCard.row._Creator}</p>
                            </div>
                        </div>

                        {/* 属性信息 */}
                        <div className="mb-3 text-xs text-gray-600">
                            <div className="grid grid-cols-4 gap-1">
                                <div className="text-center font-medium">CS</div>
                                <div className="text-center font-medium">AR</div>
                                <div className="text-center font-medium">OD</div>
                                <div className="text-center font-medium">HP</div>
                                <div className="text-center font-bold text-lg">{Number(detailCard.row.cs || detailCard.row.CS || 0).toFixed(1)}</div>
                                <div className="text-center font-bold text-lg">{Number(detailCard.row.ar || detailCard.row.AR || 0).toFixed(1)}</div>
                                <div className="text-center font-bold text-lg">{Number(detailCard.row.od || detailCard.row.OD || 0).toFixed(1)}</div>
                                <div className="text-center font-bold text-lg">{Number(detailCard.row.hp || 0).toFixed(1)}</div>
                                <div className="text-center font-medium col-span-2">Length</div>
                                <div className="text-center font-medium">BPM</div>
                                <div className="text-center font-medium">★</div>
                                <div className="text-center font-bold text-base col-span-2">{formatLength(detailCard.row.totalLength || detailCard.row.HitLength || 0)}</div>
                                <div className="text-center font-bold text-base">{Math.round(detailCard.row.bpm || detailCard.row.BPM || 0)}</div>
                                <div className="text-center font-bold text-base">{Number(detailCard.row.starRating || detailCard.row.SR || 0).toFixed(2)}</div>
                            </div>
                        </div>

                        {/* 提名者信息 */}
                        <div className="mb-3 text-xs text-gray-600">
                            <div className="flex items-center gap-3 w-full">
                                <span className="flex items-center gap-1">提名者: {detailCard.row.selectedByUsername || '未知'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
