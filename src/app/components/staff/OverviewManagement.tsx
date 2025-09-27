"use client";

import Image from 'next/image';
import { UserSession } from '@/lib/permissions';
import { UserPermissions } from '@/lib/permissions';
import { TournamentRegistration } from '@/lib/mysql-registrations';

interface OverviewManagementProps {
    user: UserSession;
    permissions: UserPermissions;
    registrations: TournamentRegistration[];
}

export default function OverviewManagement({ user, permissions, registrations }: OverviewManagementProps) {
    return (
        <div className="space-y-6">
            {/* 管理员信息卡片 */}
            <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                <div className="flex items-center mb-4">
                    <Image
                        src={user.avatar_url}
                        alt={user.username}
                        width={60}
                        height={60}
                        className="rounded-full outline outline-2 outline-[#E93B66] mr-4"
                        onError={() => { }}
                    />
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white mb-2">管理员: {user.username}</h2>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-[#E93B66] text-white text-sm border-b-2 border-[#E93B66]">
                                管理员
                            </span>
                            {permissions.isMapSelector && (
                                <span className="px-3 py-1 bg-blue-600 text-white text-sm border-b-2 border-blue-600">
                                    选图组
                                </span>
                            )}
                            {permissions.isReplayTester && (
                                <span className="px-3 py-1 bg-green-600 text-white text-sm border-b-2 border-green-600">
                                    测图组
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 数据统计 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                        <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                        注册玩家
                    </h4>
                    <div className="text-3xl font-bold text-[#3BE9D8]">{registrations.length}</div>
                    <p className="text-gray-400 text-sm mt-2">总注册人数</p>
                </div>

                <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                        <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                        活跃房间
                    </h4>
                    <div className="text-3xl font-bold text-[#3BE9D8]">-</div>
                    <p className="text-gray-400 text-sm mt-2">当前活跃比赛房间</p>
                </div>

                <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                        <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                        系统状态
                    </h4>
                    <div className="text-3xl font-bold text-green-400">正常</div>
                    <p className="text-gray-400 text-sm mt-2">系统运行状态</p>
                </div>
            </div>
        </div>
    );
}