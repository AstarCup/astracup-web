import { NextRequest, NextResponse } from 'next/server';
import { deleteRegistration } from '@/lib/registrations';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
    try {
        // 验证管理员权限
        const authResult = await requireAdminAuth(request);
        if (!authResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: authResult.error
                },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { osuId } = body;

        // 验证必要字段
        if (!osuId) {
            return NextResponse.json(
                { error: '缺少必要字段: osuId' },
                { status: 400 }
            );
        }

        // 删除用户注册信息
        const success = await deleteRegistration(osuId);

        if (!success) {
            return NextResponse.json(
                {
                    success: false,
                    error: '删除用户注册信息失败，用户可能不存在'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `用户 ${osuId} 的注册信息已成功删除`
        });

    } catch (error) {
        console.error('Error deleting registration:', error);
        return NextResponse.json(
            {
                success: false,
                error: '删除注册信息时发生内部错误',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
