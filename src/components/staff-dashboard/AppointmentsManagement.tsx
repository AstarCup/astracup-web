import React from 'react';
import { Appointment, Match } from './types';

interface AppointmentsManagementProps {
    appointments: Appointment[];
    matches: Match[];
    loading: boolean;
    onApproveAppointment: (appointmentId: number) => void;
    onRejectAppointment: (appointmentId: number) => void;
    onRefresh: () => void;
}

export const AppointmentsManagement: React.FC<AppointmentsManagementProps> = ({
    appointments,
    matches,
    loading,
    onApproveAppointment,
    onRejectAppointment,
    onRefresh
}) => {
    const getStatusColor = (status: Appointment['status']) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: Appointment['status']) => {
        switch (status) {
            case 'pending': return '待处理';
            case 'approved': return '已通过';
            case 'rejected': return '已拒绝';
            default: return '未知';
        }
    };

    const getMatchInfo = (matchId?: number) => {
        if (!matchId) return null;
        const match = matches.find(m => m.id === matchId);
        return match ? `${match.player1} vs ${match.player2} (${match.round})` : `比赛 #${matchId}`;
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">预约管理</h2>
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
                    {appointments.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400">暂无预约申请</p>
                        </div>
                    ) : (
                        appointments.map((appointment) => (
                            <div key={appointment.id} className="bg-gray-700 p-4 rounded-lg">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-2">
                                            <h3 className="text-lg font-medium text-white">{appointment.player_name}</h3>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                                                {getStatusText(appointment.status)}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 text-sm mb-2">
                                            申请时间: {new Date(appointment.requested_time).toLocaleString('zh-CN')}
                                        </p>
                                        {appointment.match_id && (
                                            <p className="text-gray-400 text-sm">
                                                关联比赛: {getMatchInfo(appointment.match_id)}
                                            </p>
                                        )}
                                        {appointment.notes && (
                                            <p className="text-gray-400 text-sm">
                                                备注: {appointment.notes}
                                            </p>
                                        )}
                                    </div>

                                    {appointment.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onApproveAppointment(appointment.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                            >
                                                通过
                                            </button>
                                            <button
                                                onClick={() => onRejectAppointment(appointment.id)}
                                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                            >
                                                拒绝
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};