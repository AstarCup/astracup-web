'use client';

import React, { useState } from 'react';
import { MatchData } from '@/lib/osu-api';

interface MatchDetailDisplayProps {
    matchData: MatchData;
}

export default function MatchDetailDisplay({ matchData }: MatchDetailDisplayProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedGameIndex, setSelectedGameIndex] = useState<number | null>(null);

    return (
        <div className="mb-20">
            {/* 比赛信息概览 - 可点击展开 */}
            <div
                className="bg-gradient-to-r from-[#2A2A2A] to-[#1A1A1A] rounded-lg p-6 border border-gray-600 shadow-xl cursor-pointer hover:border-[#FF66AA] transition-all duration-300"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <h2 className="text-2xl font-bold flex items-center">
                            🏆 {matchData.match.name}
                        </h2>
                        <div className="ml-4 text-gray-400">
                            {(matchData.games || []).length} 场比赛 • {(matchData.users || []).length} 位玩家
                        </div>
                    </div>
                    <div className="flex items-center">
                        <span className="text-gray-400 mr-2">
                            {isExpanded ? '点击收起' : '点击展开详情'}
                        </span>
                        <svg
                            className={`w-6 h-6 text-[#FF66AA] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {/* 基本信息预览 */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <div className="text-gray-400 text-sm">比赛ID</div>
                        <div className="text-white font-mono">{matchData.match.id}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-gray-400 text-sm">开始时间</div>
                        <div className="text-white text-sm">
                            {new Date(matchData.match.start_time).toLocaleString('zh-CN')}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-gray-400 text-sm">状态</div>
                        <div className="text-green-400 text-sm">✅ 数据已加载</div>
                    </div>
                </div>
            </div>

            {/* 展开的详细内容 */}
            <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="mt-4 bg-[#1A1A1A] rounded-lg border border-gray-700">
                    {/* 游戏列表 */}
                    <div className="p-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center">
                            🎮 比赛详情
                        </h3>

                        {/* 检查是否有游戏数据 */}
                        {(!matchData.games || matchData.games.length === 0) ? (
                            <div className="text-center py-12">
                                <div className="bg-yellow-900/50 border border-yellow-500 rounded-lg p-6">
                                    <div className="text-4xl mb-4">⚠️</div>
                                    <h4 className="text-yellow-400 font-bold text-lg mb-2">缺少比赛游戏数据</h4>
                                    <p className="text-gray-300 mb-4">
                                        当前数据中没有比赛游戏信息。请使用比赛ID重新获取完整数据。
                                    </p>
                                    <div className="text-sm text-gray-400">
                                        <p>• 比赛ID: {matchData.match.id}</p>
                                        <p>• 玩家数量: {(matchData.users || []).length} 位</p>
                                        <p>• 事件数量: {(matchData.events || []).length} 个</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* 游戏卡片网格 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {(matchData.games || []).map((game, index) => (
                                        <div
                                            key={game.id}
                                            className={`bg-[#2A2A2A] rounded-lg p-4 border cursor-pointer transition-all duration-200 hover:border-[#FF66AA] ${selectedGameIndex === index ? 'border-[#FF66AA] bg-[#FF66AA]/10' : 'border-gray-600'
                                                }`}
                                            onClick={() => setSelectedGameIndex(selectedGameIndex === index ? null : index)}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center">
                                                    <div className="bg-[#FF66AA] text-white text-sm font-bold px-2 py-1 rounded">
                                                        Game #{index + 1}
                                                    </div>
                                                    <div className="ml-2 text-gray-400 text-sm">
                                                        {game.scores ? `${game.scores.length} 分数` : '无分数'}
                                                    </div>
                                                </div>
                                                <svg
                                                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${selectedGameIndex === index ? 'rotate-180' : ''
                                                        }`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>

                                            {/* 歌曲信息 */}
                                            <div className="space-y-2 mb-3">
                                                <div className="text-white font-semibold text-sm">
                                                    {(game.beatmap as any)?.artist_unicode || game.beatmap?.artist} - {(game.beatmap as any)?.title_unicode || game.beatmap?.title}
                                                </div>
                                                <div className="text-gray-400 text-xs">
                                                    [{game.beatmap?.difficulty_name}]
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-500">
                                                        {game.beatmap?.version} • {game.mods?.join('') || 'NM'}
                                                    </span>
                                                    <span className="text-blue-400">
                                                        ⭐ {(game.beatmap as any)?.difficulty_rating?.toFixed(2) || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* 时间信息 */}
                                            <div className="border-t border-gray-600 pt-2 mb-3">
                                                <div className="flex justify-between text-xs text-gray-400">
                                                    <span>开始: {new Date(game.start_time).toLocaleTimeString('zh-CN')}</span>
                                                    <span>结束: {new Date(game.end_time).toLocaleTimeString('zh-CN')}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    时长: {Math.round((new Date(game.end_time).getTime() - new Date(game.start_time).getTime()) / 1000 / 60)} 分钟
                                                </div>
                                            </div>

                                            {/* 分数统计预览 */}
                                            {game.scores && game.scores.length > 0 && (
                                                <div className="border-t border-gray-600 pt-3">
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div>
                                                            <div className="text-gray-400">最高分</div>
                                                            <div className="text-white font-mono text-sm">
                                                                {Math.max(...game.scores.map(s => s.score)).toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-gray-400">平均分</div>
                                                            <div className="text-white font-mono text-sm">
                                                                {Math.round(game.scores.reduce((sum, s) => sum + s.score, 0) / game.scores.length).toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-gray-400">最高准确率</div>
                                                            <div className="text-green-400 font-mono text-sm">
                                                                {(Math.max(...game.scores.map(s => s.accuracy)) * 100).toFixed(2)}%
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-gray-400">完成人数</div>
                                                            <div className="text-blue-400 font-mono text-sm">
                                                                {game.scores.filter(s => (s as any).passed || (s as any).pass).length}/{game.scores.length}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* 选中游戏的详细分数 */}
                                {selectedGameIndex !== null && matchData.games && matchData.games[selectedGameIndex] && (
                                    <div className="mt-6 bg-[#0A0A0A] rounded-lg p-6 border border-gray-600">
                                        <h4 className="text-lg font-bold mb-4 flex items-center">
                                            📊 Game {selectedGameIndex + 1}: {(matchData.games[selectedGameIndex].beatmap as any)?.artist_unicode || matchData.games[selectedGameIndex].beatmap?.artist} - {(matchData.games[selectedGameIndex].beatmap as any)?.title_unicode || matchData.games[selectedGameIndex].beatmap?.title}
                                        </h4>

                                        {/* 游戏信息概览 */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-[#2A2A2A] rounded-lg">
                                            <div>
                                                <div className="text-gray-400 text-xs">难度星级</div>
                                                <div className="text-white font-semibold">
                                                    ⭐ {((matchData.games[selectedGameIndex].beatmap as any)?.difficulty_rating)?.toFixed(2) || 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-gray-400 text-xs">游戏模式</div>
                                                <div className="text-white font-semibold">
                                                    {matchData.games[selectedGameIndex].scoring_type || 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-gray-400 text-xs">参与人数</div>
                                                <div className="text-white font-semibold">
                                                    {matchData.games[selectedGameIndex].scores?.length || 0} 人
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-gray-400 text-xs">游戏时长</div>
                                                <div className="text-white font-semibold">
                                                    {Math.round((new Date(matchData.games[selectedGameIndex].end_time).getTime() - new Date(matchData.games[selectedGameIndex].start_time).getTime()) / 1000 / 60)} 分钟
                                                </div>
                                            </div>
                                        </div>

                                        {/* 详细分数表格 - 替换为比赛结果展示 */}
                                        <div className="mt-6">
                                            {/* 比赛结果卡片 */}
                                            <div className="rounded-xl shadow-2xl bg-[#1A1A1A]">
                                                {/* 内容层 */}
                                                <div className="p-8">
                                                    {/* 歌曲信息头部 */}
                                                    <div className="text-center mb-8">
                                                        <div
                                                            className="relative overflow-hidden rounded-lg p-6 mx-auto max-w-2xl bg-cover bg-center bg-no-repeat"
                                                            style={{
                                                                backgroundImage: `url('https://assets.ppy.sh/beatmaps/${matchData.games[selectedGameIndex].beatmap?.beatmapset_id}/covers/cover@2x.jpg')`
                                                            }}
                                                        >
                                                            {/* 半透明遮罩确保文字清晰 */}
                                                            <div className="absolute inset-0 bg-black/50"></div>
                                                            <div className="relative z-10">
                                                                <h2 className="text-3xl font-bold text-white mb-2">
                                                                    {(matchData.games[selectedGameIndex].beatmap as any)?.title_unicode || matchData.games[selectedGameIndex].beatmap?.title}
                                                                </h2>
                                                                <p className="text-xl text-gray-200 mb-4">
                                                                    by {(matchData.games[selectedGameIndex].beatmap as any)?.artist_unicode || matchData.games[selectedGameIndex].beatmap?.artist}
                                                                </p>

                                                                {/* 详细信息网格 */}
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/30 rounded-lg p-4">
                                                                    <div className="text-center">
                                                                        <div className="text-gray-300 text-sm">难度</div>
                                                                        <div className="text-white font-semibold">
                                                                            {(matchData.games[selectedGameIndex].beatmap as any)?.version || matchData.games[selectedGameIndex].beatmap?.difficulty_name}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="text-gray-300 text-sm">星级</div>
                                                                        <div className="text-yellow-400 font-semibold">
                                                                            ⭐ {((matchData.games[selectedGameIndex].beatmap as any)?.difficulty_rating)?.toFixed(2) || 'N/A'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="text-gray-300 text-sm">BPM</div>
                                                                        <div className="text-green-400 font-semibold">
                                                                            {(matchData.games[selectedGameIndex].beatmap as any)?.bpm || 'N/A'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="text-gray-300 text-sm">时长</div>
                                                                        <div className="text-blue-400 font-semibold">
                                                                            {Math.floor(((matchData.games[selectedGameIndex].beatmap as any)?.total_length || 0) / 60)}:{String(((matchData.games[selectedGameIndex].beatmap as any)?.total_length || 0) % 60).padStart(2, '0')}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="text-gray-300 text-sm">CS</div>
                                                                        <div className="text-purple-400 font-semibold">
                                                                            {((matchData.games[selectedGameIndex].beatmap as any)?.cs)?.toFixed(1) || 'N/A'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="text-gray-300 text-sm">AR</div>
                                                                        <div className="text-red-400 font-semibold">
                                                                            {((matchData.games[selectedGameIndex].beatmap as any)?.ar)?.toFixed(1) || 'N/A'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="text-gray-300 text-sm">OD</div>
                                                                        <div className="text-orange-400 font-semibold">
                                                                            {((matchData.games[selectedGameIndex].beatmap as any)?.accuracy)?.toFixed(1) || 'N/A'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="text-gray-300 text-sm">HP</div>
                                                                        <div className="text-pink-400 font-semibold">
                                                                            {((matchData.games[selectedGameIndex].beatmap as any)?.drain)?.toFixed(1) || 'N/A'}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-4 text-center">
                                                                    <span className="text-gray-400 text-sm">
                                                                        Game {selectedGameIndex + 1} • {matchData.games[selectedGameIndex].scoring_type || 'Score V2'}
                                                                    </span>
                                                                    {matchData.games[selectedGameIndex].mods && matchData.games[selectedGameIndex].mods.length > 0 && (
                                                                        <span className="ml-3 bg-[#FF66AA] text-white text-sm px-3 py-1 rounded">
                                                                            +{matchData.games[selectedGameIndex].mods.join('')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 队伍胜负结果 */}
                                                    {(() => {
                                                        const scores = matchData.games[selectedGameIndex].scores || [];
                                                        const redTeamScores = scores.filter(s => {
                                                            const user = matchData.users?.find(u => u.id === s.user_id);
                                                            return user?.country_code === 'CN'; // 中国为红队
                                                        });
                                                        const blueTeamScores = scores.filter(s => {
                                                            const user = matchData.users?.find(u => u.id === s.user_id);
                                                            return user?.country_code !== 'CN'; // 其他国家为蓝队
                                                        });

                                                        const redTeamTotal = redTeamScores.reduce((sum, s) => sum + s.score, 0);
                                                        const blueTeamTotal = blueTeamScores.reduce((sum, s) => sum + s.score, 0);
                                                        const redWins = redTeamTotal > blueTeamTotal;

                                                        return (
                                                            <div className="flex justify-center mb-8">
                                                                <div className="bg-[#2A2A2A] rounded-xl p-6 flex items-center gap-8">
                                                                    {/* 红队 */}
                                                                    <div className={`text-center p-6 rounded-lg ${redWins ? 'bg-red-600/80' : 'bg-red-900/40'} transition-all`}>
                                                                        <div className="text-2xl font-bold text-white mb-2">🇨🇳 中国队</div>
                                                                        <div className="text-3xl font-mono text-white font-bold">
                                                                            {redTeamTotal.toLocaleString()}
                                                                        </div>
                                                                        {redWins && <div className="text-yellow-400 text-xl mt-2">👑 WINNER</div>}
                                                                    </div>

                                                                    <div className="text-4xl text-white font-bold">VS</div>

                                                                    {/* 蓝队 */}
                                                                    <div className={`text-center p-6 rounded-lg ${!redWins ? 'bg-blue-600/80' : 'bg-blue-900/40'} transition-all`}>
                                                                        <div className="text-2xl font-bold text-white mb-2">🇬🇧 英国队</div>
                                                                        <div className="text-3xl font-mono text-white font-bold">
                                                                            {blueTeamTotal.toLocaleString()}
                                                                        </div>
                                                                        {!redWins && <div className="text-yellow-400 text-xl mt-2">👑 WINNER</div>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* 选手成绩 - 竖直排版 */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        {/* 红队选手 */}
                                                        <div className="bg-red-900/30 rounded-xl p-6 border border-red-500/30">
                                                            <h3 className="text-xl font-bold text-red-400 mb-4 text-center">🇨🇳 中国队选手</h3>
                                                            <div className="space-y-4">
                                                                {((matchData.games[selectedGameIndex].scores || [])
                                                                    .filter(s => {
                                                                        const user = matchData.users?.find(u => u.id === s.user_id);
                                                                        return user?.country_code === 'CN';
                                                                    })
                                                                    .sort((a, b) => b.score - a.score)
                                                                ).map((score, index) => {
                                                                    const user = matchData.users?.find(u => u.id === score.user_id);
                                                                    return (
                                                                        <div key={score.user_id} className="bg-black/40 rounded-lg p-4">
                                                                            <div className="flex items-center mb-3">
                                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${index === 0 ? 'bg-yellow-500 text-black' :
                                                                                    index === 1 ? 'bg-gray-400 text-black' :
                                                                                        'bg-red-600 text-white'
                                                                                    }`}>
                                                                                    {index + 1}
                                                                                </div>
                                                                                <img
                                                                                    src={user?.avatar_url || '/default-avatar.png'}
                                                                                    alt={user?.username || 'Unknown'}
                                                                                    className="w-10 h-10 rounded-full mr-3"
                                                                                />
                                                                                <div className="flex-1">
                                                                                    <div className="text-white font-semibold text-lg">
                                                                                        {user?.username || 'Unknown'}
                                                                                    </div>
                                                                                    <div className="text-red-300 text-sm">
                                                                                        {user?.country_code || 'N/A'}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                                <div>
                                                                                    <div className="text-gray-400">分数</div>
                                                                                    <div className="text-white font-mono text-lg">
                                                                                        {score.score.toLocaleString()}
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-gray-400">准确率</div>
                                                                                    <div className="text-green-400 font-mono text-lg">
                                                                                        {(score.accuracy * 100).toFixed(2)}%
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-gray-400">最大连击</div>
                                                                                    <div className="text-yellow-400 font-mono">
                                                                                        {score.max_combo || 0}x
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-gray-400">等级</div>
                                                                                    <div className="flex items-center">
                                                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${(score as any).rank === 'SS' || (score as any).rank === 'SSH' ? 'bg-yellow-500 text-black' :
                                                                                            (score as any).rank === 'S' || (score as any).rank === 'SH' ? 'bg-yellow-600 text-white' :
                                                                                                (score as any).rank === 'A' ? 'bg-green-500 text-white' :
                                                                                                    'bg-gray-500 text-white'
                                                                                            }`}>
                                                                                            {(score as any).rank || 'N/A'}
                                                                                        </span>
                                                                                        {score.mods && score.mods.length > 0 && (
                                                                                            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                                                                                +{score.mods.join('')}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="mt-3 pt-3 border-t border-red-500/30">
                                                                                <div className="text-xs text-gray-400 mb-1">统计</div>
                                                                                <div className="text-xs space-x-2">
                                                                                    <span className="text-blue-400">300: {score.statistics?.count_300 || 0}</span>
                                                                                    <span className="text-green-400">100: {score.statistics?.count_100 || 0}</span>
                                                                                    <span className="text-yellow-400">50: {score.statistics?.count_50 || 0}</span>
                                                                                    <span className="text-red-400">Miss: {score.statistics?.count_miss || 0}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* 蓝队选手 */}
                                                        <div className="bg-blue-900/30 rounded-xl p-6 border border-blue-500/30">
                                                            <h3 className="text-xl font-bold text-blue-400 mb-4 text-center">🇬🇧 英国队选手</h3>
                                                            <div className="space-y-4">
                                                                {((matchData.games[selectedGameIndex].scores || [])
                                                                    .filter(s => {
                                                                        const user = matchData.users?.find(u => u.id === s.user_id);
                                                                        return user?.country_code !== 'CN';
                                                                    })
                                                                    .sort((a, b) => b.score - a.score)
                                                                ).map((score, index) => {
                                                                    const user = matchData.users?.find(u => u.id === score.user_id);
                                                                    return (
                                                                        <div key={score.user_id} className="bg-black/40 rounded-lg p-4">
                                                                            <div className="flex items-center mb-3">
                                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${index === 0 ? 'bg-yellow-500 text-black' :
                                                                                    index === 1 ? 'bg-gray-400 text-black' :
                                                                                        'bg-blue-600 text-white'
                                                                                    }`}>
                                                                                    {index + 1}
                                                                                </div>
                                                                                <img
                                                                                    src={user?.avatar_url || '/default-avatar.png'}
                                                                                    alt={user?.username || 'Unknown'}
                                                                                    className="w-10 h-10 rounded-full mr-3"
                                                                                />
                                                                                <div className="flex-1">
                                                                                    <div className="text-white font-semibold text-lg">
                                                                                        {user?.username || 'Unknown'}
                                                                                    </div>
                                                                                    <div className="text-blue-300 text-sm">
                                                                                        {user?.country_code || 'N/A'}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                                <div>
                                                                                    <div className="text-gray-400">分数</div>
                                                                                    <div className="text-white font-mono text-lg">
                                                                                        {score.score.toLocaleString()}
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-gray-400">准确率</div>
                                                                                    <div className="text-green-400 font-mono text-lg">
                                                                                        {(score.accuracy * 100).toFixed(2)}%
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-gray-400">最大连击</div>
                                                                                    <div className="text-yellow-400 font-mono">
                                                                                        {score.max_combo || 0}x
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-gray-400">等级</div>
                                                                                    <div className="flex items-center">
                                                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${(score as any).rank === 'SS' || (score as any).rank === 'SSH' ? 'bg-yellow-500 text-black' :
                                                                                            (score as any).rank === 'S' || (score as any).rank === 'SH' ? 'bg-yellow-600 text-white' :
                                                                                                (score as any).rank === 'A' ? 'bg-green-500 text-white' :
                                                                                                    'bg-gray-500 text-white'
                                                                                            }`}>
                                                                                            {(score as any).rank || 'N/A'}
                                                                                        </span>
                                                                                        {score.mods && score.mods.length > 0 && (
                                                                                            <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                                                                                +{score.mods.join('')}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="mt-3 pt-3 border-t border-blue-500/30">
                                                                                <div className="text-xs text-gray-400 mb-1">统计</div>
                                                                                <div className="text-xs space-x-2">
                                                                                    <span className="text-blue-400">300: {score.statistics?.count_300 || 0}</span>
                                                                                    <span className="text-green-400">100: {score.statistics?.count_100 || 0}</span>
                                                                                    <span className="text-yellow-400">50: {score.statistics?.count_50 || 0}</span>
                                                                                    <span className="text-red-400">Miss: {score.statistics?.count_miss || 0}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
