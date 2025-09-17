'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

    // Add selection form
    const [showAddForm, setShowAddForm] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [selectedMods, setSelectedMods] = useState('NM');
    const [modPosition, setModPosition] = useState(1);
    const [comment, setComment] = useState('');
    const [approved, setApproved] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [beatmapPreview, setBeatmapPreview] = useState<BeatmapInfo | null>(null);

    // Error and message
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Check user login status and permissions
    useEffect(() => {
        checkUserAuth();
    }, []);

    // Get selection list
    useEffect(() => {
        if (isAuthorized && user) {
            fetchSelections();
        }
    }, [isAuthorized, user, season, category]);

    const checkUserAuth = async () => {
        try {
            console.log('Starting auth check...');

            // Check if user is logged in
            console.log('Fetching session...');
            const sessionResponse = await fetch('/api/session/get');
            console.log('Session response status:', sessionResponse.status);

            if (!sessionResponse.ok) {
                console.log('Session check failed, redirecting to register');
                setError('未登录。正在跳转到登录页面...');
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
                setError('未找到用户会话。正在跳转到登录页面...');
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
                setError('无效的用户会话 - 未找到用户ID。正在跳转到登录页面...');
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

                setError(errorMessage);
            }

        } catch (error) {
            console.error('Auth check failed:', error);
            setError(`验证用户权限时出错: ${error instanceof Error ? error.message : '未知错误'}`);
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

    const fetchSelections = async () => {
        try {
            const response = await fetch(`/api/map-selections?season=${season}&category=${category}&osuId=${user?.id}`);
            if (response.ok) {
                const data = await response.json();
                setSelections(data.selections || []);
            } else {
                const errorData = await response.json();
                setError(errorData.error || '获取选图列表失败');
            }
        } catch (error) {
            console.error('Failed to fetch selections:', error);
            setError('获取选图列表时出错');
        }
    };

    const parseBeatmapUrl = async () => {
        if (!urlInput.trim()) {
            setError('请输入beatmap链接');
            return;
        }

        setIsSubmitting(true);
        setError('');
        setBeatmapPreview(null);

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
                } else {
                    setBeatmapPreview(data.data.beatmaps[0]);
                }
            } else {
                const errorData = await response.json();
                setError(errorData.error || '解析beatmap链接失败');
            }
        } catch (error) {
            console.error('Failed to parse URL:', error);
            setError('解析链接时出错');
        } finally {
            setIsSubmitting(false);
        }
    };

    const addSelection = async () => {
        if (!beatmapPreview) {
            setError('请先解析有效的beatmap链接');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
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
                    category
                })
            });

            if (response.ok) {
                setMessage('选图添加成功');
                setShowAddForm(false);
                setUrlInput('');
                setComment('');
                setSelectedMods('NM');
                setModPosition(1);
                setApproved(false);
                setBeatmapPreview(null);
                fetchSelections();
            } else {
                const errorData = await response.json();
                setError(errorData.error || '添加选图失败');
            }
        } catch (error) {
            console.error('Failed to add selection:', error);
            setError('添加选图时出错');
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
                setMessage('选图删除成功');
                fetchSelections();
            } else {
                const errorData = await response.json();
                setError(errorData.error || '删除选图失败');
            }
        } catch (error) {
            console.error('Failed to delete selection:', error);
            setError('删除选图时出错');
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
                setMessage(`选图${approved ? '过审' : '取消过审'}成功`);
                fetchSelections();
            } else {
                const errorData = await response.json();
                setError(errorData.error || '更新过审状态失败');
            }
        } catch (error) {
            console.error('Failed to update approval status:', error);
            setError('更新过审状态时出错');
        }
    };

    const formatLength = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="text-gray-800 text-xl mb-4">正在验证权限...</div>
                    {error && (
                        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 max-w-2xl">
                            <pre className="text-gray-800 whitespace-pre-wrap text-sm">
                                {error}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-2xl">
                    <h2 className="text-gray-800 text-xl font-bold mb-4">访问被拒绝</h2>
                    <pre className="text-gray-800 mb-4 whitespace-pre-wrap text-sm bg-black/20 p-4 rounded overflow-auto max-h-96">
                        {error}
                    </pre>
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

                {/* Error and message alerts */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
                        <p className="text-gray-800">{error}</p>
                        <button
                            onClick={() => setError('')}
                            className="text-red-600 hover:text-red-800 mt-2"
                        >
                            关闭
                        </button>
                    </div>
                )}

                {message && (
                    <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-6">
                        <p className="text-gray-800">{message}</p>
                        <button
                            onClick={() => setMessage('')}
                            className="text-green-600 hover:text-green-800 mt-2"
                        >
                            关闭
                        </button>
                    </div>
                )}

                {/* Control panel */}
                <div className="bg-gray-100 rounded-lg p-6 mb-6">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex gap-4 items-center">
                            <div>
                                <label className="block text-gray-800 text-sm mb-1">赛季</label>
                                <select
                                    value={season}
                                    onChange={(e) => setSeason(e.target.value)}
                                    className="bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                                >
                                    {availableSeasons.map(seasonOption => (
                                        <option key={seasonOption.value} value={seasonOption.value}>
                                            {seasonOption.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-800 text-sm mb-1">类别</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
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
                                <label className="block text-gray-800 text-sm mb-2">Beatmap链接</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        placeholder="https://osu.ppy.sh/beatmaps/123456 or https://osu.ppy.sh/beatmapsets/12345"
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
                                            <p><strong>星级:</strong> {beatmapPreview.star_rating.toFixed(2)}★</p>
                                            <p><strong>BPM:</strong> {beatmapPreview.bpm}</p>
                                            <p><strong>时长:</strong> {formatLength(beatmapPreview.total_length)}</p>
                                            <p><strong>AR:</strong> {beatmapPreview.ar.toFixed(1)} | <strong>CS:</strong> {beatmapPreview.cs.toFixed(1)} | <strong>OD:</strong> {beatmapPreview.od.toFixed(1)} | <strong>HP:</strong> {beatmapPreview.hp.toFixed(1)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-gray-800 text-sm mb-2">模组</label>
                                    <select
                                        value={selectedMods}
                                        onChange={(e) => setSelectedMods(e.target.value)}
                                        className="w-full bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                                    >
                                        {MOD_OPTIONS.map(mod => (
                                            <option key={mod} value={mod}>{mod}</option>
                                        ))}
                                    </select>
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
                                        setError('');
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
                    <h3 className="text-gray-800 text-xl font-bold mb-4">
                        已选歌曲 ({selections.length})
                    </h3>

                    {selections.length === 0 ? (
                        <p className="text-gray-600 text-center py-8">暂无选图</p>
                    ) : (
                        <div className="space-y-4">
                            {selections.map((selection) => (
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
                                                        {selection.selectedMods}{selection.modPosition}
                                                    </span>
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
                                                        className="mr-2 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                                    />
                                                    过审状态
                                                </label>
                                            </div>
                                            {/* 操作按钮 */}
                                            <div className="flex gap-2">
                                                <a
                                                    href={selection.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                                                >
                                                    查看详情
                                                </a>
                                                {selection.selectedBy === user?.id.toString() && (
                                                    <button
                                                        onClick={() => deleteSelection(selection.id)}
                                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
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
    );
}
