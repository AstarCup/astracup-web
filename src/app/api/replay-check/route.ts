import { NextRequest, NextResponse } from 'next/server';
import { verifyReplayAuth } from '@/lib/permissions';

export async function POST(request: NextRequest) {
    try {
        const { osuId } = await request.json();

        if (!osuId) {
            return NextResponse.json(
                { error: '缺少osu ID' },
                { status: 400 }
            );
        }

        const hasReplayAccess = await verifyReplayAuth(osuId);

        return NextResponse.json({
            success: true,
            hasReplayAccess
        });

    } catch (error) {
        console.error('Error checking replay access:', error);
        return NextResponse.json(
            { error: '检查回放权限失败' },
            { status: 500 }
        );
    }
}