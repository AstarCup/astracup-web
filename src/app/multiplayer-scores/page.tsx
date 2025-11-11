"use client";

import { useState, useEffect } from "react";
import MultiplayerScoresTable from "../components/ui/MultiplayerScoresTable";
import { MultiplayerRoom, DisplayScore } from "@/lib/multiplayer-types";
import { MapSelection } from "@/lib/map-selection";

export default function MultiplayerScoresPage() {
    const [roomUrl, setRoomUrl] = useState('');
    const [selectedRoom, setSelectedRoom] = useState<MultiplayerRoom | null>(null);
    const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null);
    const [scores, setScores] = useState<DisplayScore[]>([]);
    const [mapSelections, setMapSelections] = useState<MapSelection[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingScores, setLoadingScores] = useState(false);
    const [loadingMapSelections, setLoadingMapSelections] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 从URL参数中提取房间链接并自动加载
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlParam = urlParams.get('url');

        if (urlParam) {
            setRoomUrl(urlParam);
            const roomId = extractRoomIdFromUrl(urlParam);
            if (roomId) {
                loadRoomById(roomId);
            }
        }
    }, []);

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

    // 加载特定房间信息
    const loadRoomById = async (roomId: string) => {
        setLoading(true);
        setError(null);
        try {
            // 先加载map-selections数据
            await loadMapSelections();

            // 通过房间ID获取房间信息
            const response = await fetch(`/api/multiplayer/rooms?roomId=${roomId}`);
            const data = await response.json();

            if (data.success && data.rooms.length > 0) {
                const room = data.rooms[0];
                setSelectedRoom(room);
                setSelectedPlaylist(null);
                setScores([]);
            } else {
                setError('未找到该房间或房间不可访问');
                setSelectedRoom(null);
                setSelectedPlaylist(null);
                setScores([]);
            }
        } catch (err) {
            setError('网络错误，无法加载房间数据');
            console.error('Error loading room:', err);
            setSelectedRoom(null);
            setSelectedPlaylist(null);
            setScores([]);
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
                <p className="text-gray-300">
                    通过房间链接查看osu! multiplayer房间的分数数据
                </p>
            </div>

            {/* 错误提示 */}
            {error && (
                <div className="bg-red-500 text-white p-4 rounded mb-6">
                    {error}
                </div>
            )}

            {/* URL输入区域 */}
            <div className="bg-[#3D3D3D] p-6 rounded-lg mb-6">
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
            </div>

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

            {/* Playlist选择区域 */}
            {selectedRoom && selectedRoom.playlist.length > 0 && (
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
                                        <h3 className="font-bold mb-2 text-lg">
                                            {playlistItem.beatmap.beatmapset.artist} - {playlistItem.beatmap.beatmapset.title}
                                        </h3>

                                        {/* Mod位显示 */}
                                        {mapSelection && (
                                            <div className="mb-2 flex items-center space-x-2">
                                                <span className="text-sm text-gray-300">Mod位:</span>
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

                                        <div className="text-sm space-y-1">
                                            <p className="text-gray-300">难度: {playlistItem.beatmap.version}</p>
                                            <p className="text-yellow-400 font-bold">{playlistItem.beatmap.difficulty_rating}★</p>
                                            <p className="text-gray-400">BPM: {playlistItem.beatmap.bpm ? Math.round(playlistItem.beatmap.bpm) : 'N/A'}</p>
                                            <p className="text-gray-400">长度: {Math.floor(playlistItem.beatmap.total_length / 60)}:{String(playlistItem.beatmap.total_length % 60).padStart(2, '0')}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 分数表格 */}
            {selectedRoom && selectedPlaylist && (
                <MultiplayerScoresTable
                    scores={scores}
                    title={getPageTitle()}
                    loading={loadingScores}
                    onRefresh={loadScores}
                />
            )}
        </div>
    );
}
