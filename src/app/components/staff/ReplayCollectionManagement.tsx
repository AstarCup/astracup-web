"use client";

import { useState, useEffect } from 'react';
import MapoolTable from '../ui/MapoolTable';
import Dropdown from '../ui/Dropdown';
import { showError, showSuccess } from '../ui/Notification';
import { UserSession } from '@/lib/permissions';
import Image from 'next/image';

interface User {
    id: number;
    username: string;
    avatar_url: string;
}

interface ReplayCollectionManagementProps {
    user: UserSession;
    permissions: {
        isAdmin: boolean;
        isReplayTester: boolean;
        isReferee: boolean;
        isStreamer: boolean;
        isCommentator: boolean;
    };
}

interface PaddingMap {
    id: number;
    artist: string;
    title: string;
    version: string;
    selectedMods: string;
    modPosition: number;
    starRating: number;
    totalLength: number;
    bpm: number;
    creator: string;
    beatmapsetId: number;
    beatmapId: number;
    ar: number;
    cs: number;
    od: number;
    hp: number;
    comment?: string;
    // MapoolTable 格式化字段
    SID: number;
    BID: number;
    Slot: string;
    MapInfo: string;
    _Creator: string;
    SR: string;
    CS: string;
    AR: string;
    OD: string;
    BPM: number;
    HitLength: string;
    Notes: string;
    _CS: string;
    _AR: string;
    _OD: string;
    // 最大连击数
    maxCombo?: number;
    MaxCombo?: number;
    // 提名者信息
    selectedByUsername?: string;
    // LZ自定义mod名称和DT倍率
    customModName?: string;
    customDTRate?: number;
}

export default function ReplayCollectionManagement({ user, permissions }: ReplayCollectionManagementProps) {
    // 转换UserSession为内部使用的User格式
    const userForState: User = {
        id: parseInt(user.osuId),
        username: user.username,
        avatar_url: user.avatar_url
    };
    const [isLoading, setIsLoading] = useState(true);
    const [paddingMaps, setPaddingMaps] = useState<PaddingMap[]>([]);

    // 从本地存储加载初始值
    const [selectedSeason, setSelectedSeason] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('replayCollection_season') || 's1';
        }
        return 's1';
    });
    const [selectedCategory, setSelectedCategory] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('replayCollection_category') || 'qualification';
        }
        return 'qualification';
    });
    const [selectedModFilter, setSelectedModFilter] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('replayCollection_modFilter') || 'all';
        }
        return 'all';
    });

    const [uploading, setUploading] = useState<number | null>(null);
    const [uploadedUsers, setUploadedUsers] = useState<{ [key: string]: string[] }>({}); // { mapId: [username, ...] }
    const [isLoadingUploadedUsers, setIsLoadingUploadedUsers] = useState(true); // 跟踪已上传用户数据加载状态
    const [highlightedMapId, setHighlightedMapId] = useState<number | null>(null);
    const [downloadingAll, setDownloadingAll] = useState(false);
    const [availableSeasons, setAvailableSeasons] = useState([
        { value: 's1', label: '第一赛季' }
    ]);
    const availableCategories = [
        { value: 'qualification', label: 'QUA' },
        { value: 'ro16', label: 'RO16' },
        { value: 'quarterfinals', label: 'QF' },
        { value: 'semifinals', label: 'SF' },
        { value: 'finals', label: 'F' },
        { value: 'grandfinals', label: 'GF' }
    ];

    const formatLength = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // 根据mod名返回对应的颜色class (用于卡片展示)
    const getModColor = (mod: string): string => {
        switch (mod) {
            case 'NM': return 'text-gray-600';
            case 'HD': return 'text-yellow-600';
            case 'HR': return 'text-red-600';
            case 'DT': return 'text-purple-600';
            case 'EZ': return 'text-green-600';
            case 'LZ': return 'text-gray-600';
            case 'TB': return 'text-black-600';
            default: return 'text-blue-600';
        }
    };

    // 加载已上传用户状态
    const loadUploadedUsers = async () => {
        setIsLoadingUploadedUsers(true); // 开始加载
        try {
            const response = await fetch(`/api/uploaded-users?season=${selectedSeason}&category=${selectedCategory}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('Loaded uploaded users:', data.uploadedUsers);
                    setUploadedUsers(data.uploadedUsers);
                }
            } else {
                console.error('Failed to load uploaded users, response not ok:', response.status);
            }
        } catch (error) {
            console.error('Failed to load uploaded users:', error);
        } finally {
            setIsLoadingUploadedUsers(false); // 加载完成，无论成功失败
        }
    };

    // 获取用户名列表 - 直接返回用户名 (用于卡片展示)
    const getUsernamesList = (usernames: string[]): string => {
        if (usernames.length === 0) return '暂无';
        return usernames.join(', ');
    };

    // 处理表格行右击 - 跳转到对应卡片并高亮
    const handleTableRowRightClick = (row: PaddingMap, _index: number) => {
        // 设置高亮状态
        setHighlightedMapId(row.id);

        // 跳转到上传区域
        const uploadSection = document.getElementById('upload-section');
        if (uploadSection) {
            uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // 7秒后取消高亮
        setTimeout(() => {
            setHighlightedMapId(null);
        }, 7000);
    };

    // 自定义 onChange 处理函数 - 保存到本地存储
    const handleSeasonChange = (value: string) => {
        setSelectedSeason(value);
        if (typeof window !== 'undefined') {
            localStorage.setItem('replayCollection_season', value);
        }
    };

    const handleCategoryChange = (value: string) => {
        setSelectedCategory(value);
        if (typeof window !== 'undefined') {
            localStorage.setItem('replayCollection_category', value);
        }
    };

    const handleModFilterChange = (value: string) => {
        setSelectedModFilter(value);
        if (typeof window !== 'undefined') {
            localStorage.setItem('replayCollection_modFilter', value);
        }
    };

    // 根据mod顺序排序地图
    const sortMapsByModOrder = (maps: PaddingMap[]): PaddingMap[] => {
        // 定义mod排序顺序
        const modOrder = ['NM', 'HD', 'HR', 'DT', 'LZ', 'FM', 'TB'];

        return [...maps].sort((a, b) => {
            // 首先按mod类型排序
            const modAIndex = modOrder.indexOf(a.selectedMods);
            const modBIndex = modOrder.indexOf(b.selectedMods);

            // 如果mod类型不同，按指定顺序排序
            if (modAIndex !== modBIndex) {
                return modAIndex - modBIndex;
            }

            // 如果mod类型相同，按mod位置排序
            return a.modPosition - b.modPosition;
        });
    };

    // 根据mod筛选地图
    const getFilteredMaps = () => {
        let filteredMaps;
        if (selectedModFilter === 'all') {
            filteredMaps = paddingMaps;
        } else {
            filteredMaps = paddingMaps.filter(map => map.selectedMods === selectedModFilter);
        }

        // 对筛选后的地图按mod顺序排序
        return sortMapsByModOrder(filteredMaps);
    };

    // 获取可用的mod选项（包含数量统计）
    const getModFilterOptions = () => {
        const modCounts: { [key: string]: number } = {};

        // 统计每个mod的数量
        paddingMaps.forEach(map => {
            const mod = map.selectedMods;
            modCounts[mod] = (modCounts[mod] || 0) + 1;
        });

        // 生成选项列表
        const options = [
            { value: 'all', label: '全部', count: paddingMaps.length }
        ];

        // 添加各个mod选项
        Object.entries(modCounts).forEach(([mod, count]) => {
            options.push({ value: mod, label: mod, count });
        });

        return options;
    };

    const loadSeasonConfig = async () => {
        try {
            const response = await fetch('/api/season-config');
            if (response.ok) {
                const data = await response.json();
                // console.log('Season config loaded:', data);
                if (data.success) {
                    setAvailableSeasons(data.availableSeasons);
                    setSelectedSeason(data.defaultSeason);
                    // console.log('Set selectedSeason to:', data.defaultSeason);
                }
            } else {
                console.error('Failed to load season config, status:', response.status);
            }
        } catch (error) {
            console.error('Failed to load season config:', error);
            // 使用默认配置
        }
    };

    // 检查权限并加载数据
    useEffect(() => {
        const checkAccessAndLoadData = async () => {
            if (!user) return;

            // console.log('Checking access for user:', user);

            const hasAccess = permissions.isReplayTester || permissions.isAdmin || permissions.isReferee || permissions.isStreamer || permissions.isCommentator;
            // console.log('User access check result:', hasAccess);

            if (!hasAccess) {
                showError('无权限访问回放收集系统');
                setIsLoading(false);
                return;
            }

            // 获取赛季配置
            await loadSeasonConfig();
            setIsLoading(false);
        };

        if (user) {
            checkAccessAndLoadData();
        }
    }, [user, permissions]); // 当用户或权限改变时执行

    // 加载地图数据 - 完全适配MapoolTable组件
    useEffect(() => {
        const loadMapData = async () => {
            if (!user) return;

            // console.log('Loading map data for:', { selectedSeason, selectedCategory, userId: userForState.id });

            // 获取padding状态的图池
            try {
                const url = `/api/map-selections?season=${selectedSeason}&category=${selectedCategory}&padding=true&osuId=${userForState.id}`;
                // console.log('Fetching from URL:', url);

                const response = await fetch(url);
                // console.log('Response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    // console.log('Received data:', data);

                    // 转换数据格式以完全匹配MapoolTable期望的格式
                    const formattedData = (data.selections || []).map((map: any) => ({
                        // 原始数据字段
                        id: map.id,
                        artist: map.artist,
                        title: map.title,
                        version: map.version,
                        selectedMods: map.selectedMods,
                        modPosition: map.modPosition,
                        starRating: map.starRating,
                        totalLength: map.totalLength,
                        bpm: map.bpm,
                        creator: map.creator,
                        beatmapsetId: map.beatmapsetId,
                        beatmapId: map.beatmapId,
                        ar: map.ar,
                        cs: map.cs,
                        od: map.od,
                        hp: map.hp,
                        comment: map.comment,
                        // MapoolTable需要的格式化字段
                        SID: map.beatmapsetId,
                        BID: map.beatmapId,
                        Slot: `${map.selectedMods}${map.modPosition}`,
                        MapInfo: `${map.artist} - ${map.title} [${map.version}]`,
                        _Creator: map.creator,
                        SR: map.starRating.toFixed(2),
                        CS: map.cs.toFixed(1),
                        AR: map.ar.toFixed(1),
                        OD: map.od.toFixed(1),
                        BPM: map.bpm,
                        HitLength: formatLength(map.totalLength),
                        Notes: map.comment || '-',
                        _CS: map.cs.toFixed(1),
                        _AR: map.ar.toFixed(1),
                        _OD: map.od.toFixed(1),
                        // 最大连击数 - 用于表格显示
                        maxCombo: map.maxCombo || map.MaxCombo || 0,
                        MaxCombo: map.maxCombo || map.MaxCombo || 0,
                        // 提名者信息 - 用于详细信息卡片显示
                        selectedByUsername: map.selectedByUsername || map.selectedBy || '未知',
                        // LZ自定义mod名称和DT倍率 - 用于表格显示
                        customModName: map.customModName || '',
                        customDTRate: map.customDTRate || 1.5,
                    }));

                    setPaddingMaps(formattedData);
                    // 加载已上传用户状态
                    await loadUploadedUsers();
                } else {
                    const errorData = await response.json();
                    console.error('API Error:', errorData);
                    showError(errorData.error || '获取图池数据失败');
                    setPaddingMaps([]); // 清空数据
                }
            } catch (error) {
                console.error('Failed to load map data:', error);
                showError('加载图池数据时出错');
                setPaddingMaps([]); // 清空数据
            }
        };

        if (user) {
            loadMapData();
        }
    }, [user, selectedSeason, selectedCategory]); // 当用户或选择改变时重新加载

    // 上传回放文件
    const handleReplayUpload = async (map: PaddingMap, file: File) => {
        if (!user) {
            showError('请先登录');
            return;
        }
        if (!file.name.endsWith('.osr')) {
            showError('请上传.osr格式的回放文件');
            return;
        }
        setUploading(map.id);
        try {
            // 构造文件名 - 格式: modPosition_bid_userId_username.osr
            const safeUsername = user.username.replace(/[^a-zA-Z0-9_-]/g, '_'); // 替换特殊字符
            const filename = `${selectedSeason}/${selectedCategory}/${map.selectedMods}${map.modPosition}_${map.BID}_${userForState.id}_${safeUsername}.osr`;
            // 上传到vercel blob
            const formData = new FormData();
            formData.append('file', file);
            formData.append('filename', filename);
            formData.append('mapId', map.id.toString());
            formData.append('userId', userForState.id.toString());
            formData.append('username', user.username);
            const res = await fetch('/api/upload-replay', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                showSuccess('上传成功');
                // 刷新已上传用户
                const mapKey = `${selectedSeason}/${selectedCategory}/${map.BID}`;
                setUploadedUsers(prev => ({
                    ...prev,
                    [mapKey]: [...(prev[mapKey] || []), user.username]
                }));
            } else {
                showError(data.error || '上传失败');
            }
        } catch {
            showError('上传失败');
        } finally {
            setUploading(null);
        }
    };

    // 删除回放文件
    const handleReplayDelete = async (map: PaddingMap) => {
        if (!user) {
            showError('请先登录');
            return;
        }

        if (!confirm('确定要删除已上传的回放文件吗？')) {
            return;
        }

        try {
            // 构造文件名 - 需要找到对应的文件名
            const safeUsername = user.username.replace(/[^a-zA-Z0-9_-]/g, '_');
            const filename = `${selectedSeason}/${selectedCategory}/${map.selectedMods}${map.modPosition}_${map.BID}_${userForState.id}_${safeUsername}.osr`;

            const res = await fetch('/api/upload-replay', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename,
                    userId: userForState.id.toString()
                })
            });

            const data = await res.json();
            if (data.success) {
                showSuccess('删除成功');
                // 更新已上传用户列表，移除当前用户
                const mapKey = `${selectedSeason}/${selectedCategory}/${map.BID}`;
                setUploadedUsers(prev => ({
                    ...prev,
                    [mapKey]: (prev[mapKey] || []).filter(username => username !== user.username)
                }));
            } else {
                showError(data.error || '删除失败');
            }
        } catch {
            showError('删除失败');
        }
    };

    // 下载全部回放文件
    const handleDownloadAllReplays = async () => {
        if (!user) {
            showError('请先登录');
            return;
        }

        setDownloadingAll(true);
        try {
            const response = await fetch(`/api/download-all-replays?season=${selectedSeason}&category=${selectedCategory}`);

            if (response.ok) {
                // 创建下载链接
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${selectedSeason}_${selectedCategory}_replays.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                showSuccess('下载成功');
            } else {
                const errorData = await response.json();
                showError(errorData.error || '下载失败');
            }
        } catch (error) {
            console.error('Download all replays failed:', error);
            showError('下载失败');
        } finally {
            setDownloadingAll(false);
        }
    };

    return (
        <div className="max-w-9xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4 text-white">回放文件收集系统</h2>

            {isLoading ? (
                <div className="text-center py-8">
                    <div className="text-lg">正在加载...</div>
                </div>
            ) : (
                <>
                    <div className="mb-4 flex gap-4 flex-wrap">
                        <Dropdown
                            options={availableSeasons}
                            value={selectedSeason}
                            onChange={handleSeasonChange}
                            placeholder="选择赛季"
                            minWidth="8rem"
                        />
                        <Dropdown
                            options={availableCategories}
                            value={selectedCategory}
                            onChange={handleCategoryChange}
                            placeholder="选择阶段"
                            minWidth="8rem"
                        />
                        <Dropdown
                            options={getModFilterOptions()}
                            value={selectedModFilter}
                            onChange={handleModFilterChange}
                            placeholder="筛选MOD"
                            minWidth="6rem"
                        />
                    </div>
                    {/* MapoolTable 组件 - 完全负责表格展示 */}
                    <MapoolTable
                        data={getFilteredMaps()}
                        title="Padding状态图池"
                        onRowRightClick={handleTableRowRightClick}
                        showUploadJump={true}
                        uploadedUsers={uploadedUsers}
                        season={selectedSeason}
                        category={selectedCategory}
                    />
                    <div className="mt-6" id="upload-section">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl text-white font-bold">回放文件上传</h3>
                            {selectedModFilter !== 'all' && (
                                <div className="text-sm text-gray-600">
                                    已筛选: {getFilteredMaps().length} 张地图 ({selectedModFilter})
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {getFilteredMaps().map(map => (
                                <div
                                    key={map.id}
                                    className={`border rounded-md p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden ${highlightedMapId === map.id ? 'ring-4 ring-blue-500 ring-opacity-75 shadow-lg highlight-pulse' : ''} ${!isLoadingUploadedUsers && user && uploadedUsers[`${selectedSeason}/${selectedCategory}/${map.BID}`]?.includes(user.username) ? 'border-green-500' : 'border-gray-300'
                                        }`}
                                    style={{
                                        backgroundImage: `url(https://assets.ppy.sh/beatmaps/${map.SID}/covers/cover.jpg)`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat',
                                        opacity: !isLoadingUploadedUsers && user && uploadedUsers[`${selectedSeason}/${selectedCategory}/${map.BID}`]?.includes(user.username) ? 0.76 : 1,
                                        transition: 'opacity 0.2s ease-in-out'
                                    }}

                                    onClick={() => {
                                        if (uploading === null && user) {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = '.osr';
                                            input.onchange = (e) => {
                                                const target = e.target as HTMLInputElement;
                                                if (target.files && target.files[0]) {
                                                    handleReplayUpload(map, target.files[0]);
                                                }
                                            };
                                            input.click();
                                        }
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        if (uploading === null) {
                                            e.currentTarget.classList.add('bg-blue-50', 'border-blue-300');
                                        }
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');
                                        if (uploading === null && user) {
                                            const files = e.dataTransfer.files;
                                            if (files.length > 0 && files[0].name.endsWith('.osr')) {
                                                handleReplayUpload(map, files[0]);
                                            } else {
                                                showError('请上传.osr格式的回放文件');
                                            }
                                        }
                                    }}
                                >
                                    {/* 删除按钮 - 只有已上传时显示 */}
                                    {!isLoadingUploadedUsers && user && uploadedUsers[`${selectedSeason}/${selectedCategory}/${map.BID}`]?.includes(user.username) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // 阻止事件冒泡
                                                handleReplayDelete(map);
                                            }}
                                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors z-30"
                                            title="删除已上传的回放"
                                        >
                                            ×
                                        </button>
                                    )}

                                    {/* 渐变覆盖层 - 已上传时显示绿色，未上传时显示白色 */}
                                    <div className={`absolute inset-0 ${!isLoadingUploadedUsers && user && uploadedUsers[`${selectedSeason}/${selectedCategory}/${map.BID}`]?.includes(user.username) ? 'bg-gradient-to-tr from-green-100 via-green-50/80 to-transparent' : 'bg-gradient-to-tr from-white via-white/80 to-transparent'}`}></div>

                                    {/* 内容层 */}
                                    <div className="relative z-10">
                                        <div className="mb-3 flex items-start justify-between">
                                            {/* 左边：mod位信息（加粗） */}
                                            <div className="flex-shrink-0">
                                                <span className={`font-bold text-lg ${getModColor(map.selectedMods)} px-2 py-1 shadow-sm bg-white/90 rounded`}>
                                                    {map.selectedMods}{map.modPosition}
                                                </span>
                                            </div>

                                            {/* 右边：歌曲信息 */}
                                            <div className="flex-1 min-w-0 ml-3 text-right">
                                                <h4 className="font-bold text-sm text-gray-800 truncate px-2 py-1" title={`${map.artist} - ${map.title}`}>
                                                    {map.artist} - {map.title}
                                                </h4>
                                                <p className="text-xs text-gray-600 truncate px-2 py-1 mt-1" title={map.version}>
                                                    [{map.version}]
                                                </p>
                                            </div>
                                        </div>

                                        {/* 中间区域：星级和其他信息 */}
                                        <div className="mb-3">
                                            <div className="flex items-center justify-end text-sm mb-1">
                                                <span className="text-gray-700 font-medium px-2 py-1">
                                                    ★{map.starRating}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-600 px-2 py-1">
                                                {map.totalLength ? formatLength(map.totalLength) : '-'} | {map.bpm} BPM
                                            </div>
                                        </div>

                                        {/* 底部区域：上传状态 */}
                                        <div className="mb-3 bg-white rounded-md px-2">
                                            <div className="text-xl text-bold text-gray-700 px-2 py-1">
                                                已上传用户: {isLoadingUploadedUsers ? '加载中...' : getUsernamesList(uploadedUsers[`${selectedSeason}/${selectedCategory}/${map.BID}`] || [])}
                                            </div>
                                            {!isLoadingUploadedUsers && user && uploadedUsers[`${selectedSeason}/${selectedCategory}/${map.BID}`]?.includes(user.username) && (
                                                <div className="text-xl text-bold text-green-600 font-medium mt-1 px-2 py-1">✓ 你已上传</div>
                                            )}
                                            {/* 调试信息 */}
                                            <div className="text-xs text-gray-500 mt-1 px-2 py-1">
                                                调试: mapKey={selectedSeason}/{selectedCategory}/{map.BID}, 已上传: {!isLoadingUploadedUsers && user && uploadedUsers[`${selectedSeason}/${selectedCategory}/${map.BID}`]?.includes(user.username) ? '是' : '否'}
                                            </div>
                                        </div>

                                        {/* 底部提示 */}
                                        <div className="text-center">
                                            <div className="text-xs text-gray-600 px-2 py-1 inline-block">
                                                {uploading === map.id ? '上传中...' : (uploading === null ? '点击上传或拖拽.osr文件' : '其他文件上传中...')}
                                            </div>
                                        </div>

                                        {/* 上传中遮罩 - 只在当前卡片上传时显示，去掉白色背景 */}
                                        {uploading === map.id && (
                                            <div className="absolute inset-0 flex items-center justify-center z-30">
                                                <div className="text-sm text-blue-600 bg-white px-3 py-2 rounded shadow-lg">上传中...</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 下载全部回放功能 */}
                    <div className="mt-8 border-t pt-6 bg-[#3d3d3d]">
                        <div className="flex justify-between items-center mb-4 p-6">
                            <h3 className="text-xl font-bold text-white">下载全部回放</h3>
                            <button
                                onClick={handleDownloadAllReplays}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white  transition-colors flex items-center gap-2"
                                disabled={downloadingAll}
                            >
                                {downloadingAll ? (
                                    <>
                                        <Image src='/icons/loading.svg' alt='loading' width={120} height={120} className='animate-spin' />
                                        下载中...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        下载全部回放
                                    </>
                                )}
                            </button>
                        </div>
                        <div className='p-6'>
                            <p className="text-sm text-white">
                                下载当前页面所有已上传回放文件，文件将按mod位分类整理。
                            </p>

                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
