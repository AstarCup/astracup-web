using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using Microsoft.JavaScript.NodeApi;
using osu.Game.Rulesets;
using osu.Game.Beatmaps;
using osu.Game.Rulesets.Difficulty;
using PerformanceCalculator;
using Newtonsoft.Json;

namespace OsuNodeHelper;

[JSExport]
public static class OsuCalculator
{
    // 强制返回类型为 string
    public static string CalculateDifficulty(string beatmapPath, int? rulesetId, string[] mods, string[] modOptions)
    {
        try
        {
            var workingBeatmap = new ProcessorWorkingBeatmap(beatmapPath);
            int finalRulesetId = rulesetId ?? workingBeatmap.BeatmapInfo.Ruleset.OnlineID;
            var ruleset = LegacyHelper.GetRulesetFromLegacyID(finalRulesetId);
            var parsedMods = ProcessorCommand.ParseMods(ruleset, mods ?? Array.Empty<string>(), modOptions ?? Array.Empty<string>());
            var calculator = ruleset.CreateDifficultyCalculator(workingBeatmap);
            var attributes = calculator.Calculate(parsedMods);

            // 直接访问DifficultyAttributes的属性
            double starRating = attributes.StarRating;
            double aimDifficulty = 0;
            double speedDifficulty = 0;
            int maxCombo = attributes.MaxCombo;

            // 尝试获取Aim和Speed难度（这些属性可能不存在于所有规则集中）
            try
            {
                var attributesType = attributes.GetType();
                var aimProperty = attributesType.GetProperty("AimDifficulty");
                var speedProperty = attributesType.GetProperty("SpeedDifficulty");

                if (aimProperty != null)
                    aimDifficulty = (double)aimProperty.GetValue(attributes);
                if (speedProperty != null)
                    speedDifficulty = (double)speedProperty.GetValue(attributes);
            }
            catch
            {
                // 如果无法获取这些属性，保持默认值0
            }

            // 获取beatmap基本信息
            var beatmap = workingBeatmap.GetPlayableBeatmap(ruleset.RulesetInfo, parsedMods);

            // 计算时长（从最后一个击打对象的时间获取）
            double length = 0;
            double bpm = 0;

            if (beatmap.HitObjects.Count > 0)
            {
                // 时长 = 最后一个击打对象的时间（毫秒）
                var lastHitObject = beatmap.HitObjects[^1];
                length = lastHitObject.StartTime;

                // 尝试计算BPM（从timing points获取）
                try
                {
                    if (beatmap.ControlPointInfo.TimingPoints.Count > 0)
                    {
                        var timingPoint = beatmap.ControlPointInfo.TimingPoints[0];
                        bpm = 60000 / timingPoint.BeatLength;
                    }
                }
                catch
                {
                    // 如果无法获取BPM，使用默认值
                }
            }

            // 应用mod到基础属性
            double clockRate = 1.0;
            bool hasHR = false;
            bool hasEZ = false;

            foreach (var mod in parsedMods)
            {
                // 检查是否有速度变化mod
                if (mod.Acronym == "DT" || mod.Acronym == "NC")
                {
                    // DT通常增加1.5倍速度，但可以通过mod选项自定义
                    clockRate = 1.5;
                }
                else if (mod.Acronym == "HT")
                {
                    clockRate = 0.75;
                }
                else if (mod.Acronym == "HR")
                {
                    hasHR = true;
                }
                else if (mod.Acronym == "EZ")
                {
                    hasEZ = true;
                }
            }

            // 如果有自定义速度变化，使用它
            foreach (var option in modOptions ?? Array.Empty<string>())
            {
                if (option.StartsWith("DT_speed_change="))
                {
                    if (double.TryParse(option.Split('=')[1], out double customSpeed))
                    {
                        clockRate = customSpeed;
                    }
                }
            }

            // 获取基础属性
            double baseAR = beatmap.BeatmapInfo.Difficulty.ApproachRate;
            double baseCS = beatmap.BeatmapInfo.Difficulty.CircleSize;
            double baseOD = beatmap.BeatmapInfo.Difficulty.OverallDifficulty;
            double baseHP = beatmap.BeatmapInfo.Difficulty.DrainRate;

            // 应用HR/EZ mod
            if (hasHR)
            {
                // HR: 增加所有属性
                baseAR = Math.Min(10, baseAR * 1.4);
                baseCS = Math.Min(10, baseCS * 1.3);
                baseOD = Math.Min(10, baseOD * 1.4);
                baseHP = Math.Min(10, baseHP * 1.4);
            }
            else if (hasEZ)
            {
                // EZ: 减少所有属性
                baseAR = Math.Max(0, baseAR * 0.5);
                baseCS = Math.Max(0, baseCS * 0.5);
                baseOD = Math.Max(0, baseOD * 0.5);
                baseHP = Math.Max(0, baseHP * 0.5);
            }

            // 计算应用速度mod后的属性
            double arWithMod = applyModToApproachRate(baseAR, clockRate);
            double odWithMod = applyModToOverallDifficulty(baseOD, clockRate);
            double hpWithMod = applyModToDrainRate(baseHP, clockRate);
            double lengthWithMod = length / clockRate;
            double bpmWithMod = bpm * clockRate;

            // CS不受速度mod影响，但受HR/EZ影响
            double csWithMod = baseCS;

            // 创建结果字典，包含所有属性
            var result = new Dictionary<string, object>();

            // 添加难度属性
            result["star_rating"] = starRating;
            result["aim_difficulty"] = aimDifficulty;
            result["speed_difficulty"] = speedDifficulty;
            result["max_combo"] = maxCombo;

            // 添加基础属性 - 只返回用户需要的属性
            result["ar"] = arWithMod;
            result["cs"] = csWithMod; // 使用应用了HR/EZ后的CS值
            result["od"] = odWithMod;
            result["hp"] = hpWithMod;

            // 原始基础属性（未应用mod）
            result["ar_base"] = beatmap.BeatmapInfo.Difficulty.ApproachRate;
            result["cs_base"] = beatmap.BeatmapInfo.Difficulty.CircleSize;
            result["od_base"] = beatmap.BeatmapInfo.Difficulty.OverallDifficulty;
            result["hp_base"] = beatmap.BeatmapInfo.Difficulty.DrainRate;

            // 时长信息（应用mod后）
            result["length"] = lengthWithMod;
            result["length_seconds"] = lengthWithMod / 1000.0;

            // 原始时长信息（未应用mod）
            result["length_base"] = length;
            result["length_seconds_base"] = length / 1000.0;

            // BPM信息（应用mod后）- 格式化为2位小数
            result["bpm"] = Math.Round(bpmWithMod, 2);

            // 原始BPM信息（未应用mod）- 格式化为2位小数
            result["bpm_base"] = Math.Round(bpm, 2);

            // 速度倍率
            result["clock_rate"] = clockRate;

            // 从workingBeatmap获取更多信息
            result["beatmap_id"] = workingBeatmap.BeatmapInfo.OnlineID;
            result["artist"] = workingBeatmap.BeatmapInfo.Metadata.Artist;
            result["title"] = workingBeatmap.BeatmapInfo.Metadata.Title;
            result["creator"] = workingBeatmap.BeatmapInfo.Metadata.Author.Username;

            // 对象计数
            result["total_hit_objects"] = beatmap.HitObjects.Count;

            // 返回序列化的结果
            return JsonConvert.SerializeObject(result);
        }
        catch (Exception ex)
        {
            return JsonConvert.SerializeObject(new { error = ex.Message });
        }
    }

    // 应用mod到Approach Rate
    private static double applyModToApproachRate(double baseAr, double clockRate)
    {
        if (clockRate == 1.0) return baseAr;

        // AR计算公式：应用速度变化
        // 当clockRate > 1时，AR增加
        // 当clockRate < 1时，AR减少
        double ar = baseAr;

        // 转换AR为毫秒
        double arMs = ar > 5 ? 1200 + (450 - 1200) * (ar - 5) / 5 :
                       ar < 5 ? 1800 - (1800 - 1200) * ar / 5 :
                       1200;

        // 应用速度变化
        arMs /= clockRate;

        // 转换回AR值
        if (arMs > 1200)
            ar = (1800 - arMs) / 120;
        else
            ar = 5 + (1200 - arMs) * 5 / 750;

        return Math.Min(11, Math.Max(0, ar));
    }

    // 应用mod到Overall Difficulty
    private static double applyModToOverallDifficulty(double baseOd, double clockRate)
    {
        if (clockRate == 1.0) return baseOd;

        // OD计算公式：应用速度变化
        double od = baseOd;

        // 转换OD为毫秒
        double odMs = 79.5 - 6 * od;

        // 应用速度变化
        odMs /= clockRate;

        // 转换回OD值
        od = (79.5 - odMs) / 6;

        return Math.Min(11, Math.Max(0, od));
    }

    // 应用mod到Health Drain
    private static double applyModToDrainRate(double baseHp, double clockRate)
    {
        if (clockRate == 1.0) return baseHp;

        // HP受速度影响较小，但也会变化
        double hp = baseHp;

        // 简单线性调整
        if (clockRate > 1.0)
            hp = Math.Min(10, hp * 1.4);
        else if (clockRate < 1.0)
            hp = Math.Max(0, hp * 0.75);

        return Math.Min(10, Math.Max(0, hp));
    }
}
