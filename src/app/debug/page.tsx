"use client";

import { useEffect, useState } from "react";

export default function DebugPage() {
    const [envInfo, setEnvInfo] = useState<Record<string, string>>({});
    const [serverEnvInfo, setServerEnvInfo] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">环境变量调试</h1>

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
