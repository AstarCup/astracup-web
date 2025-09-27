import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserPermissions } from '@/lib/permissions';

export async function GET() {
    try {
        // 获取用户session
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;

        if (!sessionCookie) {
            return NextResponse.json({
                success: true,
                permissions: {
                    isMapSelector: false,
                    isReplayTester: false,
                    isAdmin: false
                }
            });
        }

        let session;
        try {
            session = JSON.parse(sessionCookie);
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