import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

// 选图团队权限检查
export async function POST(request: NextRequest) {
    try {
        const { osuId } = await request.json();

        if (!osuId) {
            return NextResponse.json(
                { error: '缺少osu ID' },
                { status: 400 }
            );
        }

        let mapSelectionTeam: string[] = [];

        // 优先尝试从Edge Config获取选图团队列表
        if (process.env.EDGE_CONFIG) {
            const teamConfig = await get('mapSelectionTeam');
            if (teamConfig && Array.isArray(teamConfig)) {
                mapSelectionTeam = teamConfig.filter((id): id is string =>
                    typeof id === 'string' && id.trim() !== ''
                );
            }
        }

        // 如果Edge Config没有数据，尝试从环境变量获取
        if (mapSelectionTeam.length === 0 && process.env.MAP_SELECTION_TEAM_IDS) {
            mapSelectionTeam = process.env.MAP_SELECTION_TEAM_IDS
                .split(',')
                .map(id => id.trim())
                .filter(id => id !== '');
        }

        // 检查osu ID是否在选图团队列表中
        const userIdStr = osuId.toString();
        const userIdNum = parseInt(osuId);

        const isMapSelector = mapSelectionTeam.some(teamId => {
            const teamIdStr = teamId.toString();
            const teamIdNum = parseInt(teamId);
            return userIdStr === teamIdStr || userIdNum === teamIdNum;
        });

        return NextResponse.json({
            success: true,
            isMapSelector
        });

    } catch (error) {
        console.error('Error checking map selection permissions:', error);
        return NextResponse.json(
            { error: '检查选图权限失败' },
            { status: 500 }
        );
    }
}