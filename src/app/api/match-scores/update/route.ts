import { NextRequest, NextResponse } from 'next/server';
import { MultiplayerRoom, DisplayScore } from '@/lib/multiplayer-types';

// 使用与保存接口相同的模拟存储
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
        const existingRoomIndex = savedRooms.findIndex(r => r.id === room.id);
        if (existingRoomIndex === -1) {
            return NextResponse.json(
                { success: false, error: '该房间尚未保存，请先保存房间' },
                { status: 400 }
            );
        }

        // 更新房间信息
        const updatedRoomData = {
            ...savedRooms[existingRoomIndex],
            name: room.name,
            category: room.category,
            participant_count: room.participant_count,
            host: room.host,
            playlist_count: room.playlist.length,
            updated_at: new Date().toISOString()
        };

        savedRooms[existingRoomIndex] = updatedRoomData;

        // 删除该房间原有的分数数据
        savedScores = savedScores.filter(score => score.room_id !== room.id);

        // 保存新的分数数据
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
            saved_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));

        savedScores.push(...scoreData);

        console.log(`成功更新房间 ${room.name} 的分数数据`);
        console.log(`更新了 ${scoreData.length} 条分数记录`);

        return NextResponse.json({
            success: true,
            message: '分数更新成功',
            data: {
                room: updatedRoomData,
                scores_count: scoreData.length
            }
        });

    } catch (error) {
        console.error('更新分数时发生错误:', error);
        return NextResponse.json(
            { success: false, error: '服务器内部错误' },
            { status: 500 }
        );
    }
}

// 获取特定房间的保存数据
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const roomId = searchParams.get('roomId');

        if (!roomId) {
            return NextResponse.json(
                { success: false, error: '缺少roomId参数' },
                { status: 400 }
            );
        }

        const room = savedRooms.find(r => r.id === parseInt(roomId));
        if (!room) {
            return NextResponse.json(
                { success: false, error: '未找到该房间的保存数据' },
                { status: 404 }
            );
        }

        const roomScores = savedScores.filter(score => score.room_id === parseInt(roomId));

        return NextResponse.json({
            success: true,
            room,
            scores: roomScores,
            scores_count: roomScores.length
        });

    } catch (error) {
        console.error('获取房间数据时发生错误:', error);
        return NextResponse.json(
            { success: false, error: '服务器内部错误' },
            { status: 500 }
        );
    }
}
