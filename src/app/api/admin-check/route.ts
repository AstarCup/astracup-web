import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

export async function POST(request: NextRequest) {
    try {
        const { osuId } = await request.json();

        if (!osuId) {
            return NextResponse.json(
                { error: '缺少osu ID' },
                { status: 400 }
            );
        }

        let adminList: string[] = [];

        // 优先尝试从Edge Config获取管理员列表
        if (process.env.EDGE_CONFIG) {
            const adminConfig = await get('admin');
            if (adminConfig && Array.isArray(adminConfig)) {
                adminList = adminConfig.filter((id): id is string =>
                    typeof id === 'string' && id.trim() !== ''
                );
            }
        }

        // 如果Edge Config没有数据，尝试从环境变量获取
        if (adminList.length === 0 && process.env.ADMIN_IDS) {
            adminList = process.env.ADMIN_IDS
                .split(',')
                .map(id => id.trim())
                .filter(id => id !== '');
        }

        // 如果都没有数据，使用默认测试ID（开发环境）
        if (adminList.length === 0) {
            if (process.env.NODE_ENV === 'development') {
                adminList = ['2']; // peppy的ID作为示例
            } else {
                // 在生产环境中，如果没有配置，不允许任何用户作为管理员
                return NextResponse.json({
                    success: true,
                    isAdmin: false
                });
            }
        }

        // 检查osu ID是否在管理员列表中
        const userIdStr = osuId.toString();
        const userIdNum = parseInt(osuId);

        const isAdmin = adminList.some(adminId => {
            const adminIdStr = adminId.toString();
            const adminIdNum = parseInt(adminId);
            return adminIdStr === userIdStr || adminIdNum === userIdNum;
        });

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