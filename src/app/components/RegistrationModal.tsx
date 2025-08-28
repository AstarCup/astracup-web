"use client";

import { useState } from "react";
import { UserSession } from "@/lib/session";
import { TournamentRegistration } from "@/lib/edge-registrations";
import rankConfig from '@/config/rank.json';

interface RegistrationModalProps {
    user: UserSession;
    isOpen: boolean;
    onClose: () => void;
    onRegister: (registration: Omit<TournamentRegistration, 'registeredAt'>) => Promise<boolean>;
}

export default function RegistrationModal({ user, isOpen, onClose, onRegister }: RegistrationModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    const handleRegister = async () => {
        // 检查PP限制
        if (rankConfig.rankRestrictionEnabled && user.pp > rankConfig.maxPpForRegistration) {
            setError(`您的PP值超过了${rankConfig.maxPpForRegistration}点的报名限制，无法报名`);
            return;
        }

        if (!agreedToTerms) {
            setError("请先阅读并同意报名手册");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const registrationData = {
                osuId: user.osuId,
                username: user.username,
                avatar_url: user.avatar_url,
                pp: user.pp,
                global_rank: user.global_rank,
                country_rank: user.country_rank,
                teamName: "",
                seedPosition: null,
                agreedToTerms: true
            };

            const success = await onRegister(registrationData);

            if (success) {
                onClose();
                // 可以在这里添加成功提示或重定向
                window.location.reload();
            } else {
                setError("报名失败，请重试");
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "报名过程中出现错误");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    // 检查PP限制
    const isPpTooHigh = rankConfig.rankRestrictionEnabled && user.pp > rankConfig.maxPpForRegistration;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">比赛报名确认</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {isPpTooHigh && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800">报名限制</h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p>很抱歉，您的PP值 ({Math.round(user.pp)}) 超过了{rankConfig.maxPpForRegistration}点的报名限制。</p>
                                        <p className="mt-1">本次比赛面向PP值在{rankConfig.maxPpForRegistration}点以下的玩家，感谢您的理解。</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* 用户信息确认 */}
                        <div className="bg-gray-50 p-4 rounded-md">
                            <h3 className="font-semibold text-gray-900 mb-2">您的账号信息</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-gray-600">用户名: </span>
                                    <span className="font-medium">{user.username}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">PP: </span>
                                    <span className="font-medium">{Math.round(user.pp)}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">全球排名: </span>
                                    <span className="font-medium">
                                        {user.global_rank ? `#${user.global_rank.toLocaleString()}` : "未排名"}
                                    </span>
                                </div>
                                {user.country_rank && (
                                    <div>
                                        <span className="text-gray-600">地区排名: </span>
                                        <span className="font-medium">#{user.country_rank.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 报名手册 */}
                        <div className="border border-gray-200 rounded-md p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-900">报名手册</h3>
                                <button
                                    onClick={() => setShowGuide(!showGuide)}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                    {showGuide ? "收起" : "查看详情"}
                                </button>
                            </div>

                            {showGuide ? (
                                <div className="text-sm text-gray-600 space-y-2">
                                    <p><strong>比赛规则:</strong></p>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>比赛采用 osu! standard 模式</li>
                                        <li>所有参赛者必须使用真实 osu! 账号</li>
                                        <li>禁止使用任何形式的作弊工具</li>
                                        <li>比赛期间请保持良好体育精神</li>
                                    </ul>

                                    <p><strong>报名要求:</strong></p>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>每人只能报名一次</li>
                                        <li>报名信息提交后不可更改</li>
                                        <li>请确保网络连接稳定</li>
                                        <li>比赛期间需保持在线状态</li>
                                    </ul>

                                    <p><strong>注意事项:</strong></p>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>请提前测试设备性能</li>
                                        <li>建议使用有线网络连接</li>
                                        <li>比赛前请关闭不必要的后台程序</li>
                                        <li>如遇技术问题请及时联系管理员</li>
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600">
                                    请仔细阅读比赛规则和报名要求，并添加QQ群:1072271422。
                                </p>
                            )}
                        </div>

                        {/* 同意条款 */}
                        <div className="flex items-start space-x-3">
                            <input
                                type="checkbox"
                                id="agree-terms"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="agree-terms" className="text-sm text-gray-700">
                                我已阅读了解比赛手册内容，并承诺遵守比赛规则。
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleRegister}
                            disabled={isLoading || !agreedToTerms || isPpTooHigh}
                            className="px-6 py-2 bg-[#F38181] text-white rounded-md hover:bg-[#95E1D3] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "报名中..." : "确认报名"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
