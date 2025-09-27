import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserPermissions } from '@/lib/permissions';
import mysql from 'mysql2/promise';

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
        if (!userOsuId) {
            return NextResponse.json({
                success: false,
                error: '用户ID无效'
            }, { status: 400 });
        }

        const body = await request.json();
        const { id, red_score, blue_score, match_link, replay_link, stream_link, status } = body;

        if (!id) {
            return NextResponse.json({
                success: false,
                error: '缺少比赛ID'
            }, { status: 400 });
        }

        // 检查用户权限 - 只有管理员可以更新比赛信息
        const permissions = await getUserPermissions(userOsuId);
        if (!permissions.isAdmin) {
            return NextResponse.json({
                success: false,
                error: '无权限更新比赛信息'
            }, { status: 403 });
        }

        // 连接数据库
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            port: parseInt(process.env.MYSQL_PORT || '3306'),
        });

        try {
            // 构建更新查询
            const updates: string[] = [];
            const params: any[] = [];

            if (red_score !== undefined) {
                updates.push('red_score = ?');
                params.push(red_score);
            }
            if (blue_score !== undefined) {
                updates.push('blue_score = ?');
                params.push(blue_score);
            }
            if (match_link !== undefined) {
                updates.push('match_link = ?');
                params.push(match_link);
            }
            if (replay_link !== undefined) {
                updates.push('replay_link = ?');
                params.push(replay_link);
            }
            if (stream_link !== undefined) {
                updates.push('stream_link = ?');
                params.push(stream_link);
            }
            if (status !== undefined) {
                updates.push('status = ?');
                params.push(status);
            }

            if (updates.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: '没有要更新的字段'
                }, { status: 400 });
            }

            updates.push('updated_at = NOW()');
            params.push(id);

            const query = `UPDATE match_schedules SET ${updates.join(', ')} WHERE id = ?`;

            await connection.execute(query, params);

            return NextResponse.json({
                success: true,
                message: '比赛信息更新成功'
            });
        } finally {
            await connection.end();
        }
    } catch (error) {
        console.error('Error updating match details:', error);
        return NextResponse.json({
            success: false,
            error: '更新比赛信息失败'
        }, { status: 500 });
    }
}