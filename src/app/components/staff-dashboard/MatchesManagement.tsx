'use client';

import { Match } from './types';

interface MatchesManagementProps {
    matches: Match[];
    onEditMatch: (match: Match) => void;
    getStatusColor: (status: string) => string;
    getStatusText: (status: string) => string;
}

export default function MatchesManagement({ matches, onEditMatch, getStatusColor, getStatusText }: MatchesManagementProps) {
    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">比赛管理</h2>

            {matches.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-400">暂无比赛数据</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {matches.map((match) => (
                        <div key={match.id} className="bg-gray-700 p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-lg font-medium text-white">
                                        {match.round} - {match.matchNumber}
                                    </h3>
                                    <p className="text-gray-300 text-sm">
                                        {match.date} {match.time}
                                    </p>
                                    <p className="text-gray-400 text-sm">
                                        对阵: {match.player1Name || '待定'} vs {match.player2Name || '待定'}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                                        {getStatusText(match.status)}
                                    </span>
                                    <button
                                        onClick={() => onEditMatch(match)}
                                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                                    >
                                        编辑
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-400">裁判员:</span>
                                    <span className="text-white ml-2">{match.referee || '未分配'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">直播员:</span>
                                    <span className="text-white ml-2">{match.streamer || '未分配'}</span>
                                </div>
                            </div>

                            {match.status === 'completed' && (match.redScore !== undefined || match.blueScore !== undefined) && (
                                <div className="mt-3 p-3 bg-gray-600 rounded">
                                    <p className="text-white text-sm">
                                        比分: {match.redScore || 0} - {match.blueScore || 0}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}