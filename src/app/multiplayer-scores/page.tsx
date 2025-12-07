"use client";

import { useState, useEffect } from "react";
import MultiplayerScoresTable from "../components/ui/MultiplayerScoresTable";
import TotalScoresByModTable from "../components/ui/TotalScoresByModTable";
import { MultiplayerRoom, DisplayScore } from "@/lib/multiplayer-types";
import { MapSelection } from "@/lib/map-selection";
import { useIsAdmin } from "../components/ConfigProvider";

export default function MultiplayerScoresPage() {
    const [roomUrl, setRoomUrl] = useState('');
    const [selectedRoom, setSelectedRoom] = useState<MultiplayerRoom | null>(null);
    const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null);
    const [scores, setScores] = useState<DisplayScore[]>([]);
    const [allScores, setAllScores] = useState<DisplayScore[]>([]); // 存储所有图池的分数
    const [filteredScores, setFilteredScores] = useState<DisplayScore[]>([]);
    const [databaseScores, setDatabaseScores] = useState<DisplayScore[]>([]); // 从数据库获取的分数
    const [mapSelections, setMapSelections] = useState<MapSelection[]>([]);
    const [approvedPlayers, setApprovedPlayers] = useState<Set<string>>(new Set());
    const [registrations, setRegistrations] = useState<any[]>([]); // 存储已报名数据
    const [loading, setLoading] = useState(false);
    const [loadingScores, setLoadingScores] = useState(false);
    const [loadingAllScores, setLoadingAllScores] = useState(false); // 加载所有分数的状态
    const [loadingDatabaseScores, setLoadingDatabaseScores] = useState(false); // 加载数据库分数的状态
    const [loadingMapSelections, setLoadingMapSelections] = useState(false);
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    const [loadingRegistrations, setLoadingRegistrations] = useState(false); // 加载已报名数据的状态
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'byPlaylist' | 'byTotal'>(() => {
        // 如果有round_number参数，默认显示按总分tab
        const urlParams = new URLSearchParams(window.location.search);
        const roundNumberParam = urlParams.get('round_number');
        return roundNumberParam ? 'byTotal' : 'byPlaylist';
    });

    // 管理员控制面板状态
    const isAdmin = useIsAdmin();
    const [savedRooms, setSavedRooms] = useState<any[]>([]);
    const [savingScores, setSavingScores] = useState(false);
    const [updatingScores, setUpdatingScores] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    // 从URL参数中提取房间链接并自动加载
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlParam = urlParams.get('url');
        const roomIdParam = urlParams.get('room');
        const roundNumberParam = urlParams.get('round_number');

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

        if (roundNumberParam) {
            handleRoundNumberParam(roundNumberParam);
        }
    }, []);

    // 处理round_number参数
    const handleRoundNumberParam = async (roundNumber: string) => {
        // 将round_number转换为对应的category
        const category = roundNumberToCategory(roundNumber);
        // 根据category获取对应的图池数据
        await loadMapSelectionsByCategory(category);
        // 加载该轮次所有房间的分数数据
        await loadScoresByRoundNumber(roundNumber);
    };

    // 将round_number转换为对应的category
    const roundNumberToCategory = (roundNumber: string): string => {
        const roundNum = parseInt(roundNumber);
        switch (roundNum) {
            case 1:
                return 'ro16';
            case 2:
                return 'quarterfinals';
            case 3:
                return 'semifinals';
            case 4:
                return 'finals';
            case 5:
                return 'grandfinals';
            default:
                return 'qualification';
        }
    };

    // 根据category获取对应的图池数据
    const loadMapSelectionsByCategory = async (category: string) => {
        setLoadingMapSelections(true);
        try {
            const response = await fetch(`/api/map-selections?approved=true&category=${category}`);
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

    // 加载该轮次所有房间的分数数据
    const loadScoresByRoundNumber = async (roundNumber: string) => {
        setLoadingDatabaseScores(true);
        setError(null);
        try {
            // 获取该轮次的所有match_link数据
            const matchSchedulesResponse = await fetch('/api/match-schedules');
            const matchSchedulesData = await matchSchedulesResponse.json();

            if (matchSchedulesData.success) {
                // 过滤出该轮次的比赛
                const roundSchedules = matchSchedulesData.schedules.filter((schedule: any) => {
                    // 确保schedule.room存在且包含round_number字段
                    if (!schedule.room || schedule.room.round_number === undefined) {
                        return false;
                    }

                    // 将两边都转换为数字进行比较，确保类型一致
                    const scheduleRoundNumber = Number(schedule.room.round_number);
                    const targetRoundNumber = Number(roundNumber);

                    return scheduleRoundNumber === targetRoundNumber;
                });

                // 从match_link中提取房间号
                const roomIds = roundSchedules
                    .map((schedule: any) => {
                        if (!schedule.match_link) {
                            console.error(`Schedule ${schedule.id} has no match_link`);
                            return null;
                        }
                        const roomId = extractRoomIdFromUrl(schedule.match_link);
                        if (!roomId) {
                            console.error(`Failed to extract roomId from match_link: ${schedule.match_link}`);
                        }
                        return roomId;
                    })
                    .filter((roomId: string | null): roomId is string => roomId !== null);

                // 去重
                const uniqueRoomIds = [...new Set(roomIds)];

                // console.log(`Round ${roundNumber} - Total schedules: ${matchSchedulesData.schedules.length}`);
                // console.log(`Round ${roundNumber} - Filtered schedules: ${roundSchedules.length}`);
                // console.log(`Round ${roundNumber} - Extracted roomIds: ${roomIds.length}`);
                // console.log(`Round ${roundNumber} - Unique roomIds: ${uniqueRoomIds.length}`);
                // console.log(`Round ${roundNumber} - RoomIds:`, uniqueRoomIds);

                // 如果没有找到房间号，显示提示信息
                if (uniqueRoomIds.length === 0) {
                    setError(`该轮次没有找到有效的房间链接，请检查赛程数据。`);
                    setDatabaseScores([]);
                    setLoadingDatabaseScores(false);
                    return;
                }

                // 优先从数据库获取分数
                // console.log(`优先从数据库获取 ${uniqueRoomIds.length} 个房间的分数...`);
                let allDatabaseScores: DisplayScore[] = [];
                let databaseHasData = false;

                // 从数据库获取分数
                for (const roomId of uniqueRoomIds) {
                    try {
                        // console.log(`Checking database for room ${roomId}...`);
                        const scoresResponse = await fetch(`/api/match-scores/save?roomId=${roomId}`);
                        const scoresData = await scoresResponse.json();

                        // console.log(`Database response for room ${roomId}:`, scoresData.success ? `${scoresData.scores?.length || 0} scores` : 'Failed');

                        if (scoresData.success && scoresData.scores && scoresData.scores.length > 0) {
                            databaseHasData = true;
                            // 为每个分数添加房间信息
                            const scoresWithRoomInfo = scoresData.scores.map((score: DisplayScore) => ({
                                ...score,
                                roomId: roomId,
                                roomName: scoresData.room?.name || `Room ${roomId}`
                            }));
                            allDatabaseScores.push(...scoresWithRoomInfo);
                            // console.log(`Added ${scoresWithRoomInfo.length} scores from database room ${roomId}`);
                        }
                    } catch (err) {
                        console.error(`Error loading scores from database for room ${roomId}:`, err);
                    }
                }

                // console.log(`Total scores loaded from database: ${allDatabaseScores.length}`);

                // 如果数据库中有数据，直接使用
                if (allDatabaseScores.length > 0) {
                    // console.log('使用数据库中的分数数据');
                    setDatabaseScores(allDatabaseScores);
                    setError(`成功从数据库加载了 ${allDatabaseScores.length} 条分数记录。`);
                } else {
                    // console.log('数据库中没有数据，从osu API获取...');

                    // 数据库中没有数据，从API获取所有房间的分数
                    const response = await fetch('/api/multiplayer/rooms/scores', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            roomIds: uniqueRoomIds,
                            onlyValid: true, // 只获取通过且完成的分数
                            // 可以根据需要添加时间筛选
                            // startDate: '2025-11-01T00:00:00Z',
                            // endDate: '2025-12-31T23:59:59Z',
                        }),
                    });

                    const data = await response.json();

                    if (data.success) {
                        // console.log(`成功从osu API获取到 ${data.scores.length} 条分数`);

                        // 从session获取当前用户的osuId，用于保存分数
                        let currentUserOsuId = '';
                        try {
                            const sessionResponse = await fetch('/api/session/get');
                            const sessionData = await sessionResponse.json();
                            if (sessionData.success && sessionData.session?.osuId) {
                                currentUserOsuId = sessionData.session.osuId;
                            }
                        } catch (err) {
                            console.error('Error getting session data:', err);
                        }

                        // 如果有当前用户且获取到了分数，保存到数据库
                        if (currentUserOsuId && data.scores.length > 0) {
                            try {
                                // 按房间分组保存
                                const scoresByRoom: { [roomId: string]: DisplayScore[] } = {};
                                data.scores.forEach((score: DisplayScore) => {
                                    const roomId = score.roomId?.toString();
                                    if (roomId) {
                                        if (!scoresByRoom[roomId]) {
                                            scoresByRoom[roomId] = [];
                                        }
                                        scoresByRoom[roomId].push(score);
                                    }
                                });

                                // 为每个房间保存分数
                                for (const [roomId, scores] of Object.entries(scoresByRoom)) {
                                    const roomInfo = data.rooms.find((r: any) => r.id.toString() === roomId);
                                    if (roomInfo) {
                                        // console.log(`[Round Save] Saving ${scores.length} scores for room ${roomId} (${roomInfo.name})`);

                                        const saveResponse = await fetch('/api/match-scores/save', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({
                                                room: roomInfo,
                                                scores: scores,
                                                osuId: currentUserOsuId
                                            }),
                                        });

                                        const saveData = await saveResponse.json();
                                        if (saveData.success) {
                                            // console.log(`[Round Save] Successfully saved ${scores.length} scores for room ${roomId}`);
                                        } else {
                                            console.error(`[Round Save] Failed to save scores for room ${roomId}:`, saveData.error);
                                        }
                                    }
                                }

                                setError(`从osu API获取并保存了 ${data.scores.length} 条分数记录，涵盖 ${Object.keys(scoresByRoom).length} 个房间。`);
                            } catch (err) {
                                console.error('[Round Save] Error saving scores to database:', err);
                                setError(`从osu API获取了 ${data.scores.length} 条分数记录，但保存到数据库时出错。`);
                            }
                        }

                        // 设置分数数据
                        setDatabaseScores(data.scores);
                    } else {
                        console.error('Batch API failed:', data.error);
                        setError(`从osu API获取分数失败: ${data.error}`);
                        setDatabaseScores([]);
                    }
                }
            } else {
                setDatabaseScores([]);
                setError(matchSchedulesData.error || '获取赛程数据失败');
            }
        } catch (err) {
            setError('网络错误，无法加载分数数据');
            console.error('Error loading scores:', err);
            setDatabaseScores([]);
        } finally {
            setLoadingDatabaseScores(false);
        }
    };

    // 页面加载时获取已过审的玩家数据和已报名数据
    useEffect(() => {
        loadApprovedPlayers();
        loadRegistrations();
    }, []);

    // 当round_number参数变化时，从数据库加载指定轮次的分数
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const roundNumberParam = urlParams.get('round_number');

        if (!roundNumberParam) {
            // 只有在没有round_number参数时，才加载所有已保存房间的分数
            loadScoresFromDatabase();
        }
    }, []);

    // 当分数数据或已过审玩家数据变化时，过滤分数
    useEffect(() => {
        const filtered = filterScores(scores);
        setFilteredScores(filtered);
    }, [scores, approvedPlayers]);

    // 从URL中提取房间ID
    const extractRoomIdFromUrl = (url: string): string | null => {
        try {
            // 匹配 https://osu.ppy.sh/multiplayer/rooms/1774254 或 https://osu.ppy.sh/multiplayer/rooms/1774254/events 格式
            const match = url.match(/multiplayer\/rooms\/(\d+)(?:\/events)?/);
            return match ? match[1] : null;
        } catch {
            return null;
        }
    };

    // 加载map-selections数据
    const loadMapSelections = async () => {
        setLoadingMapSelections(true);
        try {
            const response = await fetch('/api/map-selections?approved=true&category=qualification');
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
                // console.log(`Loaded ${approvedSet.size} approved players`);
                // console.log('Approved player IDs:', Array.from(approvedSet));
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
                // // console.log(`Loaded ${data.registrations.length} registrations`);
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

    // 从数据库加载分数数据
    const loadScoresFromDatabase = async () => {
        setLoadingDatabaseScores(true);
        setError(null);
        try {
            const response = await fetch('/api/match-scores/save');
            const data = await response.json();

            if (data.success && data.rooms && data.rooms.length > 0) {
                // 获取所有已保存房间的分数
                const allDatabaseScores: DisplayScore[] = [];

                // 遍历所有已保存的房间，获取每个房间的分数
                for (const room of data.rooms) {
                    try {
                        const scoresResponse = await fetch(`/api/match-scores/save?roomId=${room.id}`);
                        const scoresData = await scoresResponse.json();

                        if (scoresData.success && scoresData.scores) {
                            // 为每个分数添加房间信息
                            const scoresWithRoomInfo = scoresData.scores.map((score: DisplayScore) => ({
                                ...score,
                                roomId: room.id,
                                roomName: room.name
                            }));
                            allDatabaseScores.push(...scoresWithRoomInfo);
                        }
                    } catch (err) {
                        console.error(`Error loading scores for room ${room.id}:`, err);
                    }
                }

                setDatabaseScores(allDatabaseScores);
                // // console.log(`Loaded ${allDatabaseScores.length} scores from database`);
            } else {
                setDatabaseScores([]);
                // // console.log('No saved rooms found in database');
            }
        } catch (err) {
            setError('网络错误，无法从数据库加载分数数据');
            console.error('Error loading scores from database:', err);
            setDatabaseScores([]);
        } finally {
            setLoadingDatabaseScores(false);
        }
    };

    // 过滤分数数据，只保留已过审的玩家，并重新计算排名
    const filterScores = (scores: DisplayScore[]): DisplayScore[] => {
        if (approvedPlayers.size === 0) {
            // // // console.log('No approved players data available, showing all scores');
            return scores;
        }

        const filtered = scores.filter(score => approvedPlayers.has(score.user_id.toString()));
        // // // console.log(`Filtered scores: ${filtered.length} out of ${scores.length} (${scores.length - filtered.length} removed)`);

        // 按分数降序排序并重新计算排名
        const sortedAndRanked = filtered
            .sort((a, b) => b.total_score - a.total_score)
            .map((score, index) => ({
                ...score,
                position: index + 1 // 重新计算排名
            }));

        // // // console.log(`Re-ranked ${sortedAndRanked.length} scores`);
        return sortedAndRanked;
    };

    // 加载所有图池的分数数据（返回Promise，不依赖状态）
    const loadAllScoresWithRoom = async (room: MultiplayerRoom): Promise<DisplayScore[]> => {
        // // console.log('loadAllScoresWithRoom函数开始执行');
        // // console.log('传入的房间对象:', room);

        setLoadingAllScores(true);
        setError(null);
        try {
            // // console.log('开始加载所有图池分数数据...');
            // // console.log('房间ID:', room.id);
            // // console.log('图池数量:', room.playlist.length);

            const allScoresPromises = room.playlist.map(async (playlistItem) => {
                // // console.log(`正在加载图池 ${playlistItem.id} 的分数...`);
                const url = `/api/multiplayer/rooms/${room.id}/playlists/${playlistItem.id}/scores?limit=100&sort=score_desc`;
                // // console.log(`API URL: ${url}`);

                try {
                    const response = await fetch(url);
                    // // console.log(`图池 ${playlistItem.id} 响应状态:`, response.status, response.statusText);

                    const data = await response.json();
                    // // console.log(`图池 ${playlistItem.id} 响应数据:`, data);

                    if (data.success) {
                        // // console.log(`图池 ${playlistItem.id} 加载成功，分数数量:`, data.scores.length);
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
            // // console.log('所有图池分数数据加载完成，总分数数量:', flattenedScores.length);
            // // console.log('分数数据示例:', flattenedScores.slice(0, 3));
            setAllScores(flattenedScores);
            return flattenedScores;
        } catch (err) {
            setError('网络错误，无法加载所有分数数据');
            console.error('Error loading all scores:', err);
            setAllScores([]);
            return [];
        } finally {
            setLoadingAllScores(false);
        }
    };

    // 加载特定房间信息
    const loadRoomById = async (roomId: string) => {
        setLoading(true);
        setError(null);
        try {
            // // console.log('开始加载房间信息，房间ID:', roomId);

            // 先加载map-selections数据
            await loadMapSelections();

            // 首先检查数据库中是否有该房间的数据
            // console.log(`检查数据库中房间 ${roomId} 的数据...`);
            let databaseHasData = false;
            let databaseScores: DisplayScore[] = [];
            let roomInfo: any = null;

            try {
                const scoresResponse = await fetch(`/api/match-scores/save?roomId=${roomId}`);
                const scoresData = await scoresResponse.json();

                if (scoresData.success && scoresData.scores && scoresData.scores.length > 0) {
                    databaseHasData = true;
                    roomInfo = scoresData.room;
                    databaseScores = scoresData.scores.map((score: DisplayScore) => ({
                        ...score,
                        roomId: roomId,
                        roomName: scoresData.room?.name || `Room ${roomId}`
                    }));
                    // console.log(`从数据库获取到房间 ${roomId} 的 ${databaseScores.length} 条分数`);
                }
            } catch (err) {
                console.error(`检查数据库房间 ${roomId} 时出错:`, err);
            }

            let room: MultiplayerRoom | null = null;
            let allApiScores: DisplayScore[] = [];

            if (!databaseHasData) {
                // 数据库中没有数据，从osu! API获取
                // console.log(`数据库中房间 ${roomId} 没有数据，从osu! API获取...`);

                // 通过房间ID获取房间信息
                const response = await fetch(`/api/multiplayer/rooms?roomId=${roomId}`);
                // console.log('房间信息API响应状态:', response.status);

                const data = await response.json();
                // // console.log('房间信息API响应数据:', data);

                if (data.success && data.rooms.length > 0) {
                    room = data.rooms[0];
                    // // console.log('成功从API加载房间信息:', room);

                    // 获取该房间所有图池的分数
                    allApiScores = await loadAllScoresWithRoom(room);

                    // 如果获取到了分数数据，尝试保存到数据库
                    if (allApiScores.length > 0) {
                        try {
                            // 从session获取当前用户的osuId，用于保存分数
                            let currentUserOsuId = '';
                            const sessionResponse = await fetch('/api/session/get');
                            const sessionData = await sessionResponse.json();

                            if (sessionData.success && sessionData.session?.osuId) {
                                currentUserOsuId = sessionData.session.osuId;
                            }

                            if (currentUserOsuId) {
                                // console.log(`保存房间 ${roomId} 的 ${allApiScores.length} 条分数到数据库...`);

                                const saveResponse = await fetch('/api/match-scores/save', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        room: room,
                                        scores: allApiScores,
                                        osuId: currentUserOsuId
                                    }),
                                });

                                const saveData = await saveResponse.json();
                                if (saveData.success) {
                                    // console.log(`成功保存房间 ${roomId} 的 ${saveData.data.scores_count} 条分数到数据库`);
                                    setError(`从osu! API获取并保存了 ${saveData.data.scores_count} 条分数记录`);
                                } else {
                                    console.error(`保存房间 ${roomId} 分数到数据库失败:`, saveData.error);
                                    setError(`从osu! API获取了 ${allApiScores.length} 条分数，但保存到数据库时出错: ${saveData.error}`);
                                }
                            } else {
                                console.warn('用户未登录，无法保存分数到数据库');
                                setError(`从osu! API获取了 ${allApiScores.length} 条分数，但用户未登录无法保存到数据库`);
                            }
                        } catch (err) {
                            console.error('保存分数到数据库时出错:', err);
                            setError(`从osu! API获取了 ${allApiScores.length} 条分数，但保存到数据库时出错`);
                        }
                    }
                } else {
                    console.error('未找到该房间或房间不可访问:', data);
                    setError('未找到该房间或房间不可访问');
                }
            } else {
                // 数据库中有数据，构造房间对象
                if (roomInfo) {
                    room = {
                        id: parseInt(roomId),
                        name: roomInfo.name,
                        category: roomInfo.category || 'normal',
                        type: (roomInfo.type || 'playlists') as 'playlists' | 'realtime',
                        starts_at: roomInfo.starts_at,
                        ends_at: roomInfo.ends_at,
                        max_attempts: roomInfo.max_attempts || null,
                        participant_count: roomInfo.participant_count || 0,
                        channel_id: roomInfo.channel_id || 0,
                        active: false, // 数据库中的房间通常是非活跃的
                        has_password: roomInfo.has_password || false,
                        queue_mode: (roomInfo.queue_mode || 'all_players') as 'all_players' | 'host_only' | 'all_players_round_robin',
                        auto_skip: roomInfo.auto_skip || false,
                        current_playlist_item: null,
                        current_user_score: null,
                        host: roomInfo.host || { username: 'Unknown', id: 0, avatar_url: '' },
                        playlist: [] // 数据库存储时可能不包含完整的playlist信息
                    };
                }
                allApiScores = databaseScores;
            }

            if (room) {
                setSelectedRoom(room);
                setSelectedPlaylist(null);
                setScores([]);
                setAllScores(allApiScores);
                // console.log('房间数据加载完成，分数数量:', allApiScores.length);
            } else {
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
                    // // // console.log('=== Frontend Debug - First Score Statistics ===');
                    // // // console.log('Statistics data received:', data.scores[0].statistics);
                    // // // console.log('count_300:', data.scores[0].statistics.count_300);
                    // // // console.log('count_100:', data.scores[0].statistics.count_100);
                    // // // console.log('count_50:', data.scores[0].statistics.count_50);
                    // // // console.log('count_miss:', data.scores[0].statistics.count_miss);
                    // // // console.log('=== End Frontend Debug ===');
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

        // 通过beatmap ID匹配（playlistItem.beatmap.id对应map-selections中的beatmapId）
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
        return "分数查看";
    };

    // 保存分数到数据库
    const saveScoresToDatabase = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const roundNumberParam = urlParams.get('round_number');

        setSavingScores(true);
        setSaveMessage(null);
        setSaveError(null);

        try {
            // 从session获取当前用户的osuId
            const sessionResponse = await fetch('/api/session/get');
            const sessionData = await sessionResponse.json();

            if (!sessionData.success || !sessionData.session?.osuId) {
                setSaveError('用户未登录或会话无效');
                return;
            }

            const currentUserOsuId = sessionData.session.osuId;

            let totalSavedScores = 0;

            if (roundNumberParam) {
                // 如果有round_number参数，直接使用当前已加载的databaseScores进行保存
                if (databaseScores.length === 0) {
                    setSaveError('没有可保存的分数数据，请先加载分数');
                    return;
                }

                // console.log(`[Round Save] 准备保存 ${databaseScores.length} 条已加载的分数数据`);

                // 按房间分组保存分数
                const scoresByRoom: { [roomId: string]: DisplayScore[] } = {};
                databaseScores.forEach((score: DisplayScore) => {
                    const roomId = score.roomId?.toString();
                    if (roomId) {
                        if (!scoresByRoom[roomId]) {
                            scoresByRoom[roomId] = [];
                        }
                        scoresByRoom[roomId].push(score);
                    }
                });

                // console.log(`[Round Save] 分组结果: ${Object.keys(scoresByRoom).length} 个房间`);

                // 为每个房间保存分数
                for (const [roomId, roomScores] of Object.entries(scoresByRoom)) {
                    try {
                        // 获取房间信息
                        const roomResponse = await fetch(`/api/multiplayer/rooms?roomId=${roomId}`);
                        const roomData = await roomResponse.json();

                        if (roomData.success && roomData.rooms.length > 0) {
                            const room = roomData.rooms[0];

                            // console.log(`[Round Save] 保存房间 ${roomId} (${room.name}) 的 ${roomScores.length} 条分数`);

                            const saveResponse = await fetch('/api/match-scores/save', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    room: room,
                                    scores: roomScores,
                                    osuId: currentUserOsuId
                                }),
                            });

                            const saveData = await saveResponse.json();
                            if (saveData.success) {
                                totalSavedScores += saveData.data.scores_count;
                                // console.log(`[Round Save] 成功保存房间 ${roomId} 的 ${saveData.data.scores_count} 条分数`);
                            } else {
                                console.error(`[Round Save] 保存房间 ${roomId} 失败:`, saveData.error);
                                setSaveError(`保存房间 ${room.name} 的分数失败: ${saveData.error}`);
                            }
                        } else {
                            console.error(`[Round Save] 获取房间 ${roomId} 信息失败`);
                            setSaveError(`获取房间 ${roomId} 信息失败`);
                        }
                    } catch (err) {
                        console.error(`[Round Save] 保存房间 ${roomId} 的分数数据时发生错误:`, err);
                        setSaveError(`保存房间 ${roomId} 的分数数据时发生错误`);
                    }
                }
            } else if (selectedRoom) {
                // 否则保存当前选中房间的分数数据
                const response = await fetch('/api/match-scores/save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        room: selectedRoom,
                        scores: allScores,
                        osuId: currentUserOsuId
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    totalSavedScores = data.data.scores_count;
                } else {
                    setSaveError(data.error || '保存失败');
                }
            } else {
                setSaveError('没有可保存的分数数据');
                return;
            }

            if (totalSavedScores > 0) {
                setSaveMessage(`成功保存 ${totalSavedScores} 条分数记录`);
                // 重新加载已保存的房间列表
                loadSavedRooms();
                // 如果有round_number参数，重新加载该轮次的分数数据
                if (roundNumberParam) {
                    await loadScoresByRoundNumber(roundNumberParam);
                }
            } else {
                setSaveMessage('没有可保存的分数数据');
            }
        } catch (error) {
            console.error('保存分数时发生错误:', error);
            setSaveError('网络错误，无法保存分数');
        } finally {
            setSavingScores(false);
        }
    };

    // 更新数据库中的分数
    const updateScoresInDatabase = async () => {
        if (!selectedRoom || allScores.length === 0) {
            setSaveError('没有可更新的分数数据');
            return;
        }

        setUpdatingScores(true);
        setSaveMessage(null);
        setSaveError(null);

        try {
            // 从session获取当前用户的osuId
            const sessionResponse = await fetch('/api/session/get');
            const sessionData = await sessionResponse.json();

            if (!sessionData.success || !sessionData.session?.osuId) {
                setSaveError('用户未登录或会话无效');
                return;
            }

            const currentUserOsuId = sessionData.session.osuId;

            const response = await fetch('/api/match-scores/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    room: selectedRoom,
                    scores: allScores,
                    osuId: currentUserOsuId
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSaveMessage(`成功更新 ${data.data.scores_count} 条分数记录`);
                // 重新加载已保存的房间列表
                loadSavedRooms();
            } else {
                setSaveError(data.error || '更新失败');
            }
        } catch (error) {
            console.error('更新分数时发生错误:', error);
            setSaveError('网络错误，无法更新分数');
        } finally {
            setUpdatingScores(false);
        }
    };

    // 加载已保存的房间列表
    const loadSavedRooms = async () => {
        try {
            const response = await fetch('/api/match-scores/save');
            const data = await response.json();

            if (data.success) {
                setSavedRooms(data.rooms || []);
            }
        } catch (error) {
            console.error('加载已保存的房间列表时发生错误:', error);
        }
    };

    // 页面加载时获取已保存的房间列表
    useEffect(() => {
        if (isAdmin) {
            loadSavedRooms();
        }
    }, [isAdmin]);

    return (
        <div className="container mx-auto py-8 max-w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white p-6">
                    osu! Multiplayer 分数查看
                </h1>
            </div>

            {/* 管理员控制面板 */}
            {isAdmin && (
                <div className="bg-[#2D2D2D] p-6 mb-6 border-l-4 border-[#E93B66]">
                    <h2 className="text-xl font-bold text-white mb-4">管理员控制面板</h2>

                    {/* 操作按钮 */}
                    <div className="flex gap-4 mb-4 flex-wrap">
                        {/* 保存当前房间分数按钮 */}
                        <button
                            onClick={saveScoresToDatabase}
                            disabled={savingScores || (!selectedRoom && !databaseScores.length)}
                            className={`px-4 py-2 rounded font-medium transition ${savingScores || (!selectedRoom && !databaseScores.length)
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                        >
                            {savingScores ? '保存中...' : '保存到数据库'}
                        </button>

                        {/* 更新当前房间分数按钮 */}
                        <button
                            onClick={updateScoresInDatabase}
                            disabled={updatingScores || !selectedRoom || allScores.length === 0}
                            className={`px-4 py-2 rounded font-medium transition ${updatingScores || !selectedRoom || allScores.length === 0
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {updatingScores ? '更新中...' : '更新数据库分数'}
                        </button>

                        {/* 添加所有房间分数到数据库按钮（仅当有round_number参数时显示） */}
                        {new URLSearchParams(window.location.search).get('round_number') && (
                            <button
                                onClick={saveScoresToDatabase}
                                disabled={savingScores}
                                className={`px-4 py-2 rounded font-medium transition ${savingScores
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-purple-600 text-white hover:bg-purple-700'
                                    }`}
                            >
                                {savingScores ? '保存中...' : '添加所有房间分数到数据库'}
                            </button>
                        )}

                        <button
                            onClick={loadSavedRooms}
                            className="px-4 py-2 bg-gray-600 text-white rounded font-medium hover:bg-gray-700 transition"
                        >
                            刷新已保存列表
                        </button>
                    </div>

                    {savedRooms.length === 0 && (
                        <div className="text-gray-400 text-sm">
                            暂无已保存的房间数据
                        </div>
                    )}
                </div>
            )}

            {/* 错误提示 */}
            {error && (
                <div className="bg-red-500 text-white p-4 mb-6">
                    {error}
                </div>
            )}

            {/* 房间信息显示 */}
            {selectedRoom && (
                <div className="bg-[#3D3D3D] p-6 mb-6">
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
            {/* Tab切换 - 放在顶部，只在没有round_number参数时显示 */}
            {!new URLSearchParams(window.location.search).get('round_number') && (
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
            )}

            {/* Playlist选择区域 - 只在按图池tab时显示 */}
            {activeTab === 'byPlaylist' && selectedRoom && selectedRoom.playlist.length > 0 && (
                <div className="bg-[#3D3D3D] p-6 mb-6">
                    <h2 className="text-xl font-bold text-white mb-4">选择图池</h2>
                    <div className="flex gap-4 overflow-x-auto">
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
                                        <div className="flex flex-row">
                                            {/* Mod位显示 */}
                                            {mapSelection && (
                                                <div className="flex items-center space-x-2">
                                                    <div className="flex space-x-1">
                                                        <span className={`px-2 text-xs font-bold ${getModColorClass(mapSelection.selectedMods)}`}>
                                                            {mapSelection.selectedMods}{mapSelection.modPosition}
                                                        </span>
                                                        {mapSelection.customModName && (
                                                            <span className="px-2 text-xs bg-gray-600 text-white font-bold">
                                                                {mapSelection.customModName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {/* <h3 className="font-bold mb-2 text-lg">
                                                {playlistItem.beatmap.beatmapset.artist} - {playlistItem.beatmap.beatmapset.title}
                                            </h3> */}
                                        </div>
                                        {/* <div className="text-sm space-y-1">
                                            <p className="text-gray-300">难度: {playlistItem.beatmap.version}</p>
                                            <p className="text-yellow-400 font-bold">{playlistItem.beatmap.difficulty_rating}★</p>
                                        </div> */}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 分数表格 */}
            {(selectedRoom || databaseScores.length > 0) && (
                <div className="bg-[#3D3D3D] p-6">
                    {/* 如果有round_number参数，直接显示按总分表格 */}
                    {new URLSearchParams(window.location.search).get('round_number') ? (
                        <TotalScoresByModTable
                            scores={databaseScores.length > 0 ? databaseScores : allScores}
                            mapSelections={mapSelections}
                            approvedPlayers={approvedPlayers}
                            currentBeatmapId={undefined} // 按总分不需要当前图池ID
                            loading={loadingDatabaseScores || loadingAllScores || loadingPlayers || loadingMapSelections}
                            selectedRoom={selectedRoom} // 传递房间信息用于匹配
                            registrations={registrations} // 传递已报名数据用于获取玩家信息
                        />
                    ) : (
                        /* 否则根据activeTab显示对应表格 */
                        <>
                            {/* 表格内容 */}
                            {activeTab === 'byPlaylist' && (
                                <>
                                    {/* 按图池需要选择具体图池 */}
                                    {selectedPlaylist ? (
                                        <MultiplayerScoresTable
                                            scores={databaseScores.length > 0 ? databaseScores.filter(score => {
                                                const scoreBeatmapId = (score as any).beatmapId || (score as any).beatmap?.id;
                                                const playlistInfo = getSelectedPlaylistInfo();
                                                return playlistInfo && scoreBeatmapId === playlistInfo.beatmap_id;
                                            }) : filteredScores}
                                            title={getPageTitle()}
                                            loading={loadingScores || loadingPlayers || loadingDatabaseScores}
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
                                    scores={databaseScores.length > 0 ? databaseScores : allScores}
                                    mapSelections={mapSelections}
                                    approvedPlayers={approvedPlayers}
                                    currentBeatmapId={undefined} // 按总分不需要当前图池ID
                                    loading={loadingDatabaseScores || loadingAllScores || loadingPlayers || loadingMapSelections}
                                    selectedRoom={selectedRoom} // 传递房间信息用于匹配
                                    registrations={registrations} // 传递已报名数据用于获取玩家信息
                                />
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
