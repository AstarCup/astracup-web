"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAdminUser, UserSession } from "@/lib/session";

export default function DebugPage() {
    const router = useRouter();
    const [envInfo, setEnvInfo] = useState<Record<string, string>>({});
    const [serverEnvInfo, setServerEnvInfo] = useState<Record<string, string>>({});
    const [userSession, setUserSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // 检查用户会话和权限
        fetch('/api/session/get', {
            credentials: 'include' // 确保发送cookie
        })
            .then(response => response.json())
            .then(data => {
                console.log('Debug session data:', data);
                if (data.success && data.session) {
                    setUserSession(data.session);
                    setIsAdmin(data.session.username === 'AeCw');
                } else {
                    // 未登录，重定向到首页
                    router.push('/');
                }
            })
            .catch(error => {
                console.error('Failed to fetch session:', error);
                router.push('/');
            });

        // 获取客户端环境变量信息
        const clientInfo = {
            OSU_CLIENT_ID: process.env.OSU_CLIENT_ID || "NOT_SET (Client)",
            OSU_CLIENT_SECRET: process.env.OSU_CLIENT_SECRET ? "SET" : "NOT_SET (Client)",
            OSU_REDIRECT_URI: process.env.OSU_REDIRECT_URI || "NOT_SET (Client)",
            NODE_ENV: process.env.NODE_ENV || "NOT_SET (Client)",
        };

        setEnvInfo(clientInfo);

        // 从服务器API获取环境变量信息
        fetch('/api/debug/env')
            .then(response => response.json())
            .then(data => {
                setServerEnvInfo(data.environment);
                setLoading(false);
            })
            .catch(error => {
                console.error('Failed to fetch server env:', error);
                setLoading(false);
            });
    }, [router]);

    // 如果不是管理员，显示无权限信息
    if (userSession && !isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
                    <h1 className="text-3xl font-bold text-red-600 mb-6">权限不足</h1>
                    <p className="text-lg text-gray-700 mb-4">
                        您没有权限访问调试页面
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
                    >
                        返回首页
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">调试面板 - 管理员权限</h1>

                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-3">环境变量状态</h2>
                    <div className="bg-gray-100 p-4 rounded-md">
                        <pre className="text-sm">
                            {JSON.stringify(envInfo, null, 2)}
                        </pre>
                    </div>
                </div>

                {loading ? (
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-3">服务器环境变量</h2>
                        <div className="bg-blue-50 p-4 rounded-md">
                            <p className="text-sm">加载中...</p>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-3">服务器环境变量</h2>
                        <div className="bg-blue-50 p-4 rounded-md">
                            <pre className="text-sm">
                                {JSON.stringify(serverEnvInfo, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-3">数据库操作</h2>
                    <div className="bg-green-50 p-4 rounded-md space-y-3">
                        <button
                            onClick={async () => {
                                try {
                                    const response = await fetch('/api/init-database');
                                    const data = await response.json();
                                    alert(`数据库初始化结果: ${JSON.stringify(data)}`);
                                } catch (error) {
                                    alert('数据库初始化失败: ' + error);
                                }
                            }}
                            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 mr-3"
                        >
                            初始化数据库
                        </button>

                        <button
                            onClick={async () => {
                                try {
                                    const response = await fetch('/api/edge-registrations');
                                    const data = await response.json();
                                    alert(`注册数据: ${JSON.stringify(data.registrations, null, 2)}`);
                                } catch (error) {
                                    alert('获取注册数据失败: ' + error);
                                }
                            }}
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mr-3"
                        >
                            查看注册数据
                        </button>

                        <button
                            onClick={async () => {
                                if (confirm('确定要清空所有注册数据吗？此操作不可恢复！')) {
                                    try {
                                        const response = await fetch('/api/debug/clear-registrations', {
                                            method: 'POST'
                                        });
                                        const data = await response.json();
                                        alert(`清空结果: ${JSON.stringify(data)}`);
                                    } catch (error) {
                                        alert('清空数据失败: ' + error);
                                    }
                                }
                            }}
                            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                        >
                            清空注册数据
                        </button>

                        <p className="text-sm text-green-700 mt-2">
                            数据库管理操作（仅管理员可用）
                        </p>
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <h3 className="text-lg font-medium text-yellow-800 mb-2">调试说明</h3>
                    <ul className="list-disc list-inside text-yellow-700 space-y-1">
                        <li>如果 OSU_CLIENT_ID 显示为 NOT_SET，说明环境变量未正确配置</li>
                        <li>请在 Vercel 项目设置中配置环境变量</li>
                        <li>配置后需要重新部署项目</li>
                        <li>OSU_CLIENT_SECRET 出于安全原因只显示是否设置，不显示具体值</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
