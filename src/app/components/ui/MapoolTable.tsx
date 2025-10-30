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

    // 批量下载状态
    const [bulkDownloadItems, setBulkDownloadItems] = useState<DownloadItem[]>([]);
    const [showBulkDownloadManager, setShowBulkDownloadManager] = useState(false);
    const [isBulkDownloading, setIsBulkDownloading] = useState(false);
    const [downloadSpeed, setDownloadSpeed] = useState(0);
    const [eta, setEta] = useState<number | null>(null);
    const [overallProgress, setOverallProgress] = useState(0);

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
    const startBulkDownload = async (source: 'nerinyan' | 'osu') => {
        if (bulkDownloadItems.length === 0) return;

        setIsBulkDownloading(true);
        const zip = new JSZip();
        let successCount = 0;
        let failCount = 0;

        try {
            // 先测试第一个下载，确保API工作正常
            console.log('Testing API with first beatmap...');
            const testResult = await testSingleDownload(bulkDownloadItems[0].sid, source);
            if (!testResult.success) {
                showError(`API测试失败，无法开始批量下载: ${testResult.error}`);
                setIsBulkDownloading(false);
                return;
            }
            console.log('API test passed, proceeding with bulk download...');

            // 记录开始时间
            const startTime = Date.now();
            let lastProgressUpdate = 0;

            // 逐个下载谱面，添加延迟避免并发过多
            for (let i = 0; i < bulkDownloadItems.length; i++) {
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
            console.error('Bulk download process error:', error);
            showError('批量下载过程中出现严重错误');
        } finally {
            setIsBulkDownloading(false);
        }
    };

    // 测试单个下载
    const testSingleDownload = async (sid: string, source: 'nerinyan' | 'osu') => {
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
        setIsBulkDownloading(false);
        setBulkDownloadItems([]);
        setShowBulkDownloadManager(false);
        showInfo('批量下载已取消');
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
                downloadSpeed={downloadSpeed}
                eta={eta}
                overallProgress={overallProgress}
            />
        </div>
    );
}
