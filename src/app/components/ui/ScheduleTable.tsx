import Image from 'next/image';

interface ScheduleItem {
    round: string;
    date: string;
    time: string;
    match: string;
    players: string;
    player1Score: string;
    player2Score: string;
    player1Avatar?: string;
    player2Avatar?: string;
    status: string;
    liveUrl?: string;  // 直播间地址
    roomUrl?: string;  // 比赛房间地址
    referee?: string;  // 裁判员
    streamer?: string; // 直播员
    commentator?: string; // 解说员
}

interface ScheduleTableProps {
    schedule: ScheduleItem[];
}

export default function ScheduleTable({ schedule }: ScheduleTableProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case '已完成':
                return 'bg-green-100 text-green-800';
            case '进行中':
                return 'bg-blue-100 text-blue-800';
            case '未开始':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDateTime = (dateString: string, timeString: string) => {
        try {
            // 如果date是ISO格式，提取日期部分
            const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
            // 组合日期和时间
            const dateTimeString = `${datePart}T${timeString}`;
            return new Date(dateTimeString).toLocaleString('zh-CN');
        } catch (error) {
            console.error('日期时间格式化错误:', error, dateString, timeString);
            return `${dateString} ${timeString}`;
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-[1300px] bg-white">
                <thead>
                    <tr className="bg-gray-50 text-center">
                        <th className="px-6 py-4 text-left text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            轮次
                        </th>
                        <th className="px-6 py-4 text-left text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            日期时间
                        </th>
                        <th className="px-6 py-4 text-left text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            比赛场次
                        </th>
                        <th className="px-6 py-4 text-center text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            对阵
                        </th>
                        <th className="px-6 py-4 text-center text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            状态
                        </th>
                        <th className="px-6 py-4 text-center text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            直播回放链接
                        </th>
                        <th className="px-6 py-4 text-center text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            比赛链接
                        </th>
                        <th className="px-6 py-4 text-center text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            裁判员
                        </th>
                        <th className="px-6 py-4 text-center text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            直播员
                        </th>
                        <th className="px-6 py-4 text-center text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            解说员
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {schedule.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors font-bold">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.round}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDateTime(item.date, item.time)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.match}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center space-x-4">
                                    {/* Player 1 */}
                                    <div className="flex items-center space-x-2">
                                        {item.player1Avatar ? (
                                            <Image
                                                src={item.player1Avatar}
                                                alt="Player 1 Avatar"
                                                width={32}
                                                height={32}
                                                className="w-8 h-8 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                                <span className="text-xs text-gray-600">?</span>
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-gray-900">
                                            {item.players.split(' vs ')[0] || '未知选手'}
                                        </span>
                                    </div>

                                    {/* Score */}
                                    <div className="flex items-center space-x-2 text-lg font-bold">
                                        <span className="text-red-600">{item.player1Score}</span>
                                        <span className="text-gray-400">:</span>
                                        <span className="text-blue-600">{item.player2Score}</span>
                                    </div>

                                    {/* Player 2 */}
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-900">
                                            {item.players.split(' vs ')[1] || '未知选手'}
                                        </span>
                                        {item.player2Avatar ? (
                                            <Image
                                                src={item.player2Avatar}
                                                alt="Player 2 Avatar"
                                                width={32}
                                                height={32}
                                                className="w-8 h-8 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                                <span className="text-xs text-gray-600">?</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold ${getStatusColor(item.status)}`}>
                                    {item.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                {item.liveUrl ? (
                                    <a
                                        href={item.liveUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-white transition-colors"
                                    >
                                        <Image src="/icons/bilibili-live-sm.svg" alt="BilibiliLive" width={48} height={48} />
                                    </a>
                                ) : (
                                    <span className="text-gray-400 text-xs">暂无</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                {item.roomUrl ? (
                                    <a
                                        href={item.roomUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-white transition-colors"
                                    >
                                        <Image src="/icons/osu-match-sm.svg" alt="osu" width={48} height={48} />
                                    </a>
                                ) : (
                                    <span className="text-gray-400 text-xs">暂无</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                {item.referee || <span className="text-gray-400 text-xs">暂无</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                {item.streamer || <span className="text-gray-400 text-xs">暂无</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                {item.commentator || <span className="text-gray-400 text-xs">暂无</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
