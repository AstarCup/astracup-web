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

            var attributeType = attributes.GetType();

            // 尝试直接访问已知的属性，而不是使用反射
            // 根据osu! API文档，OsuDifficultyAttributes应该有这些属性
            var result = new
            {
                // 尝试通过dynamic访问，避免编译时类型检查
                star_rating = GetPropertyValue(attributes, "StarRating"),
                aim_difficulty = GetPropertyValue(attributes, "AimDifficulty"),
                speed_difficulty = GetPropertyValue(attributes, "SpeedDifficulty"),
                max_combo = GetPropertyValue(attributes, "MaxCombo"),

                // 调试信息
                _type = attributeType.FullName,
                _assembly = attributeType.Assembly.FullName,
                _method = "direct_access"
            };

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

    // 辅助方法：安全地获取属性值
    private static object GetPropertyValue(object obj, string propertyName)
    {
        try
        {
            // 尝试使用更宽松的绑定标志
            var property = obj.GetType().GetProperty(propertyName,
                System.Reflection.BindingFlags.Public |
                System.Reflection.BindingFlags.NonPublic |
                System.Reflection.BindingFlags.Instance |
                System.Reflection.BindingFlags.GetProperty);

            if (property == null)
            {
                // 尝试查找字段
                var field = obj.GetType().GetField(propertyName,
                    System.Reflection.BindingFlags.Public |
                    System.Reflection.BindingFlags.NonPublic |
                    System.Reflection.BindingFlags.Instance);

                if (field != null)
                {
                    var fieldValue = field.GetValue(obj);
                    return fieldValue ?? $"Field '{propertyName}' value is null";
                }

                return $"Property/Field '{propertyName}' not found";
            }

            if (!property.CanRead)
            {
                return $"Property '{propertyName}' cannot be read (CanRead=false)";
            }

            var value = property.GetValue(obj);

            // 处理不同类型的返回值
            if (value == null)
            {
                return $"Property '{propertyName}' returned null";
            }

            // 如果是数值类型，直接返回
            if (value is double || value is int || value is float || value is decimal)
            {
                return value;
            }

            // 其他类型转换为字符串
            return value.ToString();
        }
        catch (Exception ex)
        {
            return $"ERROR getting '{propertyName}': {ex.GetType().Name}: {ex.Message}";
        }
    }
}
