'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { showSuccess, showError, showInfo } from '../components/Notification';
import Dropdown, { DropdownOption } from '../components/Dropdown';

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
    selectedAt: string;
    season: string;
    category: string;
    url: string;
    coverUrl: string;
    approved: boolean;
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

export default function MapSelectionPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Season configuration
    const [availableSeasons, setAvailableSeasons] = useState([
        { value: 's1', label: '第一赛季' }
    ]);

    // Map selection data
    const [selections, setSelections] = useState<MapSelection[]>([]);
    const [season, setSeason] = useState('s1');
    const [category, setCategory] = useState('qualification');
    const [modFilter, setModFilter] = useState<string>('all'); // 新增：mod筛选状态

    // Add selection form
    const [showAddForm, setShowAddForm] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [selectedMods, setSelectedMods] = useState('NM');
    const [modPosition, setModPosition] = useState(1);
    const [comment, setComment] = useState('');
    const [approved, setApproved] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [beatmapPreview, setBeatmapPreview] = useState<BeatmapInfo | null>(null);
    const [availableBeatmaps, setAvailableBeatmaps] = useState<BeatmapInfo[]>([]);
    const [moddedStats, setModdedStats] = useState<any>(null);

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

    // Remove auto-parsing, use Enter key instead

    // Check user login status and permissions
    useEffect(() => {
        checkUserAuth();
        fetchAvailableLazerMods();
    }, []);

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

    const checkUserAuth = async () => {
        try {
            console.log('Starting auth check...');

            // Check if user is logged in
            console.log('Fetching session...');
            const sessionResponse = await fetch('/api/session/get');
            console.log('Session response status:', sessionResponse.status);

            if (!sessionResponse.ok) {
                console.log('Session check failed, redirecting to register');
                showError('未登录。正在跳转到登录页面...');
                setTimeout(() => router.push('/register'), 3000); // 3秒后跳转
                return;
            }

            const sessionData = await sessionResponse.json();
            console.log('Session data:', sessionData);
            console.log('Session structure:', {
                success: sessionData.success,
                hasSession: !!sessionData.session,
                sessionType: typeof sessionData.session,
                sessionKeys: sessionData.session ? Object.keys(sessionData.session) : 'no session'
            });

            if (!sessionData.success || !sessionData.session) {
                console.log('No user in session, redirecting to register');
                showError('未找到用户会话。正在跳转到登录页面...');
                setTimeout(() => router.push('/register'), 3000); // 3秒后跳转
                return;
            }

            const currentUser = sessionData.session;
            console.log('Current user details:', {
                id: currentUser.osuId,
                username: currentUser.username,
                idType: typeof currentUser.osuId
            });

            // 为了兼容现有的User接口，我们需要将osuId转换为id
            const userForState = {
                id: parseInt(currentUser.osuId),
                username: currentUser.username,
                avatar_url: currentUser.avatar_url
            };

            setUser(userForState);
            console.log('Current user set:', userForState);

            // Verify map selection permissions
            console.log('Checking map selection permissions for user ID:', currentUser.osuId);

            if (!currentUser.osuId) {
                console.log('No user ID found in session');
                showError('无效的用户会话 - 未找到用户ID。正在跳转到登录页面...');
                setTimeout(() => router.push('/register'), 3000);
                return;
            }

            const authResponse = await fetch('/api/map-selection-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    osuId: currentUser.osuId.toString()
                })
            });

            console.log('Auth response status:', authResponse.status);
            const authError = await authResponse.json();
            console.log('Auth response data:', authError);

            if (authResponse.ok) {
                console.log('Authorization successful');
                setIsAuthorized(true);

                // 获取赛季配置
                await loadSeasonConfig();
            } else {
                console.log('Authorization failed');
                // 显示详细的调试信息
                let errorMessage = authError.error || '您没有访问选图系统的权限';

                if (authError.debug) {
                    errorMessage += `\n\n调试信息:\n`;
                    errorMessage += `您的ID: ${authError.debug.yourId} (${authError.debug.yourIdType})\n`;
                    errorMessage += `授权ID列表: ${JSON.stringify(authError.debug.authorizedIds)}\n`;
                    errorMessage += `比较详情:\n${JSON.stringify(authError.debug.comparisonDetails, null, 2)}`;
                }

                showError(errorMessage);
            }

        } catch (error) {
            console.error('Auth check failed:', error);
            showError(`验证用户权限时出错: ${error instanceof Error ? error.message : '未知错误'}`);
        } finally {
            console.log('Auth check completed');
            setIsLoading(false);
        }
    };

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

    // 检测输入是否像在输入数字（连续的数字字符，可能包含部分URL）
    const isLikelyTypingNumbers = (input: string): boolean => {
        // 如果输入为空或很短，不触发自动解析
        if (!input || input.length < 10) return true;

        // 检查是否包含完整的osu.ppy.sh域名
        if (!input.includes('osu.ppy.sh')) return true;

        // 检查是否以数字结尾（可能还在输入beatmap ID）
        const lastChar = input[input.length - 1];
        const lastFewChars = input.slice(-3);

        // 如果最后的字符是数字，并且最近几个字符主要是数字，可能还在输入
        if (/\d/.test(lastChar)) {
            const digitCount = (lastFewChars.match(/\d/g) || []).length;
            return digitCount >= 2; // 最近3个字符中有2个或更多数字
        }

        return false;
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
        try {
            const response = await fetch(`/api/map-selections?season=${season}&category=${category}&osuId=${user?.id}`);
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
    };

    const parseBeatmapUrl = async () => {
        if (!urlInput.trim()) {
            showError('请输入beatmap链接');
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
                    url: urlInput,
                    osuId: user?.id.toString()
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data.type === 'single') {
                    setBeatmapPreview(data.data.beatmap);
                    setAvailableBeatmaps([]);
                } else {
                    // 多个beatmap，让用户选择
                    setAvailableBeatmaps(data.data.beatmaps);
                    setBeatmapPreview(data.data.beatmaps[0]); // 默认选择第一个
                }
            } else {
                const errorData = await response.json();
                showError(errorData.error || '解析beatmap链接失败');
            }
        } catch (error) {
            console.error('Failed to parse URL:', error);
            showError('解析链接时出错');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 使用rosu-pp API计算应用mod后的参数值
    const calculateModdedStatsAPI = async (beatmap: BeatmapInfo, mods: string, customSettings?: {
        customModName?: string;
        customDASettings?: {
            cs?: number | null;
            ar?: number | null;
            od?: number | null;
            hp?: number | null;
        } | null;
        customDTRate?: number | null;
    }) => {
        try {
            console.log('Calculating modded stats for:', { beatmapId: beatmap.id, mods, customSettings });
            const response = await fetch('/api/calculate-mod-stats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    beatmapId: beatmap.id,
                    mods: mods,
                    accessToken: user ? localStorage.getItem('osu_access_token') : null,
                    // 添加自定义mod设置
                    customModName: customSettings?.customModName,
                    customDASettings: customSettings?.customDASettings,
                    customDTRate: customSettings?.customDTRate,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API response error:', errorText);
                throw new Error('API调用失败');
            }

            const data = await response.json();
            console.log('API response data:', data);
            console.log('Modded stats:', data.modStats);
            return data.modStats;
        } catch (error) {
            console.error('计算mod参数失败:', error);
            // 如果API失败，返回原始参数
            return {
                ar: beatmap.ar,
                cs: beatmap.cs,
                od: beatmap.od,
                hp: beatmap.hp,
                star_rating: beatmap.star_rating,
                bpm: beatmap.bpm
            };
        }
    };

    const addSelection = async () => {
        if (!beatmapPreview) {
            showError('请先解析有效的beatmap链接');
            return;
        }

        setIsSubmitting(true);
        // Clear error (using global notifications now)

        try {
            // 使用rosu-pp API计算应用mod后的参数
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
            const moddedStats = await calculateModdedStatsAPI(beatmapPreview, selectedMods, customSettings);

            const response = await fetch('/api/map-selections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: urlInput,
                    selectedMods,
                    modPosition,
                    comment,
                    approved,
                    selectedBy: user?.id.toString(),
                    season,
                    category,
                    // 包含计算后的mod参数
                    moddedStats,
                    // 自定义mod设置
                    customModName: selectedMods === 'LZ' ? customModName : '',
                    customDASettings: customModName === 'DA' && selectedMods === 'LZ' ? {
                        cs: customCS !== '' ? customCS : null,
                        ar: customAR !== '' ? customAR : null,
                        od: customOD !== '' ? customOD : null,
                        hp: customHP !== '' ? customHP : null,
                    } : null,
                    customDTRate: selectedMods === 'DT' && customDTRate !== '' ? customDTRate : null,
                })
            });

            if (response.ok) {
                showSuccess('选图添加成功');
                setShowAddForm(false);
                setUrlInput('');
                setComment('');
                setSelectedMods('NM');
                setModPosition(1);
                setCustomModName('');
                setCustomCS('');
                setCustomAR('');
                setCustomOD('');
                setCustomHP('');
                setCustomDTRate(1.5);
                setApproved(false);
                setBeatmapPreview(null);
                setAvailableBeatmaps([]);
                fetchSelections();
            } else {
                const errorData = await response.json();
                showError(errorData.error || '添加选图失败');
            }
        } catch (error) {
            console.error('Failed to add selection:', error);
            showError('添加选图时出错');
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteSelection = async (id: number) => {
        if (!confirm('确定要删除这个选图吗？')) {
            return;
        }

        try {
            const response = await fetch(`/api/map-selections?id=${id}&selectedBy=${user?.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showSuccess('选图删除成功');
                fetchSelections();
            } else {
                const errorData = await response.json();
                showError(errorData.error || '删除选图失败');
            }
        } catch (error) {
            console.error('Failed to delete selection:', error);
            showError('删除选图时出错');
        }
    };

    const updateApprovalStatus = async (id: number, approved: boolean) => {
        try {
            const response = await fetch('/api/map-selections', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: id,
                    approved: approved,
                    selectedBy: user?.id.toString()
                })
            });

            if (response.ok) {
                showSuccess(`选图${approved ? '过审' : '取消过审'}成功`);
                fetchSelections();
            } else {
                const errorData = await response.json();
                showError(errorData.error || '更新过审状态失败');
            }
        } catch (error) {
            console.error('Failed to update approval status:', error);
            showError('更新过审状态时出错');
        }
    };

    const formatLength = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // 复制beatmap ID到剪贴板
    const copyBeatmapId = async (beatmapId: number) => {
        try {
            await navigator.clipboard.writeText(beatmapId.toString());
            showSuccess(`已复制 Beatmap ID: ${beatmapId}`);
        } catch (error) {
            console.error('Failed to copy beatmap ID:', error);
            // 备用方案：使用传统的选中复制方法
            const textArea = document.createElement('textarea');
            textArea.value = beatmapId.toString();
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showSuccess(`已复制 Beatmap ID: ${beatmapId}`);
        }
    };

    // 计算筛选后的选图列表
    const filteredSelections = selections.filter(selection => {
        if (modFilter === 'all') return true;

        // 处理LZ特有mod的情况
        if (selection.selectedMods === 'LZ' && selection.customModName) {
            return modFilter === 'LZ';
        }

        return selection.selectedMods === modFilter;
    });

    // 获取当前选图中存在的所有mod类型
    const getAvailableModsFromSelections = () => {
        const mods = new Set<string>();
        selections.forEach(selection => {
            if (selection.selectedMods === 'LZ' && selection.customModName) {
                mods.add('LZ');
            } else {
                mods.add(selection.selectedMods);
            }
        });
        return Array.from(mods).sort();
    };

    // 创建mod筛选的下拉选项
    const getModFilterOptions = (): DropdownOption[] => {
        const options: DropdownOption[] = [
            {
                value: 'all',
                label: '全部',
                count: selections.length
            }
        ];

        getAvailableModsFromSelections().forEach(mod => {
            const count = selections.filter(s => {
                if (s.selectedMods === 'LZ' && s.customModName) {
                    return mod === 'LZ';
                }
                return s.selectedMods === mod;
            }).length;

            options.push({
                value: mod,
                label: mod,
                count: count
            });
        });

        return options;
    };



    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="text-gray-800 text-xl mb-4">正在验证权限...</div>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-2xl">
                    <h2 className="text-gray-800 text-xl font-bold mb-4">访问被拒绝</h2>
                    <p className="text-gray-800 mb-4">您没有访问此页面的权限。</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        返回首页
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-white p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">选图系统</h1>
                        <div className="flex items-center space-x-4">
                            {user && (
                                <div className="flex items-center space-x-2 text-gray-800">
                                    <img
                                        src={user.avatar_url}
                                        alt={user.username}
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <span>{user.username}</span>
                                </div>
                            )}
                            <button
                                onClick={() => router.push('/')}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                            >
                                首页
                            </button>
                        </div>
                    </div>

                    {/* Control panel */}
                    <div className="bg-gray-100 rounded-lg p-6 mb-6">
                        <div className="flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex gap-4 items-center">
                                <Dropdown
                                    label="赛季"
                                    options={availableSeasons}
                                    value={season}
                                    onChange={setSeason}
                                    minWidth="8rem"
                                />
                                <Dropdown
                                    label="类别"
                                    options={CATEGORY_OPTIONS}
                                    value={category}
                                    onChange={setCategory}
                                    minWidth="8rem"
                                />
                            </div>
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium"
                            >
                                添加歌曲
                            </button>
                        </div>
                    </div>

                    {/* Add map form */}
                    {showAddForm && (
                        <div className="bg-gray-100 rounded-lg p-6 mb-6">
                            <h3 className="text-gray-800 text-xl font-bold mb-4">添加新选图</h3>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-gray-800 text-sm">Beatmap链接</label>
                                        <label className="flex items-center text-sm text-gray-600">
                                            {/* <input
                                                type="checkbox"
                                                checked={isAutoParseEnabled}
                                                onChange={(e) => setIsAutoParseEnabled(e.target.checked)}
                                                className="mr-1 h-3 w-3"
                                            />
                                            自动解析 */}
                                        </label>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={urlInput}
                                            onChange={handleUrlInputChange}
                                            onKeyDown={handleUrlInputKeyDown}
                                            placeholder="https://osu.ppy.sh/beatmaps/sid#mod#/bid (按回车解析)"
                                            className="flex-1 bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                                        />
                                        <button
                                            onClick={parseBeatmapUrl}
                                            disabled={isSubmitting}
                                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-4 py-2 rounded"
                                        >
                                            {isSubmitting ? '解析中...' : '解析'}
                                        </button>
                                    </div>
                                </div>

                                {/* Beatmap preview */}
                                {beatmapPreview && (
                                    <div className="bg-gray-200 rounded-lg p-4">
                                        <h4 className="text-gray-800 font-bold mb-2">歌曲预览</h4>

                                        {/* 难度选择器 - 只在有多个难度时显示 */}
                                        {availableBeatmaps.length > 1 && (
                                            <div className="mb-4">
                                                <Dropdown
                                                    label="选择难度"
                                                    options={availableBeatmaps.map(beatmap => ({
                                                        value: beatmap.id.toString(),
                                                        label: `${beatmap.version} - ${beatmap.star_rating.toFixed(2)}★`
                                                    }))}
                                                    value={beatmapPreview.id.toString()}
                                                    onChange={(value) => {
                                                        const selectedId = parseInt(value);
                                                        const selectedBeatmap = availableBeatmaps.find(b => b.id === selectedId);
                                                        if (selectedBeatmap) {
                                                            setBeatmapPreview(selectedBeatmap);
                                                        }
                                                    }}
                                                    minWidth="100%"
                                                />
                                            </div>
                                        )}

                                        <div className="flex gap-4">
                                            {/* Cover image */}
                                            <div className="flex-shrink-0">
                                                <img
                                                    src={beatmapPreview.cover_url}
                                                    alt={`${beatmapPreview.title} cover`}
                                                    className="w-24 h-24 rounded-lg object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                            {/* Beatmap info */}
                                            <div className="text-gray-800 space-y-1 flex-1">
                                                <p><strong>标题:</strong> {beatmapPreview.title}</p>
                                                <p><strong>艺术家:</strong> {beatmapPreview.artist}</p>
                                                <p><strong>难度:</strong> {beatmapPreview.version}</p>
                                                <p><strong>作图者:</strong> {beatmapPreview.creator}</p>

                                                {/* 显示mod计算后的参数 */}
                                                {moddedStats && (() => {
                                                    const isModded = selectedMods === 'HR' || selectedMods === 'DT';

                                                    return (
                                                        <>
                                                            <p><strong>星级:</strong> {(moddedStats.star_rating || 0).toFixed(2)}★ {isModded && <span className="text-sm text-blue-600">(+{selectedMods})</span>}</p>
                                                            <p><strong>BPM:</strong> {moddedStats.bpm || 0} {isModded && selectedMods === 'DT' && <span className="text-sm text-blue-600">(+DT)</span>}</p>
                                                            <p><strong>时长:</strong> {formatLength(beatmapPreview.total_length)}</p>
                                                            <p>
                                                                <strong>AR:</strong> {(moddedStats.ar || 0).toFixed(1)}
                                                                {isModded && <span className="text-sm text-gray-500">({beatmapPreview.ar.toFixed(1)})</span>} |
                                                                <strong> CS:</strong> {(moddedStats.cs || 0).toFixed(1)}
                                                                {isModded && selectedMods === 'HR' && <span className="text-sm text-gray-500">({beatmapPreview.cs.toFixed(1)})</span>} |
                                                                <strong> OD:</strong> {(moddedStats.od || 0).toFixed(1)}
                                                                {isModded && <span className="text-sm text-gray-500">({beatmapPreview.od.toFixed(1)})</span>} |
                                                                <strong> HP:</strong> {(moddedStats.hp || 0).toFixed(1)}
                                                                {isModded && selectedMods === 'HR' && <span className="text-sm text-gray-500">({beatmapPreview.hp.toFixed(1)})</span>}
                                                            </p>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-gray-800 text-sm mb-2">选择Mod</label>
                                        <Dropdown
                                            label=""
                                            options={MOD_OPTIONS.map(mod => ({ value: mod, label: mod }))}
                                            value={selectedMods}
                                            onChange={setSelectedMods}
                                            minWidth="200%"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-gray-800 text-sm mb-2">模组位置</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={modPosition}
                                            onChange={(e) => setModPosition(parseInt(e.target.value) || 1)}
                                            placeholder="1"
                                            className="w-full bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                                        />
                                    </div>
                                    <div className="flex-2">
                                        <label className="block text-gray-800 text-sm mb-2">注释</label>
                                        <input
                                            type="text"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="可选注释"
                                            className="w-full bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                                        />
                                    </div>
                                </div>

                                {/* LZ模式：自定义mod名称 */}
                                {selectedMods === 'LZ' && (
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                                        <h4 className="text-sm font-semibold text-blue-800 mb-2">Lazer特有模组设置</h4>
                                        <div>
                                            <label className="block text-gray-800 text-sm mb-2">选择Lazer模组</label>
                                            <select
                                                value={customModName}
                                                onChange={(e) => setCustomModName(e.target.value)}
                                                className="w-full bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                                            >
                                                <option value="">请选择一个Lazer特有模组</option>
                                                {availableLazerMods.map(mod => (
                                                    <option key={mod.name} value={mod.name}>
                                                        {mod.name} - {mod.description}
                                                    </option>
                                                ))}
                                            </select>
                                            {availableLazerMods.length === 0 && (
                                                <p className="text-xs text-gray-600 mt-1">正在加载可用模组...</p>
                                            )}
                                            {customModName && (
                                                <div className="mt-2 p-2 bg-blue-100 rounded">
                                                    <p className="text-xs text-blue-700">
                                                        <strong>已选择：</strong> {customModName}
                                                        {customModName === 'DA' && ' - 可在下方自定义难度属性'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* DA模式：自定义属性 */}
                                {customModName === 'DA' && selectedMods === 'LZ' && (
                                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded">
                                        <h4 className="text-sm font-semibold text-orange-800 mb-2">DA模组自定义属性</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-gray-800 text-sm mb-2">CS (Circle Size)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="10"
                                                    value={customCS}
                                                    onChange={(e) => setCustomCS(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                    placeholder="留空使用原始值"
                                                    className="w-full bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-800 text-sm mb-2">AR (Approach Rate)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="10"
                                                    value={customAR}
                                                    onChange={(e) => setCustomAR(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                    placeholder="留空使用原始值"
                                                    className="w-full bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-800 text-sm mb-2">OD (Overall Difficulty)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="10"
                                                    value={customOD}
                                                    onChange={(e) => setCustomOD(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                    placeholder="留空使用原始值"
                                                    className="w-full bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-800 text-sm mb-2">HP (Health Points)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="10"
                                                    value={customHP}
                                                    onChange={(e) => setCustomHP(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                    placeholder="留空使用原始值"
                                                    className="w-full bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* DT模式：自定义倍率 */}
                                {selectedMods === 'DT' && (
                                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                                        <h4 className="text-sm font-semibold text-green-800 mb-2">DT自定义倍率设置</h4>
                                        <div>
                                            <label className="block text-gray-800 text-sm mb-2">速度倍率</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="1.01"
                                                max="2.0"
                                                value={customDTRate}
                                                onChange={(e) => setCustomDTRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                                placeholder="1.5"
                                                className="w-full bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                                            />
                                            <p className="text-xs text-gray-600 mt-1">标准DT为1.5倍速，可自定义1.01-2.0倍速</p>
                                        </div>
                                    </div>
                                )}

                                {/* Approval checkbox */}
                                <div className="flex items-center">
                                    <label className="flex items-center text-gray-800">
                                        <input
                                            type="checkbox"
                                            checked={approved}
                                            onChange={(e) => setApproved(e.target.checked)}
                                            className="mr-2 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                        />
                                        过审 (Approved)
                                    </label>
                                </div>

                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => {
                                            setShowAddForm(false);
                                            setUrlInput('');
                                            setComment('');
                                            setSelectedMods('NM');
                                            setModPosition(1);
                                            setApproved(false);
                                            setBeatmapPreview(null);
                                            setAvailableBeatmaps([]);
                                            // Clear error (using global notifications now)
                                            setCustomModName('');
                                            setCustomCS('');
                                            setCustomAR('');
                                            setCustomOD('');
                                            setCustomHP('');
                                            setCustomDTRate(1.5);
                                        }}
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={addSelection}
                                        disabled={!beatmapPreview || isSubmitting}
                                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white px-4 py-2 rounded"
                                    >
                                        {isSubmitting ? '添加中...' : '添加歌曲'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Map selection list */}
                    <div className="bg-gray-100 rounded-lg p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                            <h3 className="text-gray-800 text-xl font-bold">
                                已选歌曲 ({filteredSelections.length}/{selections.length})
                            </h3>

                            {/* Mod 筛选器 */}
                            <Dropdown
                                label="按Mod筛选:"
                                options={getModFilterOptions()}
                                value={modFilter}
                                onChange={setModFilter}
                                showClearButton={modFilter !== 'all'}
                                clearButtonText="清除"
                            />
                        </div>

                        {filteredSelections.length === 0 ? (
                            <div className="text-center py-8">
                                {selections.length === 0 ? (
                                    <p className="text-gray-600">暂无选图</p>
                                ) : (
                                    <p className="text-gray-600">没有找到符合条件的选图</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredSelections.map((selection) => (
                                    <div key={selection.id} className="bg-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-4 flex-1">
                                                {/* Cover image */}
                                                {selection.coverUrl && (
                                                    <div className="flex-shrink-0">
                                                        <img
                                                            src={selection.coverUrl}
                                                            alt={`${selection.title} cover`}
                                                            className="w-20 h-20 rounded-lg object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                {/* Content */}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm font-bold">
                                                            {selection.selectedMods === 'LZ' && selection.customModName ?
                                                                `${selection.customModName}${selection.modPosition}` :
                                                                `${selection.selectedMods}${selection.modPosition}`
                                                            }
                                                            {selection.selectedMods === 'DT' && selection.customDTRate && selection.customDTRate !== 1.5 && (
                                                                <span className="text-xs ml-1">({selection.customDTRate}x)</span>
                                                            )}
                                                        </span>
                                                        {selection.customDASettings && (
                                                            <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs">
                                                                DA自定义
                                                            </span>
                                                        )}
                                                        {selection.approved && (
                                                            <span className="bg-green-500 text-white px-2 py-1 rounded text-sm font-bold">
                                                                ✓ 过审
                                                            </span>
                                                        )}
                                                        <h4 className="text-gray-800 font-bold">
                                                            {selection.title} - {selection.artist}
                                                        </h4>
                                                    </div>
                                                    <div className="text-gray-700 space-y-1">
                                                        <p><strong>难度:</strong> {selection.version}</p>
                                                        <p><strong>作图者:</strong> {selection.creator}</p>
                                                        <p><strong>星级:</strong> {selection.starRating.toFixed(2)}★</p>
                                                        <p><strong>BPM:</strong> {selection.bpm}</p>
                                                        <p><strong>时长:</strong> {formatLength(selection.totalLength)}</p>
                                                        <p><strong>AR:</strong> {selection.ar.toFixed(1)} | <strong>CS:</strong> {selection.cs.toFixed(1)} | <strong>OD:</strong> {selection.od.toFixed(1)} | <strong>HP:</strong> {selection.hp.toFixed(1)}</p>

                                                        {/* 显示自定义DA设置 */}
                                                        {selection.customDASettings && (
                                                            <div className="bg-orange-50 border border-orange-200 rounded p-2 mt-2">
                                                                <p className="text-orange-800 font-semibold text-sm">DA自定义属性:</p>
                                                                <p className="text-sm">
                                                                    {selection.customDASettings.cs !== null && <span>CS: {selection.customDASettings.cs} </span>}
                                                                    {selection.customDASettings.ar !== null && <span>AR: {selection.customDASettings.ar} </span>}
                                                                    {selection.customDASettings.od !== null && <span>OD: {selection.customDASettings.od} </span>}
                                                                    {selection.customDASettings.hp !== null && <span>HP: {selection.customDASettings.hp} </span>}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {selection.comment && (
                                                            <p><strong>注释:</strong> {selection.comment}</p>
                                                        )}
                                                        <p><strong>选择时间:</strong> {new Date(selection.selectedAt).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 ml-4">
                                                {/* 过审状态勾选框 */}
                                                <div className="flex items-center">
                                                    <label className="flex items-center text-gray-800 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={selection.approved}
                                                            onChange={(e) => updateApprovalStatus(selection.id, e.target.checked)}
                                                            className="mr-2 h-5 w-5 text-green-600 border-gray-300 focus:ring-green-500"
                                                        />
                                                        过审状态
                                                    </label>
                                                </div>
                                                {/* 操作按钮 */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => copyBeatmapId(selection.beatmapId)}
                                                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-sm font-medium transition-colors"
                                                        title={`复制 Beatmap ID: ${selection.beatmapId}`}
                                                    >
                                                        复制BID
                                                    </button>
                                                    <a
                                                        href={selection.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm"
                                                    >
                                                        查看详情
                                                    </a>
                                                    {selection.selectedBy === user?.id.toString() && (
                                                        <button
                                                            onClick={() => deleteSelection(selection.id)}
                                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm"
                                                        >
                                                            删除
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
