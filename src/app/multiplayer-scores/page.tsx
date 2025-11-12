"use client";

import { useState, useEffect } from "react";
import MultiplayerScoresTable from "../components/ui/MultiplayerScoresTable";
import TotalScoresByModTable from "../components/ui/TotalScoresByModTable";
import { MultiplayerRoom, DisplayScore } from "@/lib/multiplayer-types";
import { MapSelection } from "@/lib/map-selection";

export default function MultiplayerScoresPage() {
    const [roomUrl, setRoomUrl] = useState('');
    const [selectedRoom, setSelectedRoom] = useState<MultiplayerRoom | null>(null);
    const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null);
    const [scores, setScores] = useState<DisplayScore[]>([]);
    const [allScores, setAllScores] = useState<DisplayScore[]>([]); // 存储所有图池的分数
    const [filteredScores, setFilteredScores] = useState<DisplayScore[]>([]);
    const [mapSelections, setMapSelections] = useState<MapSelection[]>([]);
    const [approvedPlayers, setApprovedPlayers] = useState<Set<string>>(new Set());
    const [registrations, setRegistrations] = useState<any[]>([]); // 存储已报名数据
    const [loading, setLoading] = useState(false);
    const [loadingScores, setLoadingScores] = useState(false);
    const [loadingAllScores, setLoadingAllScores] = useState(false); // 加载所有分数的状态
    const [loadingMapSelections, setLoadingMapSelections] = useState(false);
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    const [loadingRegistrations, setLoadingRegistrations] = useState(false); // 加载已报名数据的状态
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'byPlaylist' | 'byTotal'>('byPlaylist');

    // 从URL参数中提取房间链接并自动加载
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlParam = urlParams.get('url');
        const roomIdParam = urlParams.get('room');

        if (urlParam) {
            setRoomUrl(urlParam);
            const roomId = extractRoomIdFromUrl(urlParam);
            if (roomId) {
                loadRoomById(roomId);
            }
        }
        if (roomIdParam) {
            loadRoomById(roomIdParam);
        }
    }, []);

    // 页面加载时获取已过审的玩家数据和已报名数据
    useEffect(() => {
        loadApprovedPlayers();
        loadRegistrations();
    }, []);

    // 当分数数据或已过审玩家数据变化时，过滤分数
    useEffect(() => {
        const filtered = filterScores(scores);
        setFilteredScores(filtered);
    }, [scores, approvedPlayers]);

    // 从URL中提取房间ID
    const extractRoomIdFromUrl = (url: string): string | null => {
        try {
            // 匹配 https://osu.ppy.sh/multiplayer/rooms/1774254 格式
            const match = url.match(/multiplayer\/rooms\/(\d+)/);
            return match ? match[1] : null;
        } catch {
            return null;
        }
    };

    // 加载map-selections数据
    const loadMapSelections = async () => {
        setLoadingMapSelections(true);
        try {
            const response = await fetch('/api/map-selections?approved=true');
            const data = await response.json();

            if (data.success) {
                setMapSelections(data.selections);
            } else {
                console.error('Failed to load map selections:', data.error);
                setMapSelections([]);
            }
        } catch (err) {
            console.error('Error loading map selections:', err);
            setMapSelections([]);
        } finally {
            setLoadingMapSelections(false);
        }
    };

    // 加载已过审的玩家数据
    const loadApprovedPlayers = async () => {
        setLoadingPlayers(true);
        try {
            const response = await fetch('/api/edge-registrations');
            const data = await response.json();

            if (data.registrations) {
                // 创建已过审玩家的Set（使用osuId作为标识）
                const approvedSet = new Set<string>();
                data.registrations.forEach((reg: any) => {
                    if (reg.approved) {
                        approvedSet.add(reg.osuId);
                    }
                });
                setApprovedPlayers(approvedSet);
                // // console.log(`Loaded ${approvedSet.size} approved players`);
            } else {
                console.error('Failed to load approved players:', data.error);
                setApprovedPlayers(new Set());
            }
        } catch (err) {
            console.error('Error loading approved players:', err);
            setApprovedPlayers(new Set());
        } finally {
            setLoadingPlayers(false);
        }
    };

    // 加载已报名数据
    const loadRegistrations = async () => {
        setLoadingRegistrations(true);
        try {
            const response = await fetch('/api/edge-registrations');
            const data = await response.json();

            if (data.registrations) {
                setRegistrations(data.registrations);
                // console.log(`Loaded ${data.registrations.length} registrations`);
            } else {
                console.error('Failed to load registrations:', data.error);
                setRegistrations([]);
            }
        } catch (err) {
            console.error('Error loading registrations:', err);
            setRegistrations([]);
        } finally {
            setLoadingRegistrations(false);
        }
    };

    // 过滤分数数据，只保留已过审的玩家，并重新计算排名
    const filterScores = (scores: DisplayScore[]): DisplayScore[] => {
        if (approvedPlayers.size === 0) {
            // // console.log('No approved players data available, showing all scores');
            return scores;
        }

        const filtered = scores.filter(score => approvedPlayers.has(score.user_id.toString()));
        // // console.log(`Filtered scores: ${filtered.length} out of ${scores.length} (${scores.length - filtered.length} removed)`);

        // 按分数降序排序并重新计算排名
        const sortedAndRanked = filtered
            .sort((a, b) => b.total_score - a.total_score)
            .map((score, index) => ({
                ...score,
                position: index + 1 // 重新计算排名
            }));

        // // console.log(`Re-ranked ${sortedAndRanked.length} scores`);
        return sortedAndRanked;
    };

    // 加载所有图池的分数数据（不依赖状态）
    const loadAllScoresWithRoom = async (room: MultiplayerRoom) => {
        // console.log('loadAllScoresWithRoom函数开始执行');
        // console.log('传入的房间对象:', room);

        setLoadingAllScores(true);
        setError(null);
        try {
            // console.log('开始加载所有图池分数数据...');
            // console.log('房间ID:', room.id);
            // console.log('图池数量:', room.playlist.length);

            const allScoresPromises = room.playlist.map(async (playlistItem) => {
                // console.log(`正在加载图池 ${playlistItem.id} 的分数...`);
                const url = `/api/multiplayer/rooms/${room.id}/playlists/${playlistItem.id}/scores?limit=100&sort=score_desc`;
                // console.log(`API URL: ${url}`);

                try {
                    const response = await fetch(url);
                    // console.log(`图池 ${playlistItem.id} 响应状态:`, response.status, response.statusText);

                    const data = await response.json();
                    // console.log(`图池 ${playlistItem.id} 响应数据:`, data);

                    if (data.success) {
                        // console.log(`图池 ${playlistItem.id} 加载成功，分数数量:`, data.scores.length);
                        // 为每个分数添加 playlistId 信息
                        return data.scores.map((score: DisplayScore) => ({
                            ...score,
                            playlistId: playlistItem.id,
                            beatmapId: playlistItem.beatmap.id
                        }));
                    } else {
                        console.error(`Failed to load scores for playlist ${playlistItem.id}:`, data.error);
                        return [];
                    }
                } catch (err) {
                    console.error(`Error loading scores for playlist ${playlistItem.id}:`, err);
                    return [];
                }
            });

            const allScoresResults = await Promise.all(allScoresPromises);
            const flattenedScores = allScoresResults.flat();
            // console.log('所有图池分数数据加载完成，总分数数量:', flattenedScores.length);
            // console.log('分数数据示例:', flattenedScores.slice(0, 3));
            setAllScores(flattenedScores);
        } catch (err) {
            setError('网络错误，无法加载所有分数数据');
            console.error('Error loading all scores:', err);
            setAllScores([]);
        } finally {
            setLoadingAllScores(false);
        }
    };



    // 加载特定房间信息
    const loadRoomById = async (roomId: string) => {
        setLoading(true);
        setError(null);
        try {
            // console.log('开始加载房间信息，房间ID:', roomId);

            // 先加载map-selections数据
            await loadMapSelections();

            // 通过房间ID获取房间信息
            const response = await fetch(`/api/multiplayer/rooms?roomId=${roomId}`);
            console.log('房间信息API响应状态:', response.status);

            const data = await response.json();
            // console.log('房间信息API响应数据:', data);

            if (data.success && data.rooms.length > 0) {
                const room = data.rooms[0];
                // console.log('成功加载房间信息:', room);
                setSelectedRoom(room);
                setSelectedPlaylist(null);
                setScores([]);
                setAllScores([]);

                // 直接传递房间对象给loadAllScores，避免依赖状态更新
                // console.log('开始调用loadAllScores...');
                loadAllScoresWithRoom(room);
            } else {
                console.error('未找到该房间或房间不可访问:', data);
                setError('未找到该房间或房间不可访问');
                setSelectedRoom(null);
                setSelectedPlaylist(null);
                setScores([]);
                setAllScores([]);
            }
        } catch (err) {
            console.error('Error loading room:', err);
            setError('网络错误，无法加载房间数据');
            setSelectedRoom(null);
            setSelectedPlaylist(null);
            setScores([]);
            setAllScores([]);
        } finally {
            setLoading(false);
        }
    };

    // 处理URL输入
    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const roomId = extractRoomIdFromUrl(roomUrl);
        if (roomId) {
            loadRoomById(roomId);
        } else {
            setError('请输入有效的osu! multiplayer房间链接');
        }
    };

    // 加载分数数据
    const loadScores = async () => {
        if (!selectedRoom || !selectedPlaylist) return;

        setLoadingScores(true);
        setError(null);
        try {
            const response = await fetch(
                `/api/multiplayer/rooms/${selectedRoom.id}/playlists/${selectedPlaylist}/scores?limit=100&sort=score_desc`
            );
            const data = await response.json();

            if (data.success) {
                // 调试：打印前端接收到的第一个分数的statistics数据
                if (data.scores.length > 0) {
                    // // console.log('=== Frontend Debug - First Score Statistics ===');
                    // // console.log('Statistics data received:', data.scores[0].statistics);
                    // // console.log('count_300:', data.scores[0].statistics.count_300);
                    // // console.log('count_100:', data.scores[0].statistics.count_100);
                    // // console.log('count_50:', data.scores[0].statistics.count_50);
                    // // console.log('count_miss:', data.scores[0].statistics.count_miss);
                    // // console.log('=== End Frontend Debug ===');
                }
                setScores(data.scores);
            } else {
                setError(data.error || '加载分数失败');
                setScores([]);
            }
        } catch (err) {
            setError('网络错误，无法加载分数数据');
            setScores([]);
            console.error('Error loading scores:', err);
        } finally {
            setLoadingScores(false);
        }
    };

    // 当选择playlist时加载分数
    useEffect(() => {
        if (selectedRoom && selectedPlaylist) {
            loadScores();
        }
    }, [selectedRoom, selectedPlaylist]);

    // 处理playlist选择
    const handlePlaylistSelect = (playlistId: number) => {
        setSelectedPlaylist(playlistId);
    };

    // 获取当前选中的playlist信息
    const getSelectedPlaylistInfo = () => {
        if (!selectedRoom || !selectedPlaylist) return null;
        return selectedRoom.playlist.find(item => item.id === selectedPlaylist);
    };

    // 根据beatmap ID匹配map-selection数据
    const getMapSelectionForPlaylistItem = (playlistItem: any): MapSelection | null => {
        if (!mapSelections.length) return null;

        // 通过beatmap ID匹配
        const matchedSelection = mapSelections.find(
            selection => selection.beatmapId === playlistItem.beatmap.id
        );

        return matchedSelection || null;
    };

    // 获取mod颜色class
    const getModColorClass = (mod: string): string => {
        switch (mod) {
            case 'HD': return 'bg-yellow-500 text-black';
            case 'HR': return 'bg-red-500 text-white';
            case 'DT': return 'bg-purple-500 text-white';
            case 'FM': return 'bg-green-500 text-white';
            case 'LZ': return 'bg-pink-500 text-white';
            case 'TB': return 'bg-black-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    // 生成页面标题
    const getPageTitle = () => {
        const playlistInfo = getSelectedPlaylistInfo();
        if (playlistInfo && selectedRoom) {
            return `${selectedRoom.name} - ${playlistInfo.beatmap.version}`;
        }
        return "osu! Multiplayer 分数查看";
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-4">
                    osu! Multiplayer 分数查看
                </h1>
            </div>

            {/* 错误提示 */}
            {error && (
                <div className="bg-red-500 text-white p-4 rounded mb-6">
                    {error}
                </div>
            )}

            {/* URL输入区域 */}
            {/* <div className="bg-[#3D3D3D] p-6 rounded-lg mb-6">
                <h2 className="text-xl font-bold text-white mb-4">输入房间链接</h2>
                <form onSubmit={handleUrlSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="roomUrl" className="block text-white mb-2">
                            osu! multiplayer房间链接
                        </label>
                        <input
                            type="url"
                            id="roomUrl"
                            value={roomUrl}
                            onChange={(e) => setRoomUrl(e.target.value)}
                            placeholder="https://osu.ppy.sh/multiplayer/rooms/1774254"
                            className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-[#E93B66] focus:outline-none"
                            required
                        />
                        <p className="text-gray-400 text-sm mt-1">
                            请输入完整的osu! multiplayer房间链接
                        </p>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-[#E93B66] text-white hover:bg-[#3BE9D8] transition font-bold disabled:opacity-50"
                    >
                        {loading ? '加载中...' : '加载房间'}
                    </button>
                </form>
            </div> */}

            {/* 房间信息显示 */}
            {selectedRoom && (
                <div className="bg-[#3D3D3D] p-6 rounded-lg mb-6">
                    <h2 className="text-xl font-bold text-white mb-4">房间信息</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-white">
                        <div>
                            <p className="text-gray-400">房间名称</p>
                            <p className="font-bold">{selectedRoom.name}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">类型</p>
                            <p className="font-bold">{selectedRoom.category}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">玩家数</p>
                            <p className="font-bold">{selectedRoom.participant_count}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">状态</p>
                            <p className="font-bold">{selectedRoom.active ? '活跃' : '非活跃'}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">房主</p>
                            <p className="font-bold">{selectedRoom.host.username}</p>
                        </div>
                        {selectedRoom.ends_at && (
                            <div>
                                <p className="text-gray-400">结束时间</p>
                                <p className="font-bold">{new Date(selectedRoom.ends_at).toLocaleString('zh-CN')}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Tab切换 - 放在顶部 */}
            <div className="flex border-b border-gray-600 mb-6">
                <button
                    className={`px-6 py-3 font-medium text-lg transition ${activeTab === 'byPlaylist'
                        ? 'text-white border-b-2 border-[#E93B66]'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    onClick={() => setActiveTab('byPlaylist')}
                >
                    按图池
                </button>
                <button
                    className={`px-6 py-3 font-medium text-lg transition ${activeTab === 'byTotal'
                        ? 'text-white border-b-2 border-[#E93B66]'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    onClick={() => setActiveTab('byTotal')}
                >
                    按总分
                </button>
            </div>

            {/* Playlist选择区域 - 只在按图池tab时显示 */}
            {activeTab === 'byPlaylist' && selectedRoom && selectedRoom.playlist.length > 0 && (
                <div className="bg-[#3D3D3D] p-6 rounded-lg mb-6">
                    <h2 className="text-xl font-bold text-white mb-4">选择图池</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {selectedRoom.playlist.map(playlistItem => {
                            const mapSelection = getMapSelectionForPlaylistItem(playlistItem);
                            const hasCover = mapSelection?.coverUrl;

                            return (
                                <div
                                    key={playlistItem.id}
                                    className={`p-4 rounded cursor-pointer transition relative overflow-hidden ${selectedPlaylist === playlistItem.id
                                        ? 'bg-[#E93B66] text-white'
                                        : 'bg-gray-700 text-white hover:bg-gray-600'
                                        }`}
                                    onClick={() => handlePlaylistSelect(playlistItem.id)}
                                    style={{
                                        backgroundImage: hasCover ? `url(${mapSelection.coverUrl})` : undefined,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundBlendMode: 'overlay'
                                    }}
                                >
                                    {/* 半透明遮罩层 */}
                                    <div className={`absolute inset-0 ${hasCover ? 'bg-black/70' : ''} ${selectedPlaylist === playlistItem.id ? 'bg-[#E93B66]/80' : ''}`}></div>

                                    {/* 内容 */}
                                    <div className="relative z-10">
                                        <div className="flex flex-row gap-2">
                                            {/* Mod位显示 */}
                                            {mapSelection && (
                                                <div className="mb-2 flex items-center space-x-2">
                                                    <div className="flex space-x-1">
                                                        <span className={`px-2 py-1 text-xs rounded font-bold ${getModColorClass(mapSelection.selectedMods)}`}>
                                                            {mapSelection.selectedMods}{mapSelection.modPosition}
                                                        </span>
                                                        {mapSelection.customModName && (
                                                            <span className="px-2 py-1 text-xs rounded bg-gray-600 text-white font-bold">
                                                                {mapSelection.customModName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <h3 className="font-bold mb-2 text-lg">
                                                {playlistItem.beatmap.beatmapset.artist} - {playlistItem.beatmap.beatmapset.title}
                                            </h3>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <p className="text-gray-300">难度: {playlistItem.beatmap.version}</p>
                                            <p className="text-yellow-400 font-bold">{playlistItem.beatmap.difficulty_rating}★</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tab切换和分数表格 */}
            {selectedRoom && (
                <div className="bg-[#3D3D3D] p-6 rounded-lg">
                    {/* 表格内容 */}
                    {activeTab === 'byPlaylist' && (
                        <>
                            {/* 按图池需要选择具体图池 */}
                            {selectedPlaylist ? (
                                <MultiplayerScoresTable
                                    scores={filteredScores}
                                    title={getPageTitle()}
                                    loading={loadingScores || loadingPlayers}
                                    onRefresh={loadScores}
                                />
                            ) : (
                                <div className="text-center py-8 text-white">
                                    <p className="text-lg">请先选择一个图池</p>
                                    <p className="text-sm text-gray-400 mt-2">在上方图池选择区域选择一个图池来查看分数</p>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'byTotal' && (
                        <TotalScoresByModTable
                            scores={allScores}
                            mapSelections={mapSelections}
                            approvedPlayers={approvedPlayers}
                            currentBeatmapId={undefined} // 按总分不需要当前图池ID
                            loading={loadingAllScores || loadingPlayers || loadingMapSelections}
                            selectedRoom={selectedRoom} // 传递房间信息用于匹配
                            registrations={registrations} // 传递已报名数据用于获取玩家信息
                        />
                    )}
                </div>
            )}
        </div>
    );
}
