import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { list } from '@vercel/blob';
import { getUserPermissions } from '@/lib/permissions';

export async function GET(request: NextRequest) {
    try {
        // 获取用户session
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('astra_session');

        if (!sessionCookie?.value) {
            return NextResponse.json({
                success: false,
                error: '未登录'
            }, { status: 401 });
        }

        let session;
        try {
            session = JSON.parse(sessionCookie.value);
        } catch {
            return NextResponse.json({
                success: false,
                error: '会话无效'
            }, { status: 401 });
        }

        const userOsuId = session.osuId;
        if (!userOsuId) {
            return NextResponse.json({
                success: false,
                error: '用户ID无效'
            }, { status: 400 });
        }

        // 检查用户权限（回放测试者或管理员可以查看已上传用户）
        const permissions = await getUserPermissions(userOsuId);
        if (!permissions.isAdmin && !permissions.isReplayTester) {
            return NextResponse.json({
                success: false,
                error: '权限不足，只有回放测试者或管理员可以查看已上传用户'
            }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const season = searchParams.get('season') || 's1';
        const category = searchParams.get('category') || 'qualification';

        console.log('Fetching uploaded users for:', { season, category });

        // 从 Vercel Blob 获取已上传的文件列表
        const { blobs } = await list({
            prefix: `${season}/${category}/`,
            token: process.env.BLOB_READ_WRITE_TOKEN
        });

        console.log('Blobs found:', blobs.length);
        console.log('First few blobs:', blobs.slice(0, 3).map(b => b.pathname));

        // 解析文件名，提取用户ID和用户名
        const uploadedUsers: { [key: string]: string[] } = {};

        blobs.forEach(blob => {
            // 文件名格式: season/category/modPosition_bid_userId_username.osr
            const filename = blob.pathname;
            console.log('Processing blob:', filename);
            const parts = filename.split('/');
            if (parts.length >= 3) {
                const filePart = parts[2]; // modPosition_bid_userId_username.osr
                const modAndUser = filePart.split('_');
                if (modAndUser.length >= 4) {
                    const bid = modAndUser[1]; // beatmap ID
                    const username = modAndUser[3].replace('.osr', '');
                    const mapKey = `${season}/${category}/${bid}`;

                    if (!uploadedUsers[mapKey]) {
                        uploadedUsers[mapKey] = [];
                    }
                    // 存储用户名而不是用户ID
                    if (!uploadedUsers[mapKey].includes(username)) {
                        uploadedUsers[mapKey].push(username);
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            uploadedUsers
        });
    } catch (error) {
        console.error('Error fetching uploaded users:', error);
        return NextResponse.json(
            { error: '获取上传状态失败', success: false },
            { status: 500 }
        );
    }
}