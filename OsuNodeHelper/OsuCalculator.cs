using System;
using System.IO;
using Microsoft.JavaScript.NodeApi;
using osu.Game.Rulesets;
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
            // 调试：检查文件是否存在
            if (!File.Exists(beatmapPath))
            {
                return JsonConvert.SerializeObject(new { error = $"Beatmap file not found: {beatmapPath}" });
            }

            var workingBeatmap = new ProcessorWorkingBeatmap(beatmapPath);
            int finalRulesetId = rulesetId ?? workingBeatmap.BeatmapInfo.Ruleset.OnlineID;

            // 调试：获取ruleset
            var ruleset = LegacyHelper.GetRulesetFromLegacyID(finalRulesetId);
            if (ruleset == null)
            {
                return JsonConvert.SerializeObject(new { error = $"Ruleset not found for ID: {finalRulesetId}" });
            }

            var parsedMods = ProcessorCommand.ParseMods(ruleset, mods ?? Array.Empty<string>(), modOptions ?? Array.Empty<string>());
            var calculator = ruleset.CreateDifficultyCalculator(workingBeatmap);
            var attributes = calculator.Calculate(parsedMods);

            // 调试：检查attributes
            if (attributes == null)
            {
                return JsonConvert.SerializeObject(new { error = "Difficulty attributes are null" });
            }

            // 使用反射获取所有属性，以便调试
            var attributeType = attributes.GetType();
            var properties = attributeType.GetProperties();

            // 创建动态对象来存储所有属性
            var result = new System.Dynamic.ExpandoObject() as IDictionary<string, object>;

            foreach (var prop in properties)
            {
                try
                {
                    var value = prop.GetValue(attributes);
                    result[prop.Name] = value;
                }
                catch
                {
                    result[prop.Name] = "ERROR_GETTING_VALUE";
                }
            }

            // 添加类型信息
            result["_type"] = attributeType.FullName;
            result["_assembly"] = attributeType.Assembly.FullName;

            return JsonConvert.SerializeObject(result);
        }
        catch (Exception ex)
        {
            // 返回详细的错误信息
            return JsonConvert.SerializeObject(new
            {
                error = ex.Message,
                stackTrace = ex.StackTrace,
                innerException = ex.InnerException?.Message
            });
        }
    }
}
