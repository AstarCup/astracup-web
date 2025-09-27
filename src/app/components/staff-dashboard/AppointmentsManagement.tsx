'use client';

import { Appointment, Match } from './types';

interface AppointmentsManagementProps {
    appointments: Appointment[];
    matches: Match[];
    onUpdateAppointmentStatus: (appointmentId: string, status: string) => void;
    formatDateTime: (dateString: string | Date) => string;
    getStatusColor: (status: string) => string;
}

export default function AppointmentsManagement({
    appointments,
    matches,
    onUpdateAppointmentStatus,
    formatDateTime,
    getStatusColor
}: AppointmentsManagementProps) {
    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">预约管理</h2>

            {appointments.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-400">暂无预约申请</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map((appointment) => {
                        const match = matches.find(m => m.id === appointment.matchId);
                        return (
                            <div key={appointment.id} className="bg-gray-700 p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-lg font-medium text-white">
                                            {appointment.playerName} 挑战 {appointment.opponentName}
                                        </h3>
                                        {match && (
                                            <p className="text-gray-300 text-sm">
                                                比赛: {match.round} - {match.matchNumber} ({match.date} {match.time})
                                            </p>
                                        )}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                                        {appointment.status === 'pending' ? '等待确认' :
                                            appointment.status === 'accepted' ? '已接受' : '已拒绝'}
                                    </span>
                                </div>

                                <p className="text-gray-400 text-sm mb-3">
                                    申请时间: {formatDateTime(appointment.createdAt)}
                                </p>

                                {appointment.status === 'pending' && (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => onUpdateAppointmentStatus(appointment.id, 'accepted')}
                                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                                        >
                                            接受预约
                                        </button>
                                        <button
                                            onClick={() => onUpdateAppointmentStatus(appointment.id, 'rejected')}
                                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                                        >
                                            拒绝预约
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}