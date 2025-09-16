import React from 'react';
import { MapPoolItem, MatchGame, MatchUser } from '@/lib/osu-api';

interface ScoreCardProps {
    category: string;
    maps: MapPoolItem[];
    matchGames: MatchGame[];
    users: MatchUser[];
}

export default function ScoreCard({ category, maps, matchGames, users }: ScoreCardProps) {
    // 根据图池分类筛选对应的比赛场次
    const categoryGames = matchGames.filter(game => {
        const beatmapId = game.beatmap?.id;
        return maps.some(map => map.beatmapId === beatmapId);
    });

    // 获取分类的颜色主题
    const getCategoryColor = (cat: string) => {
        const colors: { [key: string]: string } = {
            'NM': 'bg-blue-600',
            'HD': 'bg-purple-600',
            'HR': 'bg-red-600',
            'DT': 'bg-green-600',
            'FM': 'bg-yellow-600',
            'TB': 'bg-pink-600',
        };
        return colors[cat.toUpperCase()] || 'bg-gray-600';
    };

    const getCategoryName = (cat: string) => {
        const names: { [key: string]: string } = {
            'NM': 'No Mod',
            'HD': 'Hidden',
            'HR': 'Hard Rock',
            'DT': 'Double Time',
            'FM': 'Free Mod',
            'TB': 'Tiebreaker',
        };
        return names[cat.toUpperCase()] || cat;
    };

    return (
        <div className="bg-[#2A2A2A] rounded-lg p-6 mb-6 border border-gray-600 shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <span className={`${getCategoryColor(category)} text-white px-4 py-2 rounded-full text-sm font-bold mr-4`}>
                        {category.toUpperCase()}
                    </span>
                    <h3 className="text-xl font-bold text-white">
                        {getCategoryName(category)}
                    </h3>
                </div>
                <div className="text-sm text-gray-400">
                    {categoryGames.length} 场比赛
                </div>
            </div>
            
            {categoryGames.length === 0 ? (
                <div className="text-gray-400 text-center py-12 bg-[#1A1A1A] rounded-lg">
                    <div className="text-4xl mb-4">📊</div>
                    <div className="text-lg">该分类暂无比赛数据</div>
                    <div className="text-sm mt-2">等待比赛开始或检查房间ID</div>
                </div>
            ) : (
                <div className="space-y-6">
                    {categoryGames.map((game, index) => {
                        const map = maps.find(m => m.beatmapId === game.beatmap?.id);
                        const sortedScores = game.scores.sort((a, b) => b.score - a.score);
                        
                        return (
                            <div key={game.id} className="bg-[#1A1A1A] rounded-lg border border-gray-700 overflow-hidden">
                                {/* 谱面信息头部 */}
                                <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h4 className="text-white font-semibold text-lg mb-1">
                                                {game.beatmap?.artist} - {game.beatmap?.title}
                                            </h4>
                                            <div className="text-gray-300 text-sm mb-2">
                                                [{game.beatmap?.difficulty_name}] by {game.beatmap?.creator}
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                                                <span className="flex items-center">
                                                    ⭐ {game.beatmap?.star_rating?.toFixed(2)}
                                                </span>
                                                <span className="flex items-center">
                                                    🎵 {game.beatmap?.bpm} BPM
                                                </span>
                                                <span className="flex items-center">
                                                    ⏱️ {Math.floor((game.beatmap?.total_length || 0) / 60)}:{((game.beatmap?.total_length || 0) % 60).toString().padStart(2, '0')}
                                                </span>
                                                {game.mods.length > 0 && (
                                                    <span className="flex items-center">
                                                        🔧 {game.mods.join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-white font-bold text-lg">
                                                Game #{index + 1}
                                            </div>
                                            <div className="text-gray-400 text-xs">
                                                {new Date(game.start_time).toLocaleTimeString('zh-CN')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* 分数表格 */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-800">
                                            <tr>
                                                <th className="text-left py-3 px-4 text-gray-300 font-medium">排名</th>
                                                <th className="text-left py-3 px-4 text-gray-300 font-medium">玩家</th>
                                                <th className="text-right py-3 px-4 text-gray-300 font-medium">分数</th>
                                                <th className="text-right py-3 px-4 text-gray-300 font-medium">准确率</th>
                                                <th className="text-right py-3 px-4 text-gray-300 font-medium">连击</th>
                                                <th className="text-center py-3 px-4 text-gray-300 font-medium">状态</th>
                                                <th className="text-center py-3 px-4 text-gray-300 font-medium">统计</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedScores.map((score, scoreIndex) => {
                                                const user = users.find(u => u.id === score.user_id);
                                                const isWinner = scoreIndex === 0;
                                                
                                                return (
                                                    <tr 
                                                        key={score.user_id} 
                                                        className={`border-b border-gray-700 hover:bg-gray-800/50 transition-colors ${
                                                            isWinner ? 'bg-gradient-to-r from-yellow-900/30 to-yellow-800/20' : ''
                                                        }`}
                                                    >
                                                        <td className="py-3 px-4">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                                                isWinner ? 'bg-yellow-500 text-black' :
                                                                scoreIndex === 1 ? 'bg-gray-400 text-black' :
                                                                scoreIndex === 2 ? 'bg-amber-600 text-white' :
                                                                'bg-gray-600 text-white'
                                                            }`}>
                                                                {scoreIndex + 1}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center">
                                                                {user?.avatar_url && (
                                                                    <img 
                                                                        src={user.avatar_url} 
                                                                        alt={user.username}
                                                                        className="w-8 h-8 rounded-full mr-3 border-2 border-gray-600"
                                                                    />
                                                                )}
                                                                <div>
                                                                    <div className="text-white font-medium">
                                                                        {user?.username || `User ${score.user_id}`}
                                                                    </div>
                                                                    {user?.country_code && (
                                                                        <div className="text-xs text-gray-400">
                                                                            🌍 {user.country_code}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-right py-3 px-4">
                                                            <div className="text-white font-mono text-lg font-bold">
                                                                {score.score.toLocaleString()}
                                                            </div>
                                                        </td>
                                                        <td className="text-right py-3 px-4">
                                                            <div className={`font-semibold ${
                                                                score.accuracy >= 0.95 ? 'text-green-400' :
                                                                score.accuracy >= 0.90 ? 'text-yellow-400' :
                                                                'text-white'
                                                            }`}>
                                                                {(score.accuracy * 100).toFixed(2)}%
                                                            </div>
                                                        </td>
                                                        <td className="text-right py-3 px-4">
                                                            <div className="text-white font-semibold">
                                                                {score.max_combo}x
                                                                {score.perfect && (
                                                                    <span className="ml-1 text-yellow-400">✨</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="text-center py-3 px-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                score.pass 
                                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                            }`}>
                                                                {score.pass ? '✅ 完成' : '❌ 失败'}
                                                            </span>
                                                        </td>
                                                        <td className="text-center py-3 px-4">
                                                            <div className="text-xs text-gray-400 space-y-1">
                                                                <div>
                                                                    <span className="text-blue-400">{score.statistics.count_300}</span>/
                                                                    <span className="text-green-400">{score.statistics.count_100}</span>/
                                                                    <span className="text-yellow-400">{score.statistics.count_50}</span>/
                                                                    <span className="text-red-400">{score.statistics.count_miss}</span>
                                                                </div>
                                                                {score.mods.length > 0 && (
                                                                    <div className="text-purple-400">
                                                                        +{score.mods.join('')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
