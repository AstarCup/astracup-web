import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserPermissions } from '@/lib/permissions';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const osuIdParam = searchParams.get('osuId');

        console.log('[User Permissions API] 请求参数:', { osuIdParam });

        // 如果提供了URL参数，直接使用
        if (osuIdParam) {
            console.log('[User Permissions API] 使用URL参数osuId:', osuIdParam);
            const permissions = await getUserPermissions(osuIdParam);
            console.log('[User Permissions API] 返回权限结果:', permissions);
            return NextResponse.json({
                success: true,
                permissions
            });
        }

        // 否则从session cookie获取
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;

        console.log('[User Permissions API] Session cookie存在:', !!sessionCookie);

        if (!sessionCookie) {
            console.log('[User Permissions API] 没有session cookie，返回默认权限');
            return NextResponse.json({
                success: true,
                permissions: {
                    isMapSelector: false,
                    isReplayTester: false,
                    isAdmin: false,
                    isStreamer: false,
                    isReferee: false,
                    isCommentator: false
                }
            });
        }

        let session;
        try {
            session = JSON.parse(sessionCookie);
            console.log('[User Permissions API] Session解析成功，osuId:', session.osuId);
        } catch {
            return NextResponse.json({
                success: true,
                permissions: {
                    isMapSelector: false,
                    isReplayTester: false,
                    isAdmin: false
                }
            });
        }

        const osuId = session.osuId;
        if (!osuId) {
            return NextResponse.json({
                success: true,
                permissions: {
                    isMapSelector: false,
                    isReplayTester: false,
                    isAdmin: false
                }
            });
        }

        // 获取用户权限
        const permissions = await getUserPermissions(osuId);

        return NextResponse.json({
            success: true,
            permissions
        });
    } catch (error) {
        console.error('Error fetching user permissions:', error);
        return NextResponse.json(
            { error: '获取权限信息失败', success: false },
            { status: 500 }
        );
    }
}