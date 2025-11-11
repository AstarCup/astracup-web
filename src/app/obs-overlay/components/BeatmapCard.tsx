"use client";

import { BeatmapCard as BeatmapCardType } from "../types/banpick";
import Image from "next/image";

interface BeatmapCardProps {
    beatmap: BeatmapCardType;
    onLeftClick: (beatmap: BeatmapCardType) => void;
    onRightClick: (beatmap: BeatmapCardType) => void;
    banPickHistory: Array<{
        team: 'red' | 'blue';
        action: 'ban' | 'pick';
        beatmapId: number;
        timestamp: number;
    }>;
}

export default function BeatmapCard({ beatmap, onLeftClick, onRightClick, banPickHistory }: BeatmapCardProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (e.button === 0) { // 左键
            onLeftClick(beatmap);
        } else if (e.button === 2) { // 右键
            onRightClick(beatmap);
        }
    };

    const getCardClass = () => {
        const baseClass = "w-full h-24 flex rounded-lg overflow-hidden cursor-pointer transition-all duration-300 relative";

        if (beatmap.status === 'available') {
            return `${baseClass} bg-gray-800/80 hover:bg-gray-700/80`;
        } else if (beatmap.status === 'banned') {
            const teamColor = beatmap.bannedBy === 'red' ? 'border-gray-500' : 'border-gray-500';
            return `${baseClass} ${teamColor} border-8`;
        } else if (beatmap.status === 'picked') {
            const teamColor = beatmap.pickedBy === 'red' ? 'border-red-500' : 'border-blue-500';
            return `${baseClass} ${teamColor} border-8`;
        }

        return baseClass;
    };

    const getOverlayClass = () => {
        if (beatmap.status === 'banned') {
            return beatmap.bannedBy === 'red'
                ? 'bg-red-500/40'
                : 'bg-blue-500/40';
        } else if (beatmap.status === 'picked') {
            return beatmap.pickedBy === 'red'
                ? 'bg-red-500/40'
                : 'bg-blue-500/40';
        }
        return '';
    };

    const getTeamColor = (team: 'red' | 'blue') => {
        return team === 'red' ? 'text-red-500' : 'text-blue-500';
    };

    const getStatusWithCount = () => {
        if (beatmap.status === 'banned') {
            return `BANNED${beatmap.bannedBy === 'red' ? `${getTeamColor('red')}红方` : `${getTeamColor('blue')}蓝方`}`;
        } else if (beatmap.status === 'picked') {
            return `PICKED${beatmap.pickedBy === 'red' ? `${getTeamColor('red')}红方` : `${getTeamColor('blue')}蓝方`}`;
        }
        return '';
    };

    const getModColor = () => {
        const mod = beatmap.selectedMods;
        switch (mod) {
            case 'NM':
                return 'bg-white text-black'; // 白色
            case 'HD':
                return 'bg-yellow-300 text-black'; // 黄色
            case 'HR':
                return 'bg-red-500'; // 红色
            case 'DT':
                return 'bg-purple-500';
            case 'LZ':
                return 'bg-pink-500';
            case 'TB':
                return 'bg-black';
            default:
                return 'bg-white'; // 默认白色
        }
    };

    return (
        <div
            className={`${getCardClass()} basis-140 m-2`}
            onClick={handleClick}
            onContextMenu={handleClick}
            style={{
                backgroundImage: `url(${beatmap.coverUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            {/* 左侧MOD位区域 */}
            <div className="w-[100px] h-full flex items-center justify-center bg-black/50 ">
                <span className={`text-2xl font-bold p-2 w-[80px] text-center rounded ${getModColor()}`}>
                    {beatmap.slot}
                </span>
            </div>

            {/* 右侧信息区域 */}
            <div className="flex-1 h-full p-3 flex flex-col justify-center bg-black/50">
                <div className="text-white">
                    <div className="text-sm font-semibold truncate" title={beatmap.artist}>
                        {beatmap.artist}
                    </div>
                    <div className="text-2xl font-bold truncate" title={beatmap.title}>
                        {beatmap.title}
                    </div>
                    <div className="text-xs text-gray-300 truncate" title={beatmap.version}>
                        [{beatmap.version}] - by {beatmap.creator}
                    </div>
                </div>
            </div>

            {/* Ban/Pick状态覆盖层 */}
            {(beatmap.status === 'banned' || beatmap.status === 'picked') && (
                <div className={`absolute inset-0 flex items-center justify-center ${getOverlayClass()}`}>
                    <div className="text-center text-white font-bold text-3xl leading-tight flex flex-col items-center gap-2">
                        {/* Ban/Pick图标 */}
                        <div className="">
                            {beatmap.status === 'banned' ? (
                                <span className="text-black bg-white/60 p-2 rounded flex items-center gap-2">
                                    {/* <Image src='/icons/banned.svg' width={30} height={30} alt="banned" /> */}
                                    BANNED
                                    {beatmap.bannedBy === 'red' ? (
                                        <span className="text-red-500">红方</span>
                                    ) : (
                                        <span className="text-blue-500">蓝方</span>
                                    )}
                                </span>
                            ) : (
                                <span className={`${beatmap.pickedBy === 'red' ? 'text-red-500' : 'text-blue-500'} bg-white p-2 rounded flex items-center gap-2`}>
                                    {/* <Image src='/icons/picked.svg' width={30} height={30} alt="picked" /> */}
                                    PICKED
                                    {beatmap.pickedBy === 'red' ? (
                                        <span className="text-red-500">红方</span>
                                    ) : (
                                        <span className="text-blue-500">蓝方</span>
                                    )}
                                </span>
                            )}
                        </div>
                        {/* 状态文本 */}
                        <div>
                            <div></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
