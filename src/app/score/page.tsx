"use client";
import { useState } from "react";
import OsuMatchScores from "../components/OsuMatchScores";

export default function ScorePage() {
    const [matchId, setMatchId] = useState("");
    const [submittedId, setSubmittedId] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittedId(matchId.trim());
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
            <h1 className="text-3xl font-bold mb-6">osu! 比赛分数查询</h1>
            <form onSubmit={handleSubmit} className="mb-8 flex gap-2">
                <input
                    type="text"
                    placeholder="输入 matchId..."
                    value={matchId}
                    onChange={e => setMatchId(e.target.value)}
                    className="border px-3 py-2 rounded shadow"
                />
                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    查询
                </button>
            </form>
            {submittedId && <OsuMatchScores matchId={submittedId} />}
        </div>
    );
}
