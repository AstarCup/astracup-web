import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/mysql-registrations';
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

        // 执行数据库升级（实际上是重新初始化）
        await initDatabase();

        return NextResponse.json({
            success: true,
            message: '数据库升级成功，已添加审核状态字段'
        });
    } catch (error) {
        console.error('Error upgrading database:', error);
        return NextResponse.json(
            {
                success: false,
                error: '数据库升级失败',
                details: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
}
