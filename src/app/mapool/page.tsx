'use client';

import { useState, useEffect } from 'react';
import MapoolTable from '@/app/components/MapoolTable';

interface MapSelection {
    id: number;
    beatmapId: number;
    beatmapsetId: number;
    title: string;
    artist: string;
    version: string;
    creator: string;
    starRating: number;
    bpm: number;
    totalLength: number;
    ar: number;
    cs: number;
    od: number;
    hp: number;
    selectedMods: string;
    modPosition: number;
    comment: string;
    selectedBy: string;
    selectedAt: string;
    season: string;
    category: string;
    url: string;
    coverUrl: string;
    approved: boolean;
}

const MOD_ORDER = ['NM', 'HD', 'HR', 'DT', 'FM', 'LZ', 'TB'];

export default function Mapool() {
    const [mapPoolData, setMapPoolData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [availableSeasons, setAvailableSeasons] = useState([
        { value: 's1', label: '第一赛季' }
    ]);
    const [currentSeason, setCurrentSeason] = useState('s1');
    const [selectedCategory, setSelectedCategory] = useState('qualification');

    const CATEGORY_OPTIONS = [
        { value: 'qualification', label: '资格赛' },
        { value: 'ro32', label: '32强赛' },
        { value: 'ro16', label: '16强赛' },
        { value: 'quarterfinals', label: '四分之一决赛' },
        { value: 'semifinals', label: '半决赛' },
        { value: 'finals', label: '决赛' },
        { value: 'grandfinals', label: '总决赛' }
    ];

    useEffect(() => {
        loadSeasonConfig();
    }, []);

    useEffect(() => {
        if (currentSeason) {
            fetchApprovedMaps();
        }
    }, [currentSeason, selectedCategory]);

    const loadSeasonConfig = async () => {
        try {
            const response = await fetch('/api/season-config');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setAvailableSeasons(data.availableSeasons);
                    setCurrentSeason(data.defaultSeason);
                }
            }
        } catch (error) {
            console.error('Failed to load season config:', error);
        }
    };

    const fetchApprovedMaps = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/map-selections?season=${currentSeason}&category=${selectedCategory}&approved=true`);
            
            if (response.ok) {
                const data = await response.json();
                const approvedMaps = data.selections?.filter((map: MapSelection) => map.approved) || [];
                
                // 转换数据格式为MapoolTable需要的格式
                const convertedData = convertToMapoolFormat(approvedMaps);
                setMapPoolData(convertedData);
            } else {
                setError('获取图池数据失败');
            }
        } catch (error) {
            console.error('Failed to fetch approved maps:', error);
            setError('获取图池数据时出错');
        } finally {
            setIsLoading(false);
        }
    };

    const convertToMapoolFormat = (maps: MapSelection[]) => {
        // 按MOD顺序排序
        const sortedMaps = maps.sort((a, b) => {
            const aModIndex = MOD_ORDER.indexOf(a.selectedMods);
            const bModIndex = MOD_ORDER.indexOf(b.selectedMods);
            
            if (aModIndex !== bModIndex) {
                return aModIndex - bModIndex;
            }
            
            // 如果mod相同，按位置排序
            return a.modPosition - b.modPosition;
        });

        return sortedMaps.map(map => ({
            Slot: `${map.selectedMods}${map.modPosition}`,
            BID: map.beatmapId.toString(),
            SID: map.beatmapsetId.toString(),
            MapInfo: `${map.artist} - ${map.title} [${map.version}]`,
            _Creator: map.creator,
            SR: map.starRating.toFixed(2),
            CS: map.cs.toFixed(1),
            _CS: map.cs.toFixed(1),
            AR: map.ar.toFixed(1),
            _AR: map.ar.toFixed(1),
            OD: map.od.toFixed(1),
            _OD: map.od.toFixed(1),
            BPM: map.bpm,
            HitLength: formatLength(map.totalLength),
            Notes: map.comment || '-'
        }));
    };

    const formatLength = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="max-w-9xl mx-auto p-6">
                <div className="text-center text-white">
                    <div className="text-xl mb-4">正在加载图池数据...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-9xl mx-auto p-6">
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
                    <p className="text-white">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-9xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-white">图池</h1>
            
            {/* 赛季和类别选择器 */}
            <div className="mb-6 flex gap-4 items-center">
                <div>
                    <label className="block text-white text-sm mb-1">赛季</label>
                    <select
                        value={currentSeason}
                        onChange={(e) => setCurrentSeason(e.target.value)}
                        className="bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                    >
                        {availableSeasons.map(season => (
                            <option key={season.value} value={season.value}>
                                {season.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-white text-sm mb-1">类别</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                    >
                        {CATEGORY_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {mapPoolData.length === 0 ? (
                <div className="text-center text-white py-8">
                    <p>暂无已过审的图池数据</p>
                </div>
            ) : (
                <MapoolTable 
                    data={mapPoolData} 
                    title={CATEGORY_OPTIONS.find(opt => opt.value === selectedCategory)?.label || selectedCategory}
                    downloadUrl="/" 
                />
            )}
        </div>
    );
}