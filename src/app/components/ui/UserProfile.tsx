"use client";

import { UserSession } from "@/lib/permissions";
import { useState, useEffect } from "react";
import Image from 'next/image';
import localFont from "next/font/local";

const audiowide = localFont({
    src: "../../font/Audiowide-Regular.ttf",
    display: "auto",
});

interface UserProfileProps {
    user: UserSession | null;
    onLogout?: () => void;
}

export default function UserProfile({ user, onLogout }: UserProfileProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

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
        <div className="p-2 w-full">
            <div className="flex items-left m-2">
                <Image
                    src={user.avatar_url}
                    alt={user.username}
                    width={64}
                    height={64}
                    className="outline outline-2 outline-[#E93B66]"
                    onError={(e) => {
                        e.currentTarget.src = '/default-avatar.png';
                    }}
                />
                <div className="flex-1 min-w-0 items-left text-left pl-2">
                    <h3 className="text-2xl font-semibold text-[#E93B66] truncate">
                        <a href={`https://osu.ppy.sh/users/${user.osuId}`}>{user.username}</a>
                    </h3>
                    <p className="text-sm text-gray-200">ID: {user.osuId}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col items-start">
                    <span className="text-gray-100 mb-1">PP</span>
                    <span className={`${audiowide.className} text-3xl text-white`}>{Math.round(user.pp)}</span>
                </div>
                <div className="flex flex-col items-start">
                    <span className="text-gray-100 mb-1">全球排名</span>
                    <span className={`${audiowide.className} text-3xl text-white`}>{formatRank(user.global_rank)}</span>
                </div>
                {user.country_rank && (
                    <div className="col-span-2 flex flex-col items-start mt-2">
                        <span className="text-gray-100 mb-1">地区排名</span>
                        <span className={`${audiowide.className} text-3xl text-white`}>{formatRank(user.country_rank)} <a className="text-xl">{user.country}</a></span>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                    onClick={() => {
                        if (onLogout) {
                            onLogout();
                        }
                    }}
                    className="text-sm text-red-600 text-right hover:text-red-800"
                >
                    退出登录
                </button>
            </div>
        </div>
    );
}
