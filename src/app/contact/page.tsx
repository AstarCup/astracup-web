'use client';

import React from 'react';
import StaffCard from '@/app/components/StaffCard';
import staffData from '@/config/staff.json';
import { usePageTitle } from '@/lib/usePageTitle';

interface StaffMember {
    name: string;
    osuId: string;
    avatarUrl: string;
    role: string;
    description: string;
    coverUrl?: string | null;
}

export default function Contact() {
    usePageTitle('/contact');

    const allStaffMembers = staffData as StaffMember[];

    return (
        <div className="min-h-screen pb-20">
            {/* 页面标题 */}
            <div className="py-16 mb-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center">
                        <h1 className="text-5xl font-bold text-white mb-4">Staff 团队</h1>
                        <p className="text-xl text-white/90 max-w-2xl mx-auto">
                            感谢所有为 AstaraCup 付出努力的工作人员们
                        </p>
                        <div className="mt-6 flex justify-center items-center space-x-2">
                            <span className="text-white/80">总共</span>
                            <span className="bg-white/20 text-white font-bold px-3 py-1">
                                {allStaffMembers.length}
                            </span>
                            <span className="text-white/80">位工作人员</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                {/* Staff 卡片网格 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {allStaffMembers.map((member, index) => (
                        <StaffCard key={`staff-${index}`} member={member} />
                    ))}
                </div>

                {/* 页面底部信息 */}
                <div className="mt-20 text-center">
                    <div className="bg-[#1A1A1A] p-8 border-b-4 border-[#E93B66]">
                        <h3 className="text-2xl font-bold text-white mb-4">想要加入我们？</h3>
                        <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                            AstaraCup 始终欢迎有热情的志愿者加入我们的团队。如果您想要参与比赛的组织工作，请联系我们！
                        </p>
                        <div className="flex justify-center space-x-4">
                            <div className="bg-[#2A2A2A] px-4 py-2">
                                <span className="text-gray-400 text-sm">联系方式：</span>
                                <span className="text-[#3BE9D8] ml-2"><a
                                    href="https://qm.qq.com/q/sFydxoQtaw">点击加入QQ群</a></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}