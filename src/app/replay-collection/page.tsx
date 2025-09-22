"use client";

import { useState, useEffect } from 'react';
import { hasReplayAccess } from './edgeconfig';
import MapoolTable from '../components/MapoolTable';
import { showError, showSuccess } from '../components/Notification';

interface User {
    id: number;
    username: string;
    avatar_url: string;
}

export default function ReplayCollectionPage() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [paddingMaps, setPaddingMaps] = useState<any[]>([]);
    const [selectedSeason, setSelectedSeason] = useState('s1');
    const [selectedCategory, setSelectedCategory] = useState('qualification');
    const [uploading, setUploading] = useState(false);
    const [uploadedUsers, setUploadedUsers] = useState<{ [key: string]: string[] }>({}); // { mapId: [userId, ...] }
    const [availableSeasons, setAvailableSeasons] = useState([
        { value: 's1', label: '第一赛季' }
    ]);
    const availableCategories = [
        { value: 'qualification', label: '资格赛' },
        { value: 'group', label: '小组赛' },
        { value: 'quarterfinal', label: '四分之一决赛' },
        { value: 'semifinal', label: '半决赛' },
        { value: 'final', label: '决赛' }
    ];
    const formatLength = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    const loadSeasonConfig = async () => {
        try {
            const response = await fetch('/api/season-config');
            if (response.ok) {
                const data = await response.json();
                console.log('Season config loaded:', data);
                if (data.success) {
                    setAvailableSeasons(data.availableSeasons);
                    setSelectedSeason(data.defaultSeason);
                    console.log('Set selectedSeason to:', data.defaultSeason);
                }
            } else {
                console.error('Failed to load season config, status:', response.status);
            }
        } catch (error) {
            console.error('Failed to load season config:', error);
            // 使用默认配置
        }
    };

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
                setTimeout(() => window.location.href = '/register', 3000); // 3秒后跳转
                return;
            }

            const sessionData = await sessionResponse.json();
            console.log('Session data:', sessionData);

            if (!sessionData.success || !sessionData.session) {
                console.log('No user in session, redirecting to register');
                showError('未找到用户会话。正在跳转到登录页面...');
                setTimeout(() => window.location.href = '/register', 3000); // 3秒后跳转
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

        } catch (error) {
            console.error('Auth check failed:', error);
            showError(`验证用户权限时出错: ${error instanceof Error ? error.message : '未知错误'}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkUserAuth();
    }, []);

    // 当用户加载完成后，检查权限并加载数据
    useEffect(() => {
        const checkAccessAndLoadData = async () => {
            if (!user) return;

            console.log('Checking access for user:', user);

            const hasAccess = await hasReplayAccess(user.id.toString());
            console.log('User access check result:', hasAccess);

            if (!hasAccess) {
                showError('无权限访问回放收集系统');
                return;
            }

            // 获取赛季配置
            await loadSeasonConfig();
        };

        if (user) {
            checkAccessAndLoadData();
        }
    }, [user]); // 当用户改变时执行

    // 单独的useEffect来加载地图数据
    useEffect(() => {
        const loadMapData = async () => {
            if (!user) return;

            console.log('Loading map data for:', { selectedSeason, selectedCategory, userId: user.id });

            // 获取padding状态的图池
            try {
                const url = `/api/map-selections?season=${selectedSeason}&category=${selectedCategory}&padding=true&osuId=${user.id}`;
                console.log('Fetching from URL:', url);

                const response = await fetch(url);
                console.log('Response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('Received data:', data);

                    // 转换数据格式以匹配MapoolTable期望的格式，同时保留原始数据用于卡片展示
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
                        // MapoolTable需要的格式化字段
                        SID: map.beatmapsetId, // beatmapset ID for cover image
                        BID: map.beatmapId, // beatmap ID
                        Slot: `${map.selectedMods}${map.modPosition}`, // MOD and position
                        MapInfo: `${map.artist} - ${map.title} [${map.version}]`, // song info
                        _Creator: map.creator, // creator
                        SR: map.starRating.toFixed(2), // star rating
                        CS: map.cs.toFixed(1), // circle size
                        AR: map.ar.toFixed(1), // approach rate
                        OD: map.od.toFixed(1), // overall difficulty
                        BPM: map.bpm, // BPM
                        HitLength: formatLength(map.totalLength), // length
                        Notes: map.comment || '-', // notes/comments
                        _CS: map.cs.toFixed(1), // original CS for tooltip
                        _AR: map.ar.toFixed(1), // original AR for tooltip
                        _OD: map.od.toFixed(1), // original OD for tooltip
                    }));

                    setPaddingMaps(formattedData);
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
    const handleReplayUpload = async (map: any, file: File) => {
        if (!user) {
            showError('请先登录');
            return;
        }
        if (!file.name.endsWith('.osr')) {
            showError('请上传.osr格式的回放文件');
            return;
        }
        setUploading(true);
        try {
            // 构造文件名
            const filename = `${selectedSeason}/${selectedCategory}/${map.selectedMods}${map.modPosition}_${user.id}.osr`;
            // 上传到vercel blob
            const formData = new FormData();
            formData.append('file', file);
            formData.append('filename', filename);
            formData.append('mapId', map.id);
            formData.append('userId', user.id.toString());
            const res = await fetch('/api/upload-replay', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                showSuccess('上传成功');
                // 刷新已上传用户
                setUploadedUsers(prev => ({
                    ...prev,
                    [map.id]: [...(prev[map.id] || []), user.id]
                }));
            } else {
                showError(data.error || '上传失败');
            }
        } catch {
            showError('上传失败');
        } finally {
            setUploading(false);
        }
    };

    // 删除回放文件
    const handleReplayDelete = async (map: any) => {
        if (!user) {
            showError('请先登录');
            return;
        }

        if (!confirm('确定要删除已上传的回放文件吗？')) {
            return;
        }

        try {
            // 构造文件名
            const filename = `${selectedSeason}/${selectedCategory}/${map.selectedMods}${map.modPosition}_${user.id}.osr`;

            const res = await fetch('/api/upload-replay', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename,
                    userId: user.id.toString()
                })
            });

            const data = await res.json();
            if (data.success) {
                showSuccess('删除成功');
                // 更新已上传用户列表，移除当前用户
                setUploadedUsers(prev => ({
                    ...prev,
                    [map.id]: (prev[map.id] || []).filter(id => id !== user.id.toString())
                }));
            } else {
                showError(data.error || '删除失败');
            }
        } catch {
            showError('删除失败');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">回放文件收集系统</h2>

            {isLoading ? (
                <div className="text-center py-8">
                    <div className="text-lg">正在加载...</div>
                </div>
            ) : (
                <>
                    <div className="mb-4 flex gap-4">
                        <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className="border rounded px-2 py-1">
                            {availableSeasons.map(season => (
                                <option key={season.value} value={season.value}>{season.label}</option>
                            ))}
                        </select>
                        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="border rounded px-2 py-1">
                            {availableCategories.map(category => (
                                <option key={category.value} value={category.value}>{category.label}</option>
                            ))}
                        </select>
                    </div>
                    <MapoolTable data={paddingMaps} title="Padding状态图池" />
                    <div className="mt-6">
                        <h3 className="text-xl font-bold mb-4">回放文件上传</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paddingMaps.map(map => (
                                <div
                                    key={map.id}
                                    className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
                                    onClick={() => {
                                        if (!uploading && user) {
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
                                        e.currentTarget.classList.add('bg-blue-50', 'border-blue-300');
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');
                                        if (!uploading && user) {
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
                                    {user && uploadedUsers[map.id]?.includes(user.id.toString()) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // 阻止事件冒泡
                                                handleReplayDelete(map);
                                            }}
                                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                                            title="删除已上传的回放"
                                        >
                                            ×
                                        </button>
                                    )}
                                    <div className="mb-3">
                                        <h4 className="font-bold text-sm text-gray-800 truncate" title={`${map.artist} - ${map.title}`}>
                                            {map.artist} - {map.title}
                                        </h4>
                                        <p className="text-xs text-gray-600 truncate" title={map.version}>
                                            [{map.version}]
                                        </p>
                                    </div>

                                    <div className="mb-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-blue-600">
                                                {map.selectedMods}{map.modPosition}
                                            </span>
                                            <span className="text-gray-500">
                                                ★{map.starRating}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {map.totalLength ? formatLength(map.totalLength) : '-'} | {map.bpm} BPM
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <div className="text-xs text-gray-600">
                                            已上传用户: {(uploadedUsers[map.id] || []).length === 0 ? '暂无' : uploadedUsers[map.id].join(', ')}
                                        </div>
                                        {user && uploadedUsers[map.id]?.includes(user.id.toString()) && (
                                            <div className="text-xs text-green-600 font-medium mt-1">✓ 你已上传</div>
                                        )}
                                    </div>

                                    <div className="text-center">
                                        <div className="text-xs text-gray-400">
                                            {uploading ? '上传中...' : '点击上传或拖拽.osr文件'}
                                        </div>
                                    </div>

                                    {uploading && (
                                        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                                            <div className="text-sm text-blue-600">上传中...</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
