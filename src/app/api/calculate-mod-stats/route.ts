import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// 确保 dotnet 可用的函数
async function ensureDotnetAvailable(): Promise<string> {
    const { execSync, spawnSync } = require('child_process');
    const fs = require('fs');
    const path = require('path');

    const dotnetDir = '/tmp/dotnet';
    const dotnetPath = path.join(dotnetDir, 'dotnet');

    // 检查是否已经安装
    if (fs.existsSync(dotnetPath)) {
        try {
            // 验证 dotnet 可以运行
            execSync(`${dotnetPath} --version`, { stdio: 'ignore' });
            console.log(`Using existing dotnet at: ${dotnetPath}`);
            return dotnetPath;
        } catch {
            // dotnet 存在但无法运行，重新安装
            console.log('dotnet exists but cannot run, reinstalling...');
        }
    }

    // 安装 dotnet
    console.log('Installing dotnet 8.0...');
    try {
        // 创建目录
        if (!fs.existsSync(dotnetDir)) {
            fs.mkdirSync(dotnetDir, { recursive: true });
        }

        // 下载并运行安装脚本
        const installScript = `
            curl -sSL https://dot.net/v1/dotnet-install.sh | bash /dev/stdin \
                --channel 8.0 \
                --install-dir ${dotnetDir} \
                --no-path
        `;

        spawnSync('bash', ['-c', installScript], { stdio: 'inherit' });

        // 设置执行权限
        if (fs.existsSync(dotnetPath)) {
            fs.chmodSync(dotnetPath, 0o755);
            console.log(`dotnet installed successfully at: ${dotnetPath}`);
            return dotnetPath;
        } else {
            throw new Error('dotnet installation failed - binary not found');
        }
    } catch (installError) {
        console.error('Failed to install dotnet:', installError);
        throw new Error('dotnet is not available and could not be installed');
    }
}

// 内联的 calculateDifficulty 函数，原本来自 osu-difficulty-js
async function calculateDifficulty(options: {
    beatmap: string | number;
    ruleset?: number;
    mods?: string[];
    modOptions?: string[];
    dotnetPath?: string;
    calculatorDllPath: string;
}): Promise<any> {
    const {
        beatmap,
        ruleset,
        mods = [],
        modOptions = [],
        dotnetPath,
        calculatorDllPath,
    } = options;

    // 如果没有提供 dotnetPath，确保 dotnet 可用
    const actualDotnetPath = dotnetPath || await ensureDotnetAvailable();

    if (!calculatorDllPath) {
        throw new Error("calculatorDllPath is required");
    }

    const args = [calculatorDllPath, "difficulty"];

    if (ruleset !== undefined) {
        args.push("--ruleset", String(ruleset));
    }

    for (const mod of mods) {
        args.push("-m", mod);
    }

    for (const opt of modOptions) {
        args.push("-o", opt);
    }

    args.push(String(beatmap), "-j");

    return new Promise((resolve, reject) => {
        const child = spawn(actualDotnetPath, args, {
            cwd: path.dirname(calculatorDllPath),
            stdio: ["pipe", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (chunk) => (stdout += chunk));
        child.stderr.on("data", (chunk) => (stderr += chunk));

        child.on("error", (err) => {
            reject(new Error(`Failed to run dotnet: ${err.message}`));
        });

        child.on("close", (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(stdout.trim());
                    resolve(result);
                } catch (e) {
                    const errorMessage = e instanceof Error ? e.message : String(e);
                    reject(
                        new Error(`Invalid JSON output: ${errorMessage}\nOutput: ${stdout}`)
                    );
                }
            } else {
                reject(
                    new Error(
                        `Command failed with code ${code}\nstderr: ${stderr}\nstdout: ${stdout}`
                    )
                );
            }
        });
    });
}

// 定义 osu-difficulty 返回结果的类型
interface OsuDifficultyResult {
    results?: Array<{
        attributes?: {
            star_rating?: number;
            aim_difficulty?: number;
            speed_difficulty?: number;
            max_combo?: number;
            // 可能还有其他属性
        };
    }>;
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

// PerformanceCalculator.dll 路径
function getCalculatorDllPath(): string {
    // 首先检查环境变量
    if (process.env.OSU_CALCULATOR_DLL_PATH) {
        return process.env.OSU_CALCULATOR_DLL_PATH;
    }

    // 开发环境：尝试多个可能的位置
    if (process.env.NODE_ENV === 'development') {
        const devPaths = [
            '/tmp/osu-tools/PerformanceCalculator/bin/Release/net8.0/PerformanceCalculator.dll',
            path.join(process.cwd(), 'public', 'PerformanceCalculator.dll'),
            path.join(process.cwd(), 'PerformanceCalculator.dll'),
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
    const publicPath = path.join(process.cwd(), 'public', 'PerformanceCalculator.dll');
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

        // 使用内联的 calculateDifficulty 函数计算难度
        const result: OsuDifficultyResult = await calculateDifficulty({
            beatmap: beatmapId,
            mods: modsArray,
            modOptions: modOptions,
            calculatorDllPath: CALCULATOR_DLL_PATH,
        });

        console.log('Raw result from osu-difficulty:', result);

        // 提取需要的属性
        let starRating = 0;
        let aimDifficulty = 0;
        let speedDifficulty = 0;

        if (result.results && result.results[0] && result.results[0].attributes) {
            const attrs = result.results[0].attributes;
            starRating = attrs.star_rating || 0;
            aimDifficulty = attrs.aim_difficulty || 0;
            speedDifficulty = attrs.speed_difficulty || 0;
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
            method: 'osu-difficulty',
            debug: {
                rawResultKeys: Object.keys(result || {}),
                modsApplied: mods,
                customModName,
                customDASettings,
                customDTRate,
                modsArray,
                modOptions
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
