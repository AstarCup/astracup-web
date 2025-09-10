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
      <div className="relative w-full max-w-5xl flex flex-col items-left justify-center">
        <Image
          src="/Background.svg"
          alt="Background"
          fill
          className="absolute top-0 left-1/2 -translate-x-80 object-cover object-center w-full h-full z-1 select-none pointer-events-none"
          style={{ minWidth: '180%', minHeight: '160%' }}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-30 w-full max-w-5xl z-10 relative">
        <div className='md:col-span-2 m-1 items-center justify-center bg-white p-3 outline z-2'>
          <p>距离比赛开始报名</p>
          <Countdown />
          <p className='text-right'>少女测试中，不是正确时间</p>
        </div>

        <div className="md:col-span-1 md:row-span-2 m-1 items-center justify-center bg-white p-3 outline z-2 flex flex-col text-center">
          <UserProfile user={user} />
          {!user ? (
            <a href="/register" className="text-2xl px-10 py-3 bg-[#E93B66] text-white hover:bg-[#95E1D3] transition mt-10"
            >使用 osu! 账号登录</a>
          ) : (
            <RegistrationButton user={user} />
          )}
        </div>
        <div className="md:col-span-2 p-3 m-1 flex flex-col md:flex-row items-center justify-center z-0">
          <a
            href="https://qm.qq.com/q/sFydxoQtaw"
            className="flex-1 p-3 flex items-center justify-center hover:bg-[#E93B66] hover:text-white transition"
          >
            <Image src="/icons/QQ.svg" alt="QQ群" width={240} height={124} />
          </a>
          <a
            href="https://space.bilibili.com/11872433"
            className="flex-1 p-3 flex items-center justify-center hover:bg-[#E93B66] hover:text-white transition"
          >
            <Image src="/icons/bilibili.svg" alt="主办B站" width={240} height={124} />
          </a>
          <a
            href="https://live.bilibili.com/725565"
            className="flex-1 p-3 flex items-center justify-center hover:bg-[#E93B66] hover:text-white transition"
          >
            <Image src="/icons/live.svg" alt="直播间" width={240} height={124} />
          </a>
        </div>
      </div>
      <NewsListWithPagination />

    </div>
  );
}
