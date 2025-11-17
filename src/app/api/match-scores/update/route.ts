import { NextRequest, NextResponse } from 'next/server';
import { updateMatchScores, getRoomScores } from '@/lib/mysql-registrations';

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

        // 使用数据库更新分数
        const result = await updateMatchScores(room, scores);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        console.log(`成功更新房间 ${room.name} 的分数数据`);
        console.log(`更新了 ${result.scores_count} 条分数记录`);

        return NextResponse.json({
            success: true,
            message: '分数更新成功',
            data: {
                room: {
                    id: room.id,
                    name: room.name,
                    category: room.category,
                    type: room.type,
                    starts_at: room.starts_at,
                    ends_at: room.ends_at,
                    participant_count: room.participant_count,
                    host: room.host,
                    playlist_count: room.playlist?.length || 0
                },
                scores_count: result.scores_count
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

        const { room, scores } = await getRoomScores(parseInt(roomId));

        if (!room) {
            return NextResponse.json(
                { success: false, error: '未找到该房间的保存数据' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            room,
            scores,
            scores_count: scores.length
        });

    } catch (error) {
        console.error('获取房间数据时发生错误:', error);
        return NextResponse.json(
            { success: false, error: '服务器内部错误' },
            { status: 500 }
        );
    }
}
