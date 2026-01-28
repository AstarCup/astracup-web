"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { showSuccess, showError, showInfo } from '../ui/Notification';
import Dropdown from '../ui/Dropdown';
import CommentComponent from './ui/CommentComponent';
import MapoolTable from '../ui/MapoolTable';
import { UserSession } from '@/lib/permissions';
import { animate, spring } from 'animejs';
import { getDifficultyStyle } from '@/lib/difficulty-colors';

import {
    ArrowDownToLine,
    ExternalLink,
    RotateCw,
    PencilLine,
    CircleArrowRight,
    CircleCheckBig,
    Trash2,
    LayoutGrid,
    LayoutList,
    Clipboard,
    MessageCircleMore,
    Diameter,
    CircleGauge,
    Target,
    Heart,
    Hourglass,
    CircleStar,
    Music3,
    Star,
    CloudUpload
} from 'lucide-react';

interface User {
    id: number;
    username: string;
    avatar_url: string;
}

interface BeatmapInfo {
    id: number;
    beatmapset_id: number;
    title: string;
    title_unicode: string;
    artist: string;
    artist_unicode: string;
    version: string;
    creator: string;
    star_rating: number;
    bpm: number;
    total_length: number;
    max_combo: number;
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
    title_unicode?: string;     // 新增：Unicode标题
    artist: string;
    artist_unicode?: string;    // 新增：Unicode艺术家
    version: string;
    creator: string;
    starRating: number;
    bpm: number;
    totalLength: number;
    maxCombo: number;           // 新增：最大连击数
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
    { value: 'all', label: '全部' },
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
        { value: 's1', label: '第一赛季' },
        { value: 'otc1', label: 'OTC#1' }
    ]);

    // Map selection data
    const [selections, setSelections] = useState<MapSelection[]>([]);

    // Comments data by mapSelectionId
    const [commentsByMapSelectionId, setCommentsByMapSelectionId] = useState<{ [key: number]: any[] }>({});

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
    const [paddingFilter, setPaddingFilter] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('mapSelection_paddingFilter') || 'all';
        }
        return 'all';
    });

    const [searchQuery, setSearchQuery] = useState<string>(''); // 新增：搜索查询状态

    interface ExistingSelection {
        selectedMods: string;
        modPosition: string;
        category: string;
        selectedByUsername: string;
    }

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

    // 新增：自定义mod模式相关状态
    const [isCustomMode, setIsCustomMode] = useState(false); // 是否为自定义模式
    const [customModInput, setCustomModInput] = useState(''); // 自定义mod输入框内容
    const [calculationMod, setCalculationMod] = useState('NM'); // 用于参数计算的mod值

    // 自定图池表单状态
    const [customTitle, setCustomTitle] = useState('');
    const [customTitleUnicode, setCustomTitleUnicode] = useState('');
    const [customArtist, setCustomArtist] = useState('');
    const [customArtistUnicode, setCustomArtistUnicode] = useState('');
    const [customVersion, setCustomVersion] = useState('');
    const [customCreator, setCustomCreator] = useState('');
    const [customStarRating, setCustomStarRating] = useState<number | ''>('');
    const [customBPM, setCustomBPM] = useState<number | ''>('');
    const [customTotalLength, setCustomTotalLength] = useState<number | ''>('');
    const [customMaxCombo, setCustomMaxCombo] = useState<number | ''>('');
    const [customPoolCS, setCustomPoolCS] = useState<number | ''>('');
    const [customPoolAR, setCustomPoolAR] = useState<number | ''>('');
    const [customPoolOD, setCustomPoolOD] = useState<number | ''>('');
    const [customPoolHP, setCustomPoolHP] = useState<number | ''>('');
    const [customPoolType, setCustomPoolType] = useState<'original' | 'custom'>('original');

    // osz文件上传状态
    const [oszFile, setOszFile] = useState<File | null>(null);
    const [isUploadingOsz, setIsUploadingOsz] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [oszUploadError, setOszUploadError] = useState<string | null>(null);
    const [oszUploadSuccess, setOszUploadSuccess] = useState(false);
    const [oszBeatmapInfos, setOszBeatmapInfos] = useState<any[]>([]);
    const [selectedDifficultyIndex, setSelectedDifficultyIndex] = useState<number>(0);
    const [showDifficultySelector, setShowDifficultySelector] = useState(false);

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
        showAnimate: boolean;
        x: number;
        y: number;
        selection: MapSelection | null;
        isOnRightSide: boolean;
    }>({
        show: false,
        showAnimate: false,
        x: 0,
        y: 0,
        selection: null,
        isOnRightSide: false
    });

    // 右键菜单引用
    const contextMenuRef = useRef<HTMLDivElement>(null);

    // 右键菜单动画效果 - 只处理打开动画
    useEffect(() => {
        if (!contextMenuRef.current || !contextMenu.show) return;

        // 确保菜单可见
        contextMenuRef.current.style.display = 'flex';

        // 打开动画
        const animation = animate(contextMenuRef.current, {
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 200,
            ease: spring({
                bounce: 0.5,
                duration: 628
            })
        });

        // 清理函数
        return () => {
            if (animation) {
                animation.pause();
            }
        };
    }, [contextMenu.show]);

    const closeContextMenu = () => {
        if (!contextMenu.show || !contextMenuRef.current) return;
        // 创建关闭动画
        const animation = animate(contextMenuRef.current, {
            opacity: [1, 0],
            translateY: [0, 30],
            duration: 150,
            easing: 'easeInCubic',
        });
        animation.play;
        animation.then(() => {
            setContextMenu({
                show: false,
                showAnimate: false,
                x: 0,
                y: 0,
                selection: null,
                isOnRightSide: false
            });
        });
    };

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

    // Tab切换状态
    const [activeTab, setActiveTab] = useState<'cards' | 'table'>('cards');

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
            } else {
                const errorData = await response.json();
                showError(errorData.error || '获取选图列表失败');
            }
        } catch (error) {
            console.error('Failed to fetch selections:', error);
            showError('获取选图列表时出错');
        }
    }, [season, category, userForState?.id]);

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
                const modStats = data.modStats;

                // 转换属性名以匹配前端期望的格式
                return {
                    starRating: modStats.starRating || 0,
                    aimDifficulty: modStats.aimDifficulty || 0,
                    speedDifficulty: modStats.speedDifficulty || 0,
                    ar: modStats.ar || 0,
                    cs: modStats.cs || 0,
                    od: modStats.od || 0,
                    hp: modStats.hp || 0,
                    bpm: modStats.bpm || 0,
                    totalLength: modStats.totalLength || 0,
                    maxCombo: modStats.maxCombo || 0,
                    lengthSeconds: modStats.lengthSeconds || 0,
                    clockRate: modStats.clockRate || 1.0,
                    // 添加其他可能需要的属性
                    arBase: modStats.arBase || 0,
                    csBase: modStats.csBase || 0,
                    odBase: modStats.odBase || 0,
                    hpBase: modStats.hpBase || 0,
                    bpmBase: modStats.bpmBase || 0,
                    lengthBase: modStats.lengthBase || 0
                };
            } else {
                console.error('Failed to calculate modded stats');
                return null;
            }
        } catch (error) {
            console.error('Error calculating modded stats:', error);
            return null;
        }
    }, []);

    // 批量获取评论数据
    const fetchBatchComments = useCallback(async (mapSelectionIds: number[]) => {
        if (mapSelectionIds.length === 0) return;

        try {
            const response = await fetch(`/api/map-ratings/batch-comments?mapSelectionIds=${mapSelectionIds.join(',')}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setCommentsByMapSelectionId(data.comments);
                    console.log('Batch comments loaded for', Object.keys(data.comments).length, 'map selections');
                }
            } else {
                console.error('Failed to fetch batch comments');
            }
        } catch (error) {
            console.error('Error fetching batch comments:', error);
        }
    }, []);

    // Get selection list
    useEffect(() => {
        if (isAuthorized && user) {
            fetchSelections();
        }
    }, [isAuthorized, user, fetchSelections]);

    // 当选图列表更新时，批量获取评论数据
    useEffect(() => {
        if (selections.length > 0) {
            const mapSelectionIds = selections.map(selection => selection.id);
            fetchBatchComments(mapSelectionIds);
        }
    }, [selections, fetchBatchComments]);

    // Calculate modded stats when beatmap or mods change
    useEffect(() => {
        const updateModdedStats = async () => {
            if (beatmapPreview && user) {
                // 根据模式决定使用哪个mod值进行计算
                const modForCalculation = isCustomMode ? calculationMod : selectedMods;

                const customSettings = {
                    customModName: modForCalculation === 'LZ' ? customModName : undefined,
                    customDASettings: customModName === 'DA' && modForCalculation === 'LZ' ? {
                        cs: customCS !== '' ? customCS : null,
                        ar: customAR !== '' ? customAR : null,
                        od: customOD !== '' ? customOD : null,
                        hp: customHP !== '' ? customHP : null,
                    } : null,
                    customDTRate: modForCalculation === 'DT' && customDTRate !== '' ? customDTRate : null,
                };
                const stats = await calculateModdedStatsAPI(beatmapPreview, modForCalculation, customSettings);
                setModdedStats(stats);
            } else {
                setModdedStats(null);
            }
        };

        updateModdedStats();
    }, [beatmapPreview, selectedMods, calculationMod, isCustomMode, customModName, customCS, customAR, customOD, customHP, customDTRate, user, calculateModdedStatsAPI]);

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

    const handlePaddingFilterChange = (value: string) => {
        setPaddingFilter(value);
        if (typeof window !== 'undefined') {
            localStorage.setItem('mapSelection_paddingFilter', value);
        }
    };

    // 右键菜单处理函数
    const handleContextMenu = (e: React.MouseEvent, selection: MapSelection) => {
        e.preventDefault();

        // 计算菜单位置
        const menuWidth = 450; // 双排菜单宽度
        const menuHeight = 250; // 预估菜单高度

        let left = e.clientX;
        let top = e.clientY;
        let isOnRightSide = false;

        // 检查右侧是否放不下
        if (left + menuWidth > window.innerWidth) {
            // 如果放不下，显示在左边
            left = e.clientX - menuWidth;
            isOnRightSide = true;

            // 确保不会超出左边界
            if (left < 0) {
                left = 0;
            }
        }

        // 检查底部是否放不下
        if (top + menuHeight > window.innerHeight) {
            // 如果放不下，显示在上方
            top = e.clientY - menuHeight;

            // 确保不会超出上边界
            if (top < 0) {
                top = 0;
            }
        }

        setContextMenu({
            show: true,
            showAnimate: false,
            x: left,
            y: top,
            selection,
            isOnRightSide
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
            { name: 'AD+BR(RollSpeed:6.0)', description: 'AD+BR(RollSpeed:6.0)' },
            { name: 'DA(AR:8)', description: 'Difficulty Adjust - AR8' }
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
                    // // // console.log('Season config loaded:', data);
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

        // 根据模式决定提交的mod值和计算用的mod值
        const modToSubmit = isCustomMode ? customModInput : selectedMods;
        const modForCalculation = isCustomMode ? calculationMod : selectedMods;

        // 验证自定义模式下输入框不能为空
        if (isCustomMode && !customModInput.trim()) {
            showError('请输入自定义MOD名');
            return;
        }

        setIsSubmitting(true);
        try {
            const customSettings = {
                customModName: modForCalculation === 'LZ' ? customModName : null,
                customDASettings: customModName === 'DA' && modForCalculation === 'LZ' ? {
                    cs: customCS !== '' ? customCS : null,
                    ar: customAR !== '' ? customAR : null,
                    od: customOD !== '' ? customOD : null,
                    hp: customHP !== '' ? customHP : null,
                } : null,
                customDTRate: modForCalculation === 'DT' && customDTRate !== '' ? customDTRate : null,
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
                    title_unicode: beatmapPreview.title_unicode,
                    artist: beatmapPreview.artist,
                    artist_unicode: beatmapPreview.artist_unicode,
                    version: beatmapPreview.version,
                    creator: beatmapPreview.creator,
                    // Use modded stats if available, otherwise original
                    starRating: moddedStats?.starRating ?? beatmapPreview.star_rating,
                    bpm: moddedStats?.bpm ?? beatmapPreview.bpm,
                    totalLength: modForCalculation === 'DT' && customDTRate !== '' ?
                        Math.round(beatmapPreview.total_length / (customDTRate as number)) :
                        beatmapPreview.total_length,
                    maxCombo: beatmapPreview.max_combo || 0,
                    ar: moddedStats?.ar ?? beatmapPreview.ar,
                    cs: moddedStats?.cs ?? beatmapPreview.cs,
                    od: moddedStats?.od ?? beatmapPreview.od,
                    hp: moddedStats?.hp ?? beatmapPreview.hp,
                    selectedMods: modToSubmit, // 提交的mod值
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
                    customModName: modForCalculation === 'LZ' ? customModName : null,
                    customDTRate: modForCalculation === 'DT' && customDTRate !== '' ? customDTRate : null,
                    customSettings,
                    // 新增字段：保存计算用的mod值
                    calculationMod: isCustomMode ? modForCalculation : null,
                    // send computed modded stats for backend
                    moddedStats: moddedStats
                        ? {
                            ar: moddedStats.ar,
                            cs: moddedStats.cs,
                            od: moddedStats.od,
                            hp: moddedStats.hp,
                            star_rating: moddedStats.starRating,
                            bpm: moddedStats.bpm,
                            totalLength: modForCalculation === 'DT' && customDTRate !== '' ?
                                Math.round(beatmapPreview.total_length / (customDTRate as number)) :
                                beatmapPreview.total_length,
                            max_combo: beatmapPreview.max_combo || 0
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

    // 处理osz文件上传 - 浏览器端解析后上传
    const handleOszUpload = async () => {
        if (!oszFile) {
            showError('请选择.osz文件');
            return;
        }
        if (!userForState?.id) {
            showError('请先登录');
            return;
        }

        setIsUploadingOsz(true);
        setOszUploadError(null);
        setOszUploadSuccess(false);
        setUploadProgress(0);

        try {
            // 1. 在浏览器中解析osz文件
            setUploadProgress(10);
            showInfo('正在解析osz文件...');

            // 动态导入JSZip库
            const JSZip = (await import('jszip')).default;

            // 读取文件内容
            const arrayBuffer = await oszFile.arrayBuffer();

            // 解压osz文件
            const zip = await JSZip.loadAsync(arrayBuffer);

            // 查找.osu文件
            const osuFiles = Object.keys(zip.files).filter(name => name.toLowerCase().endsWith('.osu'));

            if (osuFiles.length === 0) {
                throw new Error('在osz文件中未找到.osu文件');
            }

            // 解析所有.osu文件
            const beatmapInfos = [];

            for (const osuFile of osuFiles) {
                try {
                    const osuContent = await zip.file(osuFile)?.async('text');

                    if (!osuContent) {
                        continue;
                    }

                    // 解析.osu文件内容
                    const parsedData = parseOsuFileContent(osuContent);

                    beatmapInfos.push({
                        // 元数据
                        title: parsedData['Title'] || '',
                        titleUnicode: parsedData['TitleUnicode'] || parsedData['Title'] || '',
                        artist: parsedData['Artist'] || '',
                        artistUnicode: parsedData['ArtistUnicode'] || parsedData['Artist'] || '',
                        version: parsedData['Version'] || '',
                        creator: parsedData['Creator'] || '',
                        beatmapId: parseInt(parsedData['BeatmapID'] || '-1'),
                        beatmapsetId: parseInt(parsedData['BeatmapSetID'] || '-1'),

                        // 难度数据
                        cs: parseFloat(parsedData['CircleSize'] || '4'),
                        ar: parseFloat(parsedData['ApproachRate'] || '9'),
                        od: parseFloat(parsedData['OverallDifficulty'] || '8'),
                        hp: parseFloat(parsedData['HPDrainRate'] || '6'),

                        // 其他信息
                        bpm: parseFloat(parsedData['PreviewTime'] || '180'),
                        totalLength: parseInt(parsedData['AudioLeadIn'] || '0') + 120,
                        tags: parsedData['Tags'] || '',
                        source: parsedData['Source'] || '',

                        // 文件名信息
                        osuFilename: osuFile,
                        osuContent: osuContent, // 保存.osu文件内容用于后续计算
                        index: beatmapInfos.length
                    });
                } catch (error) {
                    console.error(`解析.osu文件 ${osuFile} 失败:`, error);
                    // 继续解析其他文件
                }
            }

            if (beatmapInfos.length === 0) {
                throw new Error('无法解析任何.osu文件');
            }

            // 按难度名排序
            beatmapInfos.sort((a, b) => a.version.localeCompare(b.version));
            setUploadProgress(40);

            // 2. 使用客户端直接上传到Vercel Blob
            showInfo('正在上传osz文件...');

            // 动态导入@vercel/blob/client
            const { upload } = await import('@vercel/blob/client');

            // 生成负数bid（使用时间戳作为负数bid）
            const negativeBeatmapId = -Math.floor(Date.now() / 1000);

            // 生成存储路径
            const blobPath = `/custom/${season}_${category}_${selectedMods}${modPosition}_${negativeBeatmapId}.osz`;

            // 客户端直接上传
            const newBlob = await upload(blobPath, oszFile, {
                access: 'public',
                handleUploadUrl: '/api/upload-url',
                clientPayload: JSON.stringify({
                    userId: userForState.id.toString(),
                    season,
                    category,
                    selectedMods,
                    modPosition: modPosition.toString(),
                    customBeatmapId: null
                })
            });

            const uploadUrl = newBlob.url;
            setUploadProgress(60);

            // 4. 调用parse-osz API处理解析后的数据
            showInfo('正在提交解析数据...');
            const parseResponse = await fetch('/api/parse-osz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileUrl: uploadUrl,
                    userId: userForState.id.toString(),
                    season,
                    category,
                    selectedMods,
                    modPosition: modPosition.toString(),
                    beatmapInfos: beatmapInfos, // 传递浏览器端解析的数据
                    parsedInBrowser: true // 标记为浏览器端解析
                })
            });
            setUploadProgress(90);

            const data = await parseResponse.json();

            if (data.success) {
                setUploadProgress(100);
                setOszUploadSuccess(true);
                showSuccess('osu文件解析成功');
                // 存储所有难度信息（使用API返回的完整数据，包含mod计算后的属性）
                setOszBeatmapInfos(data.beatmapInfos || []);

                if (data.hasMultipleDifficulties && data.beatmapInfos.length > 1) {
                    // 如果有多个难度，显示选择器
                    setShowDifficultySelector(true);
                    setSelectedDifficultyIndex(0);
                } else {
                    // 如果只有一个难度，直接填充表单
                    const beatmapInfo = data.beatmapInfos[0];
                    fillFormWithBeatmapInfo(beatmapInfo);
                    // 重置文件状态
                    setOszFile(null);
                }
            } else {
                setOszUploadError(data.error || '上传失败');
                showError(data.error || 'osz文件解析失败');
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : '上传失败';
            setOszUploadError(errorMsg);
            showError(`上传失败: ${errorMsg}`);
        } finally {
            setIsUploadingOsz(false);
            setUploadProgress(100);
        }
    };

    // 解析.osu文件内容的辅助函数
    const parseOsuFileContent = (content: string): Record<string, string> => {
        const result: Record<string, string> = {};
        const lines = content.split('\n');
        let currentSection = '';

        for (const line of lines) {
            const trimmedLine = line.trim();

            // 跳过空行和注释
            if (!trimmedLine || trimmedLine.startsWith('//')) {
                continue;
            }

            // 检查是否是节标题
            if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
                currentSection = trimmedLine.slice(1, -1);
                continue;
            }

            // 解析键值对
            const separatorIndex = trimmedLine.indexOf(':');
            if (separatorIndex > 0) {
                const key = trimmedLine.substring(0, separatorIndex).trim();
                const value = trimmedLine.substring(separatorIndex + 1).trim();

                // 只存储特定节的关键字段
                if (currentSection === 'Metadata' || currentSection === 'Difficulty' || currentSection === 'General') {
                    result[key] = value;
                }
            }
        }

        return result;
    };


    // 用beatmap信息填充表单
    const fillFormWithBeatmapInfo = (beatmapInfo: any) => {
        setCustomTitle(beatmapInfo.title || '');
        setCustomTitleUnicode(beatmapInfo.titleUnicode || '');
        setCustomArtist(beatmapInfo.artist || '');
        setCustomArtistUnicode(beatmapInfo.artistUnicode || '');
        setCustomVersion(beatmapInfo.version || '');
        setCustomCreator(beatmapInfo.creator || '');
        setCustomPoolCS(beatmapInfo.cs ? parseFloat(beatmapInfo.cs.toFixed(2)) : '');
        setCustomPoolAR(beatmapInfo.ar ? parseFloat(beatmapInfo.ar.toFixed(2)) : '');
        setCustomPoolOD(beatmapInfo.od ? parseFloat(beatmapInfo.od.toFixed(2)) : '');
        setCustomPoolHP(beatmapInfo.hp ? parseFloat(beatmapInfo.hp.toFixed(2)) : '');
        setCustomBPM(beatmapInfo.bpm ? parseFloat(beatmapInfo.bpm.toFixed(2)) : '');
        const totalLengthInSeconds = beatmapInfo.totalLength ? Math.round(beatmapInfo.totalLength / 1000) : '';
        setCustomTotalLength(totalLengthInSeconds);
        setCustomStarRating(beatmapInfo.starRating ? parseFloat(beatmapInfo.starRating.toFixed(2)) : '');
        setCustomMaxCombo(beatmapInfo.maxCombo || '');
    };

    // 处理难度选择
    const handleDifficultySelect = (index: number) => {
        setSelectedDifficultyIndex(index);
        const beatmapInfo = oszBeatmapInfos[index];
        fillFormWithBeatmapInfo(beatmapInfo);
        setShowDifficultySelector(false);
        // 重置文件状态
    };

    // 当selectedMods变化时，如果有oszBeatmapInfos，重新计算属性
    useEffect(() => {
        const recalculateOnModChange = async () => {
            if (oszBeatmapInfos.length > 0 && selectedDifficultyIndex >= 0 && selectedDifficultyIndex < oszBeatmapInfos.length) {
                const beatmapInfo = oszBeatmapInfos[selectedDifficultyIndex];
                if (beatmapInfo && beatmapInfo.osuContent) {
                    try {
                        // 调用calculate-mod-stats API重新计算
                        const response = await fetch('/api/calculate-mod-stats', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                beatmap: {
                                    id: beatmapInfo.beatmapId,
                                    title: beatmapInfo.title,
                                    artist: beatmapInfo.artist,
                                    creator: beatmapInfo.creator,
                                    bpm: beatmapInfo.bpm,
                                    totalLength: beatmapInfo.totalLength
                                },
                                mods: selectedMods,
                                customSettings: {
                                    customModName: '',
                                    customDASettings: null,
                                    customDTRate: null
                                },
                                osuContent: beatmapInfo.osuContent
                            })
                        });

                        if (response.ok) {
                            const data = await response.json();
                            const modStats = data.modStats;

                            // 更新表单字段，保留2位小数，计算后的时长单位是毫秒，需要转换为秒
                            setCustomPoolCS(modStats.cs ? parseFloat(modStats.cs.toFixed(2)) : '');
                            setCustomPoolAR(modStats.ar ? parseFloat(modStats.ar.toFixed(2)) : '');
                            setCustomPoolOD(modStats.od ? parseFloat(modStats.od.toFixed(2)) : '');
                            setCustomPoolHP(modStats.hp ? parseFloat(modStats.hp.toFixed(2)) : '');
                            setCustomBPM(modStats.bpm ? parseFloat(modStats.bpm.toFixed(2)) : '');
                            const totalLengthInSeconds = modStats.totalLength ? Math.round(modStats.totalLength / 1000) : '';
                            setCustomTotalLength(totalLengthInSeconds);
                            setCustomStarRating(modStats.starRating ? parseFloat(modStats.starRating.toFixed(2)) : '');
                            setCustomMaxCombo(modStats.maxCombo || '');
                        }
                    } catch (error) {
                        console.error('Error recalculating mod stats on mod change:', error);
                    }
                }
            }
        };

        // 延迟执行，避免频繁调用
        const timeoutId = setTimeout(recalculateOnModChange, 500);
        return () => clearTimeout(timeoutId);
    }, [selectedMods, oszBeatmapInfos, selectedDifficultyIndex]);

    // 处理文件选择
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 验证文件类型
        if (!file.name.toLowerCase().endsWith('.osz')) {
            showError('只支持.osz文件格式');
            return;
        }

        // 验证文件大小（50MB限制）
        if (file.size > 50 * 1024 * 1024) {
            showError('文件大小不能超过50MB');
            return;
        }

        setOszFile(file);
        setOszUploadError(null);
        setOszUploadSuccess(false);
    };

    // 添加自定图池
    const addCustomPool = async () => {
        // 验证必填字段
        if (!customTitle.trim()) {
            showError('请输入歌曲名');
            return;
        }
        if (!customArtist.trim()) {
            showError('请输入艺术家');
            return;
        }
        if (!customVersion.trim()) {
            showError('请输入难度名');
            return;
        }
        if (!customCreator.trim()) {
            showError('请输入谱师');
            return;
        }
        if (!userForState?.id) {
            showError('请先登录');
            return;
        }

        // 根据模式决定提交的mod值和计算用的mod值
        const modToSubmit = isCustomMode ? customModInput : selectedMods;
        const modForCalculation = isCustomMode ? calculationMod : selectedMods;

        // 验证自定义模式下输入框不能为空
        if (isCustomMode && !customModInput.trim()) {
            showError('请输入自定义MOD名');
            return;
        }

        setIsSubmitting(true);
        try {
            // 生成虚拟ID（使用负数避免与真实beatmap ID冲突）
            const virtualBeatmapId = -Math.floor(Date.now() / 1000);
            const virtualBeatmapsetId = -Math.floor(Date.now() / 1000) - 1;

            // 根据选择设置customModName
            const customModNameValue = customPoolType === 'original' ? '原创' : '定制';

            // 如果有osz文件，使用负数bid重新上传
            if (oszFile && oszUploadSuccess) {
                try {
                    const formData = new FormData();
                    formData.append('file', oszFile);
                    formData.append('userId', userForState.id.toString());
                    formData.append('season', season);
                    formData.append('category', category);
                    formData.append('selectedMods', modToSubmit); // 使用提交的mod值
                    formData.append('modPosition', modPosition.toString());
                    formData.append('customBeatmapId', virtualBeatmapId.toString()); // 传递负数bid

                    const uploadResponse = await fetch('/api/parse-osz', {
                        method: 'POST',
                        body: formData
                    });

                    const uploadData = await uploadResponse.json();
                    if (!uploadData.success) {
                        console.warn('重新上传osz文件失败，但继续提交自定图池:', uploadData.error);
                    }
                } catch (uploadError) {
                    console.warn('重新上传osz文件时出错，但继续提交自定图池:', uploadError);
                }
            }

            const response = await fetch('/api/map-selections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    beatmapId: virtualBeatmapId,
                    beatmapsetId: virtualBeatmapsetId,
                    title: customTitle,
                    title_unicode: customTitleUnicode || customTitle,
                    artist: customArtist,
                    artist_unicode: customArtistUnicode || customArtist,
                    version: customVersion,
                    creator: customCreator,
                    starRating: customStarRating !== '' ? customStarRating : 5.0,
                    bpm: customBPM !== '' ? customBPM : 180,
                    totalLength: customTotalLength !== '' ? customTotalLength : 120,
                    maxCombo: customMaxCombo !== '' ? customMaxCombo : 1000,
                    ar: customPoolAR !== '' ? customPoolAR : 9.0,
                    cs: customPoolCS !== '' ? customPoolCS : 4.0,
                    od: customPoolOD !== '' ? customPoolOD : 8.0,
                    hp: customPoolHP !== '' ? customPoolHP : 6.0,
                    selectedMods: modToSubmit, // 使用提交的mod值
                    modPosition,
                    comment,
                    approved,
                    padding,
                    season,
                    category,
                    url: `custom://pool/${virtualBeatmapId}`,
                    coverUrl: '', // 自定图池没有封面
                    selectedBy: userForState.id.toString(),
                    selectedByUsername: userForState.username,
                    selectedByAvatar: userForState.avatar_url,
                    customModName: customModNameValue,
                    customDTRate: modForCalculation === 'DT' && customDTRate !== '' ? customDTRate : null,
                    calculationMod: isCustomMode ? modForCalculation : null, // 保存计算用的mod值
                    isCustomPool: true // 标记为自定图池
                })
            });

            const data = await response.json();
            if (data.success) {
                showSuccess('自定图池添加成功');
                // 重置表单
                setCustomTitle('');
                setCustomTitleUnicode('');
                setCustomArtist('');
                setCustomArtistUnicode('');
                setCustomVersion('');
                setCustomCreator('');
                setCustomStarRating('');
                setCustomBPM('');
                setCustomTotalLength('');
                setCustomMaxCombo('');
                setCustomPoolCS('');
                setCustomPoolAR('');
                setCustomPoolOD('');
                setCustomPoolHP('');
                setCustomPoolType('original');
                setComment('');
                setApproved(false);
                setPadding(false);
                setSelectedMods('NM');
                setModPosition(1);
                setOszFile(null);
                setOszUploadSuccess(false);

                // 刷新选图列表
                await fetchSelections();
            } else {
                showError(data.error || '添加自定图池失败');
            }
        } catch (error) {
            console.error('Add custom pool error:', error);
            showError('添加自定图池时出错');
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
                : (Array.isArray(beatmapData.data.beatmaps) ? beatmapData.data.beatmaps.find((b: BeatmapInfo) => b.id === selection.beatmapId) : null);

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

            const responseData = await modStatsResponse.json();
            console.log('API返回的数据结构:', responseData);
            const { modStats } = responseData;
            console.log('modStats对象结构:', modStats);
            console.log('modStats字段详情:', {
                starRating: modStats?.starRating,
                star_rating: modStats?.star_rating,
                bpm: modStats?.bpm,
                totalLength: modStats?.totalLength,
                total_length: modStats?.total_length,
                maxCombo: modStats?.maxCombo,
                max_combo: modStats?.max_combo,
                ar: modStats?.ar,
                cs: modStats?.cs,
                od: modStats?.od,
                hp: modStats?.hp
            });

            // 第三步：更新本地状态
            setSelections(prev => prev.map(s => s.id === selection.id ? ({
                ...s,
                ar: modStats.ar,
                cs: modStats.cs,
                od: modStats.od,
                hp: modStats.hp,
                starRating: modStats.starRating,
                bpm: modStats.bpm,
                maxCombo: latestBeatmap.max_combo || 0,
                // 计算DT时长
                totalLength: selection.selectedMods === 'DT' && selection.customDTRate ?
                    Math.round(latestBeatmap.total_length / selection.customDTRate) :
                    latestBeatmap.total_length,
                // 同时更新基础beatmap信息（包括Unicode字段）
                title: latestBeatmap.title,
                title_unicode: latestBeatmap.title_unicode || latestBeatmap.title,
                artist: latestBeatmap.artist,
                artist_unicode: latestBeatmap.artist_unicode || latestBeatmap.artist,
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
                            maxCombo: latestBeatmap.max_combo || 0,
                            totalLength: selection.selectedMods === 'DT' && selection.customDTRate ?
                                Math.round(latestBeatmap.total_length / selection.customDTRate) :
                                latestBeatmap.total_length
                        },
                        // 同时更新基础beatmap信息（包括Unicode字段）
                        title: latestBeatmap.title,
                        title_unicode: latestBeatmap.title_unicode || latestBeatmap.title,
                        artist: latestBeatmap.artist,
                        artist_unicode: latestBeatmap.artist_unicode || latestBeatmap.artist,
                        version: latestBeatmap.version,
                        creator: latestBeatmap.creator,
                        coverUrl: latestBeatmap.cover_url,
                        // 直接传递maxCombo和totalLength字段
                        maxCombo: latestBeatmap.max_combo || 0,
                        totalLength: selection.selectedMods === 'DT' && selection.customDTRate ?
                            Math.round(latestBeatmap.total_length / selection.customDTRate) :
                            latestBeatmap.total_length
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
        starRating?: number;
        totalLength?: number;
        maxCombo?: number;
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
            case 'NM': return 'bg-blue-500';
            case 'HD': return 'bg-yellow-500';
            case 'HR': return 'bg-red-500';
            case 'DT': return 'bg-purple-500';
            case 'EZ': return 'bg-green-500';
            case 'LZ': return 'bg-pink-600';
            case 'TB': return 'bg-black';
            case 'FM': return 'bg-blue-500';
            default: return 'bg-blue-500';
        }
    };

    const getModColorTextClass = (mod: string): string => {
        switch (mod) {
            case 'NM': return 'text-blue-400';
            case 'HD': return 'text-yellow-400';
            case 'HR': return 'text-red-400';
            case 'DT': return 'text-purple-400';
            case 'EZ': return 'text-green-400';
            case 'LZ': return 'text-pink-400';
            case 'TB': return 'text-black-400';
            case 'FM': return 'text-blue-400';
            default: return 'text-blue-400';
        }
    };

    const getModColorBorderClass = (mod: string): string => {
        switch (mod) {
            case 'NM': return 'border-b-4 border-b-blue-500 text-blue-500';
            case 'HD': return 'border-b-4 border-b-yellow-500 text-yellow-500';
            case 'HR': return 'border-b-4 border-b-red-500 text-red-500';
            case 'DT': return 'border-b-4 border-b-purple-500 text-purple-500';
            case 'EZ': return 'border-b-4 border-b-green-500 text-green-500';
            case 'LZ': return 'border-b-4 border-b-pink-600 text-pink-600';
            case 'TB': return 'border-b-4 border-b-black text-black';
            case 'FM': return 'border-b-4 border-b-blue-500 text-blue-500';
            default: return 'border-b-4 border-b-blue-500 text-blue-500';
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

            // 测图状态筛选
            if (paddingFilter !== 'all') {
                if (paddingFilter === 'padding' && !selection.padding) {
                    return false;
                }
                if (paddingFilter === 'not-padding' && selection.padding) {
                    return false;
                }
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

                // 普通文本搜索（包括Unicode字段）
                return (
                    selection.title.toLowerCase().includes(query) ||
                    (selection.title_unicode && selection.title_unicode.toLowerCase().includes(query)) ||
                    selection.artist.toLowerCase().includes(query) ||
                    (selection.artist_unicode && selection.artist_unicode.toLowerCase().includes(query)) ||
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

    // 获取测图状态筛选选项（包含数量统计）
    const getPaddingFilterOptions = () => {
        const paddingCount = selections.filter(s => s.padding).length;
        const notPaddingCount = selections.filter(s => !s.padding).length;

        return [
            { value: 'all', label: '全部', count: selections.length },
            { value: 'padding', label: '提交测图中', count: paddingCount },
            { value: 'not-padding', label: '非测图', count: notPaddingCount }
        ];
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

    // 将MapSelection数据转换为MapoolTable需要的格式
    const convertToMapoolFormat = (maps: MapSelection[]) => {
        const MOD_ORDER = ['NM', 'HD', 'HR', 'DT', 'FM', 'LZ', 'TB'];

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
            MapInfo: `${map.artist_unicode || map.artist} - ${map.title_unicode || map.title} [${map.version}]`,
            title: map.title,
            title_unicode: map.title_unicode || map.title,
            artist: map.artist,
            artist_unicode: map.artist_unicode || map.artist,
            version: map.version,
            creator: map.creator,
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
            customModName: map.customModName,
            customDTRate: map.customDTRate,
            selectedMods: map.selectedMods,
            modPosition: map.modPosition,
            selectedByUsername: map.selectedByUsername || map.selectedBy || '未知',
            selectedAt: map.selectedAt || new Date().toISOString(),
            starRating: map.starRating,
            approved: map.approved || false,
            maxCombo: map.maxCombo || 0,
            category: map.category
        }));
    };

    return (
        <div className="max-w-9xl mx-auto p-6">

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

                <Dropdown
                    options={getPaddingFilterOptions()}
                    value={paddingFilter}
                    onChange={handlePaddingFilterChange}
                    placeholder="测图状态"
                    minWidth="8rem"
                />

                {/* 搜索框 */}
                <div className="hover:scale-[1.01] transition-all  flex-1 min-w-[200px] rounded-lg text-gray-700 bg-white">
                    <input
                        type="text"
                        placeholder="搜索歌曲、艺术家、谱师... 支持osu url、BID/SID、ar9/cs5、mod"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>

                {/* 一键选中当前筛选的图 - 仅管理员可见 */}
                {(permissions.isAdmin || permissions.isMapSelector) && (
                    <button
                        onClick={() => {
                            // 获取当前筛选出的未过审选图
                            const filteredUnapproved = filteredSelections.filter(s => !s.approved);

                            // 检查是否已经全部选中
                            const allSelected = filteredUnapproved.length > 0 &&
                                filteredUnapproved.every(s => tempApprovedSelections.has(s.id));

                            const newSelections = new Set(tempApprovedSelections);

                            if (allSelected) {
                                // 如果已经全部选中，则取消选中所有
                                filteredUnapproved.forEach(selection => {
                                    newSelections.delete(selection.id);
                                });
                            } else {
                                // 否则选中所有当前筛选的未过审选图
                                filteredUnapproved.forEach(selection => {
                                    newSelections.add(selection.id);
                                });
                            }

                            setTempApprovedSelections(newSelections);
                        }}
                        className="hover:scale-[1.05] transition-all px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md whitespace-nowrap"
                    >
                        {(() => {
                            const filteredUnapproved = filteredSelections.filter(s => !s.approved);
                            const allSelected = filteredUnapproved.length > 0 &&
                                filteredUnapproved.every(s => tempApprovedSelections.has(s.id));

                            if (allSelected) {
                                return "取消全选";
                            } else {
                                return `一键全选 (${filteredUnapproved.length})`;
                            }
                        })()}
                    </button>
                )}

                {/* 添加选图按钮 */}
                {(permissions.isMapSelector || permissions.isAdmin) && (
                    <button
                        onClick={() => {
                            setShowAddForm(!showAddForm);
                        }}
                        className="hover:scale-[1.05] transition-all px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
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
                <div className='grid gap-2 grid-cols-1 md:grid-cols-2'>
                    {/* 左边表单 */}
                    <div>
                        <div className="mb-2 p-4 border border-gray-300 rounded-lg bg-gray-50 object-center">
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
                                            <h3 className="font-bold text-sm truncate" title={beatmapPreview.title_unicode || beatmapPreview.title}>
                                                {beatmapPreview.title_unicode || beatmapPreview.title}
                                            </h3>
                                            <p className="font-bold text-xs text-gray-600 truncate" title={beatmapPreview.artist_unicode || beatmapPreview.artist}>
                                                {beatmapPreview.artist_unicode || beatmapPreview.artist}
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
                                                        if (moddedStats.cs > beatmapPreview.cs + 0.01) return `${val.toFixed(2)} ▲`;
                                                        if (moddedStats.cs < beatmapPreview.cs - 0.01) return `${val.toFixed(2)} ▼`;
                                                    }
                                                    return val.toFixed(2);
                                                })()}
                                            </div>
                                            <div className={`text-center font-bold text-lg ${selectedMods !== 'NM' && moddedStats?.ar !== undefined ? (moddedStats.ar > beatmapPreview.ar + 0.01 ? 'text-red-500' : moddedStats.ar < beatmapPreview.ar - 0.01 ? 'text-green-500' : '') : ''}`}>
                                                {(() => {
                                                    const val = moddedStats?.ar ?? beatmapPreview.ar;
                                                    if (selectedMods !== 'NM' && moddedStats?.ar !== undefined) {
                                                        if (moddedStats.ar > beatmapPreview.ar + 0.01) return `${val.toFixed(2)} ▲`;
                                                        if (moddedStats.ar < beatmapPreview.ar - 0.01) return `${val.toFixed(2)} ▼`;
                                                    }
                                                    return val.toFixed(2);
                                                })()}
                                            </div>
                                            <div className={`text-center font-bold text-lg ${selectedMods !== 'NM' && moddedStats?.od !== undefined ? (moddedStats.od > beatmapPreview.od + 0.01 ? 'text-red-500' : moddedStats.od < beatmapPreview.od - 0.01 ? 'text-green-500' : '') : ''}`}>
                                                {(() => {
                                                    const val = moddedStats?.od ?? beatmapPreview.od;
                                                    if (selectedMods !== 'NM' && moddedStats?.od !== undefined) {
                                                        if (moddedStats.od > beatmapPreview.od + 0.01) return `${val.toFixed(2)} ▲`;
                                                        if (moddedStats.od < beatmapPreview.od - 0.01) return `${val.toFixed(2)} ▼`;
                                                    }
                                                    return val.toFixed(2);
                                                })()}
                                            </div>
                                            <div className={`text-center font-bold text-lg ${selectedMods !== 'NM' && moddedStats?.hp !== undefined ? (moddedStats.hp > beatmapPreview.hp + 0.01 ? 'text-red-500' : moddedStats.hp < beatmapPreview.hp - 0.01 ? 'text-green-500' : '') : ''}`}>
                                                {(() => {
                                                    const val = moddedStats?.hp ?? beatmapPreview.hp;
                                                    if (selectedMods !== 'NM' && moddedStats?.hp !== undefined) {
                                                        if (moddedStats.hp > beatmapPreview.hp + 0.01) return `${val.toFixed(2)} ▲`;
                                                        if (moddedStats.hp < beatmapPreview.hp - 0.01) return `${val.toFixed(2)} ▼`;
                                                    }
                                                    return val.toFixed(2);
                                                })()}
                                            </div>

                                            <div className="text-center font-medium">Length</div>
                                            <div className="text-center font-medium">MaxC</div>
                                            <div className="text-center font-medium">BPM</div>
                                            <div className="text-center font-medium">★</div>
                                            <div className={`text-center font-bold text-base ${selectedMods === 'DT' && customDTRate !== '' ? 'text-red-500' : ''}`}>
                                                {selectedMods === 'DT' && customDTRate !== '' ?
                                                    formatLength(Math.round(beatmapPreview.total_length / (customDTRate as number))) + ' ▼' :
                                                    formatLength(beatmapPreview.total_length)
                                                }
                                            </div>
                                            <div className="text-center font-bold text-base">
                                                {beatmapPreview.max_combo || 0}
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

                            {/* 模式切换开关 */}
                            <div className="mb-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-sm font-medium text-gray-700">标准模式</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newMode = !isCustomMode;
                                            setIsCustomMode(newMode);
                                            // 切换模式时重置相关状态
                                            if (newMode) {
                                                // 切换到自定义模式：设置计算mod为默认值"NM"
                                                setCalculationMod('NM');
                                                setCustomModInput('');
                                            } else {
                                                // 切换回标准模式：确保selectedMods有值
                                                if (!selectedMods) {
                                                    setSelectedMods('NM');
                                                }
                                            }
                                        }}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isCustomMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCustomMode ? 'translate-x-6' : 'translate-x-1'}`}
                                        />
                                    </button>
                                    <span className="text-sm font-medium text-gray-700">自定义模式</span>
                                </div>
                                <p className="text-xs text-gray-500 mb-3">
                                    {isCustomMode
                                        ? '自定义模式下，输入框内容将作为提交的mod名，右侧下拉框mod用于参数计算'
                                        : '标准模式下，使用标准mod选择'}
                                </p>
                            </div>

                            {/* Mod选择区域 - 根据模式显示不同内容 */}
                            {isCustomMode ? (
                                // 自定义模式：显示输入框 + 计算mod下拉框
                                <div className="flex flex-cow gap-2 mb-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            自定义MOD名
                                        </label>
                                        <input
                                            type="text"
                                            value={customModInput}
                                            onChange={(e) => setCustomModInput(e.target.value)}
                                            placeholder="输入自定义MOD名"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            计算用MOD
                                        </label>
                                        <Dropdown
                                            options={MOD_OPTIONS.map(mod => ({
                                                value: mod,
                                                label: mod
                                            }))}
                                            value={calculationMod}
                                            onChange={setCalculationMod}
                                            placeholder="选择计算MOD"
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
                            ) : (
                                // 标准模式：显示原有的单个mod下拉框
                                <div className="flex flex-cow gap-2 mb-4">
                                    <div className="">
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
                            )}

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
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex flex-cow items-center gap-1">
                                    <MessageCircleMore size={16} />评论
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
                        <div className='mb-2 p-4 border border-gray-300 rounded-lg bg-gray-50 object-center'>
                            <table className='table-auto md:table-fixed text-center'>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>NM</th>
                                        <th>HD</th>
                                        <th>HR</th>
                                        <th>DT</th>
                                        <th>LZ</th>
                                        <th>TB</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>QUA</td>
                                        <td>4</td>
                                        <td>2</td>
                                        <td>2</td>
                                        <td>2</td>
                                        <td>0</td>
                                        <td>0</td>
                                    </tr>
                                    <tr>
                                        <td>RO16</td>
                                        <td>5</td>
                                        <td>3</td>
                                        <td>2</td>
                                        <td>2</td>
                                        <td>1</td>
                                        <td>1</td>
                                    </tr>
                                    <tr>
                                        <td>QF</td>
                                        <td>5</td>
                                        <td>3</td>
                                        <td>2</td>
                                        <td>3</td>
                                        <td>1</td>
                                        <td>1</td>
                                    </tr>
                                    <tr>
                                        <td>SF</td>
                                        <td>5</td>
                                        <td>3</td>
                                        <td>3</td>
                                        <td>3</td>
                                        <td>1</td>
                                        <td>1</td>
                                    </tr>
                                    <tr>
                                        <td>F</td>
                                        <td>6</td>
                                        <td>3</td>
                                        <td>3</td>
                                        <td>3</td>
                                        <td>1</td>
                                        <td>1</td>
                                    </tr>
                                    <tr>
                                        <td>GF</td>
                                        <td>6</td>
                                        <td>3</td>
                                        <td>3</td>
                                        <td>4</td>
                                        <td>2</td>
                                        <td>1</td>
                                    </tr>
                                </tbody>
                            </table>
                            <img src="/info3.svg" alt="Map Selection" className="mt-4 mx-auto" />
                        </div>
                    </div>
                    {/* 右边表单 */}
                    <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-gray-50 object-center">
                        <h3 className="text-lg font-bold mb-4">添加自定图池</h3>
                        <div>
                            {/* 模式切换开关 - 自定图池部分 */}
                            <div className="mb-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-sm font-medium text-gray-700">标准模式</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newMode = !isCustomMode;
                                            setIsCustomMode(newMode);
                                            // 切换模式时重置相关状态
                                            if (newMode) {
                                                // 切换到自定义模式：设置计算mod为默认值"NM"
                                                setCalculationMod('NM');
                                                setCustomModInput('');
                                            } else {
                                                // 切换回标准模式：确保selectedMods有值
                                                if (!selectedMods) {
                                                    setSelectedMods('NM');
                                                }
                                            }
                                        }}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isCustomMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isCustomMode ? 'translate-x-6' : 'translate-x-1'}`}
                                        />
                                    </button>
                                    <span className="text-sm font-medium text-gray-700">自定义模式</span>
                                </div>
                                <p className="text-xs text-gray-500 mb-3">
                                    {isCustomMode
                                        ? '自定义模式下，输入框内容将作为提交的mod名，右侧下拉框mod用于参数计算'
                                        : '标准模式下，使用标准mod选择'}
                                </p>
                            </div>

                            {/* Mod选择 - 自定图池部分 */}
                            <p>1.先确定好mod和mod位，上传的时候会锁定文件名</p>
                            {isCustomMode ? (
                                // 自定义模式：显示输入框 + 计算mod下拉框
                                <div className="flex flex-cow w-max gap-2 mb-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            自定义MOD名
                                        </label>
                                        <input
                                            type="text"
                                            value={customModInput}
                                            onChange={(e) => setCustomModInput(e.target.value)}
                                            placeholder="输入自定义MOD名"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div className="">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            计算用MOD
                                        </label>
                                        <Dropdown
                                            options={MOD_OPTIONS.map(mod => ({
                                                value: mod,
                                                label: mod
                                            }))}
                                            value={calculationMod}
                                            onChange={setCalculationMod}
                                            placeholder="选择计算MOD"
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>
                            ) : (
                                // 标准模式：显示原有的单个mod下拉框
                                <div className="flex flex-cow w-max gap-2 mb-4">
                                    <div className="">
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>
                            )}
                            {/* osz文件上传区域 */}
                            <p>2.上传.osz文件自动解析并填充表单信息，文件将存储为：{season}_{category}_{selectedMods}{modPosition}_[生成的负数bid].osz</p>
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                <h4 className="font-medium text-green-800 mb-2">osz文件上传</h4>
                                <div className="space-y-3">
                                    {/* 文件选择区域 */}
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors">
                                        <input
                                            type="file"
                                            id="osz-file"
                                            accept=".osz"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <label htmlFor="osz-file" className="cursor-pointer block">
                                            <div className="flex flex-col items-center justify-center">
                                                <CloudUpload />
                                                <span className="text-sm font-medium text-gray-700">
                                                    {oszFile ? `已选择: ${oszFile.name}` : '点击选择.osz文件或拖放至此'}
                                                </span>
                                                <span className="text-xs text-gray-500 mt-1">
                                                    支持.osz格式，最大50MB
                                                </span>
                                            </div>
                                        </label>
                                    </div>

                                    {/* 文件信息和上传按钮 */}
                                    {oszFile && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-700">{oszFile.name}</span>
                                                <span className="text-gray-500">{(oszFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                            </div>

                                            {/* 上传进度 */}
                                            {isUploadingOsz && (
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    ></div>
                                                </div>
                                            )}

                                            {/* 上传按钮 */}
                                            <button
                                                onClick={handleOszUpload}
                                                disabled={isUploadingOsz || !oszFile}
                                                className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-md transition-colors flex items-center justify-center gap-2"
                                            >
                                                {isUploadingOsz ? (
                                                    <>
                                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        上传中...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CloudUpload />
                                                        上传并解析osz文件
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 难度选择器 */}
                            {showDifficultySelector && oszBeatmapInfos.length > 1 && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <h4 className="font-medium text-blue-800 mb-2">选择难度</h4>
                                    <p className="text-sm text-gray-600 mb-3">
                                        检测到 {oszBeatmapInfos.length} 个难度，请选择要使用的难度：
                                    </p>

                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {oszBeatmapInfos.map((beatmapInfo, index) => (
                                            <div
                                                key={index}
                                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedDifficultyIndex === index ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                                                onClick={() => handleDifficultySelect(index)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <div className="font-medium text-gray-800">
                                                            {beatmapInfo.version}
                                                        </div>
                                                        <div className="text-xs text-gray-600">
                                                            CS: {beatmapInfo.cs.toFixed(1)} | AR: {beatmapInfo.ar.toFixed(1)} | OD: {beatmapInfo.od.toFixed(1)} | HP: {beatmapInfo.hp.toFixed(1)}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-gray-700">
                                                        {beatmapInfo.starRating ? `${beatmapInfo.starRating.toFixed(2)}★` : 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-3 flex justify-between items-center">
                                        <span className="text-sm text-gray-600">
                                            已选择: {oszBeatmapInfos[selectedDifficultyIndex]?.version}
                                        </span>
                                        <button
                                            onClick={() => handleDifficultySelect(selectedDifficultyIndex)}
                                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                                        >
                                            确认选择
                                        </button>
                                    </div>
                                </div>
                            )}
                            {/* 原创/定制选择 */}
                            <p>3.选择类型</p>
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <h4 className="font-medium text-blue-800 mb-2">图池类型</h4>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="customPoolType"
                                            value="original"
                                            checked={customPoolType === 'original'}
                                            onChange={(e) => setCustomPoolType(e.target.value as 'original' | 'custom')}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-sm text-gray-700">原创</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="customPoolType"
                                            value="custom"
                                            checked={customPoolType === 'custom'}
                                            onChange={(e) => setCustomPoolType(e.target.value as 'original' | 'custom')}
                                            className="w-4 h-4 text-purple-600"
                                        />
                                        <span className="text-sm text-gray-700">定制</span>
                                    </label>
                                </div>
                            </div>
                            {/* 基本信息 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        歌曲名 *
                                    </label>
                                    <input
                                        type="text"
                                        value={customTitle}
                                        onChange={(e) => setCustomTitle(e.target.value)}
                                        placeholder="歌曲名"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        艺术家 *
                                    </label>
                                    <input
                                        type="text"
                                        value={customArtist}
                                        onChange={(e) => setCustomArtist(e.target.value)}
                                        placeholder="艺术家"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        难度名 *
                                    </label>
                                    <input
                                        type="text"
                                        value={customVersion}
                                        onChange={(e) => setCustomVersion(e.target.value)}
                                        placeholder="难度名"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        谱师 *
                                    </label>
                                    <input
                                        type="text"
                                        value={customCreator}
                                        onChange={(e) => setCustomCreator(e.target.value)}
                                        placeholder="谱师"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            {/* 难度属性 */}
                            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
                                <h4 className="font-medium text-purple-800 mb-2">难度属性</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            CS (0-10)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="11"
                                            value={customPoolCS}
                                            onChange={(e) => setCustomPoolCS(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="4.0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            AR (0-10)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="11"
                                            value={customPoolAR}
                                            onChange={(e) => setCustomPoolAR(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="9.0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            OD (0-10)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="11"
                                            value={customPoolOD}
                                            onChange={(e) => setCustomPoolOD(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="8.0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            HP (0-10)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="11"
                                            value={customPoolHP}
                                            onChange={(e) => setCustomPoolHP(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="6.0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 其他属性 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        星数 (★)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={customStarRating}
                                        onChange={(e) => setCustomStarRating(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="5.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        BPM
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={customBPM}
                                        onChange={(e) => setCustomBPM(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="180"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        长度 (秒)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={customTotalLength}
                                        onChange={(e) => setCustomTotalLength(e.target.value === '' ? '' : parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="120"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        最大连击数
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={customMaxCombo}
                                        onChange={(e) => setCustomMaxCombo(e.target.value === '' ? '' : parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="0"
                                    />
                                </div>
                            </div>



                            {/* 评论 */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    评论
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="添加评论..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {/* 提交按钮 */}
                            <div className="flex gap-4">
                                <button
                                    onClick={addCustomPool}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 text-white rounded-md transition-colors"
                                >
                                    {isSubmitting ? '添加中...' : '添加自定图池'}
                                </button>
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
                                >
                                    取消
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Tab切换栏 - 带滑块动画 */}
            <div className="mb-6 relative p-2 w-max bg-[#2d2d2d] rounded-lg hover:scale-[1.01] transition-all">
                <div className="flex relative">
                    {/* 滑块 */}
                    <div
                        className={`absolute h-8 bg-[#E93B66] rounded-lg transition-all duration-300 ease-out ${activeTab === 'cards' ? 'left-1' : 'left-1 translate-x-full'
                            }`}
                        style={{
                            width: 'calc(50% - 0.25rem)',
                        }}
                    />
                </div>
                <div className='w-max flex flex-cow bg-[#1a1a1a] rounded-lg'>
                    <button
                        onClick={() => setActiveTab('cards')}
                        className={`hover:scale-[1.05] transition-all relative px-4 py-1 rounded-lg gap-1 duration-300 flex items-center z-10 ${activeTab === 'cards'
                            ? 'text-white'
                            : 'text-white hover:text-pink'
                            }`}
                        style={{ width: 'calc(50%)' }}
                    >
                        <LayoutGrid size={20} />卡片模式
                    </button>
                    <button
                        onClick={() => setActiveTab('table')}
                        className={`hover:scale-[1.05] transition-all relative px-4 py-1 rounded-lg gap-1 duration-300 flex items-center z-10 ${activeTab === 'table'
                            ? 'text-white'
                            : 'text-white hover:text-pink'
                            }`}
                        style={{ width: 'calc(50%)' }}
                    >
                        <LayoutList size={20} />列表模式
                    </button>

                </div>
            </div>

            {/* 选图列表 - 按mod类型分类显示 */}
            <div className="relative">
                {/* 卡片模式 */}
                <div
                    className={`transition-all duration-500 ease-in-out ${activeTab === 'cards'
                        ? 'opacity-100 translate-x-0 z-10 relative'
                        : 'opacity-0 -translate-x-full z-0 absolute top-0 left-0 w-full'
                        }`}
                >
                    {/* 卡片模式内容 */}
                    {Object.entries(getSelectionsByMod()).map(([mod, modSelections]) => (
                        <div key={mod} className="space-y-4">
                            {/* Mod分类标题 */}
                            <div className="flex items-end gap-3 ">
                                <div className={`hover:scale-x-[1.05] transition-all h-8 px-2 mt-4 py-1 rounded-lg font-bold text-lg ${getModColorTextClass(mod)}`}>
                                    <span className="text-xl">
                                        {getModDisplayName(mod)} {modSelections.length}x
                                    </span>
                                </div>
                            </div>

                            {/* 该mod下的选图列表 */}
                            <div className="grid grid-flow-row-dense row-auto grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                                {modSelections.map(selection => (
                                    <div
                                        key={selection.id}
                                        className={`border object-center z-0 relative h-full overflow-hidden rounded-lg p-4 shadow-sm hover:shadow-md hover:scale-x-[1.01] transition-all duration-200 cursor-pointer ${selection.approved ? 'border-green-300 border-l-10 bg-white' : 'border-gray-300 bg-white'
                                            } ${tempApprovedSelections.has(selection.id) ? 'border-blue-500 bg-blue-50' : ''}`}
                                        onClick={(e) => {
                                            const target = e.target as HTMLElement;
                                            if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('textarea') || target.closest('select')) {
                                                return; // 不处理按钮、链接、表单元素的点击
                                            }

                                            // 只有管理员可以对未过审的选图进行批量选择
                                            if (permissions.isAdmin && !selection.approved) {
                                                const newSelections = new Set(tempApprovedSelections);
                                                if (newSelections.has(selection.id)) {
                                                    newSelections.delete(selection.id);
                                                } else {
                                                    newSelections.add(selection.id);
                                                }
                                                setTempApprovedSelections(newSelections);
                                            }
                                        }}
                                        onContextMenu={(e) => handleContextMenu(e, selection)}
                                    >
                                        {/* 头部：封面和基本信息 */}
                                        <Image
                                            src={selection.coverUrl}
                                            alt="Beatmap cover"
                                            width={512}
                                            height={1024}
                                            className="absolute inset-0 w-full h-full object-cover -z-3 opacity-5"
                                        />
                                        <Image
                                            src={selection.coverUrl || "/noCover.svg"}
                                            alt="No Beatmap cover / 可能是被ppy限制了,或者是你的梯子没关。请稍后再刷新"
                                            width={512}
                                            height={1024}
                                            className="absolute inset-0 w-full h-32 object-cover -z-2"
                                            loading='lazy'

                                        />
                                        <div className="absolute inset-0 h-32 bg-gradient-to-t from-black/70 via-black/20 to-transparent -z-1"></div>

                                        <div className="relative">
                                            {/* 过审状态指示器 */}
                                            {selection.approved && (
                                                <div className="absolute top-65 -left-77 w-full -z-1">
                                                    <p className='font-bold text-4xl text-green-300 rotate-90'>过审APPROVED</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-start gap-3 mb-3 z-2">
                                            <div className="flex flex-col flex-col-1 w-full">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <span className={`absolute -bottom-3 -right-3 -z-1 hover:scale-[1.05] transition-all px-2 py-1 rounded text-6xl font-bold ${getModColorTextClass(selection.selectedMods)}`}>
                                                            {selection.selectedMods === 'LZ' ?
                                                                (selection.customModName && selection.customModName.trim() !== '' ?
                                                                    `LZ${selection.modPosition}-${selection.customModName}` :
                                                                    `LZ${selection.modPosition}`) :
                                                                selection.selectedMods === 'DT' ?
                                                                    ((selection.customDTRate && selection.customDTRate !== 1.50) ?
                                                                        `DT${selection.modPosition}-${selection.customDTRate.toFixed(2)}x` :
                                                                        `DT${selection.modPosition}`) :
                                                                    `${selection.selectedMods}${selection.modPosition}`
                                                            }
                                                        </span>
                                                        {selection.padding && (
                                                            <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded flex flex-cow gap-1 items-center hover:scale-[1.05] transition-all">
                                                                <CircleArrowRight size={16} />
                                                            </span>
                                                        )}
                                                        {/* 当选择"全部"时显示阶段信息 */}
                                                        {category === 'all' && (
                                                            <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:scale-[1.05] transition-all">
                                                                {CATEGORY_OPTIONS.find(cat => cat.value === selection.category)?.label || selection.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* 右侧按钮区域 */}
                                                    <div className="flex items-center gap-2 justify-end">
                                                        {/* 复制BID按钮 */}
                                                        <button
                                                            onClick={() => copyBeatmapId(selection.beatmapId)}
                                                            className="px-2 py-1 bg-gray-500 hover:scale-[1.1] hover:bg-gray-600 text-white text-xs rounded-full transition-all flex flex-cow gap-1 items-center"
                                                            title="复制Beatmap ID"
                                                        >
                                                            <Clipboard size={12} /> {selection.beatmapId}
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
                                                                    className="hover:scale-[1.05] transition-all w-6 h-6 text-blue-600 bg-pink-100 border-gray-300 rounded-full focus:ring-pink-500"
                                                                />
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* 歌名 艺术家 难度 */}

                                        <p className="font-bold text-xs text-gray-200">[{selection.version}] by {selection.creator}</p>
                                        <div className='flex flex-row gap-0 content-end items-end'>
                                            <h3 className="font-bold text-white text-2xl truncate" title={selection.title_unicode || selection.title}>
                                                {selection.title_unicode || selection.title}
                                            </h3>
                                            <p className="font-bold text-xs relative bottom-1 text-gray-200 truncate" title={selection.artist_unicode || selection.artist}>
                                                {selection.artist_unicode || selection.artist}
                                            </p>
                                        </div>
                                        {/* 属性信息 */}
                                        <div className="mb-3 text-xs text-gray-600">
                                            <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                                                <div className={`hover:scale-[1.05] transition-all bg-white rounded-lg text-center font-medium flex flex-cow gap-1 items-start p-1 ${getModColorBorderClass(selection.selectedMods)}`}><Diameter size={16} />CS<div className="font-bold text-gray-600 text-2xl">{selection.cs}</div></div>
                                                <div className={`hover:scale-[1.05] transition-all bg-white rounded-lg text-center font-medium flex flex-cow gap-1 items-start p-1 ${getModColorBorderClass(selection.selectedMods)}`}><CircleGauge size={16} />AR<div className="font-bold text-gray-600 text-2xl">{selection.ar}</div></div>
                                                <div className={`hover:scale-[1.05] transition-all bg-white rounded-lg text-center font-medium flex flex-cow gap-1 items-start p-1 ${getModColorBorderClass(selection.selectedMods)}`}><Target size={16} />OD<div className="font-bold text-gray-600 text-2xl">{selection.od}</div></div>
                                                <div className={`hover:scale-[1.05] transition-all bg-white rounded-lg text-center font-medium flex flex-cow gap-1 items-start p-1 ${getModColorBorderClass(selection.selectedMods)}`}><Heart size={16} />HP<div className="font-bold text-gray-600 text-2xl">{selection.hp}</div></div>
                                                <div className="text-center font-medium flex flex-cow gap-1 items-center items-center p-1"><Hourglass size={16} /><div className="text-center text-base">{formatLength(selection.totalLength)}</div></div>
                                                <div className="text-center font-medium flex flex-cow gap-1 items-center items-center p-1"><CircleStar size={16} /><div className="text-center text-base">{selection.maxCombo}</div></div>
                                                <div className="text-center font-medium flex flex-cow gap-1 items-center items-center p-1"><Music3 size={16} /><div className="text-center text-base">{selection.bpm}</div></div>
                                                <div
                                                    style={getDifficultyStyle(selection.starRating)}
                                                    className={`hover:scale-[1.05] transition-all bg-white rounded-lg text-center font-medium flex flex-cow gap-1 items-start p-1`}><Star size={16} />Star<div className="text-center text-xl font-bold">{selection.starRating}</div></div>
                                            </div>
                                        </div>

                                        {/* 提名者信息 */}
                                        <div className="mb-3 text-xs text-gray-600">
                                            <div className="flex items-center gap-3 w-full">
                                                <span className="flex items-center gap-1"><Image src={selection.selectedByAvatar || "/default-avatar.png"} alt={selection.selectedByUsername || '未知'} width={16} height={16} className="rounded-full" />{selection.selectedByUsername}</span>
                                            </div>
                                        </div>

                                        {/* 评论 */}
                                        {selection.comment && (
                                            <div className="hover:scale-[1.01] transition-all mb-3 p-2 bg-gray-50 rounded text-xs text-gray-700">
                                                {selection.comment}
                                            </div>
                                        )}

                                        {/* 评论区 */}
                                        <div className="mt-4 pt-3 border-t border-gray-300">
                                            <CommentComponent
                                                mapSelectionId={selection.id}
                                                userId={userForState.id.toString()}
                                                onCommentUpdate={fetchSelections}
                                                compactMode={true}
                                                ratings={commentsByMapSelectionId[selection.id] || []}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 表格视图 */}
                <div
                    className={`transition-all duration-500 ease-in-out ${activeTab === 'table'
                        ? 'opacity-100 translate-x-0 z-10 relative'
                        : 'opacity-0 translate-x-full z-0 absolute top-0 left-0 w-full'
                        }`}
                >
                    {/* 表格模式内容 */}
                    <div>
                        <MapoolTable
                            data={convertToMapoolFormat(filteredSelections)}
                            title={`选图列表 - ${selections.length} 个选图`}
                            season={season}
                            category={category}
                        />
                    </div>
                </div>

                {filteredSelections.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        {selections.length === 0 ? '暂无选图' : '没有符合筛选条件的选图'}
                    </div>
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
                        ref={contextMenuRef}
                        className="fixed flex flex-row gap-2 z-50 animate-in fade-in-0 zoom-in-95 duration-200 font-bold"
                        style={{
                            left: contextMenu.x,
                            top: contextMenu.y,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 判断是否在屏幕右侧，决定列顺序 */}
                        {(() => {
                            const isCustomMap = contextMenu.selection.beatmapId < 0; // 检查是否为负数bid（原创/定制图）

                            const firstColumn = [];

                            if (isCustomMap) {
                                // 原创/定制图：只显示blob下载
                                firstColumn.push(
                                    <button
                                        key="download-blob"
                                        onClick={() => {
                                            // 构建blob文件路径
                                            const season = contextMenu.selection!.season || 's1';
                                            const category = contextMenu.selection!.category || 'qualification';
                                            const selectedMods = contextMenu.selection!.selectedMods || 'NM';
                                            const modPosition = contextMenu.selection!.modPosition || 1;
                                            const beatmapId = contextMenu.selection!.beatmapId;

                                            // 生成blob路径（与parse-osz API中的逻辑一致）
                                            const bidStr = beatmapId < 0 ? `-${Math.abs(beatmapId)}` : beatmapId.toString();
                                            const blobPath = `/custom/${season}_${category}_${selectedMods}${modPosition}_${bidStr}.osz`;

                                            // 使用新的API下载blob文件
                                            const downloadUrl = `/api/download-blob?path=${encodeURIComponent(blobPath)}`;
                                            window.open(downloadUrl, '_blank');
                                            showSuccess('开始从Blob下载原创/定制谱面');
                                            closeContextMenu();
                                        }}
                                        className="hover:scale-[1.01] transition-all w-full hover:border-b-4 border-gray-400 text-left px-4 py-2 hover:bg-gray-200 flex items-center gap-2 rounded-lg"
                                    >
                                        <ArrowDownToLine />
                                        下载谱面 (Blob)
                                    </button>
                                );
                            } else {
                                // 普通图：显示所有下载方式
                                firstColumn.push(
                                    <button
                                        key="view"
                                        onClick={() => {
                                            window.open(contextMenu.selection!.url, '_blank');
                                            closeContextMenu();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:border-b-4 border-gray-400 hover:bg-gray-200 hover:scale-[1.01] transition-all flex items-center gap-2 rounded-lg"
                                    >
                                        <ExternalLink />
                                        查看谱面
                                    </button>,
                                    <button
                                        key="open-in-osu"
                                        onClick={() => {
                                            window.open(`osu://b/${contextMenu.selection!.beatmapId}`, '_blank');
                                            showInfo('已在osu客户端中打开谱面');
                                            closeContextMenu();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:border-b-4 border-gray-400 hover:bg-gray-200 hover:scale-[1.01] transition-all flex items-center gap-2 rounded-lg"
                                    >
                                        <Image src='/icons/osu-lazer-logo-black.svg' alt='viewOsu' width={24} height={24} />
                                        从osu中打开
                                    </button>,
                                    <button
                                        key="download-nerinyan"
                                        onClick={() => {
                                            const downloadUrl = `https://api.nerinyan.moe/d/${contextMenu.selection!.beatmapsetId}`;
                                            window.open(downloadUrl, '_blank');
                                            showSuccess('已开始从Nerinyan下载');
                                            closeContextMenu();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:border-b-4 border-gray-400 hover:bg-gray-200 hover:scale-[1.01] transition-all flex items-center gap-2 rounded-lg"
                                    >
                                        <ArrowDownToLine />
                                        下载谱面 (Nerinyan)
                                    </button>,
                                    <button
                                        key="download-official"
                                        onClick={() => {
                                            const downloadUrl = `https://osu.ppy.sh/beatmapsets/${contextMenu.selection!.beatmapsetId}/download`;
                                            window.open(downloadUrl, '_blank');
                                            showSuccess('已开始从osu官方下载');
                                            closeContextMenu();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:border-b-4 border-gray-400 hover:bg-gray-200 hover:scale-[1.01] transition-all flex items-center gap-2 rounded-lg"
                                    >
                                        <ArrowDownToLine />
                                        osu官方下载
                                    </button>
                                );
                            }

                            const secondColumn = [
                                (permissions.isAdmin || permissions.isMapSelector) && (
                                    <button
                                        key="refresh"
                                        onClick={() => {
                                            refreshSelection(contextMenu.selection!);
                                            closeContextMenu();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:border-b-4 border-gray-400 hover:bg-gray-200 hover:scale-[1.01] transition-all flex items-center gap-2 rounded-lg"
                                    >
                                        <RotateCw />
                                        刷新MOD属性
                                    </button>
                                ),
                                (permissions.isAdmin || permissions.isMapSelector) && (
                                    <button
                                        key="edit"
                                        onClick={() => {
                                            setEditDialog({
                                                show: true,
                                                selection: contextMenu.selection,
                                                isSubmitting: false
                                            });
                                            closeContextMenu();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:border-b-4 border-gray-400 hover:bg-gray-200 hover:scale-[1.01] transition-all flex items-center gap-2 rounded-lg"
                                    >
                                        <PencilLine />
                                        修改属性
                                    </button>
                                ),
                                (permissions.isAdmin || permissions.isMapSelector) && (
                                    <button
                                        key="padding"
                                        onClick={() => {
                                            togglePadding(contextMenu.selection!.id, contextMenu.selection!.padding || false);
                                            closeContextMenu();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:border-b-4 border-gray-400 hover:bg-gray-200 hover:scale-[1.01] transition-all flex items-center gap-2 rounded-lg"
                                    >
                                        <CircleArrowRight />
                                        {contextMenu.selection!.padding ? '取消测图' : '设为测图'}
                                    </button>
                                ),
                                (permissions.isAdmin || permissions.isMapSelector) && (
                                    <button
                                        key="approve"
                                        onClick={() => {
                                            toggleApproval(contextMenu.selection!.id, contextMenu.selection!.approved);
                                            closeContextMenu();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:border-b-4 border-gray-400 hover:bg-gray-200 hover:scale-[1.01] transition-all flex items-center gap-2 rounded-lg"
                                    >
                                        <CircleCheckBig />
                                        {contextMenu.selection!.approved ? '取消过审' : '过审'}
                                    </button>
                                ),
                                (contextMenu.selection!.selectedBy === userForState.id.toString() || permissions.isAdmin || permissions.isMapSelector) && (
                                    <button
                                        onClick={() => {
                                            if (confirm('确定要删除这个选图吗？此操作不可撤销。')) {
                                                deleteSelection(contextMenu.selection!.id);
                                            }
                                            closeContextMenu();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:border-b-4 border-red-400 hover:bg-red-50 rounded-lg text-red-600 hover:scale-[1.01] transition-all flex items-center gap-2 rounded-lg"
                                    >
                                        <Trash2 />
                                        删除
                                    </button>
                                )
                            ].filter(Boolean);

                            return (
                                <div className="flex flex-row items-start gap-3">
                                    {/* 根据位置决定列顺序 */}
                                    {contextMenu.isOnRightSide ? (
                                        <>
                                            {/* 右侧放不下时：第二排在左边，第一排在右边 */}
                                            <div className="space-y-2 bg-white border border-gray-300 rounded-lg p-2 shadow-lg w-[200px]">
                                                {secondColumn}
                                            </div>
                                            <div className="space-y-2 bg-white border border-gray-300 rounded-lg p-2 shadow-lg w-[240px]">
                                                {firstColumn}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* 正常情况：第一排在左边，第二排在右边 */}
                                            <div className="space-y-2 bg-white border border-gray-300 rounded-lg p-2 shadow-lg w-[240px]">
                                                {firstColumn}
                                            </div>
                                            <div className="space-y-2 bg-white border border-gray-300 rounded-lg p-2 shadow-lg w-[200px]">
                                                {secondColumn}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })()}
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

                                {/* 星数 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        星数 (★)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="20"
                                        defaultValue={editDialog.selection.starRating}
                                        id="edit-starRating"
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

                                {/* 最大连击数 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        最大连击数
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        defaultValue={editDialog.selection.maxCombo}
                                        id="edit-maxCombo"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
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
                                            starRating?: number;
                                            totalLength?: number;
                                            maxCombo?: number;
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
                                            starRating: parseFloat((document.getElementById('edit-starRating') as HTMLInputElement)?.value || '0'),
                                            totalLength: parseInt((document.getElementById('edit-totalLength') as HTMLInputElement)?.value || '0'),
                                            maxCombo: parseInt((document.getElementById('edit-maxCombo') as HTMLInputElement)?.value || '0'),
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

        </div>
    )
}
