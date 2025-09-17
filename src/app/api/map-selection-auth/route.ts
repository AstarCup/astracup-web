import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

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

        // 从Edge Config和环境变量获取选图团队成员列表
        let mapSelectionTeam: string[] = [];

        try {
            // 优先尝试从Edge Config获取（无论开发还是生产环境）
            if (process.env.EDGE_CONFIG) {
                console.log('Trying to fetch from Edge Config...');
                const teamConfig = await get('mapSelectionTeam');
                console.log('Edge Config response:', teamConfig);

                if (teamConfig && Array.isArray(teamConfig)) {
                    mapSelectionTeam = teamConfig.filter((id): id is string =>
                        typeof id === 'string' && id.trim() !== ''
                    );
                    console.log('Parsed team from Edge Config:', mapSelectionTeam);
                }
            }

            // 如果Edge Config没有数据，尝试从环境变量获取
            if (mapSelectionTeam.length === 0 && process.env.MAP_SELECTION_TEAM_IDS) {
                console.log('Using environment variable fallback...');
                mapSelectionTeam = process.env.MAP_SELECTION_TEAM_IDS
                    .split(',')
                    .map(id => id.trim())
                    .filter(id => id !== '');
                console.log('Team from env var:', mapSelectionTeam);
            }

            // 如果都没有数据，使用默认测试ID
            if (mapSelectionTeam.length === 0) {
                console.log('Using default test IDs...');
                mapSelectionTeam = [
                    '2', // peppy的ID作为示例
                ];
            }

        } catch (edgeConfigError) {
            console.error('Error fetching from Edge Config:', edgeConfigError);
            // Edge Config出错时使用环境变量
            if (process.env.MAP_SELECTION_TEAM_IDS) {
                mapSelectionTeam = process.env.MAP_SELECTION_TEAM_IDS
                    .split(',')
                    .map(id => id.trim())
                    .filter(id => id !== '');
            } else {
                mapSelectionTeam = ['2']; // 默认测试ID
            }
        }

        console.log('Final map selection team:', mapSelectionTeam);
        console.log('Checking osu ID:', osuId);
        console.log('osu ID type:', typeof osuId);

        // 检查osu ID是否在授权列表中 - 支持数字和字符串比较
        const userIdStr = osuId.toString();
        const userIdNum = parseInt(osuId);
        
        const isAuthorized = mapSelectionTeam.some(teamId => {
            const teamIdStr = teamId.toString();
            const teamIdNum = parseInt(teamId);
            
            // 比较字符串和数字形式
            const match = teamIdStr === userIdStr || teamIdNum === userIdNum;
            console.log(`Comparing ${teamIdStr} with ${userIdStr}: ${match}`);
            return match;
        });
        
        console.log('Final authorization result:', isAuthorized);

        if (!isAuthorized) {
            return NextResponse.json(
                { 
                    error: '您没有权限访问选图系统',
                    debug: {
                        yourId: osuId,
                        yourIdType: typeof osuId,
                        authorizedIds: mapSelectionTeam,
                        comparisonDetails: mapSelectionTeam.map(id => ({
                            teamId: id,
                            stringMatch: id.toString() === osuId.toString(),
                            numberMatch: parseInt(id) === parseInt(osuId)
                        }))
                    }
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

// 获取选图团队配置信息（不验证权限，用于调试）
export async function GET(request: NextRequest) {
    try {
        let mapSelectionTeam: string[] = [];

        // 优先尝试从Edge Config获取（无论开发还是生产环境）
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

        // 如果都没有数据，使用默认测试ID
        if (mapSelectionTeam.length === 0) {
            mapSelectionTeam = ['2']; // 示例ID
        }

        return NextResponse.json({
            environment: process.env.NODE_ENV,
            hasEdgeConfig: !!process.env.EDGE_CONFIG,
            teamMemberCount: mapSelectionTeam.length,
            // 显示团队成员列表用于调试（生产环境中也显示，因为需要调试）
            teamMembers: mapSelectionTeam,
            // 添加更多调试信息
            edgeConfigUrl: process.env.EDGE_CONFIG ? 'configured' : 'not configured',
            envTeamIds: process.env.MAP_SELECTION_TEAM_IDS || 'not set'
        });

    } catch (error) {
        console.error('Error getting map selection config:', error);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
}
