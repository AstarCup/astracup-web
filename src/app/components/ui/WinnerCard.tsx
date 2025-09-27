import React, { useState } from 'react';
import Image from 'next/image';

interface Winner {
    rank: number;
    playerName: string;
    osuId: string;
    country: string;
    avatarUrl: string;
    teamName: string;
    achievement: string;
    resultImage: string;
}

interface WinnerCardProps {
    winner: Winner;
    seasonName: string;
}

export default function WinnerCard({ winner, seasonName }: WinnerCardProps) {
    const [showImageModal, setShowImageModal] = useState(false);
    const isPending = winner.playerName === "TBD";
    const [avatarSrc, setAvatarSrc] = useState(isPending ? '/icons/unknow.svg' : (winner.avatarUrl || '/icons/unknow.svg'));
    const [resultImageVisible, setResultImageVisible] = useState(true);

    const handleCardClick = () => {
        if (winner.osuId !== "00000000") {
            window.open(`https://osu.ppy.sh/users/${winner.osuId}`, '_blank');
        }
    };

    const handleImageClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // 阻止事件冒泡到卡片点击
        setShowImageModal(true);
    };

    const handleAvatarError = () => {
        setAvatarSrc('/icons/unknow.svg');
    };

    const handleResultImageError = () => {
        setResultImageVisible(false);
    };

    const closeModal = () => {
        setShowImageModal(false);
    };

    const getRankStyle = (rank: number) => {
        switch (rank) {
            case 1:
                return {
                    bgGradient: 'from-yellow-400 via-yellow-500 to-yellow-600',
                    borderColor: 'border-yellow-400',
                    textColor: 'text-yellow-400',
                    icon: '/icons/1.svg',
                    title: '冠军'
                };
            case 2:
                return {
                    bgGradient: 'from-gray-300 via-gray-400 to-gray-500',
                    borderColor: 'border-gray-400',
                    textColor: 'text-gray-400',
                    icon: '/icons/2.svg',
                    title: '亚军'
                };
            case 3:
                return {
                    bgGradient: 'from-amber-600 via-amber-700 to-amber-800',
                    borderColor: 'border-amber-600',
                    textColor: 'text-amber-600',
                    icon: '/icons/3.svg',
                    title: '季军'
                };
            default:
                return {
                    bgGradient: 'from-gray-600 via-gray-700 to-gray-800',
                    borderColor: 'border-gray-600',
                    textColor: 'text-gray-400',
                    icon: '🏆',
                    title: '选手'
                };
        }
    };

    const rankStyle = getRankStyle(winner.rank);

    return (
        <>
            <div
                className={`relative bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] rounded-2xl p-6 border-2 ${rankStyle.borderColor} transition-all duration-300 ${!isPending ? 'cursor-pointer hover:scale-105 hover:shadow-2xl' : 'opacity-75'} shadow-xl`}
                onClick={handleCardClick}
            >
                {/* 排名徽章 */}
                <div className={`absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br ${rankStyle.bgGradient} rounded-full flex items-center justify-center border-4 border-[#1A1A1A] shadow-lg`}>
                    <span className="text-2xl"><Image src={rankStyle.icon} alt={rankStyle.title} width={24} height={24} /></span>
                </div>

                {/* 排名标题 */}
                <div className="text-center mb-6">
                    <h3 className={`text-2xl font-bold ${rankStyle.textColor} mb-2`}>
                        {rankStyle.title}
                    </h3>
                    <div className="text-gray-400 text-sm">
                        {seasonName}
                    </div>
                </div>

                {/* 选手信息 */}
                <div className="flex flex-col items-center mb-6">
                    {/* 头像 */}
                    <div className={`relative mb-4 p-1 rounded-full bg-gradient-to-br ${rankStyle.bgGradient}`}>
                        <Image
                            src={avatarSrc}
                            alt={winner.playerName}
                            width={96}
                            height={96}
                            className="w-24 h-24 rounded-full border-4 border-[#1A1A1A]"
                            onError={handleAvatarError}
                        />
                        {/* 国旗 */}
                        {!isPending && (
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#1A1A1A] rounded-full flex items-center justify-center border-2 border-gray-600 text-white">
                                <span className="text-xs">{winner.country}</span>
                            </div>
                        )}
                    </div>

                    {/* 选手名称 */}
                    <h4 className="text-xl font-bold text-white mb-2">
                        {winner.playerName}
                    </h4>

                    {/* 队伍名称 */}
                    <div className="bg-[#3A3A3A]  px-3 py-1 mb-3">
                        <span className="text-gray-300 text-sm">{winner.teamName}</span>
                    </div>

                    {/* 名次显示 */}
                    <div className="text-center mb-4">
                        <div className="text-gray-400 text-xs mb-1">获得名次</div>
                        <div className={`text-3xl font-bold ${rankStyle.textColor}`}>
                            第 {winner.rank} 名
                        </div>
                    </div>

                    {/* 成就描述 */}
                    <div className="bg-[#2A2A2A]  p-3 border border-gray-600">
                        <p className="text-gray-300 text-sm text-center">
                            {winner.achievement}
                        </p>
                    </div>
                </div>

                {/* osu! ID */}
                {!isPending && (
                    <div className="flex items-center justify-center bg-[#3A3A3A]  px-3 py-2 mb-3">
                        <span className="text-gray-400 text-xs mr-2">osu! ID:</span>
                        <span className="text-white font-mono text-sm">{winner.osuId}</span>
                    </div>
                )}

                {/* 查看返图按钮 */}
                {!isPending && winner.resultImage && winner.resultImage.trim() !== "" && (
                    <button
                        onClick={handleImageClick}
                        className={`w-full py-3 px-4 bg-gradient-to-r ${rankStyle.bgGradient} hover:opacity-90  transition-all duration-300 hover:scale-105 shadow-lg border border-gray-600`}
                        title="查看返图"
                    >
                        <div className="flex items-center justify-center">
                            <span className="text-white font-bold">查看返图</span>
                        </div>
                    </button>
                )}
            </div>

            {/* 全局返图模态框 */}
            {showImageModal && (
                <div
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
                    onClick={closeModal}
                >
                    <div className="relative max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
                        {/* 关闭按钮 */}
                        <button
                            onClick={closeModal}
                            className="absolute -top-2 -right-2 w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl z-10 transition-colors"
                            title="关闭"
                        >
                            ×
                        </button>

                        {/* 返图展示卡片 */}
                        <div className="bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] rounded-2xl p-6 border-2 border-[#FF66AA] shadow-2xl">
                            {/* 标题 */}
                            <div className="text-center mb-4">
                                <h3 className={`text-2xl font-bold ${rankStyle.textColor} mb-2`}>
                                    {winner.playerName} 的返图
                                </h3>
                                <p className="text-gray-400">
                                    {rankStyle.title} • {seasonName}
                                </p>
                            </div>

                            {/* 返图 */}
                            <div className="flex justify-center">
                                {resultImageVisible && (
                                    <Image
                                        src={winner.resultImage}
                                        alt={`${winner.playerName} 的返图`}
                                        width={800}
                                        height={600}
                                        className="max-w-full max-h-[70vh]  shadow-lg"
                                        onError={handleResultImageError}
                                    />
                                )}
                            </div>

                            {/* 底部信息 */}
                            <div className="text-center mt-4 text-gray-400 text-sm">
                                点击图片外区域关闭
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}