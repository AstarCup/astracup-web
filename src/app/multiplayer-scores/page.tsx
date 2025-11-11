"use client";

import { useState, useEffect } from "react";
import MultiplayerScoresTable from "../components/ui/MultiplayerScoresTable";
import { MultiplayerRoom, DisplayScore } from "@/lib/multiplayer-types";

export default function MultiplayerScoresPage() {
    const [rooms, setRooms] = useState<MultiplayerRoom[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<MultiplayerRoom | null>(null);
    const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null);
    const [scores, setScores] = useState<DisplayScore[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingScores, setLoadingScores] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 加载房间列表
    const loadRooms = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/multiplayer/rooms?mode=active&limit=50&sort=ended');
            const data = await response.json();

            if (data.success) {
                setRooms(data.rooms);
                if (data.rooms.length > 0 && !selectedRoom) {
                    setSelectedRoom(data.rooms[0]);
                }
            } else {
                setError(data.error || '加载房间失败');
            }
        } catch (err) {
            setError('网络错误，无法加载房间数据');
            console.error('Error loading rooms:', err);
        } finally {
            setLoading(false);
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

    // 页面加载时获取房间列表
    useEffect(() => {
        loadRooms();
    }, []);

    // 当选择房间或playlist时加载分数
    useEffect(() => {
        if (selectedRoom && selectedPlaylist) {
            loadScores();
        }
    }, [selectedRoom, selectedPlaylist]);

    // 处理房间选择
    const handleRoomSelect = (room: MultiplayerRoom) => {
        setSelectedRoom(room);
        setSelectedPlaylist(null);
        setScores([]);
    };

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
                    查看公开的osu! multiplayer房间的分数数据
                </p>
            </div>

            {/* 错误提示 */}
            {error && (
                <div className="bg-red-500 text-white p-4 rounded mb-6">
                    {error}
                </div>
            )}

            {/* 房间选择区域 */}
            <div className="bg-[#3D3D3D] p-6 rounded-lg mb-6">
                <h2 className="text-xl font-bold text-white mb-4">选择房间</h2>

                {loading ? (
                    <div className="text-center py-4 text-white">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <p className="mt-2">加载房间列表中...</p>
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="text-center py-4 text-white">
                        <p>暂无公开的multiplayer房间</p>
                        <button
                            onClick={loadRooms}
                            className="mt-2 px-4 py-2 bg-[#E93B66] text-white hover:bg-[#3BE9D8] transition font-bold"
                        >
                            重新加载
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rooms.map(room => (
                            <div
                                key={room.id}
                                className={`p-4 rounded cursor-pointer transition ${selectedRoom?.id === room.id
                                        ? 'bg-[#E93B66] text-white'
                                        : 'bg-gray-700 text-white hover:bg-gray-600'
                                    }`}
                                onClick={() => handleRoomSelect(room)}
                            >
                                <h3 className="font-bold text-lg mb-2">{room.name}</h3>
                                <div className="text-sm space-y-1">
                                    <p>类型: {room.category}</p>
                                    <p>玩家数: {room.participant_count}</p>
                                    <p>状态: {room.active ? '活跃' : '非活跃'}</p>
                                    <p>房主: {room.host.username}</p>
                                    {room.ends_at && (
                                        <p>结束时间: {new Date(room.ends_at).toLocaleString('zh-CN')}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

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
                    <p>• 此页面显示公开的osu! multiplayer房间的分数数据</p>
                    <p>• 仅显示无密码的公开房间</p>
                    <p>• 点击房间卡片选择要查看的房间</p>
                    <p>• 点击图池卡片选择具体的谱面</p>
                    <p>• 表格支持按各列排序，点击列标题即可</p>
                    <p>• 点击"刷新数据"按钮可以重新获取最新分数</p>
                </div>
            </div>
        </div>
    );
}
