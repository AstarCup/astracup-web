'use client';

import React from 'react';
import StaffCard from '@/app/components/StaffCard';
import staffData from '@/config/staff.json';

interface StaffMember {
    name: string;
    osuId: string;
    avatarUrl: string;
    role: string;
    description: string;
}

interface StaffData {
    organizers: StaffMember[];
    administrators: StaffMember[];
    referees: StaffMember[];
    mappool_selectors: StaffMember[];
    streamers: StaffMember[];
    commentators: StaffMember[];
    designers: StaffMember[];
}

export default function Contact() {
    const staff = staffData as StaffData;

    const sections = [
        {
            title: '主办方',
            key: 'organizers',
            icon: '👑',
            description: '比赛的创办者和总负责人'
        },
        {
            title: '管理团队',
            key: 'administrators',
            icon: '🛡️',
            description: '负责比赛运营和管理'
        },
        {
            title: '裁判团队',
            key: 'referees',
            icon: '⚖️',
            description: '负责比赛执行和裁判工作'
        },
        {
            title: '图池选择',
            key: 'mappool_selectors',
            icon: '🎵',
            description: '负责比赛图池的策划和选择'
        },
        {
            title: '图池测试',
            key: 'mapool_testers',
            icon: '🔧',
            description: '测试比赛图池的可玩性和公平性'
        },
        {
            title: '直播团队',
            key: 'streamers',
            icon: '📺',
            description: '负责比赛直播和转播'
        },
        {
            title: '解说团队',
            key: 'commentators',
            icon: '🎤',
            description: '负责比赛解说和评论'
        },
        {
            title: '设计团队',
            key: 'designers',
            icon: '🎨',
            description: '负责视觉设计和美术工作'
        }

    ];

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
                                {Object.values(staff).flat().length}
                            </span>
                            <span className="text-white/80">位工作人员</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6">
                {sections.map((section) => {
                    const members = staff[section.key as keyof StaffData] || [];

                    if (members.length === 0) return null;

                    return (
                        <div key={section.key} className="mb-16">
                            {/* 分类标题 */}
                            <div className="mb-8">
                                <div className="flex items-center mb-4">
                                    <span className="text-4xl mr-4">{section.icon}</span>
                                    <div>

                                        <span>
                                            <div className="flex items-center">
                                                <h2 className="text-3xl font-bold text-white pr-3">{section.title}</h2>
                                                <div className="bg-[#E93B66] text-white text-sm font-semibold px-3 py-1">
                                                    {members.length} 人
                                                </div>
                                            </div></span>
                                        <p className="text-gray-400 mt-1">{section.description}</p>
                                    </div>
                                </div>

                            </div>

                            {/* Staff 卡片网格 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {members.map((member, index) => (
                                    <StaffCard key={`${section.key}-${index}`} member={member} />
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* 页面底部信息 */}
                <div className="mt-20 text-center">
                    <div className="bg-[#1A1A1A] p-8 border border-gray-700">
                        <h3 className="text-2xl font-bold text-white mb-4">想要加入我们？</h3>
                        <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                            AstaraCup 始终欢迎有热情的志愿者加入我们的团队。如果您想要参与比赛的组织工作，请联系我们！
                        </p>
                        <div className="flex justify-center space-x-4">
                            <div className="bg-[#2A2A2A] px-4 py-2">
                                <span className="text-gray-400 text-sm">联系方式：</span>
                                <span className="text-white ml-2"><a
                                    href="https://qm.qq.com/q/sFydxoQtaw">点击加入QQ群</a></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}