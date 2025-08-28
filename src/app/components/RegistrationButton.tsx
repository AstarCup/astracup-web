"use client";

import { useState, useEffect } from "react";
import { UserSession } from "@/lib/session";
import RegistrationModal from "./RegistrationModal";
import { addRegistration } from "@/lib/edge-registrations";
import { isUserRegistered } from "@/lib/registrations";

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
            const registered = await isUserRegistered(user.osuId);
            setIsRegistered(registered);
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
            return await addRegistration(registrationData);
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
                <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-3 rounded-md mb-4">
                    <p className="text-lg font-semibold">✅ 您已成功报名！</p>
                    <p className="text-sm">感谢您报名参加 AstraCup 比赛</p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="text-lg px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                    刷新页面
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="mt-6 text-center">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-2xl px-10 py-3 bg-[#F38181] text-white hover:bg-[#95E1D3] transition"
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
