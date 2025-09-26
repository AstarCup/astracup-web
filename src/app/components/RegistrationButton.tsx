"use client";

import { useState, useEffect } from "react";
import { UserSession } from "@/lib/session";
import RegistrationModal from "./RegistrationModal";
import { TournamentRegistration } from "@/lib/mysql-registrations";

interface RegistrationButtonProps {
    user: UserSession;
}

export default function RegistrationButton({ user }: RegistrationButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 检查用户是否已报名
    const checkRegistrationStatus = async () => {
        try {
            // 通过 API 检查报名状态，避免客户端环境变量问题
            const response = await fetch(`/api/check-registration?osuId=${user.osuId}`, {
                credentials: 'include' // 确保发送cookie
            });

            if (!response.ok) {
                throw new Error('Failed to check registration status');
            }

            const data = await response.json();
            // console.log('Registration status for user', user.osuId, ':', data.registered);
            setIsRegistered(data.registered);
        } catch (error) {
            console.error('Error checking registration status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 组件挂载时检查报名状态
    useEffect(() => {
        checkRegistrationStatus();
    }, []);

    const handleRegister = async (registrationData: any): Promise<boolean> => {
        try {
            const response = await fetch('/api/edge-registrations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registrationData),
            });

            if (!response.ok) {
                throw new Error('Failed to register');
            }

            const result = await response.json();

            // 注册成功后立即更新本地状态，而不是重新检查
            if (result.success) {
                setIsRegistered(true);
                setIsModalOpen(false);
            }

            return result.success;
        } catch (error) {
            console.error('Registration error:', error);
            return false;
        }
    };

    if (isLoading) {
        return (
            <div className="mt-6">
                <button
                    disabled
                    className="text-2xl px-10 py-3 bg-gray-400 text-white cursor-not-allowed"
                >
                    检查报名状态...
                </button>
            </div>
        );
    }

    if (isRegistered) {
        return (
            <div className="mt-6 text-center">
                <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-3 mb-4">
                    <p className="text-lg font-semibold">您已成功报名！</p>
                    <p className="text-sm">感谢您报名参加 AstraCup 比赛</p>
                    <a href=''>点击领取主办女装照</a>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mt-6 text-center">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-2xl px-10 py-3 bg-[#E93B66] text-white hover:bg-[#95E1D3] transition"
                >
                    立即报名参赛
                </button>
                <p className="text-sm text-gray-600 mt-2">
                    点击按钮查看报名手册并完成报名
                </p>
            </div>

            <RegistrationModal
                user={user}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onRegister={handleRegister}
            />
        </>
    );
}
