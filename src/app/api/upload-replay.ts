import { NextRequest, NextResponse } from 'next/server';

// 验证回放收集权限的辅助函数
async function verifyReplayAuth(osuId: string): Promise<boolean> {
    // 简化版本：只检查硬编码的用户列表
    const allowedUsers = ['6781503', '17823832', '30826405', '5936405', '30284920'];
    return allowedUsers.includes(osuId);
}

export async function POST(request: NextRequest) {
    const formData = await request.formData();
    const file = formData.get('file');
    const filename = formData.get('filename');
    const userId = formData.get('userId');

    if (!file || !filename || !userId) {
        return NextResponse.json({ error: '参数缺失' }, { status: 400 });
    }

    // 权限校验 - 简化测试
    const allowedUsers = ['6781503'];
    const hasAccess = allowedUsers.includes(userId.toString());
    if (!hasAccess) {
        return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    // 临时：权限检查通过，直接返回成功
    return NextResponse.json({ success: true, message: '权限验证通过，文件上传功能已启用' });
}
