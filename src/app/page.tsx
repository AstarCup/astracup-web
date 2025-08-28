
"use client";

import { useEffect, useState } from "react";
import Countdown from './components/Cutdown';
import Image from 'next/image';
import UserProfile from './components/UserProfile';
import RegistrationButton from './components/RegistrationButton';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 客户端获取用户会话
    fetch('/api/session/get', {
      credentials: 'include' // 确保发送cookie
    })
      .then(response => response.json())
      .then(data => {
        console.log('Session data:', data);
        setUser(data.session);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch user session:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col m-10 items-center justify-center min-h-screen">
      <Image
        src="/AstaraCup.svg"
        alt="AstraCup Logo"
        width={1200}
        height={500}
        className="mb-6"
      />
      <h1 className="text-4xl font-bold mb-4">AstraCup 星域杯</h1>
      <p className="mb-6">欢迎参加 AstraCup，这是一场专为广大 osu!lazer std 玩家 打造的线上赛事。</p>

      {/* 用户信息卡片 */}
      <UserProfile user={user} />

      <div className='mb-6 items-center justify-center bg-white p-3 outline outline-[#F38181]'>
        <p className='text-[#F38181]'>距离比赛开始报名</p>
        <Countdown targetDate="2025-10-01T12:00:00" />
        <p className='text-[#F38181] text-right'>2025-10-01 12:00</p>
        <p className='text-[#F38181] text-right'>少女测试中，不是正确时间</p>
      </div>

      {!user ? (
        <a href="/register" className="text-2xl px-10 py-3 bg-[#F38181] text-white hover:bg-[#95E1D3] transition mt-10"
        >使用 osu! 账号报名</a>
      ) : (
        <RegistrationButton user={user} />
      )}
    </div>
  );
}
