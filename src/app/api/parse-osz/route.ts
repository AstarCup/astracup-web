import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import JSZip from 'jszip';
import { verifyMapSelectionAuth } from '@/lib/permissions';

// 解析.osu文件内容
function parseOsuFile(content: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = content.split('\n');
    let currentSection = '';

    for (const line of lines) {
        const trimmedLine = line.trim();

        // 跳过空行和注释
        if (!trimmedLine || trimmedLine.startsWith('//')) {
            continue;
        }

        // 检查是否是节标题
        if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
            currentSection = trimmedLine.slice(1, -1);
            continue;
        }

        // 解析键值对
        const separatorIndex = trimmedLine.indexOf(':');
        if (separatorIndex > 0) {
            const key = trimmedLine.substring(0, separatorIndex).trim();
            const value = trimmedLine.substring(separatorIndex + 1).trim();

            // 只存储特定节的关键字段
            if (currentSection === 'Metadata' || currentSection === 'Difficulty' || currentSection === 'General') {
                result[key] = value;
            }
        }
    }

    return result;
}

// 生成blob存储路径
function generateBlobPath(
    season: string,
    category: string,
    selectedMods: string,
    modPosition: number,
    beatmapId?: number
): string {
    // 格式: 赛季_阶段_mod_mod位_bid.osz
    if (beatmapId !== undefined && beatmapId !== null) {
        // 对于负数bid，使用绝对值并添加负号前缀
        const bidStr = beatmapId < 0 ? `-${Math.abs(beatmapId)}` : beatmapId.toString();
        return `/custom/${season}_${category}_${selectedMods}${modPosition}_${bidStr}.osz`;
    }
    // 如果没有beatmapId，使用旧格式
    return `/custom/${season}_${category}_${selectedMods}${modPosition}.osz`;
}

export async function POST(request: NextRequest) {
    try {
        let file: File;
        let userId: string;
        let season: string = 's1';
        let category: string = 'qualification';
        let selectedMods: string = 'NM';
        let modPosition: string = '1';
        let customBeatmapId: string | null = null;
        let fileUrl: string | null = null;

        // 检查Content-Type，支持两种方式：FormData和JSON
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            // 传统方式：FormData上传
            const formData = await request.formData();
            file = formData.get('file') as File;
            userId = formData.get('userId') as string;
            season = formData.get('season') as string || season;
            category = formData.get('category') as string || category;
            selectedMods = formData.get('selectedMods') as string || selectedMods;
            modPosition = formData.get('modPosition') as string || modPosition;
            customBeatmapId = formData.get('customBeatmapId') as string;
        } else {
            // 新方式：JSON请求体，包含文件URL
            const body = await request.json();
            fileUrl = body.fileUrl;
            userId = body.userId;
            season = body.season || season;
            category = body.category || category;
            selectedMods = body.selectedMods || selectedMods;
            modPosition = body.modPosition || modPosition;
            customBeatmapId = body.customBeatmapId;

            if (!fileUrl || !userId) {
                return NextResponse.json(
                    { error: '缺少必要参数：fileUrl 和 userId' },
                    { status: 400 }
                );
            }

            // 从URL下载文件
            try {
                const fileResponse = await fetch(fileUrl);
                if (!fileResponse.ok) {
                    throw new Error(`下载文件失败: ${fileResponse.status}`);
                }
                const arrayBuffer = await fileResponse.arrayBuffer();
                // 从URL中提取文件名
                const urlObj = new URL(fileUrl);
                const filename = urlObj.pathname.split('/').pop() || 'uploaded.osz';
                file = new File([arrayBuffer], filename, { type: 'application/octet-stream' });
            } catch (downloadError) {
                console.error('Error downloading file from URL:', downloadError);
                return NextResponse.json(
                    { error: `从URL下载文件失败: ${downloadError instanceof Error ? downloadError.message : '未知错误'}` },
                    { status: 400 }
                );
            }
        }

        if (!file || !userId) {
            return NextResponse.json(
                { error: '缺少必要参数：file/fileUrl 和 userId' },
                { status: 400 }
            );
        }

        // 验证文件类型
        if (!file.name.toLowerCase().endsWith('.osz')) {
            return NextResponse.json(
                { error: '只支持.osz文件格式' },
                { status: 400 }
            );
        }

        // 验证权限
        const isAuthorized = await verifyMapSelectionAuth(userId);
        if (!isAuthorized) {
            return NextResponse.json(
                { error: '您没有权限访问选图系统' },
                { status: 403 }
            );
        }

        // 验证文件大小（限制为50MB）
        if (file.size > 50 * 1024 * 1024) {
            return NextResponse.json(
                { error: '文件大小不能超过50MB' },
                { status: 400 }
            );
        }

        // 读取文件内容
        const arrayBuffer = await file.arrayBuffer();

        try {
            // 解压osz文件
            const zip = await JSZip.loadAsync(arrayBuffer);

            // 查找.osu文件
            const osuFiles = Object.keys(zip.files).filter(name => name.toLowerCase().endsWith('.osu'));

            if (osuFiles.length === 0) {
                return NextResponse.json(
                    { error: '在osz文件中未找到.osu文件' },
                    { status: 400 }
                );
            }

            // 解析所有.osu文件
            const beatmapInfos = [];

            for (const osuFile of osuFiles) {
                try {
                    const osuContent = await zip.file(osuFile)?.async('text');

                    if (!osuContent) {
                        continue;
                    }

                    const parsedData = parseOsuFile(osuContent);

                    beatmapInfos.push({
                        // 元数据
                        title: parsedData['Title'] || '',
                        titleUnicode: parsedData['TitleUnicode'] || parsedData['Title'] || '',
                        artist: parsedData['Artist'] || '',
                        artistUnicode: parsedData['ArtistUnicode'] || parsedData['Artist'] || '',
                        version: parsedData['Version'] || '',
                        creator: parsedData['Creator'] || '',
                        beatmapId: parseInt(parsedData['BeatmapID'] || '-1'),
                        beatmapsetId: parseInt(parsedData['BeatmapSetID'] || '-1'),

                        // 难度数据
                        cs: parseFloat(parsedData['CircleSize'] || '4'),
                        ar: parseFloat(parsedData['ApproachRate'] || '9'),
                        od: parseFloat(parsedData['OverallDifficulty'] || '8'),
                        hp: parseFloat(parsedData['HPDrainRate'] || '6'),

                        // 其他信息
                        bpm: parseFloat(parsedData['PreviewTime'] || '180'), // 注意：这里需要实际解析BPM
                        totalLength: parseInt(parsedData['AudioLeadIn'] || '0') + 120, // 简化处理
                        tags: parsedData['Tags'] || '',
                        source: parsedData['Source'] || '',

                        // 文件名信息
                        osuFilename: osuFile,
                        index: beatmapInfos.length
                    });
                } catch (error) {
                    console.error(`Error parsing osu file ${osuFile}:`, error);
                    // 继续解析其他文件
                }
            }

            if (beatmapInfos.length === 0) {
                return NextResponse.json(
                    { error: '无法解析任何.osu文件' },
                    { status: 400 }
                );
            }

            // 按难度名排序
            beatmapInfos.sort((a, b) => a.version.localeCompare(b.version));

            // 为每个难度计算mod后的属性
            const beatmapInfosWithModStats = [];

            for (const beatmapInfo of beatmapInfos) {
                try {
                    // 获取.osu文件内容
                    const osuContent = await zip.file(beatmapInfo.osuFilename)?.async('text');
                    if (osuContent) {
                        // 调用calculate-mod-stats API计算mod后的属性
                        const modStatsResponse = await fetch(`${request.nextUrl.origin}/api/calculate-mod-stats`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                beatmap: {
                                    id: beatmapInfo.beatmapId,
                                    title: beatmapInfo.title,
                                    artist: beatmapInfo.artist,
                                    creator: beatmapInfo.creator,
                                    bpm: beatmapInfo.bpm,
                                    totalLength: beatmapInfo.totalLength
                                },
                                mods: selectedMods,
                                customSettings: {
                                    customModName: '',
                                    customDASettings: null,
                                    customDTRate: null
                                },
                                osuContent: osuContent
                            })
                        });

                        if (modStatsResponse.ok) {
                            const modStatsData = await modStatsResponse.json();
                            const modStats = modStatsData.modStats;

                            // 合并原始信息和mod后的属性
                            beatmapInfosWithModStats.push({
                                ...beatmapInfo,
                                cs: modStats.cs || beatmapInfo.cs,
                                ar: modStats.ar || beatmapInfo.ar,
                                od: modStats.od || beatmapInfo.od,
                                hp: modStats.hp || beatmapInfo.hp,
                                bpm: modStats.bpm || beatmapInfo.bpm,
                                totalLength: modStats.totalLength || beatmapInfo.totalLength,
                                maxCombo: modStats.maxCombo || 0,
                                starRating: modStats.starRating || 5.0,
                                modStats: modStats, // 保存完整的modStats信息
                                osuContent: osuContent // 保存.osu文件内容，用于后续重新计算
                            });
                        } else {
                            // 如果计算失败，使用原始信息
                            beatmapInfosWithModStats.push({
                                ...beatmapInfo,
                                starRating: 5.0,
                                maxCombo: 0
                            });
                        }
                    } else {
                        // 如果没有.osu文件内容，使用原始信息
                        beatmapInfosWithModStats.push({
                            ...beatmapInfo,
                            starRating: 5.0,
                            maxCombo: 0
                        });
                    }
                } catch (error) {
                    console.error(`Error calculating mod stats for ${beatmapInfo.osuFilename}:`, error);
                    // 出错时使用原始信息
                    beatmapInfosWithModStats.push({
                        ...beatmapInfo,
                        starRating: 5.0,
                        maxCombo: 0
                    });
                }
            }

            // 生成存储路径
            let finalBeatmapId: number | undefined = undefined;


            if (customBeatmapId) {
                const customId = parseInt(customBeatmapId);
                if (customId < 0) { // 确保是负数
                    finalBeatmapId = customId;
                }
            }


            if (!finalBeatmapId && beatmapInfosWithModStats.length > 0) {
                const firstBeatmap = beatmapInfosWithModStats[0];
                if (firstBeatmap.beatmapId && firstBeatmap.beatmapId > 0) {
                    finalBeatmapId = firstBeatmap.beatmapId;
                }
            }

            const blobPath = generateBlobPath(
                season,
                category,
                selectedMods,
                parseInt(modPosition),
                finalBeatmapId
            );

            // 上传到Vercel Blob
            let blobUrl = '';
            try {
                const blob = await put(blobPath, file, {
                    access: 'public',
                    contentType: 'application/octet-stream',
                    token: process.env.BLOB_READ_WRITE_TOKEN
                });
                blobUrl = blob.url;
            } catch (blobError) {
                console.error('Blob upload error:', blobError);
                // 如果blob上传失败，仍然返回解析的数据
            }

            return NextResponse.json({
                success: true,
                message: 'osz文件解析成功',
                beatmapInfos: beatmapInfosWithModStats,
                fileInfo: {
                    originalName: file.name,
                    size: file.size,
                    blobPath,
                    blobUrl,
                    uploaded: !!blobUrl
                },
                hasMultipleDifficulties: beatmapInfosWithModStats.length > 1,
                totalDifficulties: beatmapInfosWithModStats.length
            });

        } catch (zipError) {
            console.error('Error processing zip file:', zipError);
            return NextResponse.json(
                { error: `处理osz文件失败: ${zipError instanceof Error ? zipError.message : '未知错误'}` },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('Error in parse-osz API:', error);
        return NextResponse.json(
            { error: `处理请求失败: ${error instanceof Error ? error.message : '未知错误'}` },
            { status: 500 }
        );
    }
}
