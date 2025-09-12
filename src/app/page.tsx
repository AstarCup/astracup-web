"use client";

import { useEffect, useState } from "react";
import Countdown from './components/Cutdown';
import Image from 'next/image';
import BackgroundSVG from './components/BackgroundSVG';
import GuideIcon from './components/icons/GuideIcon';
import ScheduleIcon from './components/icons/ScheduleIcon';
import MapoolIcon from './components/icons/MapoolIcon';
import ContactIcon from './components/icons/ContactIcon';
import UserProfile from './components/UserProfile';
import RegistrationButton from './components/RegistrationButton';
import NewsListWithPagination from "./components/NewsListWithPagination";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    setUser(null);
  };

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
    <div className="flex flex-col m-10 items-center justify-center">
      <div className="relative w-full max-w-5xl flex flex-col items-left justify-center">
        <BackgroundSVG
          className="absolute top-0 -translate-x-80 object-cover object-center w-full h-full z-1 select-none pointer-events-auto"
          style={{ minWidth: '180%', minHeight: '160%' }}
        />
        <style jsx global>{`
          .bg-block {
            transition: fill 0.3s;
            cursor: pointer;
          }
          .bg-block:hover {
            fill: #3BE9D8 !important;
          }
        `}</style>
        <Image
          src="/AstaraCup.svg"
          alt="AstraCup Logo"
          width={600}
          height={400}
          className="z-10 relative"
          style={{ height: 'auto' }}
        />
        <p className="text-4xl font-bold mb-4 z-2 relative text-white drop-shadow-lg">星域杯</p>
        <p className="mb-6 z-10 relative text-white drop-shadow-md">这里是OSU!Lazer星域杯，面向中国大陆 8100pp 分段的 1v1 比赛。</p>
      </div>
      {/* 导航按钮区域 */}
      <div className="mt-16 w-full max-w-5xl z-10 relative p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/guide"
            className="p-6 flex flex-col items-center justify-center hover:transition-colors group relative"
          >
            <span className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[15deg]">
              <GuideIcon className="guide-icon-main" color="#E93B66" />
            </span>
            <span
              className="text-3xl font-medium text-white absolute right-2 bottom-2 drop-shadow-lg pointer-events-none"
              style={{ zIndex: 2 }}
            >比赛手册</span>
          </a>
          <a
            href="/schedule"
            className="p-6 flex flex-col items-center justify-center hover:transition-colors group relative"
          >
            <span className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[15deg]">
              <ScheduleIcon className="schedule-icon-main" color="#E93B66" />
            </span>
            <span className="text-3xl font-medium text-white absolute right-2 bottom-2 drop-shadow-lg pointer-events-none"
              style={{ zIndex: 2 }}>赛程安排</span>
          </a>
          <a
            href="/mapool"
            className="p-6 flex flex-col items-center justify-center hover:transition-colors group relative"
          >
            <span className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[15deg]">
              <MapoolIcon className="mapool-icon-main" color="#E93B66" />
            </span>
            <span className="text-3xl font-medium text-white absolute right-2 bottom-2 drop-shadow-lg pointer-events-none"
              style={{ zIndex: 2 }}>图池</span>
          </a>
          <a
            href="/contact"
            className="p-6 flex flex-col items-center justify-center hover:transition-colors group relative"
          >
            <span className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[15deg]">
              <ContactIcon className="contact-icon-main" color="#E93B66" />
            </span>
            <span className="text-3xl font-medium text-white absolute right-2 bottom-2 drop-shadow-lg pointer-events-none"
              style={{ zIndex: 2 }}>联系我们</span>
          </a>
          <style jsx global>{`
          .guide-icon-main .main-fill,
          .schedule-icon-main .main-fill,
          .mapool-icon-main .main-fill,
          .contact-icon-main .main-fill {
            transition: fill 0.3s;
          }
          .group:hover .guide-icon-main .main-fill,
          .group:hover .schedule-icon-main .main-fill,
          .group:hover .mapool-icon-main .main-fill,
          .group:hover .contact-icon-main .main-fill {
            fill: #3BE9D8 !important;
          }
        `}</style>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl p-6 z-10 relative">
        <div className='md:col-span-2 m-1 items-center justify-center bg-white p-3 outline z-2'>
          <div className="md:col-span-2 p-3 m-1 flex flex-col md:flex-row items-center justify-center z-0">
            <a
              href="https://qm.qq.com/q/sFydxoQtaw"
              className="flex-1 p-3 flex items-center justify-center hover:bg-[#3D3D3D] hover:text-white transition"
            >
              <Image src="/icons/QQ.svg" alt="QQ群" width={240} height={124} />
            </a>
            <a
              href="https://space.bilibili.com/11872433"
              className="flex-1 p-3 flex items-center justify-center hover:bg-[#3D3D3D] hover:text-white transition"
            >
              <Image src="/icons/bilibili.svg" alt="主办B站" width={240} height={124} />
            </a>
            <a
              href="https://live.bilibili.com/725565"
              className="flex-1 p-3 flex items-center justify-center hover:bg-[#3D3D3D] hover:text-white transition"
            >
              <Image src="/icons/live.svg" alt="直播间" width={240} height={124} />
            </a>
          </div>
        </div>

        <div className="md:col-span-1 md:row-span-1 m-1 items-center justify-center bg-white p-3 outline z-2 flex flex-col text-center">
          <UserProfile user={user} onLogout={handleLogout} />
          {!user ? (
            <a href="/register" className="text-2xl px-3 py-3 bg-[#E93B66] text-white hover:bg-[#3D3D3D] transition"
            ><Image src='icons/useOsuLogin.svg' width={700} height={300} alt="使用 osu! 账号登录" /></a>
          ) : (
            <RegistrationButton user={user} />
          )}
        </div>
      </div>
      <div className="w-full max-w-5xl flex justify-end pr-6">
        <Image src="/Line.svg" alt="line" width={338} height={20} />
      </div>

      <NewsListWithPagination />

    </div>
  );
}
