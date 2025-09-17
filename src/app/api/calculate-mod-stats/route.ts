import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// 从osu! API获取beatmap文件内容
async function getBeatmapFile(beatmapId: number, accessToken?: string): Promise<string> {
    const headers: HeadersInit = {};
    
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`https://osu.ppy.sh/osu/${beatmapId}`, {
        headers,
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch beatmap file: ${response.status}`);
    }

    return await response.text();
}

// 动态加载rosu-pp-js模块
async function loadRosuPP() {
    try {
        // 尝试动态导入
        const rosu = await import('rosu-pp-js');
        return rosu;
    } catch (error) {
        console.error('Failed to load rosu-pp-js:', error);
        throw new Error('rosu-pp-js module could not be loaded');
    }
}

export async function POST(req: NextRequest) {
    try {
        const { beatmapId, mods, accessToken } = await req.json();

        if (!beatmapId) {
            return NextResponse.json({ error: 'beatmapId is required' }, { status: 400 });
        }

        // 动态加载rosu-pp模块
        const rosu = await loadRosuPP();
        
        // 获取beatmap文件
        const beatmapContent = await getBeatmapFile(beatmapId, accessToken);
        
        // 解析beatmap内容为Beatmap对象
        const beatmap = new rosu.Beatmap(beatmapContent);
        
        // 创建Performance计算器
        const performance = new rosu.Performance() as any;
        
        // 设置mod
        let modValue = 0;
        if (mods) {
            const modString = mods.toUpperCase();
            if (modString.includes('HR')) modValue |= 16;  // Hard Rock
            if (modString.includes('DT')) modValue |= 64;  // Double Time
            if (modString.includes('HD')) modValue |= 8;   // Hidden
        }
        
        if (modValue > 0) {
            performance.mods(modValue);
        }
        
        // 计算难度
        const difficulty = new rosu.Difficulty() as any;
        if (modValue > 0) {
            difficulty.mods(modValue);
        }
        
        const difficultyResult = difficulty.calculate(beatmap);
        const performanceResult = performance.calculate(beatmap);
        
        const result = {
            ar: difficultyResult.ar || difficultyResult.approach_rate,
            cs: difficultyResult.cs || difficultyResult.circle_size,
            od: difficultyResult.od || difficultyResult.overall_difficulty,
            hp: difficultyResult.hp || difficultyResult.drain_rate,
            star_rating: difficultyResult.stars || difficultyResult.star_rating,
            bpm: difficultyResult.bpm || 0
        };

        return NextResponse.json({ 
            modStats: result,
            method: 'rosu-pp' 
        });

    } catch (error) {
        console.error('Error calculating mod stats:', error);
        return NextResponse.json({ 
            error: 'Failed to calculate mod stats',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
