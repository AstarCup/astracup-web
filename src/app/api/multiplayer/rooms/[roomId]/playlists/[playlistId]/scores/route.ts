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
                    count_300: score.statistics.count_300,
                    count_100: score.statistics.count_100,
                    count_50: score.statistics.count_50,
                    count_miss: score.statistics.count_miss,
                },
                pp: score.pp,
                ended_at: score.ended_at,
                position: index + 1,
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
