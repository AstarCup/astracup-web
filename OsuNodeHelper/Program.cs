using System;
using System.IO;
using Newtonsoft.Json;
using osu.Game.Rulesets;
using PerformanceCalculator;

namespace OsuNodeHelper;

class Program
{
    static int Main(string[] args)
    {
        try
        {
            if (args.Length < 3)
            {
                Console.Error.WriteLine("Usage: OsuNodeHelper <beatmapPath> <rulesetId> <mods> [modOptions]");
                Console.Error.WriteLine("Example: OsuNodeHelper beatmap.osu 0 HR,HD DT_speed_change=1.2");
                return 1;
            }

            string beatmapPath = args[0];

            if (!int.TryParse(args[1], out int rulesetId))
            {
                Console.Error.WriteLine($"Invalid rulesetId: {args[1]}");
                return 1;
            }

            string[] mods = args[2].Split(',', StringSplitOptions.RemoveEmptyEntries);
            string[] modOptions = args.Length > 3 ? args[3].Split(';', StringSplitOptions.RemoveEmptyEntries) : Array.Empty<string>();

            // 验证beatmap文件存在
            if (!File.Exists(beatmapPath))
            {
                Console.Error.WriteLine($"Beatmap file not found: {beatmapPath}");
                return 1;
            }

            // 计算难度
            var result = OsuCalculator.CalculateDifficulty(beatmapPath, rulesetId, mods, modOptions);

            // 输出JSON结果
            Console.WriteLine(result);
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error: {ex.Message}");
            Console.Error.WriteLine($"StackTrace: {ex.StackTrace}");

            // 输出错误JSON
            var errorResult = new { error = ex.Message, stackTrace = ex.StackTrace };
            Console.WriteLine(JsonConvert.SerializeObject(errorResult));
            return 1;
        }
    }
}
