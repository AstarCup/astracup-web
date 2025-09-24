import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/permissions';

export async function POST(request: NextRequest) {
    try {
        const { osuId } = await request.json();

        if (!osuId) {
            return NextResponse.json(
                { error: '缺少osu ID' },
                { status: 400 }
            );
        }

        const isAdmin = await verifyAdminAuth(osuId);

        return NextResponse.json({
            success: true,
            isAdmin
        });

    } catch (error) {
        console.error('Error checking admin status:', error);
        return NextResponse.json(
            { error: '检查管理员权限失败' },
            { status: 500 }
        );
    }
}