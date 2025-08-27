import Bracket from "@/app/components/Bracket";
import ScheduleTable from "@/app/components/ScheduleTable";
import bracketParams from "./bracket.json";
import scheduleData from "./schedule-data.json";

export default function Schedule() {
    return (
        <div className="max-w-9xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">赛程安排</h1>

            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">比赛时间表</h2>
                <ScheduleTable schedule={scheduleData.schedule} />
            </div>

            <div>
                <h2 className="text-2xl font-semibold mb-4">比赛对阵表</h2>
                <Bracket
                    teams={bracketParams.teams as Array<string[]>}
                    results={bracketParams.results}
                    teamWidth={100}
                    scoreWidth={20}
                    matchMargin={80}
                    roundMargin={50}
                />
            </div>
        </div>
    );
}
