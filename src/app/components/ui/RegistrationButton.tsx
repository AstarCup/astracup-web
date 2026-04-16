"use client";

import { useState, useEffect } from "react";
import { UserSession } from "@/lib/permissions";
import RegistrationModal from "./RegistrationModal";

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
      const response = await fetch(
        `/api/check-registration?osuId=${user.osuId}`,
        {
          credentials: "include", // 确保发送cookie
        },
      );

      if (!response.ok) {
        throw new Error("Failed to check registration status");
      }

      const data = await response.json();
      console.log("Registration status response:", data);
      // 检查registrationStatus字段为registered
      const isRegistered = data.data?.registered || false;
      console.log(
        "Registration status for user",
        user.osuId,
        ":",
        isRegistered,
      );
      setIsRegistered(isRegistered);
    } catch (error) {
      console.error("Error checking registration status:", error);
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
      const response = await fetch("/api/edge-registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        throw new Error("Failed to register");
      }

      const result = await response.json();

      // 注册成功后立即更新本地状态，而不是重新检查
      if (result.success) {
        setIsRegistered(true);
        setIsModalOpen(false);
      }

      return result.success;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  if (isLoading) {
    return (
      <a className="p-9 col-span-2 flex flex-col rounded-lg bg-white items-left justify-end transition-all group relative border-b-4 border-pink-600 hover:border-gray-600 hover:bg-gray-200 active:scale-[0.99] hover:scale-[1.01]">
        <span className=""></span>
        <span
          className="text-3xl font-bold text-gray-600 absolute right-2 bottom-2 pointer-events-none"
          style={{ zIndex: 2 }}
        >
          检查报名状态
        </span>
      </a>
    );
  }

  if (isRegistered) {
    return (
      <div className="p-9 col-span-2 flex flex-col rounded-lg bg-gray-100 items-left justify-end relative border-b-4 border-gray-400 cursor-not-allowed">
        <span className=""></span>
        <span
          className="text-3xl font-bold text-gray-400 absolute right-2 bottom-2"
          style={{ zIndex: 2 }}
        >
          您已成功报名！
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="p-9 col-span-2 flex flex-col rounded-lg bg-white items-left justify-end transition-all group relative border-b-4 border-pink-600 hover:border-gray-600 hover:bg-gray-200 active:scale-[0.99] hover:scale-[1.01]"
      >
        <span className=""></span>
        <span
          className="text-3xl font-bold text-gray-600 absolute right-2 bottom-2 pointer-events-none"
          style={{ zIndex: 2 }}
        >
          立即报名参赛
        </span>
      </button>
      <RegistrationModal
        user={user}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRegister={handleRegister}
      />
    </>
  );
}
