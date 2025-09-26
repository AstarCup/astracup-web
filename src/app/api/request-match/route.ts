import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createMessage, getPlayerMatchups, updatePlayerMatchupStatus } from '@/lib/mysql-registrations';

export async function POST(request: NextRequest) {
    try {
        // 获取用户session
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('astra_session');

        if (!sessionCookie?.value) {
            return NextResponse.json({
                success: false,
                error: '未登录'
            }, { status: 401 });
        }

        let session;
        try {
            session = JSON.parse(sessionCookie.value);
        } catch {
            return NextResponse.json({
                success: false,
                error: '会话无效'
            }, { status: 401 });
        }

        const userOsuId = session.osuId;
        const userUsername = session.username;
        if (!userOsuId || !userUsername) {
            return NextResponse.json({
                success: false,
                error: '用户ID或用户名无效'
            }, { status: 400 });
        }

        // 获取请求体
        const body = await request.json();
        const { matchupId } = body;

        if (!matchupId) {
            return NextResponse.json({
                success: false,
                error: '缺少对战ID参数'
            }, { status: 400 });
        }

        // 获取对战信息
        const matchups = await getPlayerMatchups();
        const matchup = matchups.find(m => m.id === parseInt(matchupId));

        if (!matchup) {
            return NextResponse.json({
                success: false,
                error: '对战不存在'
            }, { status: 404 });
        }

        if (matchup.status !== 'available') {
            return NextResponse.json({
                success: false,
                error: '对战不可预约'
            }, { status: 400 });
        }

        // 确定对手信息
        const opponent = matchup.player1_osuId === userOsuId
            ? { osuId: matchup.player2_osuId, username: matchup.player2_username }
            : { osuId: matchup.player1_osuId, username: matchup.player1_username };

        // 创建预约请求消息给对手
        const messageId = await createMessage({
            sender_osuId: userOsuId,
            sender_username: userUsername,
            receiver_osuId: opponent.osuId,
            receiver_username: opponent.username,
            type: 'match_invitation',
            title: '对战预约请求',
            content: `${userUsername} 想要与你预约一场对战。请确认是否接受预约。`,
            related_matchup_id: matchup.id,
            status: 'unread'
        });

        // 将对战状态改为预约中（等待对手确认）
        await updatePlayerMatchupStatus(matchup.id, 'scheduled');

        return NextResponse.json({
            success: true,
            message: '预约请求已发送给对手，请等待确认',
            messageId
        });
    } catch (error) {
        console.error('Error requesting match:', error);
        return NextResponse.json({
            success: false,
            error: '预约对战失败'
        }, { status: 500 });
    }
}