"use client";

import { UserSession } from "@/lib/permissions";
import { useState, useEffect } from "react";
import Image from 'next/image';


interface UserProfileProps {
    user: UserSession | null;
    onLogout?: () => void;
}

export default function UserProfile({ user, onLogout }: UserProfileProps) {
    const [isClient, setIsClient] = useState(false);
    const [avatarSrc, setAvatarSrc] = useState(user?.avatar_url || '');

    useEffect(() => {
        setIsClient(true);
        if (user?.avatar_url) {
            setAvatarSrc(user.avatar_url);
        }
    }, [user?.avatar_url]);

    const handleAvatarError = () => {
        setAvatarSrc('/default-avatar.png');
    };

    if (!isClient || !user) {
        return (
            <div className="">
                {/* <p className="text-gray-600">未登录</p> */}
            </div>
        );
    }

    const formatRank = (rank: number | null) => {
        if (rank === null) return "未排名";
        return `#${rank.toLocaleString()}`;
    };

    return (
        <div className="w-full relative">
            <div className="justify-end">
                <Image
                    src={avatarSrc}
                    alt={user.username}
                    width={440}
                    height={220}
                    className="rounded-lg h-60 object-cover"
                    onError={handleAvatarError}
                />
                <div className="absolute inset-0 bg-gradient-to-t h-60 rounded-lg from-black/30 via-black/0 to-transparent"></div>
            </div>
            <div className="relative">
                <div className="grid grid-row-1 bg-white rounded-lg mt-3 gap-10 text-sm items-start justify-start text-right w-full p-6">
                    <h3 className="absolute text-6xl -top-16 font-semibold text-white -left-0 truncate">
                        <a href={`https://osu.ppy.sh/users/${user.osuId}`}>{user.username}</a>
                    </h3>
                    <div className="items-end justify-between relative">
                        <span className="text-gray-400 font-bold text-2xl absolute top-0 left-0 text-left mb-1">PP</span>
                        <span className={`text-6xl text-gray-600 font-bold relative text-right top-4 text-pink-500`}>{Math.round(user.pp)}</span>
                    </div>
                    <div className="items-end justify-between relative">
                        <span className="text-gray-400 font-bold text-2xl absolute top-0 left-0 text-left mb-1">全球排名</span>
                        <span className={`text-4xl text-gray-600 font-bold relative text-right top-4 text-pink-400`}>{formatRank(user.global_rank)}</span>
                    </div>
                    {user.country_rank && (
                        <div className="items-end justify-between relative">
                            <span className="text-gray-400 font-bold text-2xl absolute top-0 left-0 text-left mb-1">地区排名-<a className="text-xl">{user.country}</a></span>
                            <span className={`text-4xl text-gray-600 font-bold relative text-right top-4 text-pink-400`}>{formatRank(user.country_rank)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
