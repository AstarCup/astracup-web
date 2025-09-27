"use client";

import Image from 'next/image';
import { useState } from 'react';
import { UserSession } from '@/lib/permissions';
import { UserPermissions } from '@/lib/permissions';
import { StaffRoomAssignment, AvailableRoom } from './types';

interface StreamingManagementProps {
    user: UserSession;
    permissions: UserPermissions;
    staffAssignments: StaffRoomAssignment[];
    staffAssignmentsLoading: boolean;
    availableRooms: AvailableRoom[];
    availableRoomsLoading: boolean;
    onApplyForRoom: (roomId: number, role: 'referee' | 'streamer' | 'commentator') => void;
    onRevokeAssignment: (assignmentId: number, roleName: string) => void;
}

export default function StreamingManagement({
    user,
    permissions,
    staffAssignments,
    staffAssignmentsLoading,
    availableRooms,
    availableRoomsLoading,
    onApplyForRoom,
    onRevokeAssignment
}: StreamingManagementProps) {
    // 格式化日期时间函数 - 转换为东八区并显示年/月/日 时:分格式
    const formatDateTime = (dateTimeString: string) => {
        const date = new Date(dateTimeString);
        // 转换为东八区时间
        const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
        const cstTime = new Date(utcTime + (8 * 3600000));
        const year = cstTime.getFullYear();
        const month = String(cstTime.getMonth() + 1).padStart(2, '0');
        const day = String(cstTime.getDate()).padStart(2, '0');
        const hours = String(cstTime.getHours()).padStart(2, '0');
        const minutes = String(cstTime.getMinutes()).padStart(2, '0');
        return `${year}/${month}/${day} ${hours}:${minutes}`;
    };

    // 格式化日期和时间字符串 - 转换为东八区并显示年/月/日 时:分格式
    const formatDateTimeFromStrings = (dateString: string | undefined, timeString: string | undefined) => {
        if (!dateString) return '时间未定';

        let dateTimeString: string;

        // 检查dateString是否已经是完整的ISO字符串格式
        if (dateString.includes('T') && dateString.includes('Z')) {
            // 如果是完整的ISO字符串，直接使用
            dateTimeString = dateString;
        } else if (timeString) {
            // 如果是分别的日期和时间字段，组合它们
            dateTimeString = `${dateString}T${timeString}`;
        } else {
            // 如果只有日期字段，假设时间是00:00:00
            dateTimeString = `${dateString}T00:00:00.000Z`;
        }

        try {
            const date = new Date(dateTimeString);
            if (isNaN(date.getTime())) {
                return '时间格式错误';
            }

            // 转换为东八区时间
            const utcTime = date.getTime();
            const cstTime = new Date(utcTime + (8 * 3600000));
            const year = cstTime.getFullYear();
            const month = String(cstTime.getMonth() + 1).padStart(2, '0');
            const day = String(cstTime.getDate()).padStart(2, '0');
            const hours = String(cstTime.getHours()).padStart(2, '0');
            const minutes = String(cstTime.getMinutes()).padStart(2, '0');
            return `${year}/${month}/${day} ${hours}:${minutes}`;
        } catch (error) {
            console.error('日期格式化错误:', error, dateString, timeString);
            return '时间格式错误';
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                    {permissions.isAdmin ? 'Staff房间分配管理' : '直播裁判房间确认'}
                </h3>

                {staffAssignmentsLoading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E93B66]"></div>
                        <span className="ml-2 text-gray-400">加载中...</span>
                    </div>
                ) : permissions.isAdmin ? (
                    // 管理员视图 - 显示所有已确认的staff分配（从比赛预约表获取）
                    <div className="space-y-4">

                        {/* Staff分配列表 */}
                        {staffAssignments.length > 0 ? (
                            <div className="space-y-3">
                                {staffAssignments.map((assignment) => (
                                    <div key={assignment.id} className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-4 hover:border-[#E93B66] transition-colors duration-200">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center space-x-3">
                                                <Image
                                                    src={assignment.staff_avatar_url || '/unknow.svg'}
                                                    alt={`${assignment.staff_username} avatar`}
                                                    width={40}
                                                    height={40}
                                                    className="w-10 h-10 rounded-full"
                                                    onError={() => { }}
                                                />
                                                <div>
                                                    <h4 className="text-white font-semibold">{assignment.staff_username}</h4>
                                                    <p className="text-sm text-gray-400">ID: {assignment.staff_osuId}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${assignment.staff_role === 'referee' ? 'bg-blue-600 text-white' :
                                                    assignment.staff_role === 'streamer' ? 'bg-purple-600 text-white' :
                                                        'bg-green-600 text-white'
                                                    }`}>
                                                    {assignment.staff_role === 'referee' ? '裁判' :
                                                        assignment.staff_role === 'streamer' ? '直播' : '解说'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div className="text-sm text-gray-400">
                                                <span>房间: </span>
                                                <span className="text-white">
                                                    {assignment.room?.room_name || `房间 ${assignment.room_id}`}
                                                    (轮次 {assignment.room?.round_number}, 场次 {assignment.room?.match_number})
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className="text-xs text-gray-400">状态:</span>
                                                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">已确认</span>
                                            </div>
                                        </div>

                                        {/* 显示比赛信息 */}
                                        {assignment.match_info && (
                                            <div className="mt-2 space-y-2">
                                                <div className="text-sm text-gray-400">
                                                    <span>比赛: </span>
                                                    <span className="text-white">
                                                        {assignment.match_info.player1_username} vs {assignment.match_info.player2_username}
                                                    </span>
                                                    <span className="ml-4 text-xs">
                                                        {assignment.match_info.scheduled_time ? formatDateTime(assignment.match_info.scheduled_time) : '时间未定'}
                                                    </span>
                                                </div>

                                                {/* 比赛详细信息 */}
                                                <div className="text-xs text-gray-400 space-y-1">
                                                    {assignment.match_info.red_score !== undefined && assignment.match_info.blue_score !== undefined && (
                                                        <div>比分: <span className="text-white">{assignment.match_info.red_score} - {assignment.match_info.blue_score}</span></div>
                                                    )}
                                                    {assignment.match_info.match_link && (
                                                        <div>房间链接: <a href={assignment.match_info.match_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">点击进入</a></div>
                                                    )}
                                                    {assignment.match_info.stream_link && (
                                                        <div>直播链接: <a href={assignment.match_info.stream_link} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">观看直播</a></div>
                                                    )}
                                                    {assignment.match_info.replay_link && (
                                                        <div>回放链接: <a href={assignment.match_info.replay_link} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline">观看回放</a></div>
                                                    )}
                                                    <div>比赛状态: <span className={`px-2 py-1 rounded text-xs ${assignment.match_info.status === 'completed' ? 'bg-green-600 text-white' :
                                                        assignment.match_info.status === 'confirmed' ? 'bg-blue-600 text-white' :
                                                            assignment.match_info.status === 'cancelled' ? 'bg-red-600 text-white' :
                                                                'bg-yellow-600 text-white'
                                                        }`}>
                                                        {assignment.match_info.status === 'completed' ? '已完成' :
                                                            assignment.match_info.status === 'confirmed' ? '已确认' :
                                                                assignment.match_info.status === 'cancelled' ? '已取消' : '待定'}
                                                    </span></div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-2 text-xs text-gray-500">
                                            分配时间: {new Date(assignment.assigned_at).toLocaleString('zh-CN')}
                                            {assignment.responded_at && (
                                                <span className="ml-4">
                                                    响应时间: {new Date(assignment.responded_at).toLocaleString('zh-CN')}
                                                </span>
                                            )}
                                        </div>

                                        {/* 管理员操作按钮 */}
                                        <div className="mt-3 flex justify-end space-x-2">
                                            <button
                                                onClick={() => onRevokeAssignment(assignment.id, assignment.staff_role === 'referee' ? '裁判' : assignment.staff_role === 'streamer' ? '直播' : '解说')}
                                                className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-3 rounded transition-colors duration-200"
                                            >
                                                撤销分配
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <p>暂无Staff房间分配</p>
                            </div>
                        )}

                        {/* 管理员也可以申请加入房间 */}
                        <div className="mt-8 pt-6 border-t border-gray-600">
                            <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                                <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                                申请加入比赛房间 (直播员)
                            </h4>

                            {availableRoomsLoading ? (
                                <div className="flex justify-center items-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E93B66]"></div>
                                    <span className="ml-2 text-gray-400">加载房间中...</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {availableRooms.map((room) => {
                                        // 检查管理员是否已经申请了这个房间
                                        const adminApplication = staffAssignments.find(a =>
                                            a.staff_osuId === user.osuId &&
                                            a.room_id === room.id &&
                                            a.status === 'confirmed'
                                        );

                                        return (
                                            <div key={room.id} className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-4 hover:border-[#E93B66] transition-colors duration-200">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h5 className="text-white font-semibold text-sm truncate flex-1 mr-2">
                                                        {room.room_name}
                                                    </h5>
                                                    <span className={`px-2 py-1 rounded text-xs ${room.status === 'open' ? 'bg-green-600 text-white' :
                                                        room.status === 'in_progress' ? 'bg-yellow-600 text-white' :
                                                            'bg-red-600 text-white'
                                                        }`}>
                                                        {room.status === 'open' ? '开放' :
                                                            room.status === 'in_progress' ? '进行中' : '关闭'}
                                                    </span>
                                                </div>

                                                <div className="text-xs text-gray-400 space-y-1 mb-4">
                                                    <div>轮次: {room.round_number} | 场次: {room.match_number}</div>
                                                    <div>时间: {formatDateTimeFromStrings(room.match_date, room.match_time)}</div>
                                                    <div>选手: {room.player1_username || '待定'} vs {room.player2_username || '待定'}</div>
                                                </div>

                                                {/* Staff分配情况 */}
                                                <div className="mb-4">
                                                    {/* 裁判 */}
                                                    {(() => {
                                                        const referees = staffAssignments.filter(a => a.room_id === room.id && a.staff_role === 'referee' && a.status === 'confirmed');
                                                        return referees.length > 0 ? (
                                                            <div className="mb-2">
                                                                <div className="text-xs text-gray-400 mb-1">裁判 ({referees.length}人):</div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {referees.map(referee => (
                                                                        <div key={referee.id} className="flex items-center space-x-1 bg-blue-900/30 px-2 py-1 rounded">
                                                                            <Image
                                                                                src={referee.staff_avatar_url || '/unknow.svg'}
                                                                                alt={referee.staff_username}
                                                                                width={16} height={16} className="w-4 h-4 rounded-full"
                                                                                onError={() => { }} />
                                                                            <span className="text-xs text-white">{referee.staff_username}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-gray-400 mb-1">裁判: 0人</div>
                                                        );
                                                    })()}

                                                    {/* 解说 */}
                                                    {(() => {
                                                        const commentators = staffAssignments.filter(a => a.room_id === room.id && a.staff_role === 'commentator' && a.status === 'confirmed');
                                                        return commentators.length > 0 ? (
                                                            <div className="mb-2">
                                                                <div className="text-xs text-gray-400 mb-1">解说 ({commentators.length}人):</div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {commentators.map(commentator => (
                                                                        <div key={commentator.id} className="flex items-center space-x-1 bg-green-900/30 px-2 py-1 rounded">
                                                                            <Image
                                                                                src={commentator.staff_avatar_url || '/unknow.svg'}
                                                                                alt={commentator.staff_username}
                                                                                width={16} height={16} className="w-4 h-4 rounded-full"
                                                                                onError={() => { }} />
                                                                            <span className="text-xs text-white">{commentator.staff_username}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-gray-400 mb-1">解说: 0人</div>
                                                        );
                                                    })()}

                                                    {/* 直播 */}
                                                    {(() => {
                                                        const streamers = staffAssignments.filter(a => a.room_id === room.id && a.staff_role === 'streamer' && a.status === 'confirmed');
                                                        return streamers.length > 0 ? (
                                                            <div className="mb-2">
                                                                <div className="text-xs text-gray-400 mb-1">直播 ({streamers.length}人):</div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {streamers.map(streamer => (
                                                                        <div key={streamer.id} className="flex items-center space-x-1 bg-purple-900/30 px-2 py-1 rounded">
                                                                            <Image
                                                                                src={streamer.staff_avatar_url || '/unknow.svg'}
                                                                                alt={streamer.staff_username}
                                                                                width={16} height={16} className="w-4 h-4 rounded-full"
                                                                                onError={() => { }} />
                                                                            <span className="text-xs text-white">{streamer.staff_username}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-gray-400 mb-1">直播: 0人</div>
                                                        );
                                                    })()}
                                                </div>

                                                {room.description && (
                                                    <div className="text-xs text-gray-500 mb-4 line-clamp-2">
                                                        {room.description}
                                                    </div>
                                                )}

                                                {/* 申请按钮 - 管理员默认申请直播员 */}
                                                <div className="flex flex-col space-y-2">
                                                    {adminApplication ? (
                                                        <div className="text-xs text-green-400 text-center py-2">
                                                            已加入直播员
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => onApplyForRoom(room.id, 'streamer')}
                                                            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 px-4 rounded transition-colors duration-200"
                                                        >
                                                            申请直播员
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {!availableRoomsLoading && availableRooms.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    <p>暂无可申请的比赛房间</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // Staff视图 - 显示自己的申请和可参加的房间
                    <div className="space-y-6">
                        {/* 已参加的房间 */}
                        {staffAssignments.filter(a => a.staff_osuId === user.osuId && a.status === 'confirmed').length > 0 && (
                            <div>
                                <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                                    我已确认参加的房间
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                    {staffAssignments
                                        .filter(a => a.staff_osuId === user.osuId && a.status === 'confirmed')
                                        .map((assignment) => (
                                            <div key={assignment.id} className="bg-[#2d2d2d] border border-green-600 rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h5 className="text-white font-semibold text-sm truncate flex-1 mr-2">
                                                        {assignment.room?.room_name || `房间 ${assignment.room_id}`}
                                                    </h5>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${assignment.staff_role === 'referee' ? 'bg-blue-600 text-white' :
                                                        assignment.staff_role === 'streamer' ? 'bg-purple-600 text-white' :
                                                            'bg-green-600 text-white'
                                                        }`}>
                                                        {assignment.staff_role === 'referee' ? '裁判' :
                                                            assignment.staff_role === 'streamer' ? '直播' : '解说'}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-400 space-y-1">
                                                    <div>轮次: {assignment.room?.round_number} | 场次: {assignment.room?.match_number}</div>
                                                    <div>时间: {assignment.room?.match_date && assignment.room?.match_time ? formatDateTimeFromStrings(assignment.room.match_date, assignment.room.match_time) : '时间未定'}</div>
                                                </div>
                                                <div className="mt-3">
                                                    <button
                                                        onClick={() => onRevokeAssignment(assignment.id, assignment.staff_role === 'referee' ? '裁判' : assignment.staff_role === 'streamer' ? '直播' : '解说')}
                                                        className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-3 rounded transition-colors duration-200"
                                                    >
                                                        撤销分配
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* 可参加的房间 */}
                        <div>
                            <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                                <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                                可申请参加的比赛房间
                            </h4>

                            {availableRoomsLoading ? (
                                <div className="flex justify-center items-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E93B66]"></div>
                                    <span className="ml-2 text-gray-400">加载房间中...</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {availableRooms.map((room) => {
                                        // 检查用户是否已经申请了这个房间的某个角色
                                        const userApplication = staffAssignments.find(a =>
                                            a.staff_osuId === user.osuId &&
                                            a.room_id === room.id &&
                                            a.status === 'confirmed'
                                        );

                                        return (
                                            <div key={room.id} className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-4 hover:border-[#E93B66] transition-colors duration-200">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h5 className="text-white font-semibold text-sm truncate flex-1 mr-2">
                                                        {room.room_name}
                                                    </h5>
                                                    <span className={`px-2 py-1 rounded text-xs ${room.status === 'open' ? 'bg-green-600 text-white' :
                                                        room.status === 'in_progress' ? 'bg-yellow-600 text-white' :
                                                            'bg-red-600 text-white'
                                                        }`}>
                                                        {room.status === 'open' ? '开放' :
                                                            room.status === 'in_progress' ? '进行中' : '关闭'}
                                                    </span>
                                                </div>

                                                <div className="text-xs text-gray-400 space-y-1 mb-4">
                                                    <div>轮次: {room.round_number} | 场次: {room.match_number}</div>
                                                    <div>时间: {formatDateTimeFromStrings(room.match_date, room.match_time)}</div>
                                                    <div>选手: {room.player1_username || '待定'} vs {room.player2_username || '待定'}</div>
                                                </div>

                                                {/* Staff分配情况 */}
                                                <div className="mb-4">
                                                    {/* 裁判 */}
                                                    {(() => {
                                                        const referees = staffAssignments.filter(a => a.room_id === room.id && a.staff_role === 'referee' && a.status === 'confirmed');
                                                        return referees.length > 0 ? (
                                                            <div className="mb-2">
                                                                <div className="text-xs text-gray-400 mb-1">裁判 ({referees.length}人):</div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {referees.map(referee => (
                                                                        <div key={referee.id} className="flex items-center space-x-1 bg-blue-900/30 px-2 py-1 rounded">
                                                                            <Image
                                                                                src={referee.staff_avatar_url || '/unknow.svg'}
                                                                                alt={referee.staff_username}
                                                                                width={16} height={16} className="w-4 h-4 rounded-full"
                                                                                onError={() => { }} />
                                                                            <span className="text-xs text-white">{referee.staff_username}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-gray-400 mb-1">裁判: 0人</div>
                                                        );
                                                    })()}

                                                    {/* 解说 */}
                                                    {(() => {
                                                        const commentators = staffAssignments.filter(a => a.room_id === room.id && a.staff_role === 'commentator' && a.status === 'confirmed');
                                                        return commentators.length > 0 ? (
                                                            <div className="mb-2">
                                                                <div className="text-xs text-gray-400 mb-1">解说 ({commentators.length}人):</div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {commentators.map(commentator => (
                                                                        <div key={commentator.id} className="flex items-center space-x-1 bg-green-900/30 px-2 py-1 rounded">
                                                                            <Image
                                                                                src={commentator.staff_avatar_url || '/unknow.svg'}
                                                                                alt={commentator.staff_username}
                                                                                width={16} height={16} className="w-4 h-4 rounded-full"
                                                                                onError={() => { }} />
                                                                            <span className="text-xs text-white">{commentator.staff_username}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-gray-400 mb-1">解说: 0人</div>
                                                        );
                                                    })()}

                                                    {/* 直播 */}
                                                    {(() => {
                                                        const streamers = staffAssignments.filter(a => a.room_id === room.id && a.staff_role === 'streamer' && a.status === 'confirmed');
                                                        return streamers.length > 0 ? (
                                                            <div className="mb-2">
                                                                <div className="text-xs text-gray-400 mb-1">直播 ({streamers.length}人):</div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {streamers.map(streamer => (
                                                                        <div key={streamer.id} className="flex items-center space-x-1 bg-purple-900/30 px-2 py-1 rounded">
                                                                            <Image
                                                                                src={streamer.staff_avatar_url || '/unknow.svg'}
                                                                                alt={streamer.staff_username}
                                                                                width={16} height={16} className="w-4 h-4 rounded-full"
                                                                                onError={() => { }} />
                                                                            <span className="text-xs text-white">{streamer.staff_username}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-gray-400 mb-1">直播: 0人</div>
                                                        );
                                                    })()}
                                                </div>

                                                {room.description && (
                                                    <div className="text-xs text-gray-500 mb-4 line-clamp-2">
                                                        {room.description}
                                                    </div>
                                                )}

                                                {/* 申请按钮 */}
                                                <div className="flex flex-col space-y-2">
                                                    {userApplication ? (
                                                        <div className="text-xs text-green-400 text-center py-2">
                                                            已加入 {userApplication.staff_role === 'referee' ? '裁判' :
                                                                userApplication.staff_role === 'streamer' ? '直播' : '解说'}
                                                        </div>
                                                    ) : (
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => onApplyForRoom(room.id, 'referee')}
                                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors duration-200"
                                                                disabled={(room.staff_counts?.referee ?? 0) >= 2}
                                                            >
                                                                申请裁判 {((room.staff_counts?.referee ?? 0) >= 2) && '(已满)'}
                                                            </button>
                                                            <button
                                                                onClick={() => onApplyForRoom(room.id, 'commentator')}
                                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-3 rounded transition-colors duration-200"
                                                                disabled={(room.staff_counts?.commentator ?? 0) >= 2}
                                                            >
                                                                申请解说 {((room.staff_counts?.commentator ?? 0) >= 2) && '(已满)'}
                                                            </button>
                                                            <button
                                                                onClick={() => onApplyForRoom(room.id, 'streamer')}
                                                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 px-3 rounded transition-colors duration-200"
                                                            >
                                                                申请直播
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {!availableRoomsLoading && availableRooms.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    <p>暂无可申请的比赛房间</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}
