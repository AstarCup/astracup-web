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
        
        // 创建BeatmapAttributesBuilder来获取基础参数
        const attributesBuilder = new rosu.BeatmapAttributesBuilder();
        
        // 设置mod
        let modValue = 0;
        if (mods && mods !== 'NM') {
            const modString = mods.toUpperCase();
            if (modString.includes('HR')) modValue |= 16;  // Hard Rock
            if (modString.includes('DT')) modValue |= 64;  // Double Time
            if (modString.includes('HD')) modValue |= 8;   // Hidden
            
            if (modValue > 0) {
                attributesBuilder.mods = modValue;
            }
        }
        
        // 获取带mod的beatmap属性
        const beatmapAttributes = attributesBuilder.build();
        
        // 计算难度（获取星级）
        const difficulty = new rosu.Difficulty();
        if (modValue > 0) {
            difficulty.mods = modValue;
        }
        
        const difficultyResult = difficulty.calculate(beatmap);
        
        console.log('Beatmap attributes:', beatmapAttributes);
        console.log('Difficulty result:', difficultyResult);
        console.log('Beatmap attributes keys:', Object.keys(beatmapAttributes || {}));
        console.log('Difficulty result keys:', Object.keys(difficultyResult || {}));
        
        const result = {
            ar: beatmapAttributes.ar || 0,
            cs: beatmapAttributes.cs || 0,
            od: beatmapAttributes.od || 0,
            hp: beatmapAttributes.hp || 0,
            star_rating: difficultyResult.stars || 0,
            bpm: Math.round((beatmapAttributes.clockRate || 1) * 120) // 默认BPM估算
        };

        console.log('Final result:', result);

        return NextResponse.json({ 
            modStats: result,
            method: 'rosu-pp',
            debug: {
                beatmapKeys: Object.keys(beatmapAttributes || {}),
                difficultyKeys: Object.keys(difficultyResult || {}),
                modsApplied: mods
            }
        });

    } catch (error) {
        console.error('Error calculating mod stats:', error);
        return NextResponse.json({ 
            error: 'Failed to calculate mod stats',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
