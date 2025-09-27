"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { showSuccess, showError } from '../ui/Notification';
import Dropdown from '../ui/Dropdown';
import RatingDisplay from './ui/RatingDisplay';
import CommentComponent from './ui/CommentComponent';
import CurrentRating from './ui/CurrentRating';
import { UserSession } from '@/lib/permissions';

interface User {
    id: number;
    username: string;
    avatar_url: string;
}

interface BeatmapInfo {
    id: number;
    beatmapset_id: number;
    title: string;
    artist: string;
    version: string;
    creator: string;
    star_rating: number;
    bpm: number;
    total_length: number;
    ar: number;
    cs: number;
    od: number;
    hp: number;
    url: string;
    cover_url: string;
}

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
    selectedByUsername?: string; // 新增：提名者的用户名
    selectedByAvatar?: string;   // 新增：提名者的头像URL
    selectedAt: string;
    season: string;
    category: string;
    url: string;
    coverUrl: string;
    approved: boolean;
    padding?: boolean;
    // 新增字段
    customModName?: string;
    customDASettings?: {
        cs?: number | null;
        ar?: number | null;
        od?: number | null;
        hp?: number | null;
    } | null;
    customDTRate?: number | null;
}

interface ModdedStats {
    cs?: number;
    ar?: number;
    od?: number;
    hp?: number;
    starRating?: number;
    bpm?: number;
}

const MOD_OPTIONS = [
    'NM', 'HD', 'HR', 'DT', 'FM', 'LZ', 'TB'
];

const CATEGORY_OPTIONS = [
    { value: 'qualification', label: '资格赛' },
    { value: 'ro32', label: '32强赛' },
    { value: 'ro16', label: '16强赛' },
    { value: 'quarterfinals', label: '四分之一决赛' },
    { value: 'semifinals', label: '半决赛' },
    { value: 'finals', label: '决赛' },
    { value: 'grandfinals', label: '总决赛' }
];

interface MapSelectionManagementProps {
    user: UserSession;
    permissions: {
        isAdmin: boolean;
        isMapSelector: boolean;
    };
}

export default function MapSelectionManagement({ user, permissions }: MapSelectionManagementProps) {
    // 格式化日期时间函数 - 使用本地化时间显示
    const formatDateTime = (dateTimeString: string) => {
        try {
            return new Date(dateTimeString).toLocaleString('zh-CN');
        } catch (error) {
            console.error('日期格式化错误:', error, dateTimeString);
            return '时间格式错误';
        }
    };

    // 转换UserSession为内部使用的User格式
    const userForState: User = {
        id: parseInt(user.osuId),
        username: user.username,
        avatar_url: user.avatar_url
    };

    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [_isAdmin, setIsAdmin] = useState(false);

    // Season configuration
    const [availableSeasons, setAvailableSeasons] = useState([
        { value: 's1', label: '第一赛季' }
    ]);

    // Map selection data
    const [selections, setSelections] = useState<MapSelection[]>([]);
    const [season, setSeason] = useState('s1');
    const [category, setCategory] = useState('qualification');
    const [modFilter, setModFilter] = useState<string>('all'); // 新增：mod筛选状态
    const [searchQuery, setSearchQuery] = useState<string>(''); // 新增：搜索查询状态
    const [sortByRating, setSortByRating] = useState<boolean>(false); // 新增：按评分排序状态

    // Rating states
    const [userRatings, setUserRatings] = useState<{ [key: number]: number }>({});
    interface MapRating {
        id: number;
        mapSelectionId: number;
        userId: string;
        username: string;
        avatar_url: string;
        rating: number;
        comment: string;
        createdAt: string;
        updatedAt: string;
    }

    interface ExistingSelection {
        selectedMods: string;
        modPosition: string;
        category: string;
        selectedByUsername: string;
    }

    const [mapRatings, setMapRatings] = useState<{ [key: number]: MapRating[] }>({});
    const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);

    // Add selection form
    const [showAddForm, setShowAddForm] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [selectedMods, setSelectedMods] = useState('NM');
    const [modPosition, setModPosition] = useState(1);
    const [comment, setComment] = useState('');
    const [approved, setApproved] = useState(false);
    const [padding, setPadding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [beatmapPreview, setBeatmapPreview] = useState<BeatmapInfo | null>(null);
    const [availableBeatmaps, setAvailableBeatmaps] = useState<BeatmapInfo[]>([]);
    const [moddedStats, setModdedStats] = useState<ModdedStats | null>(null);

    // 重复检查状态
    const [duplicateWarning, setDuplicateWarning] = useState<{
        show: boolean;
        beatmapId: number;
        existingSelections: ExistingSelection[];
    }>({
        show: false,
        beatmapId: 0,
        existingSelections: []
    });

    // Lazer特有mod相关状态
    const [customModName, setCustomModName] = useState('');
    const [availableLazerMods, setAvailableLazerMods] = useState<{ name: string, description: string }[]>([]);

    // DA mod自定义属性
    const [customCS, setCustomCS] = useState<number | ''>('');
    const [customAR, setCustomAR] = useState<number | ''>('');
    const [customOD, setCustomOD] = useState<number | ''>('');
    const [customHP, setCustomHP] = useState<number | ''>('');

    // DT自定义倍率
    const [customDTRate, setCustomDTRate] = useState<number | ''>(1.5);

    // 批量过审相关状态
    const [tempApprovedSelections, setTempApprovedSelections] = useState<Set<number>>(new Set());
    const [showBulkApprovalModal, setShowBulkApprovalModal] = useState(false);
    const [isBulkApproving, setIsBulkApproving] = useState(false);

    // 检查权限并加载数据
    useEffect(() => {
        const checkAccessAndLoadData = async () => {
            if (!user) return;

            const hasAccess = permissions.isMapSelector || permissions.isAdmin;
            if (!hasAccess) {
                showError('无权限访问选图系统');
                setIsLoading(false);
                return;
            }

            setIsAuthorized(true);
            setIsAdmin(permissions.isAdmin);

            // 获取赛季配置
            await loadSeasonConfig();
            setIsLoading(false);
        };

        if (user) {
            checkAccessAndLoadData();
        }
    }, [user, permissions]); // 当用户或权限改变时执行

    // 获取可用的Lazer特有mod
    const fetchAvailableLazerMods = async () => {
        try {
            const response = await fetch('/api/get-available-mods');
            if (response.ok) {
                const data = await response.json();
                setAvailableLazerMods(data.availableMods || []);
            } else {
                // 如果API失败，使用预定义的mod列表
                const fallbackMods = [
                    { name: 'DA', description: 'Difficulty Adjust - 自定义难度属性' },
                    { name: 'WG', description: 'Wiggle - 摆动效果' },
                    { name: 'MR', description: 'Mirror - 镜像' },
                    { name: 'RD', description: 'Random - 随机' },
                    { name: 'AS', description: 'Adaptive Speed - 自适应速度' },
                    { name: 'CL', description: 'Classic - 经典模式' },
                    { name: 'SG', description: 'Single Tap - 单键模式' },
                    { name: 'TC', description: 'Target Practice - 目标练习' },
                    { name: 'AC', description: 'Accuracy Challenge - 精确度挑战' }
                ];
                setAvailableLazerMods(fallbackMods);
            }
        } catch (error) {
            console.error('Failed to fetch available Lazer mods:', error);
            // 使用预定义的mod列表作为备选
            const fallbackMods = [
                { name: 'DA', description: 'Difficulty Adjust - 自定义难度属性' },
                { name: 'WG', description: 'Wiggle - 摆动效果' },
                { name: 'MR', description: 'Mirror - 镜像' },
                { name: 'RD', description: 'Random - 随机' },
                { name: 'AS', description: 'Adaptive Speed - 自适应速度' },
                { name: 'CL', description: 'Classic - 经典模式' },
                { name: 'SG', description: 'Single Tap - 单键模式' },
                { name: 'TC', description: 'Target Practice - 目标练习' },
                { name: 'AC', description: 'Accuracy Challenge - 精确度挑战' }
            ];
            setAvailableLazerMods(fallbackMods);
        }
    };

    // Get selection list
    useEffect(() => {
        if (isAuthorized && user) {
            fetchSelections();
        }
    }, [isAuthorized, user, season, category]);

    // Calculate modded stats when beatmap or mods change
    useEffect(() => {
        const updateModdedStats = async () => {
            if (beatmapPreview && user) {
                const customSettings = {
                    customModName: selectedMods === 'LZ' ? customModName : undefined,
                    customDASettings: customModName === 'DA' && selectedMods === 'LZ' ? {
                        cs: customCS !== '' ? customCS : null,
                        ar: customAR !== '' ? customAR : null,
                        od: customOD !== '' ? customOD : null,
                        hp: customHP !== '' ? customHP : null,
                    } : null,
                    customDTRate: selectedMods === 'DT' && customDTRate !== '' ? customDTRate : null,
                };
                const stats = await calculateModdedStatsAPI(beatmapPreview, selectedMods, customSettings);
                setModdedStats(stats);
            } else {
                setModdedStats(null);
            }
        };

        updateModdedStats();
    }, [beatmapPreview, selectedMods, customModName, customCS, customAR, customOD, customHP, customDTRate, user]);

    const loadSeasonConfig = async () => {
        try {
            const response = await fetch('/api/season-config');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setAvailableSeasons(data.availableSeasons);
                    setSeason(data.defaultSeason);
                    console.log('Season config loaded:', data);
                }
            }
        } catch (error) {
            console.error('Failed to load season config:', error);
            // 使用默认配置
        }
    };

    // 处理输入变化
    const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrlInput(e.target.value);
    };

    // 处理按键事件（回车键解析）
    const handleUrlInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isSubmitting && urlInput.trim()) {
            e.preventDefault();
            parseBeatmapUrl();
        }
    };

    const fetchSelections = async () => {
        if (!userForState?.id) {
            console.warn('fetchSelections called without user ID');
            return;
        }

        try {
            const response = await fetch(`/api/map-selections?season=${season}&category=${category}&osuId=${userForState.id}`);
            if (response.ok) {
                const data = await response.json();
                setSelections(data.selections || []);

                // 获取所有选图的评分数据
                if (data.selections && data.selections.length > 0) {
                    for (const selection of data.selections) {
                        fetchMapRatings(selection.id);
                    }
                }
            } else {
                const errorData = await response.json();
                showError(errorData.error || '获取选图列表失败');
            }
        } catch (error) {
            console.error('Failed to fetch selections:', error);
            showError('获取选图列表时出错');
        }
    };

    const parseBeatmapUrl = async () => {
        if (!urlInput.trim()) {
            showError('请输入beatmap链接');
            return;
        }
        if (!userForState?.id) {
            showError('请先登录');
            return;
        }

        setIsSubmitting(true);
        // Clear error (using global notifications now)
        setBeatmapPreview(null);
        setAvailableBeatmaps([]);

        try {
            const response = await fetch('/api/parse-beatmap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: urlInput.trim(),
                    osuId: userForState.id.toString()
                })
            });

            const data = await response.json();

            if (data.success) {
                if (data.beatmaps && data.beatmaps.length > 0) {
                    setAvailableBeatmaps(data.beatmaps);
                    // 如果只有一个谱面，直接预览
                    if (data.beatmaps.length === 1) {
                        setBeatmapPreview(data.beatmaps[0]);
                    }
                } else {
                    showError('未找到有效的beatmap数据');
                }
            } else {
                showError(data.error || '解析beatmap失败');
            }
        } catch (error) {
            console.error('Parse beatmap error:', error);
            showError('解析beatmap时出错');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 计算mod后的属性
    interface CustomSettings {
        customDASettings: {
            cs: number | null;
            ar: number | null;
            od: number | null;
            hp: number | null;
        } | null;
        customDTRate: number | null;
    }

    const calculateModdedStatsAPI = async (beatmap: BeatmapInfo, mods: string, customSettings: CustomSettings) => {
        try {
            const response = await fetch('/api/calculate-mod-stats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    beatmap,
                    mods,
                    customSettings
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data.stats;
            } else {
                console.error('Failed to calculate modded stats');
                return null;
            }
        } catch (error) {
            console.error('Error calculating modded stats:', error);
            return null;
        }
    };

    // 获取地图评分
    const fetchMapRatings = async (selectionId: number) => {
        try {
            const response = await fetch(`/api/map-ratings?selectionId=${selectionId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setMapRatings(prev => ({
                        ...prev,
                        [selectionId]: data.ratings
                    }));

                    // 设置当前用户的评分
                    const userRating = data.ratings.find((rating: MapRating) => rating.userId === userForState.id.toString());
                    if (userRating) {
                        setUserRatings(prev => ({
                            ...prev,
                            [selectionId]: userRating.rating
                        }));
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch map ratings:', error);
        }
    };

    // 提交评分
    const submitRating = async (selectionId: number, rating: number) => {
        if (!userForState?.id) {
            showError('请先登录');
            return;
        }

        setIsRatingSubmitting(true);
        try {
            const response = await fetch('/api/map-ratings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    selectionId,
                    userId: userForState.id.toString(),
                    rating
                })
            });

            const data = await response.json();
            if (data.success) {
                // 更新本地状态
                setUserRatings(prev => ({
                    ...prev,
                    [selectionId]: rating
                }));

                // 重新获取评分数据
                await fetchMapRatings(selectionId);

                showSuccess('评分提交成功');
            } else {
                showError(data.error || '评分提交失败');
            }
        } catch (error) {
            console.error('Rating submission error:', error);
            showError('评分提交时出错');
        } finally {
            setIsRatingSubmitting(false);
        }
    };

    // 添加选图
    const addSelection = async () => {
        if (!beatmapPreview) {
            showError('请先解析beatmap');
            return;
        }
        if (!userForState?.id) {
            showError('请先登录');
            return;
        }

        setIsSubmitting(true);
        try {
            const customSettings = {
                customModName: selectedMods === 'LZ' ? customModName : undefined,
                customDASettings: customModName === 'DA' && selectedMods === 'LZ' ? {
                    cs: customCS !== '' ? customCS : null,
                    ar: customAR !== '' ? customAR : null,
                    od: customOD !== '' ? customOD : null,
                    hp: customHP !== '' ? customHP : null,
                } : null,
                customDTRate: selectedMods === 'DT' && customDTRate !== '' ? customDTRate : null,
            };

            const response = await fetch('/api/map-selections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    beatmapId: beatmapPreview.id,
                    beatmapsetId: beatmapPreview.beatmapset_id,
                    title: beatmapPreview.title,
                    artist: beatmapPreview.artist,
                    version: beatmapPreview.version,
                    creator: beatmapPreview.creator,
                    starRating: beatmapPreview.star_rating,
                    bpm: beatmapPreview.bpm,
                    totalLength: beatmapPreview.total_length,
                    ar: beatmapPreview.ar,
                    cs: beatmapPreview.cs,
                    od: beatmapPreview.od,
                    hp: beatmapPreview.hp,
                    selectedMods,
                    modPosition,
                    comment,
                    approved,
                    padding,
                    season,
                    category,
                    url: beatmapPreview.url,
                    coverUrl: beatmapPreview.cover_url,
                    selectedBy: userForState.id.toString(),
                    customSettings
                })
            });

            const data = await response.json();
            if (data.success) {
                showSuccess('选图添加成功');
                // 重置表单
                setUrlInput('');
                setBeatmapPreview(null);
                setAvailableBeatmaps([]);
                setComment('');
                setApproved(false);
                setPadding(false);
                setCustomModName('');
                setCustomCS('');
                setCustomAR('');
                setCustomOD('');
                setCustomHP('');
                setCustomDTRate(1.5);
                setShowAddForm(false);
                setDuplicateWarning({ show: false, beatmapId: 0, existingSelections: [] });

                // 刷新选图列表
                await fetchSelections();
            } else {
                showError(data.error || '添加选图失败');
            }
        } catch (error) {
            console.error('Add selection error:', error);
            showError('添加选图时出错');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 删除选图
    const deleteSelection = async (selectionId: number) => {
        if (!confirm('确定要删除这个选图吗？此操作不可撤销。')) {
            return;
        }

        try {
            const response = await fetch('/api/map-selections', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: selectionId })
            });

            const data = await response.json();
            if (data.success) {
                showSuccess('选图删除成功');
                // 刷新选图列表
                await fetchSelections();
            } else {
                showError(data.error || '删除选图失败');
            }
        } catch (error) {
            console.error('Delete selection error:', error);
            showError('删除选图时出错');
        }
    };

    // 切换过审状态
    const toggleApproval = async (selectionId: number, currentApproved: boolean) => {
        try {
            const response = await fetch('/api/map-selections/approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: selectionId,
                    approved: !currentApproved
                })
            });

            const data = await response.json();
            if (data.success) {
                showSuccess(currentApproved ? '已取消过审' : '过审成功');
                // 刷新选图列表
                await fetchSelections();
            } else {
                showError(data.error || '操作失败');
            }
        } catch (error) {
            console.error('Toggle approval error:', error);
            showError('操作时出错');
        }
    };

    // 批量过审
    const handleBulkApproval = async () => {
        if (tempApprovedSelections.size === 0) {
            showError('请选择要过审的选图');
            return;
        }

        setIsBulkApproving(true);
        try {
            const response = await fetch('/api/map-selections/bulk-approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    selectionIds: Array.from(tempApprovedSelections),
                    approved: true
                })
            });

            const data = await response.json();
            if (data.success) {
                showSuccess(`批量过审成功，共过审 ${tempApprovedSelections.size} 个选图`);
                setTempApprovedSelections(new Set());
                setShowBulkApprovalModal(false);
                // 刷新选图列表
                await fetchSelections();
            } else {
                showError(data.error || '批量过审失败');
            }
        } catch (error) {
            console.error('Bulk approval error:', error);
            showError('批量过审时出错');
        } finally {
            setIsBulkApproving(false);
        }
    };

    // 根据mod名返回对应的颜色class
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

    // 格式化时间长度
    const formatLength = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // 筛选和排序选图
    const filteredSelections = selections
        .filter(selection => {
            // MOD筛选
            if (modFilter !== 'all' && selection.selectedMods !== modFilter) {
                return false;
            }

            // 搜索筛选
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                return (
                    selection.title.toLowerCase().includes(query) ||
                    selection.artist.toLowerCase().includes(query) ||
                    selection.creator.toLowerCase().includes(query) ||
                    selection.version.toLowerCase().includes(query) ||
                    (selection.selectedByUsername && selection.selectedByUsername.toLowerCase().includes(query))
                );
            }

            return true;
        })
        .sort((a, b) => {
            // 按评分排序
            if (sortByRating) {
                const aRating = mapRatings[a.id]?.reduce((sum, rating) => sum + rating.rating, 0) / (mapRatings[a.id]?.length || 1) || 0;
                const bRating = mapRatings[b.id]?.reduce((sum, rating) => sum + rating.rating, 0) / (mapRatings[b.id]?.length || 1) || 0;
                return bRating - aRating;
            }

            // 默认按创建时间排序（最新的在前）
            return new Date(b.selectedAt).getTime() - new Date(a.selectedAt).getTime();
        });

    // 获取可用的mod选项（包含数量统计）
    const getModFilterOptions = () => {
        const modCounts: { [key: string]: number } = {};

        // 统计每个mod的数量
        selections.forEach(selection => {
            const mod = selection.selectedMods;
            modCounts[mod] = (modCounts[mod] || 0) + 1;
        });

        // 生成选项列表
        const options = [
            { value: 'all', label: '全部', count: selections.length }
        ];

        // 添加各个mod选项
        Object.entries(modCounts).forEach(([mod, count]) => {
            options.push({ value: mod, label: mod, count });
        });

        return options;
    };

    // 初始化
    useEffect(() => {
        fetchAvailableLazerMods();
    }, []);

    return (
        <div className="max-w-9xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">选图管理</h2>

            {isLoading ? (
                <div className="text-center py-8">
                    <div className="text-lg">正在加载...</div>
                </div>
            ) : (
                <>
                    {/* 筛选和控制栏 */}
                    <div className="mb-4 flex gap-4 flex-wrap">
                        <Dropdown
                            options={availableSeasons}
                            value={season}
                            onChange={setSeason}
                            placeholder="选择赛季"
                            minWidth="8rem"
                        />
                        <Dropdown
                            options={CATEGORY_OPTIONS}
                            value={category}
                            onChange={setCategory}
                            placeholder="选择阶段"
                            minWidth="8rem"
                        />
                        <Dropdown
                            options={getModFilterOptions()}
                            value={modFilter}
                            onChange={setModFilter}
                            placeholder="筛选MOD"
                            minWidth="6rem"
                        />

                        {/* 搜索框 */}
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="搜索歌曲、艺术家、作者..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* 排序切换 */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={sortByRating}
                                onChange={(e) => setSortByRating(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">按评分排序</span>
                        </label>

                        {/* 添加选图按钮 */}
                        {(permissions.isMapSelector || permissions.isAdmin) && (
                            <button
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                            >
                                {showAddForm ? '取消添加' : '+ 添加选图'}
                            </button>
                        )}

                        {/* 批量过审按钮 */}
                        {permissions.isAdmin && tempApprovedSelections.size > 0 && (
                            <button
                                onClick={() => setShowBulkApprovalModal(true)}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
                            >
                                批量过审 ({tempApprovedSelections.size})
                            </button>
                        )}
                    </div>

                    {/* 添加选图表单 */}
                    {showAddForm && (
                        <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-gray-50">
                            <h3 className="text-lg font-bold mb-4">添加新选图</h3>

                            {/* URL输入 */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Beatmap URL
                                </label>
                                <input
                                    type="text"
                                    value={urlInput}
                                    onChange={handleUrlInputChange}
                                    onKeyDown={handleUrlInputKeyDown}
                                    placeholder="粘贴osu! beatmap链接或ID"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isSubmitting}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    支持完整的URL或beatmap ID，按回车键解析
                                </p>
                            </div>

                            {/* Beatmap选择 */}
                            {availableBeatmaps.length > 1 && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        选择难度
                                    </label>
                                    <select
                                        value={beatmapPreview?.id || ''}
                                        onChange={(e) => {
                                            const selected = availableBeatmaps.find(b => b.id.toString() === e.target.value);
                                            setBeatmapPreview(selected || null);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">请选择难度...</option>
                                        {availableBeatmaps.map(beatmap => (
                                            <option key={beatmap.id} value={beatmap.id}>
                                                {beatmap.version} ({beatmap.star_rating.toFixed(2)}★)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Beatmap预览 */}
                            {beatmapPreview && (
                                <div className="mb-4 p-3 bg-white border border-gray-300 rounded-md">
                                    <div className="flex items-start gap-4">
                                        <Image
                                            src={beatmapPreview.cover_url}
                                            alt="Beatmap cover"
                                            width={64}
                                            height={64}
                                            className="w-16 h-16 object-cover rounded"
                                        />
                                        <div className="flex-1">
                                            <h4 className="font-bold">{beatmapPreview.title}</h4>
                                            <p className="text-sm text-gray-600">{beatmapPreview.artist} / {beatmapPreview.creator}</p>
                                            <p className="text-sm text-gray-600">[{beatmapPreview.version}] ★{beatmapPreview.star_rating.toFixed(2)}</p>
                                            <p className="text-sm text-gray-600">
                                                CS: {beatmapPreview.cs} | AR: {beatmapPreview.ar} | OD: {beatmapPreview.od} | HP: {beatmapPreview.hp}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                BPM: {beatmapPreview.bpm} | Length: {formatLength(beatmapPreview.total_length)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Mod选择 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        MOD
                                    </label>
                                    <select
                                        value={selectedMods}
                                        onChange={(e) => setSelectedMods(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {MOD_OPTIONS.map(mod => (
                                            <option key={mod} value={mod}>{mod}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        位置
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={modPosition}
                                        onChange={(e) => setModPosition(parseInt(e.target.value) || 1)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Lazer特有mod设置 */}
                            {selectedMods === 'LZ' && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <h4 className="font-medium text-blue-800 mb-2">Lazer特有MOD设置</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                MOD名称
                                            </label>
                                            <select
                                                value={customModName}
                                                onChange={(e) => setCustomModName(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">选择MOD...</option>
                                                {availableLazerMods.map(mod => (
                                                    <option key={mod.name} value={mod.name}>
                                                        {mod.name} - {mod.description}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* DA mod自定义属性 */}
                                    {customModName === 'DA' && (
                                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                            <h5 className="font-medium text-yellow-800 mb-2">Difficulty Adjust 设置</h5>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">CS</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max="10"
                                                        value={customCS}
                                                        onChange={(e) => setCustomCS(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                                        placeholder="原值"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">AR</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max="10"
                                                        value={customAR}
                                                        onChange={(e) => setCustomAR(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                                        placeholder="原值"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">OD</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max="10"
                                                        value={customOD}
                                                        onChange={(e) => setCustomOD(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                                        placeholder="原值"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">HP</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max="10"
                                                        value={customHP}
                                                        onChange={(e) => setCustomHP(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                                        placeholder="原值"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* DT自定义倍率 */}
                            {selectedMods === 'DT' && (
                                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
                                    <h4 className="font-medium text-purple-800 mb-2">DT 设置</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            自定义倍率
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="1.0"
                                            max="2.0"
                                            value={customDTRate}
                                            onChange={(e) => setCustomDTRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="1.5"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            默认1.5倍，可自定义1.0-2.0之间的倍率
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Mod后的属性预览 */}
                            {moddedStats && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                    <h4 className="font-medium text-green-800 mb-2">应用MOD后的属性</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                        <div>CS: {moddedStats.cs?.toFixed(1) || 'N/A'}</div>
                                        <div>AR: {moddedStats.ar?.toFixed(1) || 'N/A'}</div>
                                        <div>OD: {moddedStats.od?.toFixed(1) || 'N/A'}</div>
                                        <div>HP: {moddedStats.hp?.toFixed(1) || 'N/A'}</div>
                                        <div className="col-span-2">星级: {moddedStats.starRating?.toFixed(2) || 'N/A'}★</div>
                                        <div className="col-span-2">BPM: {moddedStats.bpm || 'N/A'}</div>
                                    </div>
                                </div>
                            )}

                            {/* 重复检查警告 */}
                            {duplicateWarning.show && (
                                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <h4 className="font-medium text-yellow-800 mb-2">⚠️ 重复检测</h4>
                                    <p className="text-yellow-700 text-sm mb-2">
                                        此谱面已被选择 {duplicateWarning.existingSelections.length} 次：
                                    </p>
                                    <ul className="text-sm text-yellow-700 list-disc list-inside">
                                        {duplicateWarning.existingSelections.map((sel: ExistingSelection, index: number) => (
                                            <li key={index}>
                                                {sel.selectedMods}{sel.modPosition} - {sel.category} - {sel.selectedByUsername}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* 评论和选项 */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    评论
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="添加评论..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex gap-4 items-center mb-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={approved}
                                        onChange={(e) => setApproved(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">直接过审</span>
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={padding}
                                        onChange={(e) => setPadding(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Padding图</span>
                                </label>
                            </div>

                            {/* 提交按钮 */}
                            <div className="flex gap-4">
                                <button
                                    onClick={addSelection}
                                    disabled={isSubmitting || !beatmapPreview}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-md transition-colors"
                                >
                                    {isSubmitting ? '添加中...' : '添加选图'}
                                </button>
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
                                >
                                    取消
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 选图列表 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSelections.map(selection => (
                            <div
                                key={selection.id}
                                className={`border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 ${selection.approved ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-white'
                                    }`}
                            >
                                {/* 头部：封面和基本信息 */}
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="relative">
                                        <Image
                                            src={selection.coverUrl}
                                            alt="Beatmap cover"
                                            width={64}
                                            height={64}
                                            className="w-16 h-16 object-cover rounded"
                                        />
                                        {/* 过审状态指示器 */}
                                        {selection.approved && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getModColorClass(selection.selectedMods)}`}>
                                                {selection.selectedMods === 'LZ' ?
                                                    (selection.customModName && selection.customModName.trim() !== '' ?
                                                        `LZ${selection.modPosition}-${selection.customModName}` :
                                                        `LZ${selection.modPosition}`) :
                                                    selection.selectedMods === 'DT' ?
                                                        ((selection.customDTRate && selection.customDTRate !== 1.5) ?
                                                            `DT${selection.modPosition}-${selection.customDTRate.toFixed(1)}倍` :
                                                            `DT${selection.modPosition}`) :
                                                        `${selection.selectedMods}${selection.modPosition}`
                                                }
                                            </span>
                                            {selection.padding && (
                                                <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">
                                                    Padding
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-sm truncate" title={selection.title}>
                                            {selection.title}
                                        </h3>
                                        <p className="text-xs text-gray-600 truncate" title={`${selection.artist} - ${selection.creator}`}>
                                            {selection.artist} - {selection.creator}
                                        </p>
                                        <p className="text-xs text-gray-600">[{selection.version}]</p>
                                    </div>
                                </div>

                                {/* 属性信息 */}
                                <div className="mb-3 text-xs text-gray-600">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>★ {selection.starRating.toFixed(2)}</div>
                                        <div>{formatLength(selection.totalLength)}</div>
                                        <div>BPM: {selection.bpm}</div>
                                        <div>CS: {selection.cs.toFixed(1)} | AR: {selection.ar.toFixed(1)}</div>
                                    </div>
                                </div>

                                {/* 提名者信息 */}
                                <div className="mb-3 text-xs text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <span>提名者: {selection.selectedByUsername || '未知'}</span>
                                        <span>•</span>
                                        <span>{formatDateTime(selection.selectedAt)}</span>
                                    </div>
                                </div>

                                {/* 评论 */}
                                {selection.comment && (
                                    <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-700">
                                        {selection.comment}
                                    </div>
                                )}

                                {/* 评分组件 */}
                                <div className="mb-3">
                                    <CurrentRating
                                        rating={userRatings[selection.id] || 0}
                                        onRatingChange={(rating) => submitRating(selection.id, rating)}
                                        isSubmitting={isRatingSubmitting}
                                        userId={userForState.id.toString()}
                                    />
                                    <RatingDisplay
                                        ratings={mapRatings[selection.id] || []}
                                        selectedBy={selection.selectedBy}
                                        currentUserId={userForState.id.toString()}
                                        compact={true}
                                        isAdmin={permissions.isAdmin}
                                    />
                                </div>

                                {/* 操作按钮 */}
                                <div className="flex gap-2">
                                    <a
                                        href={selection.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded text-center transition-colors"
                                    >
                                        查看谱面
                                    </a>

                                    {/* 过审按钮 - 仅管理员可见 */}
                                    {permissions.isAdmin && (
                                        <button
                                            onClick={() => toggleApproval(selection.id, selection.approved)}
                                            className={`px-3 py-2 text-xs rounded transition-colors ${selection.approved
                                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                                : 'bg-gray-500 hover:bg-gray-600 text-white'
                                                }`}
                                        >
                                            {selection.approved ? '取消过审' : '过审'}
                                        </button>
                                    )}

                                    {/* 批量选择复选框 - 仅管理员可见 */}
                                    {permissions.isAdmin && !selection.approved && (
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={tempApprovedSelections.has(selection.id)}
                                                onChange={(e) => {
                                                    const newSelections = new Set(tempApprovedSelections);
                                                    if (e.target.checked) {
                                                        newSelections.add(selection.id);
                                                    } else {
                                                        newSelections.delete(selection.id);
                                                    }
                                                    setTempApprovedSelections(newSelections);
                                                }}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                        </label>
                                    )}

                                    {/* 删除按钮 - 仅提名者或管理员可见 */}
                                    {(selection.selectedBy === userForState.id.toString() || permissions.isAdmin) && (
                                        <button
                                            onClick={() => deleteSelection(selection.id)}
                                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                                        >
                                            删除
                                        </button>
                                    )}
                                </div>

                                {/* 评论区 */}
                                <div className="mt-4 pt-3 border-t border-gray-300">
                                    <CommentComponent
                                        mapSelectionId={selection.id}
                                        userId={userForState.id.toString()}
                                        onCommentUpdate={fetchSelections}
                                        compactMode={true}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredSelections.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            {selections.length === 0 ? '暂无选图' : '没有符合筛选条件的选图'}
                        </div>
                    )}
                </>
            )}

            {/* 批量过审弹窗 */}
            {showBulkApprovalModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">批量过审确认</h3>
                        <p className="text-gray-600 mb-4">
                            以下 {tempApprovedSelections.size} 个选图将被过审并公开，请确认：
                        </p>

                        <div className="overflow-x-auto">
                            <table className="table-auto w-full text-sm border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-300 px-3 py-2 text-left">Mod</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">歌曲</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">艺术家</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">难度</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">提名者</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSelections
                                        .filter(selection => tempApprovedSelections.has(selection.id) && !selection.approved)
                                        .map(selection => (
                                            <tr key={selection.id} className="hover:bg-gray-50">
                                                <td className="border border-gray-300 px-3 py-2">
                                                    <span className={`${getModColorClass(selection.selectedMods)} text-white px-2 py-1 rounded text-sm font-bold`}>
                                                        {selection.selectedMods === 'LZ' ?
                                                            (selection.customModName && selection.customModName.trim() !== '' ?
                                                                `LZ${selection.modPosition}-${selection.customModName}` :
                                                                `LZ${selection.modPosition}`) :
                                                            selection.selectedMods === 'DT' ?
                                                                ((selection.customDTRate && selection.customDTRate !== 1.5) ?
                                                                    `DT${selection.modPosition}-${selection.customDTRate.toFixed(1)}倍` :
                                                                    `DT${selection.modPosition}`) :
                                                                `${selection.selectedMods}${selection.modPosition}`
                                                        }
                                                    </span>
                                                </td>
                                                <td className="border border-gray-300 px-3 py-2">{selection.title}</td>
                                                <td className="border border-gray-300 px-3 py-2">{selection.artist}</td>
                                                <td className="border border-gray-300 px-3 py-2">{selection.version}</td>
                                                <td className="border border-gray-300 px-3 py-2">{selection.selectedByUsername}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex gap-4 justify-end mt-6">
                            <button
                                onClick={() => setShowBulkApprovalModal(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleBulkApproval}
                                disabled={isBulkApproving}
                                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white px-4 py-2 rounded"
                            >
                                {isBulkApproving ? '过审中...' : `确认过审 (${tempApprovedSelections.size} 个)`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}