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
        const roomId = searchParams.get('roomId');

        let apiUrl: string;

        if (roomId) {
            // 查询特定房间
            apiUrl = `https://osu.ppy.sh/api/v2/rooms/${roomId}`;
        } else {
            // 查询房间列表
            apiUrl = `https://osu.ppy.sh/api/v2/rooms?mode=${mode}&limit=${limit}&sort=${sort}`;
        }

        const response = await fetch(
            apiUrl,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            console.error('Failed to fetch multiplayer rooms:', response.status, response.statusText);
            // 如果是单个房间查询且返回404，返回空房间列表而不是错误
            if (roomId && response.status === 404) {
                return NextResponse.json(
                    { success: true, rooms: [], total: 0 },
                    { status: 200 }
                );
            }
            return NextResponse.json(
                { success: false, error: '获取multiplayer房间失败' },
                { status: response.status }
            );
        }

        const data = await response.json();

        let rooms: MultiplayerRoom[] = [];

        if (roomId) {
            // 单个房间查询 - 直接处理返回的房间对象
            if (!data.has_password) {
                rooms = [{
                    id: data.id,
                    name: data.name,
                    category: data.category,
                    type: data.type,
                    starts_at: data.starts_at,
                    ends_at: data.ends_at,
                    max_attempts: data.max_attempts,
                    participant_count: data.participant_count,
                    channel_id: data.channel_id,
                    active: data.active,
                    has_password: data.has_password,
                    queue_mode: data.queue_mode,
                    auto_skip: data.auto_skip,
                    current_playlist_item: data.current_playlist_item,
                    current_user_score: data.current_user_score,
                    host: {
                        id: data.host.id,
                        username: data.host.username,
                        avatar_url: data.host.avatar_url,
                    },
                    playlist: data.playlist || [],
                }];
            }
        } else {
            // 房间列表查询 - 过滤掉有密码的房间
            rooms = data.rooms
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
        }

        return NextResponse.json({
            success: true,
            rooms: rooms,
            total: rooms.length,
        });
    } catch (error) {
        console.error('Error fetching multiplayer rooms:', error);
        return NextResponse.json(
            { success: false, error: '获取multiplayer房间时发生错误' },
            { status: 500 }
        );
    }
}
