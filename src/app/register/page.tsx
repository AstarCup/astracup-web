"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePageTitle } from '@/lib/usePageTitle';

export default function Login() {
    usePageTitle('/register');

    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // 处理URL参数（客户端渲染时）
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        const successParam = urlParams.get('success');

        if (errorParam) {
            switch (errorParam) {
                case 'auth_failed':
                    setError('osu! 登录失败，请重试');
                    break;
                case 'no_code':
                    setError('授权码缺失，请重新登录');
                    break;
                case 'token_failed':
                    setError('令牌获取失败，请重试');
                    break;
                default:
                    setError('登录过程中出现错误');
            }
        }

        if (successParam) {
            setSuccess(true);
            // 3秒后跳转到首页
            const timer = setTimeout(() => {
                router.push('/');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [router]);

    const handleOsuLogin = async () => {
        setIsLoading(true);
        setError(''); // 清除之前的错误
        try {
            // 从服务器API获取OAuth URL
            const response = await fetch('/api/auth/url');
            const data = await response.json();

            if (data.success) {
                window.location.href = data.authUrl;
            } else {
                throw new Error(data.error || 'Failed to get authentication URL');
            }
        } catch (error) {
            setIsLoading(false);
            setError(error instanceof Error ? error.message : 'OAuth配置错误，这不是你的问题，请等待修复');
            console.error('OAuth login error:', error);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-2xl mx-auto shadow-md p-8 text-center">
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                        <h2 className="text-2xl font-bold mb-2">登录成功！</h2>
                        <p>欢迎来到 AstraCup！</p>
                        <p>3秒后将自动跳转到首页...</p>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-[#F38181] text-white px-6 py-2 rounded-md hover:bg-[#95E1D3] transition-colors"
                    >
                        立即返回首页
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-2xl mx-auto p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 text-white">用户登录</h1>
                    <p className="mt-2 text-sm text-gray-100">
                        请使用您的 osu! 账号登录
                    </p>
                </div>

                <div className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 p-4">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="bg-yellow-50 border border-yellow-200 p-4">
                        <h3 className="text-sm font-medium text-yellow-800">隐私说明</h3>
                        <p className="mt-2 text-sm text-yellow-600">
                            我们只会获取您的基本账号信息（ID、用户名、头像、地区、PP、排名），
                            不会获取您的密码或其他敏感信息。所有数据仅用于网站功能使用。
                        </p>
                    </div>

                    <div className="text-center">
                        <button
                            onClick={handleOsuLogin}
                            disabled={isLoading}
                            className={`px-8 py-4 rounded-lg text-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF66AA] ${!isLoading
                                ? 'bg-[#FF66AA] text-white hover:bg-[#FF4488]'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isLoading ? '跳转中...' : '使用 osu! 账号登录'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
