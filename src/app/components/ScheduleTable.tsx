interface ScheduleItem {
    round: string;
    date: string;
    time: string;
    match: string;
    players: string;
    player1Score: string;
    player2Score: string;
    status: string;
    liveUrl?: string;  // 直播间地址
    roomUrl?: string;  // 比赛房间地址
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

    return (
        <div className="overflow-x-auto">
            <table className="min-w-[1400px] bg-white">
                <thead>
                    <tr className="bg-gray-50 text-center">
                        <th className="px-6 py-4 text-left text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            轮次
                        </th>
                        <th className="px-6 py-4 text-left text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            日期
                        </th>
                        <th className="px-6 py-4 text-left text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            时间
                        </th>
                        <th className="px-6 py-4 text-left text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            比赛场次
                        </th>
                        <th className="px-6 py-4 text-left text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            选手
                        </th>
                        <th className="px-6 py-4 text-center text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            红方分数
                        </th>
                        <th className="px-6 py-4 text-center text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            蓝方分数
                        </th>
                        <th className="px-6 py-4 text-center text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            状态
                        </th>
                        <th className="px-6 py-4 text-center text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            直播链接
                        </th>
                        <th className="px-6 py-4 text-center text-2xs font-medium text-gray-500 uppercase tracking-wider">
                            比赛链接
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
                                {item.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.time}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.match}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.players}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center font-medium">
                                {item.player1Score}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center font-medium">
                                {item.player2Score}
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
                                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                                    >
                                        LiveLink
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
                                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                                    >
                                        MatchLink
                                    </a>
                                ) : (
                                    <span className="text-gray-400 text-xs">暂无</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
