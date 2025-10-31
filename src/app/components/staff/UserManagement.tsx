"use client";

import Image from 'next/image';
import { TournamentRegistration } from '@/lib/mysql-registrations';

interface UserManagementProps {
    registrations: TournamentRegistration[];
    registrationsLoading: boolean;
    processingUser: string | null;
    onFetchRegistrations: () => void;
    onApproveRegistration: (osuId: string, username: string) => void;
    onDeleteRegistration: (osuId: string, username: string) => void;
}

export default function UserManagement({
    registrations,
    registrationsLoading,
    processingUser,
    onFetchRegistrations,
    onApproveRegistration,
    onDeleteRegistration
}: UserManagementProps) {
    return (
        <div className="space-y-6">
            {/* 用户注册审核管理 */}
            <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
                    用户注册审核管理
                </h3>
                <div className="bg-[#3D3D3D80] p-4 border border-gray-600">
                    <div className="mb-4">
                        <button
                            onClick={onFetchRegistrations}
                            disabled={registrationsLoading}
                            className="bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-6 py-3 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {registrationsLoading ? (
                                <div className="flex items-center">
                                    <Image src='/icons/loading.svg' alt='loading' width={120} height={120} className='animate-spin' />                                    加载中...
                                </div>
                            ) : '获取待审核用户列表'}
                        </button>
                    </div>

                    {registrationsLoading && (
                        <div className="text-center py-8">
                            <Image src='/icons/loading.svg' alt='loading' width={120} height={120} className='animate-spin' />                            <p className="text-gray-400">正在加载注册数据...</p>
                        </div>
                    )}

                    {registrations.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-lg font-medium text-white mb-4">
                                注册用户列表 ({registrations.length} 人)
                            </h4>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {registrations.map((player) => (
                                    <div key={player.osuId} className="bg-[#3D3D3D80] border border-gray-600 p-4 hover:border-[#3BE9D8] transition-colors duration-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Image
                                                    src={player.avatar_url}
                                                    alt={player.username}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full outline outline-1 outline-[#E93B66]"
                                                    onError={() => { }}
                                                />
                                                <div>
                                                    <h4 className="font-medium text-white">{player.username}</h4>
                                                    <p className="text-sm text-gray-400">ID: {player.osuId}</p>
                                                    <p className="text-sm text-gray-400">
                                                        PP: {Math.round(player.pp).toLocaleString()} |
                                                        排名: {player.global_rank ? `#${player.global_rank.toLocaleString()}` : '未排名'}
                                                    </p>
                                                    <p className={`text-xs font-medium ${player.approved ? 'text-green-400' : 'text-yellow-400'}`}>
                                                        {player.approved ? '✓ 已审核通过' : '⏳ 待审核'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end space-y-2">
                                                {!player.approved && (
                                                    <button
                                                        onClick={() => onApproveRegistration(player.osuId, player.username)}
                                                        disabled={processingUser === player.osuId}
                                                        className="bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-4 py-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                                    >
                                                        {processingUser === player.osuId ? '审核中...' : '审核通过'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onDeleteRegistration(player.osuId, player.username)}
                                                    disabled={processingUser === player.osuId}
                                                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                                >
                                                    {processingUser === player.osuId ? '删除中...' : '删除用户'}
                                                </button>
                                                <p className="text-xs text-gray-500 text-right">
                                                    {new Date(player.registeredAt).toLocaleString('zh-CN')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {registrations.length === 0 && !registrationsLoading && (
                        <div className="text-center py-8 text-gray-400">
                            <p>暂无注册用户数据，点击上方按钮获取</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}