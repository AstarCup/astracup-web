import { NextRequest, NextResponse } from 'next/server';
import { verifyMapSelectionAuth } from '@/lib/permissions';

// 选图团队权限验证
export async function POST(request: NextRequest) {
    try {
        const { osuId } = await request.json();

        if (!osuId) {
            return NextResponse.json(
                { error: '缺少osu ID' },
                { status: 400 }
            );
        }

        // 使用统一的权限验证系统
        const isAuthorized = await verifyMapSelectionAuth(osuId);

        if (!isAuthorized) {
            return NextResponse.json(
                {
                    error: '您没有权限访问选图系统',
                    authorized: false
                },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            message: '权限验证成功',
            authorized: true
        });

    } catch (error) {
        console.error('Error in map selection auth:', error);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
}