"use client";

import { BeatmapCard as BeatmapCardType } from "../types/banpick";
import BeatmapCard from "./BeatmapCard";

interface MapPoolGridProps {
    beatmaps: BeatmapCardType[];
    onBeatmapLeftClick: (beatmap: BeatmapCardType) => void;
    onBeatmapRightClick: (beatmap: BeatmapCardType) => void;
    banPickHistory: Array<{
        team: 'red' | 'blue';
        action: 'ban' | 'pick';
        beatmapId: number;
        timestamp: number;
    }>;
}

const MOD_ORDER = ['NM', 'HD', 'HR', 'DT', 'FM', 'LZ', 'TB'];

export default function MapPoolGrid({ beatmaps, onBeatmapLeftClick, onBeatmapRightClick, banPickHistory }: MapPoolGridProps) {
    // 按MOD分类分组
    const groupedByMod = MOD_ORDER.reduce((acc, mod) => {
        acc[mod] = beatmaps
            .filter(beatmap => beatmap.selectedMods === mod)
            .sort((a, b) => a.modPosition - b.modPosition);
        return acc;
    }, {} as Record<string, BeatmapCardType[]>);

    // 过滤掉没有谱面的MOD分类
    const validMods = MOD_ORDER.filter(mod => groupedByMod[mod].length > 0);

    const getModLabel = (mod: string) => {
        const labels: Record<string, string> = {
            'NM': 'No Mod',
            'HD': 'Hidden',
            'HR': 'Hard Rock',
            'DT': 'Double Time',
            'FM': 'Free Mod',
            'LZ': 'Lazer',
            'TB': 'Tiebreaker'
        };
        return labels[mod] || mod;
    };

    return (
        <div className="w-full max-w-8xl mx-auto p-4">
            {validMods.map(mod => (
                <div key={mod} className="mb-6">
                    {/* MOD分类标题 */}
                    <div className="flex justify-center mb-3">
                        <div className={`px-4 py-2 rounded-lg text-white font-bold text-lg ${mod === 'NM' ? 'bg-gray-500' :
                            mod === 'HD' ? 'bg-yellow-500' :
                                mod === 'HR' ? 'bg-red-500' :
                                    mod === 'DT' ? 'bg-purple-500' :
                                        mod === 'FM' ? 'bg-green-500' :
                                            mod === 'LZ' ? 'bg-blue-500' :
                                                'bg-black'
                            }`}>
                            {getModLabel(mod)}
                        </div>
                    </div>

                    {/* 谱面网格 */}
                    <div className="">
                        <div className="flex flex-row flex-wrap justify-center w-full">
                            {groupedByMod[mod].map(beatmap => (
                                <BeatmapCard
                                    key={beatmap.id}
                                    beatmap={beatmap}
                                    onLeftClick={onBeatmapLeftClick}
                                    onRightClick={onBeatmapRightClick}
                                    banPickHistory={banPickHistory}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            ))}

        </div>
    );
}
