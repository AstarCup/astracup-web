import { NextRequest, NextResponse } from 'next/server';
import {
    getRatingsForMap,
    getUserRating,
    addOrUpdateRating,
    deleteRating,
    getRatingStats,
    initMapRatingsDatabase
} from '@/lib/map-ratings';
import { verifyMapSelectionAuth } from '../map-selections/route';

// 验证用户权限的辅助函数
async function verifyUserAuth(osuId: string): Promise<{ authorized: boolean; username?: string }> {
    try {
        // 验证用户是否有选图权限
        const isAuthorized = await verifyMapSelectionAuth(osuId);

        if (isAuthorized) {
            // 在生产环境中，用户已经通过OAuth登录，主要依赖session获取用户名
            try {
                // 在API路由中，直接从请求头获取host信息
                const host = process.env.VERCEL_URL || 'localhost:3000';
                const protocol = host.includes('localhost') ? 'http' : 'https';
                const sessionResponse = await fetch(`${protocol}://${host}/api/session/get`, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (sessionResponse.ok) {
                    const sessionData = await sessionResponse.json();
                    if (sessionData.success && sessionData.session) {
                        return {
                            authorized: true,
                            username: sessionData.session.username || `User_${osuId}`
                        };
                    }
                }
            } catch (sessionError) {
                console.error('Error getting session for username:', sessionError);
                // 如果获取session失败，使用默认用户名
            }

            // 直接返回授权通过，使用默认用户名
            return { authorized: true, username: `User_${osuId}` };
        }

        return { authorized: false };
    } catch (error) {
        console.error('Error verifying user auth:', error);
        return { authorized: false };
    }
}

// GET - 获取指定选图的评分和评论
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const mapSelectionId = searchParams.get('mapSelectionId');
        const statsOnly = searchParams.get('statsOnly') === 'true';

        if (!mapSelectionId) {
            return NextResponse.json(
                { error: '缺少必要参数：mapSelectionId' },
                { status: 400 }
            );
        }

        // 自动初始化数据库（如果需要）
        try {
            await initMapRatingsDatabase();
        } catch (error) {
            console.error('Error auto-initializing ratings database:', error);
            // 继续执行，表可能已经存在
        }

        if (statsOnly) {
            // 只获取评分统计
            const stats = await getRatingStats(parseInt(mapSelectionId));
            return NextResponse.json({
                success: true,
                stats
            });
        } else {
            // 获取所有评分和评论
            const ratings = await getRatingsForMap(parseInt(mapSelectionId));
            return NextResponse.json({
                success: true,
                ratings,
                count: ratings.length
            });
        }

    } catch (error) {
        console.error('Error getting map ratings:', error);
        return NextResponse.json(
            { error: '获取评分信息失败' },
            { status: 500 }
        );
    }
}

// POST - 添加或更新评分和评论
export async function POST(request: NextRequest) {
    try {
        const {
            mapSelectionId,
            rating,
            comment = '',
            userId
        } = await request.json();

        if (!mapSelectionId || !rating || !userId) {
            return NextResponse.json(
                { error: '缺少必要参数：mapSelectionId, rating, userId' },
                { status: 400 }
            );
        }

        // 验证评分范围
        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: '评分必须在1-5之间' },
                { status: 400 }
            );
        }

        // 验证用户权限
        const authResult = await verifyUserAuth(userId);
        if (!authResult.authorized) {
            return NextResponse.json(
                { error: '您没有权限进行评分' },
                { status: 403 }
            );
        }

        // 获取用户头像URL
        let avatarUrl = '';
        try {
            // 在API路由中，直接从请求头获取host信息
            const host = process.env.VERCEL_URL || 'localhost:3000';
            const protocol = host.includes('localhost') ? 'http' : 'https';
            const sessionResponse = await fetch(`${protocol}://${host}/api/session/get`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (sessionResponse.ok) {
                const sessionData = await sessionResponse.json();
                if (sessionData.success && sessionData.session) {
                    avatarUrl = sessionData.session.avatar_url || '';
                }
            }
        } catch (sessionError) {
            console.error('Error getting session for avatar:', sessionError);
            // 如果获取session失败，使用默认头像
        }

        // 初始化数据库
        await initMapRatingsDatabase();

        // 添加或更新评分
        const success = await addOrUpdateRating(
            parseInt(mapSelectionId),
            userId,
            authResult.username || `User_${userId}`,
            rating,
            comment,
            avatarUrl
        );

        if (!success) {
            return NextResponse.json(
                { error: '添加评分失败' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: '评分添加成功'
        });

    } catch (error) {
        console.error('Error adding rating:', error);
        return NextResponse.json(
            { error: '添加评分失败' },
            { status: 500 }
        );
    }
}

// DELETE - 删除评分
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const mapSelectionId = searchParams.get('mapSelectionId');
        const userId = searchParams.get('userId');

        if (!mapSelectionId || !userId) {
            return NextResponse.json(
                { error: '缺少必要参数：mapSelectionId, userId' },
                { status: 400 }
            );
        }

        // 验证用户权限
        const authResult = await verifyUserAuth(userId);
        if (!authResult.authorized) {
            return NextResponse.json(
                { error: '您没有权限删除评分' },
                { status: 403 }
            );
        }

        // 初始化数据库
        await initMapRatingsDatabase();

        // 删除评分
        const success = await deleteRating(parseInt(mapSelectionId), userId);

        if (!success) {
            return NextResponse.json(
                { error: '删除评分失败' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: '评分删除成功'
        });

    } catch (error) {
        console.error('Error deleting rating:', error);
        return NextResponse.json(
            { error: '删除评分失败' },
            { status: 500 }
        );
    }
}
