
"use client";

import { useEffect, useState } from "react";
import Countdown from './components/Cutdown';
import Image from 'next/image';
import UserProfile from './components/UserProfile';
import RegistrationButton from './components/RegistrationButton';
import NewsListWithPagination from "./components/NewsListWithPagination";

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
      <div className="relative w-full flex flex-col items-left justify-center">
        <Image
          src="/Background.svg"
          alt="Background"
          fill
          className="absolute top-0 left-1/2 -translate-x-30 object-cover object-center w-full h-full z-1 select-none pointer-events-none"
          style={{ minWidth: '120%', minHeight: '160%' }}
        />
        <Image
          src="/AstaraCup.svg"
          alt="AstraCup Logo"
          width={600}
          height={400}
          className="z-10 relative"
        />
        <p className="text-4xl font-bold mb-4 z-2 relative text-white">星域杯</p>
        <p className="mb-6 z-10 relative text-white">欢迎参加 AstraCup，这是一场专为广大 osu!lazer std 玩家 打造的线上赛事。</p>
      </div>
      <div className="flex flex-wrap mt-30 w-full max-w-5xl z-10 relative">
        <div className="flex-0 m-1 items-center justify-center bg-white p-3 outline z-2"></div>
        <div className='flex-2 m-1 items-center justify-center bg-white p-3 outline z-2'>
          <p>距离比赛开始报名</p>
          <Countdown targetDate="2025-10-01T12:00:00" />
          <p className='text-right'>2025-10-01 12:00</p>
          <p className='text-right'>少女测试中，不是正确时间</p>
        </div>

        <div className="flex-1 m-1 items-center justify-center bg-white p-3 outline z-2 flex flex-col text-center">
          <UserProfile user={user} />
          {!user ? (
            <a href="/register" className="text-2xl px-10 py-3 bg-[#F38181] text-white hover:bg-[#95E1D3] transition mt-10"
            >使用 osu! 账号登录</a>
          ) : (
            <RegistrationButton user={user} />
          )}

        </div>
      </div>
      <NewsListWithPagination />

    </div>
  );
}
