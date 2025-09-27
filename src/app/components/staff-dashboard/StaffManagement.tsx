'use client';

import { StaffMember } from './types';

interface StaffManagementProps {
    staffMembers: StaffMember[];
}

export default function StaffManagement({ staffMembers }: StaffManagementProps) {
    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">工作人员管理</h2>

            <div className="space-y-4">
                {staffMembers.map((staff) => (
                    <div key={staff.id} className="bg-gray-700 p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-medium text-white">{staff.username}</h3>
                                <p className="text-gray-400 text-sm">
                                    角色: {staff.role === 'referee' ? '裁判员' : staff.role === 'streamer' ? '直播员' : '管理员'}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${staff.role === 'admin' ? 'bg-red-100 text-red-800' :
                                staff.role === 'referee' ? 'bg-blue-100 text-blue-800' :
                                    'bg-purple-100 text-purple-800'
                                }`}>
                                {staff.role === 'referee' ? '裁判员' : staff.role === 'streamer' ? '直播员' : '管理员'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}