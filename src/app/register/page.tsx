"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Register() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

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
                case 'already_registered':
                    setError('该账号已经报名过了！');
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
        if (!agreedToTerms) {
            setError('请先阅读并同意报名须知');
            return;
        }

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
                        <h2 className="text-2xl font-bold mb-2">报名成功！</h2>
                        <p>感谢您报名参加 AstraCup 比赛！</p>
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
            <div className="max-w-2xl mx-auto shadow-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 text-white">比赛报名</h1>
                    <p className="mt-2 text-sm text-gray-100">
                        请使用您的 osu! 账号登录完成报名
                    </p>
                </div>

                <div className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 p-4">
                        <h3 className="text-sm font-medium text-blue-800">报名须知</h3>
                        <ul className="mt-2 text-sm text-blue-600 list-disc list-inside space-y-1">
                            <li>比赛因奖品发货原因，仅限中国大陆地区玩家报名</li>
                            <li>需要使用 osu! Bancho 账号进行报名</li>
                            <li>系统将自动获取您的游戏数据用于比赛报名安排</li>
                            <li>每人只能报名一次，不可重复报名</li>
                            <li>报名后不可更改信息，请确保账号是个人报名的行为</li>
                            <li>报名后请添加<a href="https://qm.qq.com/q/sFydxoQtaw" className="text-blue-600 hover:underline">QQ群聊（点击加入）</a></li>
                            <li>报名成功后如没有加入QQ群聊则视为放弃比赛</li>
                            <li>报名成功可以领取一张主办女装感谢图，不喜欢请不要领取，也请不要开盒，谢谢</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 p-4">
                        <h3 className="text-sm font-medium text-yellow-800">隐私说明</h3>
                        <p className="mt-2 text-sm text-yellow-600">
                            我们只会获取您的基本账号信息（ID、用户名、头像、国家、PP、排名），
                            不会获取您的密码或其他敏感信息。所有数据仅用于比赛安排目的。
                        </p>
                    </div>

                    {/* 同意报名须知勾选框 */}
                    <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-md">
                        <input
                            type="checkbox"
                            id="agreeTerms"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="h-4 w-4 text-[#FF66AA] focus:ring-[#FF66AA] border-gray-300"
                        />
                        <label htmlFor="agreeTerms" className="text-sm text-gray-700 cursor-pointer">
                            我已阅读并同意上述报名须知和隐私说明
                        </label>
                    </div>

                    <div className="text-center">
                        <button
                            onClick={handleOsuLogin}
                            disabled={isLoading || !agreedToTerms}
                            className={`px-8 py-4 rounded-lg text-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF66AA] ${agreedToTerms && !isLoading
                                ? 'bg-[#FF66AA] text-white hover:bg-[#FF4488]'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isLoading ? '跳转中...' : '使用 osu! 账号登录报名'}
                        </button>
                        {!agreedToTerms && (
                            <p className="mt-2 text-sm text-gray-500">
                                请先同意报名须知才能继续
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
