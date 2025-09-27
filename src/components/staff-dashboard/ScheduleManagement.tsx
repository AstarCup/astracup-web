import React, { useState } from 'react';
import { MatchRoom, PlayerMatchup, TournamentRegistration, StaffRoomAssignment, ApprovedPlayer } from './types';

interface ScheduleManagementProps {
    // 房间管理
    rooms: MatchRoom[];
    roomsLoading: boolean;
    onRefreshRooms: () => void;
    onCreateRoom: () => void;
    onDeleteRoom: (roomId: number) => void;

    // 对战管理
    matchups: PlayerMatchup[];
    matchupsLoading: boolean;
    approvedPlayers: ApprovedPlayer[];
    onRefreshMatchups: () => void;
    onCreateMatchup: () => void;
    onDeleteMatchup: (matchupId: number) => void;

    // 用户管理
    registrations: TournamentRegistration[];
    registrationsLoading: boolean;
    processingUser: string | null;
    onRefreshRegistrations: () => void;
    onApproveRegistration: (osuId: string, username: string) => void;
    onDeleteRegistration: (osuId: string, username: string) => void;

    // 直播分配
    staffAssignments: StaffRoomAssignment[];
    staffAssignmentsLoading: boolean;
    availableRooms: any[];
    availableRoomsLoading: boolean;
    onRefreshStaffAssignments: () => void;
    onAssignStaffToRoom: (staffId: number, roomId: number) => void;
    onRevokeStaffAssignment: (assignmentId: number) => void;

    // 权限
    schedulePermissions: {
        isAdmin: boolean;
        isReferee: boolean;
        isStreamer: boolean;
    };
}

type ScheduleTab = 'overview' | 'rooms' | 'matchups' | 'users' | 'streaming';

export const ScheduleManagement: React.FC<ScheduleManagementProps> = ({
    rooms,
    roomsLoading,
    onRefreshRooms,
    onCreateRoom,
    onDeleteRoom,
    matchups,
    matchupsLoading,
    approvedPlayers,
    onRefreshMatchups,
    onCreateMatchup,
    onDeleteMatchup,
    registrations,
    registrationsLoading,
    processingUser,
    onRefreshRegistrations,
    onApproveRegistration,
    onDeleteRegistration,
    staffAssignments,
    staffAssignmentsLoading,
    availableRooms,
    availableRoomsLoading,
    onRefreshStaffAssignments,
    onAssignStaffToRoom,
    onRevokeStaffAssignment,
    schedulePermissions
}) => {
    const [activeTab, setActiveTab] = useState<ScheduleTab>('overview');

    const tabs = [
        { id: 'overview' as ScheduleTab, label: '总览', alwaysShow: true },
        { id: 'rooms' as ScheduleTab, label: '房间管理', show: schedulePermissions.isAdmin },
        { id: 'matchups' as ScheduleTab, label: '对战管理', show: schedulePermissions.isAdmin },
        { id: 'users' as ScheduleTab, label: '用户管理', show: schedulePermissions.isAdmin },
        { id: 'streaming' as ScheduleTab, label: '直播分配', show: schedulePermissions.isAdmin || schedulePermissions.isReferee || schedulePermissions.isStreamer }
    ].filter(tab => tab.alwaysShow || tab.show);

    const getRoomStatusColor = (status: MatchRoom['status']) => {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-800';
            case 'occupied': return 'bg-blue-100 text-blue-800';
            case 'maintenance': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoomStatusText = (status: MatchRoom['status']) => {
        switch (status) {
            case 'available': return '可用';
            case 'occupied': return '占用中';
            case 'maintenance': return '维护中';
            default: return '未知';
        }
    };

    const getMatchupStatusColor = (status: PlayerMatchup['status']) => {
        switch (status) {
            case 'scheduled': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getMatchupStatusText = (status: PlayerMatchup['status']) => {
        switch (status) {
            case 'scheduled': return '已安排';
            case 'completed': return '已完成';
            case 'cancelled': return '已取消';
            default: return '未知';
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">赛程管理</h2>

            {/* 标签页导航 */}
            <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-[#F38181] text-white'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 总览标签页 */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-white mb-2">房间数量</h3>
                            <p className="text-2xl font-bold text-[#F38181]">{rooms.length}</p>
                        </div>
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-white mb-2">对战数量</h3>
                            <p className="text-2xl font-bold text-[#F38181]">{matchups.length}</p>
                        </div>
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-white mb-2">注册用户</h3>
                            <p className="text-2xl font-bold text-[#F38181]">{registrations.length}</p>
                        </div>
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <h3 className="text-lg font-medium text-white mb-2">工作人员分配</h3>
                            <p className="text-2xl font-bold text-[#F38181]">{staffAssignments.length}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 房间管理标签页 */}
            {activeTab === 'rooms' && schedulePermissions.isAdmin && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-white">房间管理</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={onCreateRoom}
                                className="bg-[#F38181] hover:bg-[#e57373] text-white px-4 py-2 rounded transition-colors"
                            >
                                创建房间
                            </button>
                            <button
                                onClick={onRefreshRooms}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                                disabled={roomsLoading}
                            >
                                {roomsLoading ? '刷新中...' : '刷新'}
                            </button>
                        </div>
                    </div>

                    {roomsLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F38181] mx-auto"></div>
                            <p className="text-gray-400 mt-2">加载中...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {rooms.map((room) => (
                                <div key={room.id} className="bg-gray-700 p-4 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="text-lg font-medium text-white">{room.name}</h4>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoomStatusColor(room.status)}`}>
                                                {getRoomStatusText(room.status)}
                                            </span>
                                            {room.current_match && (
                                                <p className="text-gray-400 text-sm mt-1">当前比赛: #{room.current_match}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => onDeleteRoom(room.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                        >
                                            删除
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 对战管理标签页 */}
            {activeTab === 'matchups' && schedulePermissions.isAdmin && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-white">对战管理</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={onCreateMatchup}
                                className="bg-[#F38181] hover:bg-[#e57373] text-white px-4 py-2 rounded transition-colors"
                            >
                                创建对战
                            </button>
                            <button
                                onClick={onRefreshMatchups}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                                disabled={matchupsLoading}
                            >
                                {matchupsLoading ? '刷新中...' : '刷新'}
                            </button>
                        </div>
                    </div>

                    {matchupsLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F38181] mx-auto"></div>
                            <p className="text-gray-400 mt-2">加载中...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {matchups.map((matchup) => (
                                <div key={matchup.id} className="bg-gray-700 p-4 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="text-lg font-medium text-white">
                                                {matchup.player1_name} vs {matchup.player2_name}
                                            </h4>
                                            <p className="text-gray-400 text-sm">轮次: {matchup.round}</p>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMatchupStatusColor(matchup.status)}`}>
                                                {getMatchupStatusText(matchup.status)}
                                            </span>
                                            {matchup.scheduled_time && (
                                                <p className="text-gray-400 text-sm mt-1">
                                                    比赛时间: {new Date(matchup.scheduled_time).toLocaleString('zh-CN')}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => onDeleteMatchup(matchup.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                        >
                                            删除
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 用户管理标签页 */}
            {activeTab === 'users' && schedulePermissions.isAdmin && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-white">用户注册管理</h3>
                        <button
                            onClick={onRefreshRegistrations}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                            disabled={registrationsLoading}
                        >
                            {registrationsLoading ? '刷新中...' : '刷新'}
                        </button>
                    </div>

                    {registrationsLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F38181] mx-auto"></div>
                            <p className="text-gray-400 mt-2">加载中...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {registrations.map((registration) => (
                                <div key={registration.id} className="bg-gray-700 p-4 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="text-lg font-medium text-white">{registration.osu_username || `用户 ${registration.player_id}`}</h4>
                                            <p className="text-gray-400 text-sm">Discord: {registration.discord_username || '未设置'}</p>
                                            <p className="text-gray-400 text-sm">
                                                注册时间: {new Date(registration.registration_time).toLocaleString('zh-CN')}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onApproveRegistration(registration.player_id.toString(), registration.osu_username || `用户 ${registration.player_id}`)}
                                                disabled={processingUser === registration.player_id.toString()}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                                            >
                                                {processingUser === registration.player_id.toString() ? '处理中...' : '通过'}
                                            </button>
                                            <button
                                                onClick={() => onDeleteRegistration(registration.player_id.toString(), registration.osu_username || `用户 ${registration.player_id}`)}
                                                disabled={processingUser === registration.player_id.toString()}
                                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                                            >
                                                {processingUser === registration.player_id.toString() ? '处理中...' : '删除'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 直播分配标签页 */}
            {activeTab === 'streaming' && (schedulePermissions.isAdmin || schedulePermissions.isReferee || schedulePermissions.isStreamer) && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-white">直播分配管理</h3>
                        <button
                            onClick={onRefreshStaffAssignments}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                            disabled={staffAssignmentsLoading}
                        >
                            {staffAssignmentsLoading ? '刷新中...' : '刷新'}
                        </button>
                    </div>

                    {staffAssignmentsLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F38181] mx-auto"></div>
                            <p className="text-gray-400 mt-2">加载中...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {staffAssignments.map((assignment) => (
                                <div key={`${assignment.staff_id}-${assignment.room_id}`} className="bg-gray-700 p-4 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="text-lg font-medium text-white">工作人员 #{assignment.staff_id}</h4>
                                            <p className="text-gray-400 text-sm">分配房间: #{assignment.room_id}</p>
                                            <p className="text-gray-400 text-sm">
                                                分配时间: {new Date(assignment.assignment_time).toLocaleString('zh-CN')}
                                            </p>
                                        </div>
                                        {schedulePermissions.isAdmin && (
                                            <button
                                                onClick={() => onRevokeStaffAssignment(assignment.staff_id)}
                                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                            >
                                                撤销分配
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};