"use client";

import React from "react";
import staffData from "@/config/staff.json";
import { usePageTitle } from "@/lib/usePageTitle";
import StaffCanvas from "../components/ui/StaffCanvas";

interface StaffMember {
  name: string;
  osuId: string;
  avatarUrl: string;
  role: string;
  description: string;
  coverUrl?: string | null;
  isSpecial?: boolean;
}

export default function Contact() {
  usePageTitle("/contact");

  const allStaffMembers = staffData as StaffMember[];
  const regularStaff = allStaffMembers.filter(
    (member) => member.role !== "special",
  );
  const specialStaff = allStaffMembers.filter(
    (member) => member.role === "special",
  );

  const allStaffWithFlags = [
    ...regularStaff.map((member) => ({ ...member, isSpecial: false })),
    ...specialStaff.map((member) => ({ ...member, isSpecial: true })),
  ];

  return (
    <div className="relative min-h-screen">
      <div className="w-full mx-auto">
        <div className="absolute bottom-4 right-4 text-right z-[2]">
          <p className="mt-2 text-lg text-gray-600 text-shadow-md">
            感谢所有为 AstarCup 付出努力的工作人员们
          </p>
        </div>

        <div className="absolute top-18 left-4 z-[2]">
          <h1 className="text-4xl font-bold text-white text-shadow-md mb-2">Staff 团队</h1>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-[#E93B66]"></div>
              <span className="text-sm text-gray-300 text-shadow-md">Staff</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-[#3B7FE9]"></div>
              <span className="text-sm text-gray-300 text-shadow-md">特别感谢</span>
            </div>
          </div>
        </div>

        {allStaffWithFlags.length === 0 ? (
          <div className="text-center py-12 bg-[#3d3d3d] border-b-4 border-[#E93B66]">
            <div className="p-8">
              <h3 className="text-xl font-semibold text-white mb-2">
                暂无工作人员
              </h3>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 -top-20 bottom-0 z-[1]">
            <StaffCanvas staffMembers={allStaffWithFlags} />
          </div>
        )}

        <div className="absolute bottom-16 left-4 z-[2]">
          <div className="bg-[#1A1A1A]/80 p-4 rounded-md">
            <h3 className="text-lg font-bold text-white mb-2">想要加入我们？</h3>
            <p className="text-gray-400 text-sm mb-2">
              AstarCup 始终欢迎有热情的志愿者加入我们的团队
            </p>
            <a
              href="https://qm.qq.com/q/sFydxoQtaw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text hover:underline text-sm"
            >
              点击加入QQ群
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
