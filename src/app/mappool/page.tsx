'use client';

import { useState, useEffect } from 'react';
import MapoolTable from '@/app/components/ui/MapoolTable';
import Dropdown from '@/app/components/ui/Dropdown';
import { usePageTitle } from '@/lib/usePageTitle';
import { useConfig } from '@/app/components/ConfigProvider';

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
    maxCombo: number;
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
    // 添加自定义mod字段
    customModName?: string;
    customDTRate?: number;
    // 添加缺失的字段
    selectedByUsername?: string;
}

const MOD_ORDER = ['NM', 'HD', 'HR', 'DT', 'FM', 'LZ', 'TB'];

export default function Mapool() {
    usePageTitle('/mappool');

    const { tournamentSettings } = useConfig();

    const [mapPoolData, setMapPoolData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [availableSeasons, setAvailableSeasons] = useState([
        { value: 's1', label: '第1赛季' }
    ]);
    const [currentSeason, setCurrentSeason] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('mappool_season') || 's1';
        }
        return 's1';
    });
    const [selectedCategory, setSelectedCategory] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('mappool_category') || 'qualification';
        }
        return 'qualification';
    });

    // 自定义 onChange 处理函数 - 保存到本地存储
    const handleSeasonChange = (value: string) => {
        setCurrentSeason(value);
        if (typeof window !== 'undefined') {
            localStorage.setItem('mappool_season', value);
        }
    };

    const handleCategoryChange = (value: string) => {
        setSelectedCategory(value);
        if (typeof window !== 'undefined') {
            localStorage.setItem('mappool_category', value);
        }
    };

    // 当config加载完成后，更新赛季信息 - 只在初始加载时设置一次
    useEffect(() => {
        // console.log('tournamentSettings changed:', tournamentSettings);
        if (tournamentSettings?.current_season && currentSeason === 's1') {
            // tournamentSettings.current_season 已经是字符串格式（如 's1'）
            const seasonValue = tournamentSettings.current_season;
            const seasonNumber = tournamentSettings.current_season.replace('s', '');
            const seasonLabel = `第${seasonNumber}赛季`;

            setAvailableSeasons([{ value: seasonValue, label: seasonLabel }]);
            setCurrentSeason(seasonValue);
            if (typeof window !== 'undefined') {
                localStorage.setItem('mappool_season', seasonValue);
            }
        }
    }, [tournamentSettings, currentSeason]);

    // 调试：监控mapPoolData变化
    useEffect(() => {
        // console.log('mapPoolData changed, length:', mapPoolData.length);
    }, [mapPoolData]);

    const CATEGORY_OPTIONS = [
        { value: 'qualification', label: 'QUA' },
        { value: 'ro16', label: 'RO16' },
        { value: 'quarterfinals', label: 'QF' },
        { value: 'semifinals', label: 'SF' },
        { value: 'finals', label: 'F' },
        { value: 'grandfinals', label: 'GF' }
    ];

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
            // console.log('fetchApprovedMaps called with:', { currentSeason, selectedCategory });
            setIsLoading(true);
            const response = await fetch(`/api/map-selections?season=${currentSeason}&category=${selectedCategory}&approved=true`);

            // console.log('fetchApprovedMaps response:', response.status, response.ok);

            if (response.ok) {
                const data = await response.json();
                // console.log('fetchApprovedMaps data:', data);
                const approvedMaps = data.selections?.filter((map: MapSelection) => map.approved) || [];
                // console.log('approvedMaps:', approvedMaps);

                // 转换数据格式为MapoolTable需要的格式
                const convertedData = convertToMapoolFormat(approvedMaps);
                // console.log('convertedData:', convertedData);
                setMapPoolData(convertedData);
            } else {
                const errorText = await response.text();
                console.error('fetchApprovedMaps failed:', errorText);
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
            hp: map.hp?.toFixed(1) || '0.0',
            totalLength: map.totalLength,
            BPM: map.bpm,
            HitLength: formatLength(map.totalLength),
            Notes: map.comment || '-',
            // 添加自定义mod字段
            customModName: map.customModName,
            customDTRate: map.customDTRate,
            selectedMods: map.selectedMods,
            modPosition: map.modPosition,
            selectedByUsername: map.selectedByUsername || map.selectedBy || '未知',
            selectedAt: map.selectedAt || new Date().toISOString(),
            starRating: map.starRating,
            approved: map.approved || false,
            // 添加maxCombo字段
            maxCombo: map.maxCombo || 0
        }));
    };

    const formatLength = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="max-w-9xl mx-auto pt-60 pb-60">
                <div className="text-center text-white">
                    <div className="text-xl mb-4">正在加载图池数据...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-9xl mx-auto p-6">
                <div className="bg-red-500/20 border border-red-500  p-4 mb-6">
                    <p className="text-white">{error}</p>
                </div>
            </div>
        );
    }

    // 检查图池是否可见 - 只有当没有数据时才显示"暂未开放"
    if (!tournamentSettings?.mappool_visible && mapPoolData.length === 0) {
        return (
            <div className="max-w-9xl mx-auto pt-60 pb-60">
                <div className="text-center text-white">
                    <div className="text-xl mb-4">图池暂未开放</div>
                    <p className="text-gray-400">请关注官方公告获取最新信息</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-9xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-white">图池</h1>

            {/* 赛季和类别选择器 */}
            <div className="mb-6 flex gap-6 items-end">
                <Dropdown
                    label="赛季"
                    options={availableSeasons.map(season => ({
                        value: season.value,
                        label: season.label
                    }))}
                    value={currentSeason}
                    onChange={handleSeasonChange}
                    minWidth="8rem"
                    darkMode={true}
                />
                <Dropdown
                    label="类别"
                    options={CATEGORY_OPTIONS.map(option => ({
                        value: option.value,
                        label: option.label
                    }))}
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    minWidth="6rem"
                    darkMode={true}
                />
                <p className='text-white text-xl animate-bounce'>QF图池已更新</p>
            </div>

            {mapPoolData.length === 0 ? (
                <div className="text-center text-white pt-60 pb-60">
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
