"use client";
import Image from "next/image";
import { useState } from "react";
import { showSuccess, showError, showInfo } from '../components/Notification';
import ContextMenu from './ContextMenu';

interface MapoolTableProps {
    data: any[];
    title: string;
    downloadUrl?: string;
    onRowClick?: (row: any, index: number) => void;
    onRowRightClick?: (row: any, index: number) => void;
    showUploadJump?: boolean; // 是否显示跳转到上传区域的选项
}

export default function MapoolTable({ data, title, downloadUrl, onRowClick, onRowRightClick, showUploadJump = false }: MapoolTableProps) {
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        position: { x: number; y: number };
        row: any;
        index: number;
    } | null>(null);

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
                        const response = await fetch(`https://dl.sayobot.cn/beatmaps/download/full/${row.SID}`, {
                            headers: {
                                'Referer': 'https://www.rino.ink/',
                                'User-Agent': navigator.userAgent
                            }
                        });

                        if (response.ok) {
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${row.artist} - ${row.title}.osz`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                            showSuccess('谱面下载开始');
                        } else {
                            showError('下载失败，请稍后重试');
                        }
                    } catch (error) {
                        console.error('Download error:', error);
                        showError('下载过程中出现错误');
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
                {/* {downloadUrl && (
                    <a
                        href={downloadUrl}
                        className="px-5 py-3 bg-[#E93B66] text-white hover:bg-[#95E1D3] transition font-bold"
                    >
                        图包下载 MAPPAK DOWNLOAD
                    </a>
                )} */}
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
        </div>
    );
}