import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserPermissions } from '@/lib/permissions';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const osuIdParam = searchParams.get('osuId');

        // 如果提供了URL参数，直接使用
        if (osuIdParam) {
            const permissions = await getUserPermissions(osuIdParam);
            return NextResponse.json({
                success: true,
                permissions
            });
        }

        // 从cookie获取session
        const cookieStore = await cookies();
        const astraSessionCookie = cookieStore.get('astra_session');
        const sessionCookie = cookieStore.get('session');

        let sessionCookieValue = null;

        // 优先使用astra_session cookie
        if (astraSessionCookie?.value) {
            sessionCookieValue = astraSessionCookie.value;
        } else if (sessionCookie?.value) {
            sessionCookieValue = sessionCookie.value;
        }

        if (!sessionCookieValue) {
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
            session = JSON.parse(sessionCookieValue);
        } catch {
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

        const osuId = session.osuId;
        if (!osuId) {
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

        const permissions = await getUserPermissions(osuId);
        return NextResponse.json({
            success: true,
            permissions
        });

    } catch (error) {
        console.error('Error fetching user permissions:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch user permissions'
        }, { status: 500 });
    }
}
