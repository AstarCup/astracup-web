import React from 'react';

interface StaffMember {
    name: string;
    osuId: string;
    avatarUrl: string;
    role: string;
    description: string;
    coverUrl?: string | null;
}

interface StaffCardProps {
    member: StaffMember;
}

export default function StaffCard({ member }: StaffCardProps) {
    const handleClick = () => {
        window.open(`https://osu.ppy.sh/users/${member.osuId}`, '_blank');
    };

    return (
        <div
            className="relative bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] p-6 border border-gray-600 hover:border-[#FF66AA] transition-all duration-300 cursor-pointer group transform hover:scale-105 shadow-xl hover:shadow-2xl overflow-hidden"
            onClick={handleClick}
        >
            {/* Cover 背景图 */}
            {member.coverUrl && (
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                    style={{
                        backgroundImage: `url(${member.coverUrl})`,
                    }}
                />
            )}

            {/* 内容层，确保文字在背景图之上 */}
            <div className="relative z-10 flex flex-col items-center">
                {/* 头像 */}
                <div className="relative mb-4">
                    <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-20 h-20 rounded-full border-4 border-gray-600 group-hover:border-[#FF66AA] transition-colors duration-300"
                        onError={(e) => {
                            // 如果头像加载失败，使用默认头像
                            (e.target as HTMLImageElement).src = '/icons/unknow.svg';
                        }}
                    />
                </div>

                {/* 用户名 */}
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#FF66AA] transition-colors duration-300">
                    {member.name}
                </h3>

                {/* 描述 */}
                <p className="text-gray-400 text-sm text-center mb-4">
                    {member.description}
                </p>

                {/* osu! ID */}
                <div className="flex items-center bg-[#3A3A3A] rounded-lg px-3 py-2">
                    <span className="text-gray-400 text-xs mr-2">ID:</span>
                    <span className="text-white font-mono text-sm">{member.osuId}</span>
                </div>

                {/* 悬停提示 */}
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-[#FF66AA] text-xs">点击访问 osu! 主页 →</span>
                </div>
            </div>
        </div>
    );
}