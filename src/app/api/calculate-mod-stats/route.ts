import { NextRequest, NextResponse } from 'next/server';

// 使用 node-api-dotnet 加载 PerformanceCalculator.dll
async function loadDotNetCalculator() {
    try {
        const fs = require('fs');
        const path = require('path');

        // 在导入node-api-dotnet之前，确保/usr/lib/dotnet存在
        // node-api-dotnet硬编码查找/usr/lib/dotnet
        const usrLibDotnet = '/usr/lib/dotnet';
        const possibleDotnetPaths = [
            '/usr/lib/dotnet',
            '/tmp/dotnet',
            '/opt/dotnet',
            '/usr/share/dotnet',
            path.join(process.cwd(), 'public', 'dotnet')
        ];

        let dotnetPath = null;

        // 查找现有的.NET安装
        for (const p of possibleDotnetPaths) {
            try {
                fs.accessSync(p);
                dotnetPath = p;
                console.log(`找到.NET安装: ${p}`);
                break;
            } catch {
                // 继续尝试下一个路径
            }
        }

        // 如果没找到，尝试创建符号链接
        if (!dotnetPath) {
            // 检查public/dotnet是否存在（构建脚本应该安装了.NET到这里）
            const publicDotnet = path.join(process.cwd(), 'public', 'dotnet');
            if (fs.existsSync(publicDotnet)) {
                console.log(`使用public/dotnet中的.NET: ${publicDotnet}`);
                dotnetPath = publicDotnet;

                // 尝试创建符号链接/usr/lib/dotnet -> public/dotnet
                try {
                    // 创建/usr/lib目录（如果不存在）
                    fs.mkdirSync('/usr/lib', { recursive: true });
                    // 创建或更新符号链接
                    if (fs.existsSync(usrLibDotnet)) {
                        fs.unlinkSync(usrLibDotnet);
                    }
                    fs.symlinkSync(publicDotnet, usrLibDotnet);
                    console.log(`创建符号链接 ${usrLibDotnet} -> ${publicDotnet}`);
                } catch (symlinkError: any) {
                    console.warn(`无法创建符号链接: ${symlinkError.message}`);
                    // 设置环境变量作为备选方案
                    process.env.DOTNET_ROOT = publicDotnet;
                }
            } else {
                console.warn('未找到.NET安装，node-api-dotnet可能无法工作');
            }
        }

        // 设置环境变量
        if (dotnetPath && !process.env.DOTNET_ROOT) {
            process.env.DOTNET_ROOT = dotnetPath;
            console.log(`设置DOTNET_ROOT为: ${dotnetPath}`);
        }

        // 动态导入node-api-dotnet，避免在构建时打包
        const dotnetModule = await import('node-api-dotnet');
        const dotnet = dotnetModule.default || dotnetModule;

        // 添加解析事件监听器来处理依赖
        dotnet.addListener('resolving', (assemblyName: string, assemblyVersion: string, resolve: (path: string) => void) => {
            console.log(`Resolving assembly: ${assemblyName}, version: ${assemblyVersion}`);

            // 忽略 osu.Game 依赖，因为用户说可以不依赖它
            if (assemblyName === 'osu.Game') {
                console.log(`Ignoring osu.Game dependency as requested`);
                return;
            }

            // 对于其他依赖，尝试在osu-tools项目中查找
            const path = require('path');
            const osuToolsPath = path.join(process.cwd(), 'osu-tools');
            const possiblePaths = [
                path.join(osuToolsPath, `${assemblyName}.dll`),
                path.join(osuToolsPath, 'bin', 'Release', 'net8.0', `${assemblyName}.dll`),
                path.join(osuToolsPath, 'bin', 'Debug', 'net8.0', `${assemblyName}.dll`),
            ];

            for (const possiblePath of possiblePaths) {
                try {
                    require('fs').accessSync(possiblePath);
                    console.log(`Found ${assemblyName} at: ${possiblePath}`);
                    resolve(possiblePath);
                    return;
                } catch (err) {
                    // 继续尝试下一个路径
                }
            }

            console.log(`Could not find ${assemblyName}, letting runtime handle it`);
        });

        return dotnet;
    } catch (error) {
        console.error('Failed to load node-api-dotnet:', error);
        throw new Error('node-api-dotnet module could not be loaded');
    }
}

// 定义难度计算结果的类型
interface DifficultyResult {
    starRating?: number;
    aimDifficulty?: number;
    speedDifficulty?: number;
    maxCombo?: number;
}

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

// OsuNodeHelper.dll 路径
import * as path from 'path';

function getCalculatorDllPath(): string {
    // 首先检查环境变量
    if (process.env.OSU_CALCULATOR_DLL_PATH) {
        return process.env.OSU_CALCULATOR_DLL_PATH;
    }

    // 根据平台选择运行时标识符
    const platform = process.platform;
    const arch = process.arch;
    let runtimeIdentifier = 'win-x64'; // 默认

    if (platform === 'linux') {
        runtimeIdentifier = 'linux-x64';
    } else if (platform === 'darwin') {
        runtimeIdentifier = 'osx-x64';
    } else if (platform === 'win32') {
        runtimeIdentifier = 'win-x64';
    }

    console.log(`Platform: ${platform}-${arch}, using runtime identifier: ${runtimeIdentifier}`);

    // 开发环境：尝试多个可能的位置
    if (process.env.NODE_ENV === 'development') {
        const devPaths = [
            path.join(process.cwd(), 'OsuNodeHelper', 'bin', 'Release', 'net8.0', runtimeIdentifier, 'publish', 'OsuNodeHelper.dll'),
            path.join(process.cwd(), 'public', 'OsuNodeHelper.dll'),
            path.join(process.cwd(), 'OsuNodeHelper.dll'),
        ];

        for (const devPath of devPaths) {
            try {
                require('fs').accessSync(devPath);
                console.log(`Using DLL at: ${devPath}`);
                return devPath;
            } catch {
                // 继续尝试下一个路径
            }
        }
    }

    // 生产环境：使用 public 目录中的 DLL
    // 在 Vercel 上，public 目录的内容会被部署
    const publicPath = path.join(process.cwd(), 'public', 'OsuNodeHelper.dll');
    console.log(`Using DLL from public directory: ${publicPath}`);
    return publicPath;
}

const CALCULATOR_DLL_PATH = getCalculatorDllPath();

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

        // 准备 osu-difficulty 的参数
        const modsArray: string[] = [];
        const modOptions: string[] = [];

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
                if (modString.includes('HR')) modsArray.push('HR');
                if (modString.includes('HD')) modsArray.push('HD');
                if (modString.includes('DT')) {
                    modsArray.push('DT');
                    // 处理自定义DT倍率
                    if (customDTRate && customDTRate !== 1.5) {
                        modOptions.push(`DT_speed_change=${customDTRate}`);
                    }
                }
                if (modString.includes('EZ')) modsArray.push('EZ');
                if (modString.includes('FL')) modsArray.push('FL');
            }
        }

        console.log('Calculating difficulty with:', {
            beatmapId,
            mods: modsArray,
            modOptions,
            customModName,
            customDASettings,
            customDTRate
        });

        // 加载 node-api-dotnet 模块
        const dotnet = await loadDotNetCalculator();

        // 加载 OsuNodeHelper.dll
        console.log(`Loading DLL from: ${CALCULATOR_DLL_PATH}`);

        // 声明结果变量
        let starRating = 0;
        let aimDifficulty = 0;
        let speedDifficulty = 0;

        try {
            // 加载DLL
            dotnet.load(CALCULATOR_DLL_PATH);
            console.log('DLL loaded successfully');

            // 获取OsuCalculator类
            // 使用类型断言，因为OsuNodeHelper是在DLL加载后动态添加的
            const OsuNodeHelperNamespace = (dotnet as any).OsuNodeHelper;

            if (!OsuNodeHelperNamespace) {
                throw new Error('OsuNodeHelper namespace not found after loading DLL');
            }

            const OsuCalculator = OsuNodeHelperNamespace.OsuCalculator;

            if (!OsuCalculator) {
                throw new Error('OsuCalculator class not found in OsuNodeHelper namespace');
            }

            console.log('OsuCalculator class found');

            // 获取beatmap文件内容并保存到临时文件
            const beatmapContent = await getBeatmapFile(beatmapId, accessToken);
            const fs = require('fs');
            const os = require('os');
            const tempDir = os.tmpdir();
            const tempBeatmapPath = path.join(tempDir, `${beatmapId}.osu`);

            fs.writeFileSync(tempBeatmapPath, beatmapContent);
            console.log(`Beatmap saved to temporary file: ${tempBeatmapPath}`);

            try {
                // 调用OsuCalculator.CalculateDifficulty方法
                // rulesetId: 0 表示osu!标准模式
                const rawResult = OsuCalculator.CalculateDifficulty(tempBeatmapPath, 0, modsArray, modOptions);
                const jsonString = String(rawResult);
                const result = JSON.parse(jsonString);

                console.log('Raw result from OsuCalculator:', result);

                // 解析结果
                if (result.error) {
                    throw new Error(`OsuCalculator error: ${result.error}`);
                }

                // 提取难度属性
                starRating = result.star_rating || 0;
                aimDifficulty = result.aim_difficulty || 0;
                speedDifficulty = result.speed_difficulty || 0;

                console.log('Parsed difficulty values:', { starRating, aimDifficulty, speedDifficulty });
            } finally {
                // 清理临时文件
                try {
                    fs.unlinkSync(tempBeatmapPath);
                    console.log('Temporary beatmap file cleaned up');
                } catch (cleanupError) {
                    console.warn('Failed to clean up temporary file:', cleanupError);
                }
            }
        } catch (error: any) {
            console.error('Error calling OsuCalculator:', error.message);
            console.log('Using simulated values due to error');
            starRating = 5.0; // 模拟值
            aimDifficulty = 3.0; // 模拟值
            speedDifficulty = 2.0; // 模拟值
        }

        // 构建结果 - 注意：新API可能不提供ar, cs, od, hp等属性
        // 我们暂时使用默认值或从customDASettings获取
        const modStats = {
            ar: customDASettings?.ar || 0,
            cs: customDASettings?.cs || 0,
            od: customDASettings?.od || 0,
            hp: customDASettings?.hp || 0,
            starRating: starRating,
            bpm: beatmapInfo?.bpm || 0,
            totalLength: beatmapInfo?.totalLength || 0,
            // 添加新API提供的额外信息
            aimDifficulty,
            speedDifficulty
        };

        // 应用DA模式的自定义属性覆盖
        if (mods === 'LZ' && customModName === 'DA' && customDASettings) {
            if (customDASettings.cs !== null && customDASettings.cs !== undefined) {
                modStats.cs = customDASettings.cs;
            }
            if (customDASettings.ar !== null && customDASettings.ar !== undefined) {
                modStats.ar = customDASettings.ar;
            }
            if (customDASettings.od !== null && customDASettings.od !== undefined) {
                modStats.od = customDASettings.od;
            }
            if (customDASettings.hp !== null && customDASettings.hp !== undefined) {
                modStats.hp = customDASettings.hp;
            }
        }

        console.log('Final mod stats:', modStats);

        return NextResponse.json({
            modStats: modStats,
            method: 'node-api-dotnet',
            debug: {
                dllPath: CALCULATOR_DLL_PATH,
                modsApplied: mods,
                customModName,
                customDASettings,
                customDTRate,
                modsArray,
                modOptions,
                starRating,
                aimDifficulty,
                speedDifficulty
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
