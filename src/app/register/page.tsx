"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export interface OsuUser {
    id: number;
    username: string;
    avatar_url: string;
    country_code: string;
    statistics: {
        pp: number;
        global_rank: number | null;
        country_rank: number | null;
        ranked_score: number;
        hit_accuracy: number;
        play_count: number;
        play_time: number;
        level: {
            current: number;
            progress: number;
        };
        grade_counts: {
            ss: number;
            ssh: number;
            s: number;
            sh: number;
            a: number;
        };
    };
}

export default function Register() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState<OsuUser | null>(null);
    const [error, setError] = useState("");

    const fetchUserData = async () => {
        if (!username.trim()) {
            setError("请输入 osu! 用户名");
            return;
        }

        setIsLoading(true);
        setError("");
        setUserData(null);

        try {
            // 使用服务器端API获取用户数据
            const response = await fetch(`/api/osu-user?username=${encodeURIComponent(username)}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '获取玩家数据失败');
            }

            const data: OsuUser = await response.json();
            setUserData(data);

            // 检查是否已注册
            const checkResponse = await fetch(`/api/register?osuId=${data.id}`);
            if (checkResponse.ok) {
                const registrations = await checkResponse.json();
                const isRegistered = registrations.some((reg: any) => reg.osuId === data.id.toString());

                if (isRegistered) {
                    setError("该玩家已经报名过了！");
                    setUserData(null);
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            setError(error instanceof Error ? error.message : "获取玩家数据失败");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userData) {
            setError("请先获取玩家数据");
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    osuId: userData.id.toString(),
                    username: userData.username,
                    inGameName: userData.username,
                    discord: "",
                    timezone: "UTC+8",
                    availability: "",
                    avatar_url: userData.avatar_url,
                    pp: userData.statistics.pp,
                    global_rank: userData.statistics.global_rank,
                    country_rank: userData.statistics.country_rank,
                }),
            });

            if (response.ok) {
                alert("报名成功！感谢您的参与！");
                router.push("/");
            } else {
                const errorData = await response.json();
                alert(`报名失败: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Registration error:", error);
            alert("报名失败，请稍后重试");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">比赛报名</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        请输入您的 osu! 用户名，系统将自动获取您的游戏数据
                    </p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            osu! 用户名 *
                        </label>
                        <div className="mt-1 flex gap-2">
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="flex-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F38181] focus:border-transparent"
                                placeholder="请输入您的 osu! 用户名"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={fetchUserData}
                                disabled={isLoading}
                                className="bg-[#F38181] text-white px-4 py-2 rounded-md hover:bg-[#95E1D3] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F38181] disabled:opacity-50"
                            >
                                {isLoading ? "获取中..." : "获取数据"}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {userData && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                            <div className="flex items-center space-x-4 mb-4">
                                {userData.avatar_url && (
                                    <Image
                                        src={userData.avatar_url}
                                        alt={userData.username}
                                        width={64}
                                        height={64}
                                        className="rounded-full"
                                    />
                                )}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{userData.username}</h3>
                                    <p className="text-sm text-gray-600">{userData.country_code}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">PP: </span>
                                    {userData.statistics.pp.toLocaleString()}
                                </div>
                                <div>
                                    <span className="font-medium">全球排名: </span>
                                    {userData.statistics.global_rank ? `#${userData.statistics.global_rank.toLocaleString()}` : "无排名"}
                                </div>
                                <div>
                                    <span className="font-medium">国家排名: </span>
                                    {userData.statistics.country_rank ? `#${userData.statistics.country_rank.toLocaleString()}` : "无排名"}
                                </div>
                                <div>
                                    <span className="font-medium">准确率: </span>
                                    {userData.statistics.hit_accuracy.toFixed(2)}%
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="w-full mt-4 bg-[#F38181] text-white py-3 px-4 rounded-md hover:bg-[#95E1D3] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F38181]"
                            >
                                确认报名
                            </button>
                        </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <h3 className="text-sm font-medium text-blue-800">报名须知</h3>
                        <ul className="mt-2 text-sm text-blue-600 list-disc list-inside space-y-1">
                            <li>请确保输入正确的 osu! 用户名</li>
                            <li>系统将自动获取您的游戏数据用于比赛安排</li>
                            <li>每人只能报名一次，请勿重复报名</li>
                            <li>报名后不可更改信息，请仔细核对</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
