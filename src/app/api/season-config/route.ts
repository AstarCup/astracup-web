import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
    try {
        let nowSeason = 's1'; // 默认赛季
        // 根据当前赛季生成可用的赛季选项
        const availableSeasons = [];
        availableSeasons.push({ value: 's1', label: 'Season 1' });
        availableSeasons.push({ value: 'otc1', label: 'OTC#1' });


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
