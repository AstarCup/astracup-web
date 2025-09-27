import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

export async function GET(_request: NextRequest) {
    try {
        let nowSeason = 's1'; // 默认赛季

        // 尝试从Edge Config获取当前赛季
        if (process.env.EDGE_CONFIG) {
            try {
                const seasonConfig = await get('nowSeason');
                if (seasonConfig && typeof seasonConfig === 'string') {
                    nowSeason = seasonConfig;
                }
            } catch (error) {
                console.warn('Failed to get season config from Edge Config:', error);
            }
        }

        // 根据当前赛季生成可用的赛季选项
        const availableSeasons = [];

        if (nowSeason === 's1') {
            // 如果当前是s1，只显示s1
            availableSeasons.push({ value: 's1', label: 'Season 1' });
        } else if (nowSeason === 's2') {
            // 如果当前是s2，显示s1和s2，默认选择s2
            availableSeasons.push({ value: 's1', label: 'Season 1' });
            availableSeasons.push({ value: 's2', label: 'Season 2' });
        } else {
            // 其他情况，使用默认配置
            availableSeasons.push({ value: 's1', label: 'Season 1' });
        }

        // 确定默认赛季
        const defaultSeason = nowSeason === 's2' ? 's2' : 's1';

        return NextResponse.json({
            success: true,
            nowSeason,
            defaultSeason,
            availableSeasons
        });

    } catch (error) {
        console.error('Error getting season config:', error);

        // 返回默认配置
        return NextResponse.json({
            success: true,
            nowSeason: 's1',
            defaultSeason: 's1',
            availableSeasons: [
                { value: 's1', label: 'Season 1' }
            ]
        });
    }
}
