"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { showSuccess, showError, showInfo } from '../ui/Notification';
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
    totalLength?: number;
}

const MOD_OPTIONS = [
    'NM', 'HD', 'HR', 'DT', 'FM', 'LZ', 'TB'
];

const CATEGORY_OPTIONS = [
    { value: 'qualification', label: 'QUA' },
    { value: 'ro16', label: 'RO16' },
    { value: 'quarterfinals', label: 'QF' },
    { value: 'semifinals', label: 'SF' },
    { value: 'finals', label: 'F' },
    { value: 'grandfinals', label: 'GF' }
];

interface MapSelectionManagementProps {
    user: UserSession;
    permissions: {
        isAdmin: boolean;
        isMapSelector: boolean;
        isReplayTester: boolean;
        isStreamer: boolean;
        isReferee: boolean;
        isCommentator: boolean;
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
        id: parseInt(user.osuId) || 0,
        username: user.username,
        avatar_url: user.avatar_url
    };

    // 状态定义 - 必须在任何条件逻辑之前
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Season configuration
    const [availableSeasons, setAvailableSeasons] = useState([
        { value: 's1', label: '第一赛季' }
    ]);

    // Map selection data
    const [selections, setSelections] = useState<MapSelection[]>([]);

    // 从本地存储加载初始值
    const [season, setSeason] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('mapSelection_season') || 's1';
        }
        return 's1';
    });
    const [category, setCategory] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('mapSelection_category') || 'qualification';
        }
        return 'qualification';
    });
    const [modFilter, setModFilter] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('mapSelection_modFilter') || 'all';
        }
        return 'all';
    });

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

    // 右键菜单状态
    const [contextMenu, setContextMenu] = useState<{
        show: boolean;
        x: number;
        y: number;
        selection: MapSelection | null;
    }>({
        show: false,
        x: 0,
        y: 0,
        selection: null
    });

    // 编辑对话框状态
    const [editDialog, setEditDialog] = useState<{
        show: boolean;
        selection: MapSelection | null;
        isSubmitting: boolean;
    }>({
        show: false,
        selection: null,
        isSubmitting: false
    });

    // 检查权限并加载数据
    useEffect(() => {
        const checkAccessAndLoadData = async () => {
            if (!user) return;

            const hasAccess = permissions.isMapSelector || permissions.isAdmin || permissions.isReferee || permissions.isStreamer || permissions.isCommentator;
            if (!hasAccess) {
                showError('无权限访问选图系统');
                setIsLoading(false);
                return;
            }

            setIsAuthorized(true);

            // 获取赛季配置
            await loadSeasonConfig();
            setIsLoading(false);
        };

        if (user) {
            checkAccessAndLoadData();
        }
    }, [user, permissions]); // 当用户或权限改变时执行

    // 获取地图评分
    const fetchMapRatings = useCallback(async (selectionId: number) => {
        try {
            const response = await fetch(`/api/map-ratings?mapSelectionId=${selectionId}`);
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
            } else {
                console.error('Failed to fetch map ratings');
            }
        } catch (error) {
            console.error('Error fetching map ratings:', error);
        }
    }, [userForState.id]);

    const fetchSelections = useCallback(async () => {
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
    }, [season, category, userForState?.id, fetchMapRatings]);

    // 计算mod后的属性
    interface CustomSettings {
        customModName?: string;
        customDASettings?: {
            cs: number | null;
            ar: number | null;
            od: number | null;
            hp: number | null;
        } | null;
        customDTRate?: number | null;
    }

    const calculateModdedStatsAPI = useCallback(async (beatmap: BeatmapInfo, mods: string, customSettings: CustomSettings) => {
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
                return data.modStats;
            } else {
                console.error('Failed to calculate modded stats');
                return null;
            }
        } catch (error) {
            console.error('Error calculating modded stats:', error);
            return null;
        }
    }, []);

    // Get selection list
    useEffect(() => {
        if (isAuthorized && user) {
            fetchSelections();
        }
    }, [isAuthorized, user, fetchSelections]);

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
    }, [beatmapPreview, selectedMods, customModName, customCS, customAR, customOD, customHP, customDTRate, user, calculateModdedStatsAPI]);

    // 初始化
    useEffect(() => {
        fetchAvailableLazerMods();
    }, []);

    // 验证用户数据
    if (!userForState.id || isNaN(userForState.id)) {
        return (
            <div className="space-y-6">
                <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                    <h3 className="text-xl font-bold text-white mb-4">选图管理</h3>
                    <p className="text-red-400">用户数据无效，请重新登录</p>
                </div>
            </div>
        );
    }

    // 自定义 onChange 处理函数 - 保存到本地存储
    const handleSeasonChange = (value: string) => {
        setSeason(value);
        if (typeof window !== 'undefined') {
            localStorage.setItem('mapSelection_season', value);
        }
    };

    const handleCategoryChange = (value: string) => {
        setCategory(value);
        if (typeof window !== 'undefined') {
            localStorage.setItem('mapSelection_category', value);
        }
    };

    const handleModFilterChange = (value: string) => {
        setModFilter(value);
        if (typeof window !== 'undefined') {
            localStorage.setItem('mapSelection_modFilter', value);
        }
    };

    // 右键菜单处理函数
    const handleContextMenu = (e: React.MouseEvent, selection: MapSelection) => {
        e.preventDefault();
        setContextMenu({
            show: true,
            x: e.clientX,
            y: e.clientY,
            selection
        });
    };

    const closeContextMenu = () => {
        setContextMenu({
            show: false,
            x: 0,
            y: 0,
            selection: null
        });
    };

    // 复制BID到剪贴板
    const copyBeatmapId = async (beatmapId: number) => {
        try {
            await navigator.clipboard.writeText(beatmapId.toString());
            showSuccess('Beatmap ID已复制到剪贴板');
        } catch (error) {
            console.error('复制失败:', error);
            showError('复制失败');
        }
    };

    // 获取可用的Lazer特有mod
    const fetchAvailableLazerMods = async () => {
        const fallbackMods = [
            { name: 'DA', description: 'Difficulty Adjust - 自定义难度属性' },
            { name: 'AD', description: 'Approach Different - 不一样的缩圈' },
            { name: 'AS', description: 'Adaptive Speed - 自适应速度' },
            { name: 'BM', description: 'Bloom - 缩圈越来越大' },
            { name: 'BR', description: 'Barrel Roll - 旋转' },
            { name: 'BU', description: 'Bubbles - 气泡一样的显示方式' },
            { name: 'DF', description: 'Deflate - ' },
            { name: 'DP', description: 'Depth - 3d模式' },
            { name: 'FR', description: 'Freeze Frame - 每组note都一起分组出现' },
            { name: 'GR', description: 'Grow - 逐渐变大' },
            { name: 'MG', description: 'Magnetised - 自动吸note' },
            { name: 'MU', description: 'Muted - 我的世界没有声音' },
            { name: 'NS', description: 'No Scope - 我的世界没有瞄准' },
            { name: 'RP', description: 'Repel - ' },
            { name: 'SI', description: 'Spin In - 精确度挑战' },
            { name: 'SY', description: 'Synesthesia - 缩圈颜色为节奏型' },
            { name: 'TC', description: 'Traceable - 只有缩圈' },
            { name: 'TR', description: 'Transform - ' },
            { name: 'WD', description: 'Wind Down - ' },
            { name: 'WG', description: 'Wiggle - ' },
            { name: 'WU', description: 'Wind Up - 精确度挑战' },
            // 后续添加的特殊mod组合
            { name: 'AD+BR(RollSpeed:6.0)', description: 'AD+BR(RollSpeed:6.0)' }
        ];
        setAvailableLazerMods(fallbackMods);
    };

    const loadSeasonConfig = async () => {
        try {
            const response = await fetch('/api/season-config');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setAvailableSeasons(data.availableSeasons);
                    setSeason(data.defaultSeason);
                    // // console.log('Season config loaded:', data);
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
                if (data.data) {
                    if (data.data.type === 'multiple' && data.data.beatmaps && data.data.beatmaps.length > 0) {
                        setAvailableBeatmaps(data.data.beatmaps);
                        // 如果只有一个谱面，直接预览
                        if (data.data.beatmaps.length === 1) {
                            setBeatmapPreview(data.data.beatmaps[0]);
                        }
                    } else if (data.data.type === 'single' && data.data.beatmap) {
                        setAvailableBeatmaps([data.data.beatmap]);
                        setBeatmapPreview(data.data.beatmap);
                    } else {
                        showError('未找到有效的beatmap数据');
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

    // 提交评分
    const submitRating = async (selectionId: number, rating: number) => {
        if (!userForState?.id || isNaN(userForState.id)) {
            showError('用户数据无效，请重新登录');
            return;
        }

        if (!selectionId || isNaN(selectionId)) {
            showError('无效的选图ID');
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
                    mapSelectionId: selectionId,
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
                    // Use modded stats if available, otherwise original
                    starRating: moddedStats?.starRating ?? beatmapPreview.star_rating,
                    bpm: moddedStats?.bpm ?? beatmapPreview.bpm,
                    totalLength: selectedMods === 'DT' && customDTRate !== '' ?
                        Math.round(beatmapPreview.total_length / (customDTRate as number)) :
                        beatmapPreview.total_length,
                    ar: moddedStats?.ar ?? beatmapPreview.ar,
                    cs: moddedStats?.cs ?? beatmapPreview.cs,
                    od: moddedStats?.od ?? beatmapPreview.od,
                    hp: moddedStats?.hp ?? beatmapPreview.hp,
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
                    selectedByUsername: userForState.username,
                    selectedByAvatar: userForState.avatar_url,
                    customModName: selectedMods === 'LZ' ? customModName : undefined,
                    customDTRate: selectedMods === 'DT' && customDTRate !== '' ? customDTRate : undefined,
                    customSettings
                    ,
                    // send computed modded stats for backend
                    moddedStats: moddedStats
                        ? {
                            ar: moddedStats.ar,
                            cs: moddedStats.cs,
                            od: moddedStats.od,
                            hp: moddedStats.hp,
                            star_rating: moddedStats.starRating,
                            bpm: moddedStats.bpm,
                            totalLength: selectedMods === 'DT' && customDTRate !== '' ?
                                Math.round(beatmapPreview.total_length / (customDTRate as number)) :
                                beatmapPreview.total_length
                        }
                        : undefined
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
        try {
            const response = await fetch(`/api/map-selections?id=${selectionId}&selectedBy=${userForState.id}`, {
                method: 'DELETE'
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

    // 刷新MOD属性
    const refreshSelection = async (selection: MapSelection) => {
        try {
            // 第一步：重新获取beatmap数据
            showInfo('正在重新获取beatmap数据...');
            const beatmapResponse = await fetch('/api/parse-beatmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: selection.url,
                    osuId: userForState.id.toString()
                })
            });

            if (!beatmapResponse.ok) {
                showError('重新获取beatmap数据失败');
                return;
            }

            const beatmapData = await beatmapResponse.json();
            if (!beatmapData.success || !beatmapData.data) {
                showError('重新获取beatmap数据失败: ' + (beatmapData.error || '未知错误'));
                return;
            }

            // 获取最新的beatmap信息
            const latestBeatmap = beatmapData.data.type === 'single'
                ? beatmapData.data.beatmap
                : beatmapData.data.beatmaps?.find((b: BeatmapInfo) => b.id === selection.beatmapId);

            if (!latestBeatmap) {
                showError('未找到对应的beatmap数据');
                return;
            }

            // 第二步：使用最新的beatmap数据计算mod属性
            showInfo('正在计算MOD属性...');
            const modStatsResponse = await fetch('/api/calculate-mod-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    beatmap: latestBeatmap,
                    mods: selection.selectedMods,
                    customSettings: {
                        customModName: selection.customModName,
                        customDASettings: selection.customDASettings,
                        customDTRate: selection.customDTRate
                    }
                })
            });

            if (!modStatsResponse.ok) {
                showError('计算MOD属性失败');
                return;
            }

            const { modStats } = await modStatsResponse.json();

            // 第三步：更新本地状态
            setSelections(prev => prev.map(s => s.id === selection.id ? ({
                ...s,
                ar: modStats.ar,
                cs: modStats.cs,
                od: modStats.od,
                hp: modStats.hp,
                starRating: modStats.starRating,
                bpm: modStats.bpm,
                // 计算DT时长
                totalLength: selection.selectedMods === 'DT' && selection.customDTRate ?
                    Math.round(latestBeatmap.total_length / selection.customDTRate) :
                    latestBeatmap.total_length,
                // 同时更新基础beatmap信息
                title: latestBeatmap.title,
                artist: latestBeatmap.artist,
                version: latestBeatmap.version,
                creator: latestBeatmap.creator,
                coverUrl: latestBeatmap.cover_url
            }) : s));

            // 第四步：将最终数据写入数据库
            showInfo('正在更新数据库...');
            try {
                const putResp = await fetch('/api/map-selections', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: selection.id,
                        selectedBy: userForState.id.toString(),
                        moddedStats: {
                            ar: modStats.ar,
                            cs: modStats.cs,
                            od: modStats.od,
                            hp: modStats.hp,
                            starRating: modStats.starRating,
                            bpm: modStats.bpm,
                            totalLength: selection.selectedMods === 'DT' && selection.customDTRate ?
                                Math.round(latestBeatmap.total_length / selection.customDTRate) :
                                latestBeatmap.total_length
                        },
                        // 同时更新基础beatmap信息，包括计算后的DT时长
                        title: latestBeatmap.title,
                        artist: latestBeatmap.artist,
                        version: latestBeatmap.version,
                        creator: latestBeatmap.creator,
                        totalLength: selection.selectedMods === 'DT' && selection.customDTRate ?
                            Math.round(latestBeatmap.total_length / selection.customDTRate) :
                            latestBeatmap.total_length,
                        coverUrl: latestBeatmap.cover_url
                    })
                });

                if (!putResp.ok) {
                    const err = await putResp.json();
                    showError('数据库更新失败: ' + (err.error || putResp.statusText));
                } else {
                    showSuccess('已重新获取beatmap数据、刷新MOD属性并更新数据库');
                }
            } catch (err) {
                console.error('Error updating backend:', err);
                showError('更新数据库时出错');
            }

            // 重新加载列表以确保数据一致
            await fetchSelections();
        } catch (error) {
            console.error('Refresh error:', error);
            showError('刷新属性时出错');
        }
    };

    // 切换过审状态
    const toggleApproval = async (selectionId: number, currentApproved: boolean) => {
        try {
            const response = await fetch('/api/map-selections', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: selectionId,
                    approved: !currentApproved,
                    selectedBy: userForState.id.toString()
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

    // 切换padding状态
    const togglePadding = async (selectionId: number, currentPadding: boolean) => {
        try {
            const response = await fetch('/api/map-selections', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: selectionId,
                    padding: !currentPadding,
                    selectedBy: userForState.id.toString()
                })
            });

            const data = await response.json();
            if (data.success) {
                showSuccess(currentPadding ? '已取消测图状态' : '已设为测图状态');
                // 刷新选图列表
                await fetchSelections();
            } else {
                showError(data.error || '操作失败');
            }
        } catch (error) {
            console.error('Toggle padding error:', error);
            showError('操作时出错');
        }
    };

    // 更新选图属性
    const updateSelectionAttributes = async (selectionId: number, updates: {
        title?: string;
        version?: string;
        ar?: number;
        od?: number;
        cs?: number;
        hp?: number;
        bpm?: number;
        totalLength?: number;
        selectedMods?: string;
        category?: string;
        comment?: string;
        customModName?: string;
        customDTRate?: number;
    }) => {
        setEditDialog(prev => ({ ...prev, isSubmitting: true }));

        try {
            const response = await fetch('/api/map-selections', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: selectionId,
                    selectedBy: userForState.id.toString(),
                    ...updates
                })
            });

            const data = await response.json();
            if (data.success) {
                showSuccess('属性更新成功');
                // 关闭编辑对话框
                setEditDialog({
                    show: false,
                    selection: null,
                    isSubmitting: false
                });
                // 刷新选图列表
                await fetchSelections();
            } else {
                showError(data.error || '属性更新失败');
                setEditDialog(prev => ({ ...prev, isSubmitting: false }));
            }
        } catch (error) {
            console.error('Update selection attributes error:', error);
            showError('属性更新时出错');
            setEditDialog(prev => ({ ...prev, isSubmitting: false }));
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
                    approved: true,
                    selectedBy: userForState.id.toString()
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

    // 解析 osu beatmap URL
    const parseOsuUrl = (url: string): { beatmapId?: number; beatmapsetId?: number } | null => {
        try {
            // 处理完整的 URL 或缩短的 URL
            let cleanUrl = url.trim();

            // 如果是完整的 URL，提取路径部分
            if (cleanUrl.includes('osu.ppy.sh/')) {
                const urlObj = new URL(cleanUrl);
                cleanUrl = urlObj.pathname;
            }

            // 匹配 beatmapsets/{setId}#osu/{mapId} 格式
            const beatmapsetWithMapMatch = cleanUrl.match(/^\/beatmapsets\/(\d+)#osu\/(\d+)$/);
            if (beatmapsetWithMapMatch) {
                return {
                    beatmapsetId: parseInt(beatmapsetWithMapMatch[1]),
                    beatmapId: parseInt(beatmapsetWithMapMatch[2])
                };
            }

            // 匹配 beatmapsets/{setId} 格式
            const beatmapsetMatch = cleanUrl.match(/^\/beatmapsets\/(\d+)$/);
            if (beatmapsetMatch) {
                return {
                    beatmapsetId: parseInt(beatmapsetMatch[1])
                };
            }

            // 匹配 /b/{mapId} 格式
            const beatmapMatch = cleanUrl.match(/^\/b\/(\d+)$/);
            if (beatmapMatch) {
                return {
                    beatmapId: parseInt(beatmapMatch[1])
                };
            }

            return null;
        } catch (error) {
            return null;
        }
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
                const query = searchQuery.toLowerCase().trim();

                // 检查是否是纯数字 - 直接匹配 beatmap ID 或 beatmapset ID
                if (/^\d+$/.test(query)) {
                    const numericQuery = parseInt(query);
                    return selection.beatmapId === numericQuery || selection.beatmapsetId === numericQuery;
                }

                // 检查是否是 osu beatmap URL
                const urlData = parseOsuUrl(searchQuery);
                if (urlData) {
                    if (urlData.beatmapId && urlData.beatmapsetId) {
                        // 如果同时有 beatmapId 和 beatmapsetId，精确匹配两者
                        return selection.beatmapId === urlData.beatmapId && selection.beatmapsetId === urlData.beatmapsetId;
                    } else if (urlData.beatmapId) {
                        // 只匹配 beatmapId
                        return selection.beatmapId === urlData.beatmapId;
                    } else if (urlData.beatmapsetId) {
                        // 只匹配 beatmapsetId
                        return selection.beatmapsetId === urlData.beatmapsetId;
                    }
                }

                // 检查是否是简化属性搜索格式 (属性名+数字，如 ar9, cs5, nm1)
                const simplifiedPropertyMatch = query.match(/^([a-zA-Z]+)(\d+(?:\.\d+)?)$/);
                if (simplifiedPropertyMatch) {
                    const [, property, valueStr] = simplifiedPropertyMatch;
                    const value = parseFloat(valueStr);

                    switch (property.toLowerCase()) {
                        case 'ar':
                            return Math.abs(selection.ar - value) < 0.01;
                        case 'cs':
                            return Math.abs(selection.cs - value) < 0.01;
                        case 'od':
                            return Math.abs(selection.od - value) < 0.01;
                        case 'hp':
                            return Math.abs(selection.hp - value) < 0.01;
                        case 'nm':
                        case 'hd':
                        case 'hr':
                        case 'dt':
                        case 'fm':
                        case 'lz':
                        case 'tb':
                            return selection.selectedMods.toLowerCase() === property.toLowerCase() && selection.modPosition === value;
                        default:
                            break;
                    }
                }

                // 检查是否是特殊搜索格式 (key:value)
                const specialSearchMatch = query.match(/^(\w+):(.+)$/);
                if (specialSearchMatch) {
                    const [, key, value] = specialSearchMatch;

                    switch (key.toLowerCase()) {
                        case 'ar':
                            return Math.abs(selection.ar - parseFloat(value)) < 0.01;
                        case 'cs':
                            return Math.abs(selection.cs - parseFloat(value)) < 0.01;
                        case 'od':
                            return Math.abs(selection.od - parseFloat(value)) < 0.01;
                        case 'hp':
                            return Math.abs(selection.hp - parseFloat(value)) < 0.01;
                        case 'bid':
                            return selection.beatmapId.toString() === value;
                        case 'sid':
                            return selection.beatmapsetId.toString() === value;
                        case 'mod':
                            return selection.selectedMods.toLowerCase() === value.toLowerCase();
                        default:
                            // 如果不是特殊格式，回退到普通文本搜索
                            break;
                    }
                }

                // 普通文本搜索
                return (
                    selection.title.toLowerCase().includes(query) ||
                    selection.artist.toLowerCase().includes(query) ||
                    selection.creator.toLowerCase().includes(query) ||
                    selection.version.toLowerCase().includes(query) ||
                    selection.selectedMods.toLowerCase().includes(query) ||
                    selection.beatmapId.toString().includes(query) ||
                    selection.beatmapsetId.toString().includes(query) ||
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

    // 按mod类型分组选图
    const getSelectionsByMod = () => {
        const grouped: { [key: string]: MapSelection[] } = {};

        // 按mod类型分组
        filteredSelections.forEach(selection => {
            const mod = selection.selectedMods;
            if (!grouped[mod]) {
                grouped[mod] = [];
            }
            grouped[mod].push(selection);
        });

        // 按mod顺序排序
        const modOrder = ['NM', 'HD', 'HR', 'DT', 'FM', 'LZ', 'TB'];
        const sortedGroups: { [key: string]: MapSelection[] } = {};

        modOrder.forEach(mod => {
            if (grouped[mod]) {
                sortedGroups[mod] = grouped[mod];
            }
        });

        // 添加其他mod类型
        Object.keys(grouped).forEach(mod => {
            if (!modOrder.includes(mod)) {
                sortedGroups[mod] = grouped[mod];
            }
        });

        return sortedGroups;
    };

    // 获取mod显示名称
    const getModDisplayName = (mod: string): string => {
        const modNames: { [key: string]: string } = {
            'NM': 'No Mod',
            'HD': 'Hidden',
            'HR': 'Hard Rock',
            'DT': 'Double Time',
            'FM': 'Free Mod',
            'LZ': 'Lazer Mod',
            'TB': 'Tiebreaker'
        };
        return modNames[mod] || mod;
    };

    return (
        <div className="max-w-9xl mx-auto p-6">
            {isLoading ? (
                <div className="text-center py-8">
                    <Image src='/icons/loading.svg' alt='loading' width={120} height={120} className='animate-spin' />
                    <div className="text-lg text-white">正在加载...</div>
                </div>
            ) : (
                <>
                    {/* 筛选和控制栏 */}
                    <div className="mb-4 flex gap-4 flex-wrap">
                        <Dropdown
                            options={availableSeasons}
                            value={season}
                            onChange={handleSeasonChange}
                            placeholder="选择赛季"
                            minWidth="8rem"
                        />
                        <Dropdown
                            options={CATEGORY_OPTIONS}
                            value={category}
                            onChange={handleCategoryChange}
                            placeholder="选择阶段"
                            minWidth="8rem"
                        />
                        <Dropdown
                            options={getModFilterOptions()}
                            value={modFilter}
                            onChange={handleModFilterChange}
                            placeholder="筛选MOD"
                            minWidth="6rem"
                        />

                        {/* 搜索框 */}
                        <div className="flex-1 min-w-[200px] text-gray-700 bg-white">
                            <input
                                type="text"
                                placeholder="搜索歌曲、艺术家、作者... 支持osu网址、BID/SID、ar9/cs5、mod"
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
                            <span className="text-sm text-white">按评分排序</span>
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
                        {(permissions.isAdmin || permissions.isMapSelector) && tempApprovedSelections.size > 0 && (
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
                        <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-gray-50 max-w-5xl object-center">
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
                                    <Dropdown
                                        label="选择难度"
                                        options={[
                                            { value: '', label: '请选择难度...' },
                                            ...availableBeatmaps.map(beatmap => ({
                                                value: beatmap.id.toString(),
                                                label: `${beatmap.version} (${beatmap.star_rating.toFixed(2)}★)`
                                            }))
                                        ]}
                                        value={beatmapPreview?.id?.toString() || ''}
                                        onChange={(value) => {
                                            const selected = availableBeatmaps.find(b => b.id.toString() === value);
                                            setBeatmapPreview(selected || null);
                                        }}
                                        placeholder="请选择难度..."
                                        minWidth="100%"
                                    />
                                </div>
                            )}

                            {/* Beatmap预览 */}
                            {beatmapPreview && (
                                <div className="mb-4 p-4 bg-white border border-gray-300 rounded-lg shadow-sm max-w-[660px]">
                                    {/* 头部：封面和基本信息 */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <Image
                                            src={beatmapPreview.cover_url}
                                            alt="Beatmap cover"
                                            width={512}
                                            height={512}
                                            className="w-28 h-19 object-cover rounded"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-sm truncate" title={beatmapPreview.title}>
                                                {beatmapPreview.title}
                                            </h3>
                                            <p className="font-bold text-xs text-gray-600 truncate" title={beatmapPreview.artist}>
                                                {beatmapPreview.artist}
                                            </p>
                                            <p className="font-bold text-xs text-gray-600">[{beatmapPreview.version}] by {beatmapPreview.creator}</p>
                                        </div>
                                    </div>

                                    {/* 属性信息 */}
                                    <div className="mb-3 text-xs text-gray-600">
                                        <div className="grid grid-cols-4 gap-1">
                                            <div className="text-center font-medium">CS</div>
                                            <div className="text-center font-medium">AR</div>
                                            <div className="text-center font-medium">OD</div>
                                            <div className="text-center font-medium">HP</div>
                                            <div className={`text-center font-bold text-lg ${selectedMods !== 'NM' && moddedStats?.cs !== undefined ? (moddedStats.cs > beatmapPreview.cs + 0.01 ? 'text-red-500' : moddedStats.cs < beatmapPreview.cs - 0.01 ? 'text-green-500' : '') : ''}`}>
                                                {(() => {
                                                    const val = moddedStats?.cs ?? beatmapPreview.cs;
                                                    if (selectedMods !== 'NM' && moddedStats?.cs !== undefined) {
                                                        if (moddedStats.cs > beatmapPreview.cs + 0.01) return `${val.toFixed(1)} ▲`;
                                                        if (moddedStats.cs < beatmapPreview.cs - 0.01) return `${val.toFixed(1)} ▼`;
                                                    }
                                                    return val.toFixed(1);
                                                })()}
                                            </div>
                                            <div className={`text-center font-bold text-lg ${selectedMods !== 'NM' && moddedStats?.ar !== undefined ? (moddedStats.ar > beatmapPreview.ar + 0.01 ? 'text-red-500' : moddedStats.ar < beatmapPreview.ar - 0.01 ? 'text-green-500' : '') : ''}`}>
                                                {(() => {
                                                    const val = moddedStats?.ar ?? beatmapPreview.ar;
                                                    if (selectedMods !== 'NM' && moddedStats?.ar !== undefined) {
                                                        if (moddedStats.ar > beatmapPreview.ar + 0.01) return `${val.toFixed(1)} ▲`;
                                                        if (moddedStats.ar < beatmapPreview.ar - 0.01) return `${val.toFixed(1)} ▼`;
                                                    }
                                                    return val.toFixed(1);
                                                })()}
                                            </div>
                                            <div className={`text-center font-bold text-lg ${selectedMods !== 'NM' && moddedStats?.od !== undefined ? (moddedStats.od > beatmapPreview.od + 0.01 ? 'text-red-500' : moddedStats.od < beatmapPreview.od - 0.01 ? 'text-green-500' : '') : ''}`}>
                                                {(() => {
                                                    const val = moddedStats?.od ?? beatmapPreview.od;
                                                    if (selectedMods !== 'NM' && moddedStats?.od !== undefined) {
                                                        if (moddedStats.od > beatmapPreview.od + 0.01) return `${val.toFixed(1)} ▲`;
                                                        if (moddedStats.od < beatmapPreview.od - 0.01) return `${val.toFixed(1)} ▼`;
                                                    }
                                                    return val.toFixed(1);
                                                })()}
                                            </div>
                                            <div className={`text-center font-bold text-lg ${selectedMods !== 'NM' && moddedStats?.hp !== undefined ? (moddedStats.hp > beatmapPreview.hp + 0.01 ? 'text-red-500' : moddedStats.hp < beatmapPreview.hp - 0.01 ? 'text-green-500' : '') : ''}`}>
                                                {(() => {
                                                    const val = moddedStats?.hp ?? beatmapPreview.hp;
                                                    if (selectedMods !== 'NM' && moddedStats?.hp !== undefined) {
                                                        if (moddedStats.hp > beatmapPreview.hp + 0.01) return `${val.toFixed(1)} ▲`;
                                                        if (moddedStats.hp < beatmapPreview.hp - 0.01) return `${val.toFixed(1)} ▼`;
                                                    }
                                                    return val.toFixed(1);
                                                })()}
                                            </div>
                                            <div className="text-center font-medium col-span-2">Length</div>
                                            <div className="text-center font-medium">BPM</div>
                                            <div className="text-center font-medium">★</div>
                                            <div className={`text-center font-bold text-base col-span-2 ${selectedMods === 'DT' && customDTRate !== '' ? 'text-red-500' : ''}`}>
                                                {selectedMods === 'DT' && customDTRate !== '' ?
                                                    formatLength(Math.round(beatmapPreview.total_length / (customDTRate as number))) + ' ▼' :
                                                    formatLength(beatmapPreview.total_length)
                                                }
                                            </div>
                                            <div className={`text-center font-bold text-base ${selectedMods !== 'NM' && moddedStats?.bpm !== undefined ? (moddedStats.bpm > beatmapPreview.bpm + 0.01 ? 'text-red-500' : moddedStats.bpm < beatmapPreview.bpm - 0.01 ? 'text-green-500' : '') : ''}`}>
                                                {(() => {
                                                    const val = moddedStats?.bpm ?? beatmapPreview.bpm;
                                                    if (selectedMods !== 'NM' && moddedStats?.bpm !== undefined) {
                                                        if (moddedStats.bpm > beatmapPreview.bpm + 0.01) return `${val} ▲`;
                                                        if (moddedStats.bpm < beatmapPreview.bpm - 0.01) return `${val} ▼`;
                                                    }
                                                    return val;
                                                })()}
                                            </div>
                                            <div className={`text-center font-bold text-base ${selectedMods !== 'NM' && moddedStats?.starRating !== undefined ? (moddedStats.starRating > beatmapPreview.star_rating + 0.01 ? 'text-red-500' : moddedStats.starRating < beatmapPreview.star_rating - 0.01 ? 'text-green-500' : '') : ''}`}>
                                                {(() => {
                                                    const val = moddedStats?.starRating ?? beatmapPreview.star_rating;
                                                    if (selectedMods !== 'NM' && moddedStats?.starRating !== undefined) {
                                                        if (moddedStats.starRating > beatmapPreview.star_rating + 0.01) return `${val.toFixed(2)} ▲`;
                                                        if (moddedStats.starRating < beatmapPreview.star_rating - 0.01) return `${val.toFixed(2)} ▼`;
                                                    }
                                                    return val.toFixed(2);
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Mod选择 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="min-w-[220px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mod
                                    </label>
                                    <Dropdown
                                        options={MOD_OPTIONS.map(mod => ({
                                            value: mod,
                                            label: mod
                                        }))}
                                        value={selectedMods}
                                        onChange={setSelectedMods}
                                        placeholder="选择MOD"
                                        minWidth="100%"
                                    />
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
                                        <div className='min-w-[300px]'>
                                            <Dropdown
                                                label="MOD名称"
                                                options={[
                                                    { value: '', label: '选择MOD...' },
                                                    ...availableLazerMods.map(mod => ({
                                                        value: mod.name,
                                                        label: `${mod.name} - ${mod.description}`
                                                    }))
                                                ]}
                                                value={customModName}
                                                onChange={setCustomModName}
                                                placeholder="选择MOD..."
                                                minWidth="100%"
                                            />
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
                                                        placeholder="不修改则为原值"
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
                                                        placeholder="不修改则为原值"
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
                                                        placeholder="不修改则为原值"
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
                                                        placeholder="不修改则为原值"
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
                                            step="0.01"
                                            min="1.0"
                                            max="2.0"
                                            value={customDTRate}
                                            onChange={(e) => setCustomDTRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="1.50"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            默认1.50倍，可自定义1.00-2.00之间的倍率
                                        </p>
                                    </div>
                                </div>
                            )}


                            {/* 重复检查警告 */}
                            {duplicateWarning.show && (
                                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <h4 className="font-medium text-yellow-800 mb-2">重复检测</h4>
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
                                {/* <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={approved}
                                        onChange={(e) => setApproved(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">直接过审</span>
                                </label> */}

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={padding}
                                        onChange={(e) => setPadding(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">送测该图</span>
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

                    {/* 选图列表 - 按mod类型分类显示 */}
                    <div className="space-y-8">
                        {Object.entries(getSelectionsByMod()).map(([mod, modSelections]) => (
                            <div key={mod} className="space-y-4">
                                {/* Mod分类标题 */}
                                <div className="flex items-center gap-3">
                                    <div className={`px-4 py-2 rounded-lg text-white font-bold text-lg ${getModColorClass(mod)}`}>
                                        {mod} - {getModDisplayName(mod)}
                                    </div>
                                    <span className="text-gray-500 text-sm">
                                        ({modSelections.length} 个选图)
                                    </span>
                                </div>

                                {/* 该mod下的选图列表 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {modSelections.map(selection => (
                                        <div
                                            key={selection.id}
                                            className={`border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 ${selection.approved ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-white'
                                                }`}
                                            onContextMenu={(e) => handleContextMenu(e, selection)}
                                        >
                                            {/* 头部：封面和基本信息 */}
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="relative">
                                                    <Image
                                                        src={selection.coverUrl}
                                                        alt="Beatmap cover"
                                                        width={512}
                                                        height={512}
                                                        className="w-24 h-19 object-cover rounded"
                                                    />
                                                    {/* 过审状态指示器 */}
                                                    {selection.approved && (
                                                        <div className="absolute -top-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                                            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
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
                                                                    ((selection.customDTRate && selection.customDTRate !== 1.50) ?
                                                                        `DT${selection.modPosition}-${selection.customDTRate.toFixed(2)}倍` :
                                                                        `DT${selection.modPosition}`) :
                                                                    `${selection.selectedMods}${selection.modPosition}`
                                                            }
                                                        </span>
                                                        {selection.padding && (
                                                            <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">
                                                                提交测图中
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="font-bold text-sm truncate" title={selection.title}>
                                                        {selection.title}
                                                    </h3>
                                                    <p className="font-bold text-xs text-gray-600 truncate" title={`${selection.artist}`}>
                                                        {selection.artist}
                                                    </p>
                                                    <p className="font-bold text-xs text-gray-600">[{selection.version}] by {selection.creator}</p>
                                                </div>
                                                <div className="ml-auto">
                                                    <RatingDisplay
                                                        ratings={mapRatings[selection.id] || []}
                                                        selectedBy={selection.selectedBy}
                                                        currentUserId={userForState.id.toString()}
                                                        compact={true}
                                                        isAdmin={permissions.isAdmin || permissions.isMapSelector}
                                                    />
                                                </div>
                                            </div>

                                            {/* 属性信息 */}
                                            <div className="mb-3 text-xs text-gray-600">
                                                <div className="grid grid-cols-4 gap-1">
                                                    <div className="text-center font-medium">CS</div>
                                                    <div className="text-center font-medium">AR</div>
                                                    <div className="text-center font-medium">OD</div>
                                                    <div className="text-center font-medium">HP</div>
                                                    <div className="text-center font-bold text-lg">{selection.cs.toFixed(1)}</div>
                                                    <div className="text-center font-bold text-lg">{selection.ar.toFixed(1)}</div>
                                                    <div className="text-center font-bold text-lg">{selection.od.toFixed(1)}</div>
                                                    <div className="text-center font-bold text-lg">{selection.hp.toFixed(1)}</div>
                                                    <div className="text-center font-medium col-span-2">Length</div>
                                                    <div className="text-center font-medium">BPM</div>
                                                    <div className="text-center font-medium">★</div>
                                                    <div className="text-center font-bold text-base col-span-2">{formatLength(selection.totalLength)}</div>
                                                    <div className="text-center font-bold text-base">{selection.bpm}</div>
                                                    <div className="text-center font-bold text-base">{selection.starRating.toFixed(2)}</div>
                                                </div>
                                            </div>

                                            {/* 提名者信息 */}
                                            <div className="mb-3 text-xs text-gray-600">
                                                <div className="flex items-center gap-3 w-full">
                                                    <span className="flex items-center gap-1">提名者:<Image src={selection.selectedByAvatar || "/default-avatar.png"} alt={selection.selectedByUsername || '未知'} width={16} height={16} className="rounded-full" />{selection.selectedByUsername}</span>
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
                                            </div>

                                            {/* 操作按钮 */}
                                            <div className="flex gap-2 items-center justify-end">
                                                {/* 复制BID按钮 */}
                                                <button
                                                    onClick={() => copyBeatmapId(selection.beatmapId)}
                                                    className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                                                    title="复制Beatmap ID"
                                                >
                                                    复制BID
                                                </button>

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
                                    {selections
                                        .filter(selection => tempApprovedSelections.has(selection.id) && !selection.approved)
                                        .map(selection => (
                                            <tr key={selection.id} className="hover:bg-gray-50">
                                                <td className="border border-gray-300 px-3 py-2 text-left">
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
                                                <td className="border border-gray-300 px-3 py-2 text-left">{selection.title}</td>
                                                <td className="border border-gray-300 px-3 py-2 text-left">{selection.artist}</td>
                                                <td className="border border-gray-300 px-3 py-2 text-left">{selection.version}</td>
                                                <td className="border border-gray-300 px-3 py-2 text-left">{selection.selectedByUsername}</td>
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

            {/* 右键菜单 */}
            {contextMenu.show && contextMenu.selection && (
                <div
                    className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg py-2 min-w-[160px]"
                    style={{
                        left: contextMenu.x,
                        top: contextMenu.y,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => {
                            window.open(contextMenu.selection!.url, '_blank');
                            closeContextMenu();
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                        <Image src='/icons/link.svg' alt='viewOsu' width={30} height={30} />
                        查看谱面
                    </button>

                    <button
                        onClick={() => {
                            window.open(`osu://b/${contextMenu.selection!.beatmapId}`, '_blank');
                            showInfo('已在osu客户端中打开谱面');
                            closeContextMenu();
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                        <Image src='/icons/osu-lazer-logo-black.svg' alt='viewOsu' width={30} height={30} />
                        从osu中打开
                    </button>

                    {/* 分隔符 */}
                    <div className="border-t border-gray-200 my-2"></div>

                    <button
                        onClick={() => {
                            const downloadUrl = `https://api.nerinyan.moe/d/${contextMenu.selection!.beatmapsetId}`;
                            window.open(downloadUrl, '_blank');
                            showSuccess('已开始从Nerinyan下载');
                            closeContextMenu();
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                        <Image src='/icons/download.svg' alt='download' width={30} height={30} />
                        下载谱面 (Nerinyan)
                    </button>

                    <button
                        onClick={() => {
                            const downloadUrl = `https://osu.ppy.sh/beatmapsets/${contextMenu.selection!.beatmapsetId}/download`;
                            window.open(downloadUrl, '_blank');
                            showSuccess('已开始从osu官方下载');
                            closeContextMenu();
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                        <Image src='/icons/download.svg' alt='download' width={30} height={30} />
                        osu官方下载
                    </button>
                    {/* 怕点错 */}
                    {(permissions.isAdmin || permissions.isMapSelector) && (
                        <button
                            onClick={() => {
                                toggleApproval(contextMenu.selection!.id, contextMenu.selection!.approved);
                                closeContextMenu();
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                            <Image src='/icons/auction-fill-black.svg' alt='download' width={30} height={30} />
                            {contextMenu.selection!.approved ? '取消过审' : '过审'}
                        </button>
                    )}

                    {(permissions.isAdmin || permissions.isMapSelector) && (
                        <>
                            <button
                                onClick={() => {
                                    togglePadding(contextMenu.selection!.id, contextMenu.selection!.padding || false);
                                    closeContextMenu();
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                            >
                                <Image src='/icons/auction-fill-black.svg' alt='download' width={30} height={30} />
                                {contextMenu.selection!.padding ? '取消测图' : '设为测图'}
                            </button>

                            <button
                                onClick={() => {
                                    refreshSelection(contextMenu.selection!);
                                    closeContextMenu();
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                            >
                                <Image src='/icons/loading-black.svg' alt='refresh map' width={30} height={30} />
                                刷新MOD属性
                            </button>

                            {/* 修改属性选项 */}
                            <button
                                onClick={() => {
                                    setEditDialog({
                                        show: true,
                                        selection: contextMenu.selection,
                                        isSubmitting: false
                                    });
                                    closeContextMenu();
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                            >
                                <Image src='/icons/settings-3-fill.svg' alt='edit' width={30} height={30} />
                                修改属性
                            </button>
                        </>
                    )}

                    {(contextMenu.selection!.selectedBy === userForState.id.toString() || permissions.isAdmin || permissions.isMapSelector) && (
                        <button
                            onClick={() => {
                                if (confirm('确定要删除这个选图吗？此操作不可撤销。')) {
                                    deleteSelection(contextMenu.selection!.id);
                                }
                                closeContextMenu();
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
                        >
                            <Image src='/icons/delete-bin-2-fill.svg' alt='delete' width={30} height={30} />
                            删除
                        </button>
                    )}
                </div>
            )}

            {/* 点击其他地方关闭右键菜单 */}
            {contextMenu.show && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={closeContextMenu}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        closeContextMenu();
                    }}
                />
            )}

            {/* 编辑属性对话框 */}
            {editDialog.show && editDialog.selection && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto rounded-lg">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">修改选图属性</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* 标题 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    标题
                                </label>
                                <input
                                    type="text"
                                    defaultValue={editDialog.selection.title}
                                    id="edit-title"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* 难度名 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    难度名
                                </label>
                                <input
                                    type="text"
                                    defaultValue={editDialog.selection.version}
                                    id="edit-version"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* AR */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    AR
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    defaultValue={editDialog.selection.ar}
                                    id="edit-ar"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* OD */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    OD
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    defaultValue={editDialog.selection.od}
                                    id="edit-od"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* CS */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    CS
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    defaultValue={editDialog.selection.cs}
                                    id="edit-cs"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* HP */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    HP
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    defaultValue={editDialog.selection.hp}
                                    id="edit-hp"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* BPM */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    BPM
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    defaultValue={editDialog.selection.bpm}
                                    id="edit-bpm"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* 时长（秒） */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    时长（秒）
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    defaultValue={editDialog.selection.totalLength}
                                    id="edit-totalLength"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    当前时长: {formatLength(editDialog.selection.totalLength)}
                                </p>
                            </div>

                            {/* MOD */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    MOD
                                </label>
                                <select
                                    id="edit-selectedMods"
                                    defaultValue={editDialog.selection.selectedMods}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {MOD_OPTIONS.map(mod => (
                                        <option key={mod} value={mod}>{mod}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 阶段 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    阶段
                                </label>
                                <select
                                    id="edit-category"
                                    defaultValue={editDialog.selection.category}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {CATEGORY_OPTIONS.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* LZ mod 自定义字段 */}
                        {editDialog.selection.selectedMods === 'LZ' && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <h4 className="font-medium text-blue-800 mb-2">Lazer MOD 设置</h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        MOD 名称
                                    </label>
                                    <select
                                        id="edit-customModName"
                                        defaultValue={editDialog.selection.customModName || ''}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">选择 MOD...</option>
                                        {availableLazerMods.map(mod => (
                                            <option key={mod.name} value={mod.name}>
                                                {mod.name} - {mod.description}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        从可用的 Lazer 特有 MOD 中选择
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* DT 自定义倍率字段 */}
                        {editDialog.selection.selectedMods === 'DT' && (
                            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
                                <h4 className="font-medium text-purple-800 mb-2">DT 设置</h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        自定义倍率
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="1.0"
                                        max="2.0"
                                        defaultValue={editDialog.selection.customDTRate || 1.5}
                                        id="edit-customDTRate"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="1.50"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        默认 1.50 倍，可自定义 1.00-2.00 之间的倍率
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 备注 */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                备注
                            </label>
                            <textarea
                                defaultValue={editDialog.selection.comment}
                                id="edit-comment"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex gap-4 justify-end">
                            <button
                                onClick={() => setEditDialog({
                                    show: false,
                                    selection: null,
                                    isSubmitting: false
                                })}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={() => {
                                    if (!editDialog.selection) return;

                                    const updates: {
                                        title?: string;
                                        version?: string;
                                        ar?: number;
                                        od?: number;
                                        cs?: number;
                                        hp?: number;
                                        bpm?: number;
                                        totalLength?: number;
                                        selectedMods?: string;
                                        category?: string;
                                        comment?: string;
                                        customModName?: string;
                                        customDTRate?: number;
                                    } = {
                                        title: (document.getElementById('edit-title') as HTMLInputElement)?.value,
                                        version: (document.getElementById('edit-version') as HTMLInputElement)?.value,
                                        ar: parseFloat((document.getElementById('edit-ar') as HTMLInputElement)?.value || '0'),
                                        od: parseFloat((document.getElementById('edit-od') as HTMLInputElement)?.value || '0'),
                                        cs: parseFloat((document.getElementById('edit-cs') as HTMLInputElement)?.value || '0'),
                                        hp: parseFloat((document.getElementById('edit-hp') as HTMLInputElement)?.value || '0'),
                                        bpm: parseFloat((document.getElementById('edit-bpm') as HTMLInputElement)?.value || '0'),
                                        totalLength: parseInt((document.getElementById('edit-totalLength') as HTMLInputElement)?.value || '0'),
                                        selectedMods: (document.getElementById('edit-selectedMods') as HTMLSelectElement)?.value,
                                        category: (document.getElementById('edit-category') as HTMLSelectElement)?.value,
                                        comment: (document.getElementById('edit-comment') as HTMLTextAreaElement)?.value
                                    };

                                    // 添加 LZ mod 自定义字段
                                    if (editDialog.selection.selectedMods === 'LZ') {
                                        const customModNameInput = document.getElementById('edit-customModName') as HTMLInputElement;
                                        if (customModNameInput) {
                                            updates.customModName = customModNameInput.value || undefined;
                                        }
                                    }

                                    // 添加 DT 自定义倍率字段
                                    if (editDialog.selection.selectedMods === 'DT') {
                                        const customDTRateInput = document.getElementById('edit-customDTRate') as HTMLInputElement;
                                        if (customDTRateInput && customDTRateInput.value) {
                                            updates.customDTRate = parseFloat(customDTRateInput.value);
                                        }
                                    }

                                    updateSelectionAttributes(editDialog.selection.id, updates);
                                }}
                                disabled={editDialog.isSubmitting}
                                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-4 py-2 rounded transition-colors"
                            >
                                {editDialog.isSubmitting ? '保存中...' : '保存'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
