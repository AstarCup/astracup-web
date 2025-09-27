import React from 'react';
import { StaffMember } from './types';

interface StaffManagementProps {
    staffMembers: StaffMember[];
    loading: boolean;
    onRefresh: () => void;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({
    staffMembers,
    loading,
    onRefresh
}) => {
    const getRoleColor = (role: StaffMember['role']) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800';
            case 'referee': return 'bg-blue-100 text-blue-800';
            case 'streamer': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoleText = (role: StaffMember['role']) => {
        switch (role) {
            case 'admin': return '管理员';
            case 'referee': return '裁判员';
            case 'streamer': return '直播员';
            default: return '未知';
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">工作人员管理</h2>
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
                    {staffMembers.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400">暂无工作人员数据</p>
                        </div>
                    ) : (
                        staffMembers.map((staff) => (
                            <div key={staff.id} className="bg-gray-700 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-medium text-white">{staff.username}</h3>
                                        <p className="text-gray-400 text-sm">
                                            角色: {getRoleText(staff.role)}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(staff.role)}`}>
                                        {getRoleText(staff.role)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};