using System;
using System.IO;
using System.Collections.Generic;
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

            // 使用osu-tools中的方法：先序列化再反序列化为字典
            var attributeValues = JsonConvert.DeserializeObject<Dictionary<string, object>>(JsonConvert.SerializeObject(attributes)) ?? new Dictionary<string, object>();

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

            // 计算应用mod后的属性
            double arWithMod = applyModToApproachRate(beatmap.BeatmapInfo.Difficulty.ApproachRate, clockRate);
            double odWithMod = applyModToOverallDifficulty(beatmap.BeatmapInfo.Difficulty.OverallDifficulty, clockRate);
            double hpWithMod = applyModToDrainRate(beatmap.BeatmapInfo.Difficulty.DrainRate, clockRate);
            double lengthWithMod = length / clockRate;
            double bpmWithMod = bpm * clockRate;

            // 创建结果字典，包含所有属性
            var result = new Dictionary<string, object>();

            // 首先添加所有难度属性
            foreach (var kvp in attributeValues)
            {
                result[kvp.Key] = kvp.Value;
            }

            // 然后添加/覆盖基础属性
            result["ar"] = arWithMod;
            result["cs"] = beatmap.BeatmapInfo.Difficulty.CircleSize; // CS不受速度mod影响
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

            // BPM信息（应用mod后）
            result["bpm"] = bpmWithMod;

            // 原始BPM信息（未应用mod）
            result["bpm_base"] = bpm;

            // 速度倍率
            result["clock_rate"] = clockRate;

            // 从workingBeatmap获取更多信息
            result["beatmap_id"] = workingBeatmap.BeatmapInfo.OnlineID;
            result["artist"] = workingBeatmap.BeatmapInfo.Metadata.Artist;
            result["title"] = workingBeatmap.BeatmapInfo.Metadata.Title;
            result["creator"] = workingBeatmap.BeatmapInfo.Metadata.Author.Username;

            // 对象计数
            result["total_hit_objects"] = beatmap.HitObjects.Count;

            // 确保关键难度属性存在（如果attributeValues中没有）
            if (!result.ContainsKey("star_rating") && attributes is IHasStarRating hasStarRating)
            {
                try
                {
                    result["star_rating"] = hasStarRating.StarRating;
                }
                catch
                {
                    result["star_rating"] = 0;
                }
            }

            if (!result.ContainsKey("aim_difficulty"))
            {
                result["aim_difficulty"] = 0;
            }

            if (!result.ContainsKey("speed_difficulty"))
            {
                result["speed_difficulty"] = 0;
            }

            if (!result.ContainsKey("max_combo"))
            {
                result["max_combo"] = 0;
            }

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
