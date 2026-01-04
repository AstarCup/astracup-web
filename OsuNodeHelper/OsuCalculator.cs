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

            // 使用反射获取所有公共实例属性
            var attributeType = attributes.GetType();
            var properties = attributeType.GetProperties(
                System.Reflection.BindingFlags.Public |
                System.Reflection.BindingFlags.Instance |
                System.Reflection.BindingFlags.GetProperty);

            // 创建动态对象来存储所有属性
            var result = new System.Dynamic.ExpandoObject() as IDictionary<string, object>;

            foreach (var prop in properties)
            {
                try
                {
                    // 尝试获取属性值
                    var value = prop.GetValue(attributes);

                    // 处理特殊类型
                    if (value == null)
                    {
                        result[prop.Name] = null;
                    }
                    else if (value is double doubleValue)
                    {
                        result[prop.Name] = doubleValue;
                    }
                    else if (value is int intValue)
                    {
                        result[prop.Name] = intValue;
                    }
                    else if (value is float floatValue)
                    {
                        result[prop.Name] = floatValue;
                    }
                    else
                    {
                        // 其他类型转换为字符串
                        result[prop.Name] = value.ToString();
                    }
                }
                catch (Exception propEx)
                {
                    // 记录详细的错误信息
                    result[prop.Name] = $"ERROR: {propEx.GetType().Name}: {propEx.Message}";
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
