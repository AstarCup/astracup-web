"use client";

import { useState, useEffect } from "react";
import MultiplayerScoresTable from "../components/ui/MultiplayerScoresTable";
import { MultiplayerRoom, DisplayScore } from "@/lib/multiplayer-types";

export default function MultiplayerScoresPage() {
    const [roomUrl, setRoomUrl] = useState('');
    const [selectedRoom, setSelectedRoom] = useState<MultiplayerRoom | null>(null);
    const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null);
    const [scores, setScores] = useState<DisplayScore[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingScores, setLoadingScores] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    // 加载特定房间信息
    const loadRoomById = async (roomId: string) => {
        setLoading(true);
        setError(null);
        try {
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
                        {selectedRoom.playlist.map(playlistItem => (
                            <div
                                key={playlistItem.id}
                                className={`p-4 rounded cursor-pointer transition ${selectedPlaylist === playlistItem.id
                                    ? 'bg-[#E93B66] text-white'
                                    : 'bg-gray-700 text-white hover:bg-gray-600'
                                    }`}
                                onClick={() => handlePlaylistSelect(playlistItem.id)}
                            >
                                <h3 className="font-bold mb-2">
                                    #{playlistItem.playlist_order} - {playlistItem.beatmap.version}
                                </h3>
                                <div className="text-sm space-y-1">
                                    <p className="truncate">
                                        {playlistItem.beatmap.beatmapset.artist} - {playlistItem.beatmap.beatmapset.title}
                                    </p>
                                    <p>难度: {playlistItem.beatmap.difficulty_rating}★</p>
                                    <p>BPM: {Math.round(playlistItem.beatmap.bpm)}</p>
                                    <p>长度: {Math.floor(playlistItem.beatmap.total_length / 60)}:{String(playlistItem.beatmap.total_length % 60).padStart(2, '0')}</p>
                                </div>
                            </div>
                        ))}
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

            {/* 使用说明 */}
            <div className="bg-[#3D3D3D] p-6 rounded-lg mt-8">
                <h2 className="text-xl font-bold text-white mb-4">使用说明</h2>
                <div className="text-gray-300 space-y-2">
                    <p>• 在输入框中粘贴osu! multiplayer房间的完整链接</p>
                    <p>• 例如: https://osu.ppy.sh/multiplayer/rooms/1774254</p>
                    <p>• 点击"加载房间"按钮获取房间信息</p>
                    <p>• 选择具体的图池（playlist）查看分数</p>
                    <p>• 表格支持按各列排序，点击列标题即可</p>
                    <p>• 点击"刷新数据"按钮可以重新获取最新分数</p>
                </div>
            </div>
        </div>
    );
}
