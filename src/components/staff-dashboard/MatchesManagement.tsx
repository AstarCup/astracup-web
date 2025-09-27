import React from 'react';
import { Match } from './types';

interface MatchesManagementProps {
    matches: Match[];
    loading: boolean;
    onEditMatch: (match: Match) => void;
    onRefresh: () => void;
}

export const MatchesManagement: React.FC<MatchesManagementProps> = ({
    matches,
    loading,
    onEditMatch,
    onRefresh
}) => {
    const getStatusColor = (status: Match['status']) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'ongoing':
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: Match['status']) => {
        switch (status) {
            case 'pending': return '待开始';
            case 'ongoing':
            case 'in_progress': return '进行中';
            case 'completed': return '已完成';
            case 'cancelled': return '已取消';
            default: return '未知';
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">比赛管理</h2>
                <button
                    onClick={onRefresh}
                    className="bg-[#F38181] hover:bg-[#e57373] text-white px-4 py-2 rounded transition-colors"
                    disabled={loading}
                >
                    {loading ? '刷新中...' : '刷新'}
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F38181] mx-auto"></div>
                    <p className="text-gray-400 mt-2">加载中...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {matches.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400">暂无比赛数据</p>
                        </div>
                    ) : (
                        matches.map((match) => (
                            <div key={match.id} className="bg-gray-700 p-4 rounded-lg">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-2">
                                            <h3 className="text-lg font-medium text-white">
                                                {match.player1} vs {match.player2}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                                                {getStatusText(match.status)}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 text-sm mb-2">轮次: {match.round}</p>
                                        <p className="text-gray-400 text-sm">
                                            比赛时间: {new Date(match.scheduled_time).toLocaleString('zh-CN')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onEditMatch(match)}
                                        className="bg-[#F38181] hover:bg-[#e57373] text-white px-3 py-1 rounded text-sm transition-colors"
                                    >
                                        编辑
                                    </button>
                                </div>

                                {(match.referee || match.streamer) && (
                                    <div className="flex gap-4 text-sm text-gray-300">
                                        {match.referee && <span>裁判: {match.referee}</span>}
                                        {match.streamer && <span>直播: {match.streamer}</span>}
                                    </div>
                                )}

                                {(match.stream_link || match.replay_link || match.match_link) && (
                                    <div className="flex gap-4 mt-2">
                                        {match.stream_link && (
                                            <a
                                                href={match.stream_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#F38181] hover:text-[#e57373] text-sm underline"
                                            >
                                                直播链接
                                            </a>
                                        )}
                                        {match.replay_link && (
                                            <a
                                                href={match.replay_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#F38181] hover:text-[#e57373] text-sm underline"
                                            >
                                                回放链接
                                            </a>
                                        )}
                                        {match.match_link && (
                                            <a
                                                href={match.match_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#F38181] hover:text-[#e57373] text-sm underline"
                                            >
                                                比赛链接
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};