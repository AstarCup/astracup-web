
import Countdown from './components/Cutdown';
import Image from 'next/image';
import type { Metadata } from "next";
import UserProfile from './components/UserProfile';
import RegistrationButton from './components/RegistrationButton';

export const metadata: Metadata = {
  title: "AstraCup 星域杯",
  description: "欢迎参加 AstraCup，这是一场专为广大 osu!lazer std 玩家 打造的线上赛事。",
};

export default async function Home() {
  // 通过API获取用户会话
  let user = null;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/session/get`, {
      cache: 'no-store'
    });
    const data = await response.json();
    user = data.session;
  } catch (error) {
    console.error('Failed to fetch user session:', error);
  }

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
