import Bracket from "@/app/components/Bracket";
import bracketParams from "./bracket.json";

export default function Schedule() {
    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">赛程安排</h1>
            <Bracket
                teams={bracketParams.teams as Array<string[]>}
                results={bracketParams.results}
                teamWidth={100}
                scoreWidth={20}
                matchMargin={80}
                roundMargin={50}
            />
        </div>
    );
}
