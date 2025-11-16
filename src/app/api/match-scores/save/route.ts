import { NextRequest, NextResponse } from 'next/server';
import { MultiplayerRoom, DisplayScore } from '@/lib/multiplayer-types';

// 模拟数据库存储（实际使用时需要替换为真实的数据库操作）
let savedRooms: any[] = [];
let savedScores: any[] = [];

export async function POST(request: NextRequest) {
    try {
        // 验证管理员权限
        const adminCheckResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin-check`);
        const adminCheckData = await adminCheckResponse.json();

        if (!adminCheckData.isAdmin) {
            return NextResponse.json(
                { success: false, error: '权限不足，只有管理员可以执行此操作' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { room, scores } = body;

        if (!room || !scores) {
            return NextResponse.json(
                { success: false, error: '缺少必要的参数：room 或 scores' },
                { status: 400 }
            );
        }

        // 检查房间是否已经保存过
        const existingRoom = savedRooms.find(r => r.id === room.id);
        if (existingRoom) {
            return NextResponse.json(
                { success: false, error: '该房间已经保存过' },
                { status: 400 }
            );
        }

        // 保存房间信息
        const roomData = {
            id: room.id,
            name: room.name,
            category: room.category,
            type: room.type,
            starts_at: room.starts_at,
            ends_at: room.ends_at,
            participant_count: room.participant_count,
            host: room.host,
            playlist_count: room.playlist.length,
            saved_at: new Date().toISOString()
        };

        savedRooms.push(roomData);

        // 保存分数数据
        const scoreData = scores.map((score: DisplayScore & { playlistId?: number, beatmapId?: number }) => ({
            room_id: room.id,
            user_id: score.user_id,
            username: score.username,
            playlist_id: score.playlistId,
            beatmap_id: score.beatmapId,
            total_score: score.total_score,
            accuracy: score.accuracy,
            max_combo: score.max_combo,
            mods: score.mods,
            rank: score.rank,
            passed: score.passed,
            statistics: score.statistics,
            pp: score.pp,
            ended_at: score.ended_at,
            saved_at: new Date().toISOString()
        }));

        savedScores.push(...scoreData);

        console.log(`成功保存房间 ${room.name} 的分数数据`);
        console.log(`房间信息: ${JSON.stringify(roomData)}`);
        console.log(`保存了 ${scoreData.length} 条分数记录`);

        return NextResponse.json({
            success: true,
            message: '分数保存成功',
            data: {
                room: roomData,
                scores_count: scoreData.length
            }
        });

    } catch (error) {
        console.error('保存分数时发生错误:', error);
        return NextResponse.json(
            { success: false, error: '服务器内部错误' },
            { status: 500 }
        );
    }
}

// 获取已保存的房间列表
export async function GET() {
    try {
        return NextResponse.json({
            success: true,
            rooms: savedRooms,
            total_scores: savedScores.length
        });
    } catch (error) {
        console.error('获取保存的房间列表时发生错误:', error);
        return NextResponse.json(
            { success: false, error: '服务器内部错误' },
            { status: 500 }
        );
    }
}
