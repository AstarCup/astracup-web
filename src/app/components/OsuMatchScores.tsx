import React, { useEffect, useState } from 'react';

interface OsuMatchScoresProps {
    matchId: string;
}

interface Score {
    slot: number;
    team: number;
    user_id: number;
    score: number;
    pass: boolean;
}

interface Game {
    id: number;
    start_time: string;
    end_time: string;
    scores: Score[];
}

export default function OsuMatchScores({ matchId }: OsuMatchScoresProps) {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchMatch() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/osu-match/${matchId}`);
                const data = await res.json();
                // debug: 输出原始数据
                console.debug('[OsuMatchScores] fetched data:', data);
                if (data && data.games) {
                    // 适配osu! v2 API结构
                    setGames(data.games.map((g: any) => ({
                        id: g.id,
                        start_time: g.start_time,
                        end_time: g.end_time,
                        scores: g.scores || [],
                    })));
                } else {
                    setError('No games found');
                }
            } catch (e) {
                setError('Failed to fetch match data');
            }
            setLoading(false);
        }
        fetchMatch();
    }, [matchId]);

    if (loading) return <div>Loading match scores...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h2>Match Scores</h2>
            {games.length === 0 ? (
                <div>No games found.</div>
            ) : (
                games.map((game) => (
                    <div key={game.id} style={{ marginBottom: 24 }}>
                        <h3>Game {game.id}</h3>
                        <p>Start: {game.start_time} | End: {game.end_time}</p>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th>Slot</th>
                                    <th>User ID</th>
                                    <th>Score</th>
                                    <th>Pass</th>
                                    <th>Team</th>
                                </tr>
                            </thead>
                            <tbody>
                                {game.scores.map((score, idx) => (
                                    <tr key={idx}>
                                        <td>{score.slot}</td>
                                        <td>{score.user_id}</td>
                                        <td>{score.score}</td>
                                        <td>{score.pass ? 'Yes' : 'No'}</td>
                                        <td>{score.team}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))
            )}
        </div>
    );
}
