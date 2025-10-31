import { NextRequest, NextResponse } from 'next/server';

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
        const {
            beatmap: beatmapInfo,
            mods,
            accessToken,
            customSettings
        } = await req.json();

        const { customModName, customDASettings, customDTRate } = customSettings || {};
        const beatmapId = beatmapInfo?.id;

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
        const attributesBuilder = new rosu.BeatmapAttributesBuilder({
            map: beatmap  // 指定beatmap
        });

        // 处理mod设置
        let modValue = 0;
        let clockRate = 1.0;

        if (mods && mods !== 'NM') {
            const modString = mods.toUpperCase();

            // 处理LZ模式
            if (modString === 'LZ' && customModName) {
                const customMod = customModName.toUpperCase();

                // 处理DA模式 - 自定义属性将在后面应用
                if (customMod === 'DA') {
                    // DA模式不需要特殊的mod值，属性会直接覆盖
                    console.log('DA mod detected, will apply custom attributes later');
                }
                // 处理其他已知的Lazer特有mod
                else if (['WG', 'MR', 'RD', 'AS', 'CL', 'SG', 'TC', 'AC'].includes(customMod)) {
                    // 这些mod大多是视觉或转换效果，不影响难度计算
                    // 但我们记录它们以便将来扩展
                    console.log(`Lazer mod detected: ${customMod} (visual/conversion effect)`);
                }
                // 其他未知的lazer mod
                else {
                    console.log('Unknown lazer mod:', customMod);
                }
            }
            // 处理标准mod
            else {
                if (modString.includes('HR')) modValue |= 16;  // Hard Rock
                if (modString.includes('HD')) modValue |= 8;   // Hidden

                // DT处理 - 支持自定义倍率
                if (modString.includes('DT')) {
                    modValue |= 64;  // Double Time
                    clockRate = customDTRate && customDTRate !== 1.5 ? customDTRate : 1.5;
                }
            }

            if (modValue > 0) {
                attributesBuilder.mods = modValue;
            }

            // 设置时钟倍率（用于DT自定义倍率）
            if (clockRate !== 1.0) {
                attributesBuilder.clockRate = clockRate;
            }
        }

        // 获取带mod的beatmap属性
        const beatmapAttributes = attributesBuilder.build();

        // 计算难度（获取星级）
        const difficulty = new rosu.Difficulty();
        if (modValue > 0) {
            difficulty.mods = modValue;
        }
        if (clockRate !== 1.0) {
            difficulty.clockRate = clockRate;
        }

        const difficultyResult = difficulty.calculate(beatmap);

        console.log('Mod value:', modValue);
        console.log('Clock rate:', clockRate);
        console.log('Custom settings:', { customModName, customDASettings, customDTRate });
        console.log('Beatmap attributes:', beatmapAttributes);
        console.log('Difficulty result:', difficultyResult);

        // 构建结果 - 优先使用计算出的属性
        const result = {
            ar: beatmapAttributes.ar || 0,
            cs: beatmapAttributes.cs || 0,
            od: beatmapAttributes.od || 0,
            hp: beatmapAttributes.hp || 0,
            starRating: difficultyResult.stars || 0,
            bpm: Math.round((beatmapAttributes.clockRate || clockRate) * (beatmap.bpm || 120)),
            totalLength: Math.round((beatmap.totalLength || 0) / (beatmapAttributes.clockRate || clockRate))
        };

        // 应用DA模式的自定义属性覆盖
        if (mods === 'LZ' && customModName === 'DA' && customDASettings) {
            if (customDASettings.cs !== null && customDASettings.cs !== undefined) {
                result.cs = customDASettings.cs;
            }
            if (customDASettings.ar !== null && customDASettings.ar !== undefined) {
                result.ar = customDASettings.ar;
            }
            if (customDASettings.od !== null && customDASettings.od !== undefined) {
                result.od = customDASettings.od;
            }
            if (customDASettings.hp !== null && customDASettings.hp !== undefined) {
                result.hp = customDASettings.hp;
            }
        }

        console.log('Final result after DA override:', result);

        return NextResponse.json({
            modStats: result,
            method: 'rosu-pp',
            debug: {
                beatmapKeys: Object.keys(beatmapAttributes || {}),
                difficultyKeys: Object.keys(difficultyResult || {}),
                modsApplied: mods,
                customModName,
                customDASettings,
                customDTRate,
                clockRate,
                modValue
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
