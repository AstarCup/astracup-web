import { NextRequest, NextResponse } from 'next/server';
import { getValidClientToken } from '@/lib/osu-auth';
import { MultiplayerScoresResponse, DisplayScore } from '@/lib/multiplayer-types';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string; playlistId: string }> }
) {
    try {
        const { roomId, playlistId } = await params;

        // 获取客户端token
        const accessToken = await getValidClientToken();

        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') || '50';
        const sort = searchParams.get('sort') || 'score_desc';

        const response = await fetch(
            `https://osu.ppy.sh/api/v2/rooms/${roomId}/playlist/${playlistId}/scores?limit=${limit}&sort=${sort}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            console.error('Failed to fetch multiplayer scores:', response.status, response.statusText);
            return NextResponse.json(
                { success: false, error: '获取multiplayer分数失败' },
                { status: response.status }
            );
        }

        const data: MultiplayerScoresResponse = await response.json();

        // 调试：打印第一个分数的完整数据结构和statistics
        if (data.scores.length > 0) {
            // console.log('=== API Debug - First Score Data ===');
            // console.log('Full score data:', JSON.stringify(data.scores[0], null, 2));
            // console.log('Statistics object:', data.scores[0].statistics);
            // console.log('Statistics type:', typeof data.scores[0].statistics);
            // console.log('Statistics keys:', Object.keys(data.scores[0].statistics || {}));
            // console.log('count_300:', data.scores[0].statistics?.count_300);
            // console.log('count_100:', data.scores[0].statistics?.count_100);
            // console.log('count_50:', data.scores[0].statistics?.count_50);
            // console.log('count_miss:', data.scores[0].statistics?.count_miss);
            // console.log('=== End API Debug ===');

            // 额外调试：尝试获取单个分数的详细信息
            const firstScore = data.scores[0];
            try {
                // console.log('=== Individual Score API Debug ===');
                // console.log('Attempting to fetch individual score details...');

                // 尝试获取单个分数的详细信息
                const individualScoreResponse = await fetch(
                    `https://osu.ppy.sh/api/v2/scores/${firstScore.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (individualScoreResponse.ok) {
                    const individualScoreData = await individualScoreResponse.json();
                    // console.log('Individual score data:', JSON.stringify(individualScoreData, null, 2));
                    // console.log('Individual score statistics:', individualScoreData.statistics);
                } else {
                    // console.log('Individual score API failed:', individualScoreResponse.status, individualScoreResponse.statusText);
                    // console.log('Score ID used:', firstScore.id);
                }
                // console.log('=== End Individual Score Debug ===');
            } catch (error) {
                // console.log('Error fetching individual score:', error);
            }
        }

        // 首先获取playlist item信息来获取beatmap数据
        const playlistItemResponse = await fetch(
            `https://osu.ppy.sh/api/v2/rooms/${roomId}/playlist/${playlistId}`,
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
            console.log(`Playlist item beatmapId: ${playlistItemBeatmapId}, beatmapsetId: ${playlistItemBeatmapsetId}`);
            console.log('Full playlist item data:', JSON.stringify(playlistItemData, null, 2));
        } else {
            console.log('Failed to fetch playlist item:', playlistItemResponse.status, playlistItemResponse.statusText);
            console.log('Playlist item URL:', `https://osu.ppy.sh/api/v2/rooms/${roomId}/playlist/${playlistId}`);

            // 如果无法获取playlist item数据，尝试从分数数据中获取beatmap信息
            if (data.scores.length > 0) {
                const firstScore = data.scores[0];
                playlistItemBeatmapId = firstScore.beatmap_id;
                // 注意：分数数据中通常不包含beatmapset_id，需要另外获取
                console.log(`Using beatmap_id from first score: ${playlistItemBeatmapId}`);

                // 尝试获取beatmap详细信息来获取beatmapset_id
                if (playlistItemBeatmapId) {
                    try {
                        const beatmapResponse = await fetch(
                            `https://osu.ppy.sh/api/v2/beatmaps/${playlistItemBeatmapId}`,
                            {
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`,
                                    'Content-Type': 'application/json',
                                },
                            }
                        );

                        if (beatmapResponse.ok) {
                            const beatmapData = await beatmapResponse.json();
                            playlistItemBeatmapsetId = beatmapData.beatmapset_id;
                            console.log(`Retrieved beatmapset_id from beatmap API: ${playlistItemBeatmapsetId}`);
                        }
                    } catch (error) {
                        console.error('Error fetching beatmap details:', error);
                    }
                }
            }
        }

        // 最终验证：确保我们有必要的beatmap信息
        if (!playlistItemBeatmapId) {
            console.error('Warning: Could not determine beatmapId for playlist item');
        }
        if (!playlistItemBeatmapsetId) {
            console.error('Warning: Could not determine beatmapsetId for playlist item');
        }

        // 转换数据格式用于前端展示
        const displayScores: DisplayScore[] = data.scores
            .map((score, index) => ({
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
                    count_50: score.statistics?.meh || 0, // 注意：API中没有meh字段，可能需要处理
                    count_miss: score.statistics?.miss || 0,
                },
                pp: score.pp,
                ended_at: score.ended_at,
                position: index + 1,
                // 添加beatmap信息用于匹配map selections
                beatmap_id: playlistItemBeatmapId, // 使用playlist item的beatmapId
                beatmapset_id: playlistItemBeatmapsetId, // 使用playlist item的beatmapsetId
            }))
            .sort((a, b) => b.total_score - a.total_score) // 按分数降序排序
            .map((score, index) => ({
                ...score,
                position: index + 1, // 重新计算排名
            }));

        return NextResponse.json({
            success: true,
            scores: displayScores,
            total: data.total,
            user_score: data.user_score,
        });
    } catch (error) {
        console.error('Error fetching multiplayer scores:', error);
        return NextResponse.json(
            { success: false, error: '获取multiplayer分数时发生错误' },
            { status: 500 }
        );
    }
}
