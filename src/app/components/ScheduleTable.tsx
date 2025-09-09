interface ScheduleItem {
    round: string;
    date: string;
    time: string;
    match: string;
    players: string;
    player1Score: string;
    player2Score: string;
    status: string;
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
            <table className="min-w-[1200px] bg-white border border-gray-200">
                <thead>
                    <tr className="bg-gray-50 text-left p-6">
                        <th className="">
                            轮次
                        </th>
                        <th className="">
                            日期
                        </th>
                        <th className="">
                            时间
                        </th>
                        <th className="">
                            比赛场次
                        </th>
                        <th className="">
                            选手
                        </th>
                        <th>
                            选手1分数
                        </th>
                        <th>
                            选手2分数
                        </th>
                        <th className="">
                            状态
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {schedule.map((item, index) => (
                        <tr key={index} className="p-6 hover:bg-gray-50">
                            <td className="">
                                {item.round}
                            </td>
                            <td className="">
                                {item.date}
                            </td>
                            <td className="">
                                {item.time}
                            </td>
                            <td className="">
                                {item.match}
                            </td>
                            <td className="">
                                {item.players}
                            </td>
                            <td>{item.player1Score}</td>
                            <td>{item.player2Score}</td>
                            <td className="">
                                <span className={` text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                                    {item.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
