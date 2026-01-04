const dotnet = require('node-api-dotnet');

dotnet.load('C:\\Users\\bobbycyl\\Projects\\osu-difficulty-js\\OsuNodeHelper\\bin\\Release\\net8.0\\win-x64\\publish\\OsuNodeHelper.dll');

const { OsuCalculator } = dotnet.OsuNodeHelper;

async function run() {
    try {
        const beatmapPath = "C:\\Users\\bobbycyl\\Projects\\osu-tools\\PerformanceCalculator\\bin\\Release\\net8.0\\cache\\3477131.osu";
        const mods = ["HD", "DT"];
        const modOptions = ["DT_speed_change=1.3"];
        const rawResult = OsuCalculator.CalculateDifficulty(beatmapPath, 0, mods, modOptions);
        const jsonString = String(rawResult);
        const result = JSON.parse(jsonString);

        console.log("Star Rating:", result.star_rating);
        console.log("Full Attributes:", result);
    } catch (err) {
        console.error("Error calling .NET:", err);
    }
}

run();