import { NextRequest, NextResponse } from 'next/server';
import { approveRegistration } from '@/lib/mysql-registrations';
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

        const { osuId } = await request.json();

        if (!osuId) {
            return NextResponse.json(
                { success: false, error: '缺少osuId参数' },
                { status: 400 }
            );
        }

        const success = await approveRegistration(osuId);

        if (success) {
            return NextResponse.json({
                success: true,
                message: `用户 ${osuId} 审核通过成功`
            });
        } else {
            return NextResponse.json({
                success: false,
                error: '审核通过失败，用户可能不存在'
            }, { status: 404 });
        }
    } catch (error) {
        console.error('Error approving registration:', error);
        return NextResponse.json(
            { success: false, error: '审核过程中发生错误' },
            { status: 500 }
        );
    }
}
