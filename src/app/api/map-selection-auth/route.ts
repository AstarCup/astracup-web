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

        // 从Edge Config获取选图团队成员列表
        let mapSelectionTeam: string[] = [];

        try {
            if (process.env.NODE_ENV === 'production' && process.env.EDGE_CONFIG) {
                // 生产环境从Edge Config获取
                const teamConfig = await get('mapSelectionTeam');
                if (teamConfig && Array.isArray(teamConfig)) {
                    mapSelectionTeam = teamConfig.filter((id): id is string => 
                        typeof id === 'string' && id.trim() !== ''
                    );
                }
            } else {
                // 开发环境使用默认配置（可以在这里添加测试用的osu ID）
                mapSelectionTeam = [
                    // 添加测试用的osu ID，生产环境时通过Edge Config配置
                    '2', // peppy的ID作为示例，实际使用时请替换
                ];
            }
        } catch (edgeConfigError) {
            console.error('Error fetching from Edge Config:', edgeConfigError);
            // Edge Config出错时使用空数组
            mapSelectionTeam = [];
        }

        // 检查osu ID是否在授权列表中
        const isAuthorized = mapSelectionTeam.includes(osuId.toString());

        if (!isAuthorized) {
            return NextResponse.json(
                { error: '您没有权限访问选图系统' },
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

        if (process.env.NODE_ENV === 'production' && process.env.EDGE_CONFIG) {
            // 生产环境从Edge Config获取
            const teamConfig = await get('mapSelectionTeam');
            if (teamConfig && Array.isArray(teamConfig)) {
                mapSelectionTeam = teamConfig.filter((id): id is string => 
                    typeof id === 'string' && id.trim() !== ''
                );
            }
        } else {
            // 开发环境使用默认配置
            mapSelectionTeam = [
                '2', // 示例ID
            ];
        }

        return NextResponse.json({
            environment: process.env.NODE_ENV,
            hasEdgeConfig: !!process.env.EDGE_CONFIG,
            teamMemberCount: mapSelectionTeam.length,
            // 在生产环境中，不返回实际的ID列表以保护隐私
            teamMembers: process.env.NODE_ENV === 'development' ? mapSelectionTeam : undefined
        });

    } catch (error) {
        console.error('Error getting map selection config:', error);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
}
