import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyMapSelectionAuth } from '@/lib/permissions';

// 动态加载rosu-pp-js模块
async function loadRosuPP() {
    try {
        const rosu = await import('rosu-pp-js');
        return rosu;
    } catch (error) {
        console.error('Failed to load rosu-pp-js:', error);
        throw new Error('rosu-pp-js module could not be loaded');
    }
}

export async function GET() {
    try {
        // 获取用户session进行权限验证
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;

        if (!sessionCookie) {
            return NextResponse.json(
                { error: '未登录用户' },
                { status: 401 }
            );
        }

        let session;
        try {
            session = JSON.parse(sessionCookie);
        } catch {
            return NextResponse.json(
                { error: '无效的会话' },
                { status: 401 }
            );
        }

        const osuId = session.osuId;
        if (!osuId) {
            return NextResponse.json(
                { error: '无效的用户ID' },
                { status: 401 }
            );
        }

        // 验证选图权限
        const hasPermission = await verifyMapSelectionAuth(osuId);
        if (!hasPermission) {
            return NextResponse.json(
                { error: '无选图权限' },
                { status: 403 }
            );
        }

        const rosu = await loadRosuPP();

        // 获取所有可用的mod
        console.log('Rosu object keys:', Object.keys(rosu));

        // 定义Lazer特有的mod列表
        // 这些是osu!lazer中特有的模组，不在传统osu!中存在
        const lazerSpecificMods = [
            {
                name: 'DA',
                description: 'Difficulty Adjust - 自定义难度属性',
                supportedAttributes: ['CS', 'AR', 'OD', 'HP'],
                category: 'difficulty'
            },
            {
                name: 'WG',
                description: 'Wiggle - 摆动效果',
                category: 'visual'
            },
            {
                name: 'MR',
                description: 'Mirror - 镜像',
                category: 'conversion'
            },
            {
                name: 'RD',
                description: 'Random - 随机',
                category: 'conversion'
            },
            {
                name: 'AS',
                description: 'Adaptive Speed - 自适应速度',
                category: 'difficulty'
            },
            {
                name: 'CL',
                description: 'Classic - 经典模式',
                category: 'conversion'
            },
            {
                name: 'SG',
                description: 'Single Tap - 单键模式',
                category: 'conversion'
            },
            {
                name: 'AT',
                description: 'Autoplay - 自动游玩',
                category: 'automation'
            },
            {
                name: 'CN',
                description: 'Cinema - 电影模式',
                category: 'automation'
            },
            {
                name: 'TP',
                description: 'Touch Device - 触屏设备模式',
                category: 'conversion'
            },
            {
                name: 'SC',
                description: 'Score V2 - 评分系统V2',
                category: 'system'
            },
            {
                name: 'TC',
                description: 'Target Practice - 目标练习',
                category: 'fun'
            },
            {
                name: 'RP',
                description: 'Repel - 排斥',
                category: 'visual'
            },
            {
                name: 'MG',
                description: 'Magnetised - 磁化',
                category: 'visual'
            },
            {
                name: 'AC',
                description: 'Accuracy Challenge - 精确度挑战',
                category: 'difficulty'
            },
            {
                name: 'BR',
                description: 'Barrel Roll - 桶滚',
                category: 'visual'
            },
            {
                name: 'AD',
                description: 'Approach Different - 不同接近',
                category: 'visual'
            },
            {
                name: 'MU',
                description: 'Muted - 静音',
                category: 'audio'
            },
            {
                name: 'NS',
                description: 'No Scope - 无瞄准',
                category: 'visual'
            },
            {
                name: 'BL',
                description: 'Blinds - 百叶窗',
                category: 'visual'
            }
        ];

        // 过滤出最常用和最稳定的mod供选择
        const recommendedMods = lazerSpecificMods.filter(mod =>
            ['DA', 'WG', 'MR', 'RD', 'AS', 'CL', 'SG', 'TC', 'AC'].includes(mod.name)
        );

        return NextResponse.json({
            availableMods: recommendedMods,
            allLazerMods: lazerSpecificMods,
            debug: {
                rosuLoaded: true,
                totalMods: lazerSpecificMods.length,
                recommendedCount: recommendedMods.length
            }
        });

    } catch (error) {
        console.error('Error getting available mods:', error);

        // 如果rosu加载失败，返回基本的mod列表
        const basicMods = [
            { name: 'DA', description: 'Difficulty Adjust - 自定义难度属性', category: 'difficulty' },
            { name: 'WG', description: 'Wiggle - 摆动效果', category: 'visual' },
            { name: 'MR', description: 'Mirror - 镜像', category: 'conversion' },
            { name: 'RD', description: 'Random - 随机', category: 'conversion' },
            { name: 'AS', description: 'Adaptive Speed - 自适应速度', category: 'difficulty' },
            { name: 'CL', description: 'Classic - 经典模式', category: 'conversion' },
        ];

        return NextResponse.json({
            availableMods: basicMods,
            error: 'Fallback mod list used',
            debug: {
                rosuLoaded: false,
                errorMessage: error instanceof Error ? error.message : String(error)
            }
        });
    }
}