import { NextRequest, NextResponse } from 'next/server';
import { getValidClientToken } from '@/lib/osu-auth';
import { MultiplayerRoom } from '@/lib/multiplayer-types';

export async function GET(request: NextRequest) {
    try {
        // 获取客户端token
        const accessToken = await getValidClientToken();

        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode') || 'active';
        const limit = searchParams.get('limit') || '50';
        const sort = searchParams.get('sort') || 'ended';

        const response = await fetch(
            `https://osu.ppy.sh/api/v2/rooms?mode=${mode}&limit=${limit}&sort=${sort}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            console.error('Failed to fetch multiplayer rooms:', response.status, response.statusText);
            return NextResponse.json(
                { success: false, error: '获取multiplayer房间失败' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // 过滤掉有密码的房间，只返回公开房间
        const publicRooms: MultiplayerRoom[] = data.rooms
            ?.filter((room: any) => !room.has_password)
            ?.map((room: any) => ({
                id: room.id,
                name: room.name,
                category: room.category,
                type: room.type,
                starts_at: room.starts_at,
                ends_at: room.ends_at,
                max_attempts: room.max_attempts,
                participant_count: room.participant_count,
                channel_id: room.channel_id,
                active: room.active,
                has_password: room.has_password,
                queue_mode: room.queue_mode,
                auto_skip: room.auto_skip,
                current_playlist_item: room.current_playlist_item,
                current_user_score: room.current_user_score,
                host: {
                    id: room.host.id,
                    username: room.host.username,
                    avatar_url: room.host.avatar_url,
                },
                playlist: room.playlist || [],
            })) || [];

        return NextResponse.json({
            success: true,
            rooms: publicRooms,
            total: publicRooms.length,
        });
    } catch (error) {
        console.error('Error fetching multiplayer rooms:', error);
        return NextResponse.json(
            { success: false, error: '获取multiplayer房间时发生错误' },
            { status: 500 }
        );
    }
}
