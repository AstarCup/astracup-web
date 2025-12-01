import { NextRequest, NextResponse } from 'next/server';
import { getValidClientToken } from '@/lib/osu-auth';
import { MultiplayerScoresResponse, DisplayScore } from '@/lib/multiplayer-types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { roomIds, startDate, endDate, onlyValid = false } = body;

        if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
            return NextResponse.json(
                { success: false, error: '房间ID数组不能为空' },
                { status: 400 }
            );
        }

        // 获取所有房间的所有分数
        const allScores: DisplayScore[] = [];
        const roomsData: any[] = [];
        let databaseHasData = false;

        console.log(`开始获取 ${roomIds.length} 个房间的分数数据，优先从数据库获取...`);

        // 第一步：优先从数据库获取所有房间的分数
        for (const roomId of roomIds) {
            try {
                console.log(`检查数据库中房间 ${roomId} 的分数...`);

                // 调用数据库API获取房间分数
                const dbResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/match-scores/save?roomId=${roomId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (dbResponse.ok) {
                    const dbData = await dbResponse.json();
                    if (dbData.success && dbData.scores && dbData.scores.length > 0) {
                        databaseHasData = true;
                        console.log(`从数据库获取到房间 ${roomId} 的 ${dbData.scores.length} 条分数`);

                        // 添加房间信息
                        const roomInfo = {
                            id: dbData.room?.id || roomId,
                            name: dbData.room?.name || `Room ${roomId}`,
                            category: dbData.room?.category || 'normal',
                            participant_count: dbData.room?.participant_count || 0,
                            active: false, // 数据库中的房间通常是非活跃的
                            playlist_count: dbData.scores.length > 0 ? new Set(dbData.scores.map((s: any) => s.playlistId)).size : 0
                        };
                        roomsData.push(roomInfo);

                        // 处理数据库分数数据，确保字段名正确
                        const processedScores: DisplayScore[] = dbData.scores.map((score: any) => {
                            // 确保字段名一致，支持多种格式
                            const processedScore: DisplayScore = {
                                user_id: score.user_id,
                                username: score.username,
                                avatar_url: score.avatar_url,
                                country_code: score.country_code || '',
                                total_score: score.total_score,
                                accuracy: score.accuracy,
                                max_combo: score.max_combo,
                                mods: Array.isArray(score.mods) ? score.mods : [],
                                rank: score.rank,
                                passed: score.passed,
                                statistics: score.statistics || {
                                    count_300: 0,
                                    count_100: 0,
                                    count_50: 0,
                                    count_miss: 0,
                                },
                                pp: score.pp,
                                ended_at: score.ended_at,
                                position: score.position || 0,
                                // 确保beatmap信息字段名正确
                                beatmap_id: score.beatmap_id || (score as any).beatmapId,
                                beatmapset_id: score.beatmapset_id || (score as any).beatmapsetId,
                                // 添加房间信息
                                roomId: roomId,
                                roomName: roomInfo.name,
                                playlistId: score.playlistId,
                            };

                            // 时间筛选
                            if (startDate || endDate) {
                                if (!score.ended_at) return null;
                                const endedAt = new Date(score.ended_at);
                                if (startDate && endedAt < new Date(startDate)) {
                                    return null;
                                }
                                if (endDate && endedAt > new Date(endDate)) {
                                    return null;
                                }
                            }

                            // 有效性筛选（只通过且完成的分数）
                            if (onlyValid && (!score.passed || !score.ended_at)) {
                                return null;
                            }

                            return processedScore;
                        }).filter(score => score !== null) as DisplayScore[];

                        allScores.push(...processedScores);
                        continue; // 成功从数据库获取，跳过API调用
                    }
                }

                console.log(`数据库中房间 ${roomId} 没有数据或获取失败`);
            } catch (error) {
                console.error(`从数据库获取房间 ${roomId} 分数时出错:`, error);
            }
        }

        // 如果所有房间都有数据库数据，直接返回
        if (databaseHasData) {
            // 按分数降序排序并重新计算排名
            const sortedScores = allScores
                .sort((a, b) => b.total_score - a.total_score)
                .map((score, index) => ({
                    ...score,
                    position: index + 1,
                }));

            console.log(`从数据库总共获取到 ${sortedScores.length} 条有效分数`);

            return NextResponse.json({
                success: true,
                scores: sortedScores,
                total: sortedScores.length,
                rooms: roomsData.map(room => ({
                    id: room.id,
                    name: room.name,
                    category: room.category,
                    participant_count: room.participant_count,
                    active: room.active,
                    playlist_count: room.playlist_count
                })),
                source: 'database'
            });
        }

        // 如果数据库中没有数据，才从osu API获取
        console.log('数据库中没有完整数据，从osu API获取...');

        // 获取客户端token
        const accessToken = await getValidClientToken();

        for (const roomId of roomIds) {
            try {
                console.log(`正在从API获取房间 ${roomId} 的信息...`);

                // 获取房间信息
                const roomResponse = await fetch(
                    `https://osu.ppy.sh/api/v2/rooms/${roomId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!roomResponse.ok) {
                    console.error(`Failed to fetch room ${roomId}:`, roomResponse.status, roomResponse.statusText);
                    continue;
                }

                const room = await roomResponse.json();
                roomsData.push(room);

                console.log(`房间 ${room.name} 有 ${room.playlist.length} 个图池`);

                // 获取该房间所有图池的分数
                for (const playlistItem of room.playlist) {
                    try {
                        // 获取playlist item信息来获取beatmap数据
                        const playlistItemResponse = await fetch(
                            `https://osu.ppy.sh/api/v2/rooms/${roomId}/playlist/${playlistItem.id}`,
                            {
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`,
                                    'Content-Type': 'application/json',
                                },
                            }
                        );

                        let playlistItemBeatmapId: number | null = null;
                        let playlistItemBeatmapsetId: number | null = null;

                        if (playlistItemResponse.ok) {
                            const playlistItemData = await playlistItemResponse.json();
                            playlistItemBeatmapId = playlistItemData.beatmap_id;
                            playlistItemBeatmapsetId = playlistItemData.beatmap?.beatmapset_id;
                        } else {
                            // 回退：使用playlist item中的beatmap信息
                            playlistItemBeatmapId = playlistItem.beatmap_id;
                            if (playlistItem.beatmap?.beatmapset_id) {
                                playlistItemBeatmapsetId = playlistItem.beatmap.beatmapset_id;
                            }
                        }

                        // 获取分数数据
                        const scoresResponse = await fetch(
                            `https://osu.ppy.sh/api/v2/rooms/${roomId}/playlist/${playlistItem.id}/scores?limit=100&sort=score_desc`,
                            {
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`,
                                    'Content-Type': 'application/json',
                                },
                            }
                        );

                        if (!scoresResponse.ok) {
                            console.error(`Failed to fetch scores for room ${roomId}, playlist ${playlistItem.id}:`, scoresResponse.status, scoresResponse.statusText);
                            continue;
                        }

                        const scoresData: MultiplayerScoresResponse = await scoresResponse.json();
                        console.log(`房间 ${roomId} 图池 ${playlistItem.id} 获取到 ${scoresData.scores.length} 条分数`);

                        // 转换数据格式并添加时间筛选
                        const displayScores: DisplayScore[] = scoresData.scores
                            .map((score, index) => {
                                const scoreData = {
                                    user_id: score.user_id,
                                    username: score.user.username,
                                    avatar_url: score.user.avatar_url,
                                    country_code: score.user.country_code,
                                    total_score: score.total_score,
                                    accuracy: score.accuracy,
                                    max_combo: score.max_combo,
                                    mods: score.mods.map(mod => mod.acronym),
                                    rank: score.rank,
                                    passed: score.passed,
                                    statistics: {
                                        count_300: score.statistics?.great || 0,
                                        count_100: score.statistics?.ok || 0,
                                        count_50: score.statistics?.meh || 0,
                                        count_miss: score.statistics?.miss || 0,
                                    },
                                    pp: score.pp,
                                    ended_at: score.ended_at,
                                    position: index + 1,
                                    // 添加beatmap信息用于匹配map selections
                                    beatmap_id: playlistItemBeatmapId,
                                    beatmapset_id: playlistItemBeatmapsetId,
                                    // 添加房间信息
                                    roomId: roomId,
                                    roomName: room.name,
                                    playlistId: playlistItem.id,
                                };

                                // 时间筛选
                                if (startDate || endDate) {
                                    if (!score.ended_at) return null;
                                    const endedAt = new Date(score.ended_at);
                                    if (startDate && endedAt < new Date(startDate)) {
                                        return null;
                                    }
                                    if (endDate && endedAt > new Date(endDate)) {
                                        return null;
                                    }
                                }

                                // 有效性筛选（只通过且完成的分数）
                                if (onlyValid && (!score.passed || !score.ended_at)) {
                                    return null;
                                }

                                return scoreData;
                            })
                            .filter(score => score !== null) as DisplayScore[];

                        allScores.push(...displayScores);

                    } catch (error) {
                        console.error(`Error processing playlist ${playlistItem.id} for room ${roomId}:`, error);
                        continue;
                    }
                }

            } catch (error) {
                console.error(`Error processing room ${roomId}:`, error);
                continue;
            }
        }

        // 按分数降序排序并重新计算排名
        const sortedScores = allScores
            .sort((a, b) => b.total_score - a.total_score)
            .map((score, index) => ({
                ...score,
                position: index + 1,
            }));

        console.log(`总共获取到 ${sortedScores.length} 条有效分数`);

        return NextResponse.json({
            success: true,
            scores: sortedScores,
            total: sortedScores.length,
            rooms: roomsData.map(room => ({
                id: room.id,
                name: room.name,
                category: room.category,
                participant_count: room.participant_count,
                active: room.active,
                playlist_count: room.playlist.length
            })),
        });

    } catch (error) {
        console.error('Error fetching multiple room scores:', error);
        return NextResponse.json(
            { success: false, error: '获取多房间分数时发生错误' },
            { status: 500 }
        );
    }
}
