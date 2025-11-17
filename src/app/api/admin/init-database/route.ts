import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/mysql-registrations';

export async function POST(request: NextRequest) {
    try {
        // 验证管理员权限
        const adminCheckResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin-check`);
        const adminCheckData = await adminCheckResponse.json();

        if (!adminCheckData.isAdmin) {
            return NextResponse.json(
                { success: false, error: '权限不足，只有管理员可以执行此操作' },
                { status: 403 }
            );
        }

        // 初始化数据库
        await initDatabase();

        return NextResponse.json({
            success: true,
            message: '数据库初始化成功'
        });

    } catch (error) {
        console.error('数据库初始化错误:', error);
        return NextResponse.json(
            { success: false, error: '数据库初始化失败' },
            { status: 500 }
        );
    }
}
