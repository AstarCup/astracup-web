"use client";

import MatchScheduleSystem from "@/app/components/staff/MatchScheduleSystem";

interface MatchManagementProps {
  userOsuId: string;
  isAdmin: boolean;
}

export default function MatchManagement({
  userOsuId,
  isAdmin,
}: MatchManagementProps) {
  return (
    <div className="space-y-6">
      {/* 比赛预约系统管理 */}
      <div className="bg-[#3D3D3D] border-b-4 border-[#E93B66] p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <span className="w-2 h-2 bg-[#E93B66] rounded-full mr-3"></span>
          比赛预约系统管理
        </h3>
        <div className="bg-[#3D3D3D80] p-4 border border-gray-600">
          <MatchScheduleSystem userOsuId={userOsuId} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
}
