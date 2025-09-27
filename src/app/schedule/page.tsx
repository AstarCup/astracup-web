'use client';

import { useState, useEffect } from 'react';
import ScheduleTable from "@/app/components/ui/ScheduleTable";
import { MatchSchedule, StaffRoomAssignment } from '@/lib/mysql-registrations';

interface ScheduleItem {
    round: string;
    date: string;
    time: string;
    match: string;
    players: string;
    player1Score: string;
    player2Score: string;
    status: string;
    liveUrl?: string;
    roomUrl?: string;
    referee?: string;  // 裁判员
    streamer?: string; // 直播员
    commentator?: string; // 解说员
}

export default function Schedule() {
    const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMatchSchedules();
    }, []);

    const fetchMatchSchedules = async () => {
        try {
            setLoading(true);
            const [matchSchedulesResponse, staffAssignmentsResponse] = await Promise.all([
                fetch('/api/match-schedules'),
                fetch('/api/staff-room-assignments')
            ]);

            const matchSchedulesData = await matchSchedulesResponse.json();
            const staffAssignmentsData = await staffAssignmentsResponse.json();

            if (matchSchedulesData.success) {
                const convertedData = convertMatchSchedulesToScheduleItems(
                    matchSchedulesData.schedules,
                    staffAssignmentsData.assignments || []
                );
                setScheduleData(convertedData);
            } else {
                setError(matchSchedulesData.error || '获取赛程数据失败');
            }
        } catch (err) {
            setError('网络错误，请稍后重试');
            console.error('Error fetching match schedules:', err);
        } finally {
            setLoading(false);
        }
    };

    const convertMatchSchedulesToScheduleItems = (schedules: MatchSchedule[], staffAssignments: StaffRoomAssignment[]): ScheduleItem[] => {
        return schedules.map(schedule => {
            // 获取该房间的staff分配
            const roomStaff = staffAssignments.filter(assignment => assignment.room_id === schedule.room_id);

            // 按角色分组staff
            const referees = roomStaff.filter(s => s.staff_role === 'referee').map(s => s.staff_username);
            const streamers = roomStaff.filter(s => s.staff_role === 'streamer').map(s => s.staff_username);
            const commentators = roomStaff.filter(s => s.staff_role === 'commentator').map(s => s.staff_username);

            return {
                round: schedule.room ? `第${schedule.room.round_number}轮` : '未知轮次',
                date: schedule.room ? schedule.room.match_date : '',
                time: schedule.room ? schedule.room.match_time : '',
                match: schedule.room ? `${schedule.room.room_name} 第${schedule.room.match_number}场` : '未知比赛',
                players: `${schedule.player1_username || '未知选手'} vs ${schedule.player2_username || '未知选手'}`,
                player1Score: schedule.red_score !== null && schedule.red_score !== undefined ? schedule.red_score.toString() : '-',
                player2Score: schedule.blue_score !== null && schedule.blue_score !== undefined ? schedule.blue_score.toString() : '-',
                player1Avatar: schedule.player1_avatar_url,
                player2Avatar: schedule.player2_avatar_url,
                status: getStatusText(schedule.status),
                liveUrl: schedule.replay_link || undefined,
                roomUrl: schedule.match_link || undefined,
                referee: referees.length > 0 ? referees.join(', ') : undefined,
                streamer: streamers.length > 0 ? streamers.join(', ') : undefined,
                commentator: commentators.length > 0 ? commentators.join(', ') : undefined,
            };
        });
    };

    const getStatusText = (status: string): string => {
        switch (status) {
            case 'pending':
                return '未开始';
            case 'confirmed':
                return '已确认';
            case 'completed':
                return '已完成';
            case 'cancelled':
                return '已取消';
            default:
                return '未知状态';
        }
    };

    if (loading) {
        return (
            <div className="max-w-9xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6 text-white">赛程安排</h1>
                <div className="text-white">加载中...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-9xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6 text-white">赛程安排</h1>
                <div className="text-red-400">错误: {error}</div>
            </div>
        );
    }

    return (
        <div className="max-w-9xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-white">赛程安排</h1>

            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-white">比赛时间表</h2>
                <div className="overflow-x-auto">
                    <ScheduleTable schedule={scheduleData} />
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-semibold mb-4 text-white">比赛对阵表</h2>

                <iframe src="https://challonge.com/zh_CN/MWC4K2025/module" width="100%" height="800"></iframe>
            </div>
        </div>
    );
}
