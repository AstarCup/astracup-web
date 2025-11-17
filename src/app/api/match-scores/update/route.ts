import { NextRequest, NextResponse } from 'next/server';
import { updateMatchScores, getRoomScores, getTournamentSettings } from '@/lib/mysql-registrations';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { room, scores, osuId } = body;

        if (!room || !scores || !osuId) {
            return NextResponse.json(
                { success: false, error: '缺少必要的参数：room、scores 或 osuId' },
                { status: 400 }
            );
        }

        // 直接验证管理员权限
        let adminList: string[] = [];

        // 优先尝试从数据库获取管理员列表
        try {
            const tournamentSettings = await getTournamentSettings();
            if (tournamentSettings?.admin_group && Array.isArray(tournamentSettings.admin_group)) {
                adminList = tournamentSettings.admin_group.filter((id: any): id is string =>
                    typeof id === 'string' && id.trim() !== ''
                );
            }
        } catch (dbError) {
            console.warn('Failed to fetch admin list from database:', dbError);
        }

        // 检查osu ID是否在管理员列表中
        const userIdStr = osuId.toString();
        const userIdNum = parseInt(osuId);

        const isAdmin = adminList.some(adminId => {
            const adminIdStr = adminId.toString();
            const adminIdNum = parseInt(adminId);
            return adminIdStr === userIdStr || adminIdNum === userIdNum;
        });

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: '权限不足，只有管理员可以执行此操作' },
                { status: 403 }
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
