import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

export async function GET() {
    try {
        const replayAccessUsers = await get('replayAccessUsers');
        return NextResponse.json({
            success: true,
            replayAccessUsers: replayAccessUsers || []
        });
    } catch (error) {
        console.error('Error fetching replay access users:', error);
        return NextResponse.json(
            { error: '获取权限配置失败', success: false },
            { status: 500 }
        );
    }
}