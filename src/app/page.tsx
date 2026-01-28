"use client";

import { useEffect, useState } from "react";
import Image from 'next/image';
import BackgroundSVG from './components/ui/BackgroundSVG';
import GuideIcon from './components/icons/GuideIcon';
import ScheduleIcon from './components/icons/ScheduleIcon';
import MapoolIcon from './components/icons/MapoolIcon';
import ContactIcon from './components/icons/ContactIcon';
import UserProfile from './components/ui/UserProfile';
import RegistrationButton from './components/ui/RegistrationButton';
import NewsListWithPagination from "./components/ui/NewsListWithPagination";
import NewStyleLogo from "./components/icons/NewStyleLogo";
import { useConfig } from './components/ConfigProvider';
import { BookMarked, CalendarDays, Table2, Contact } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { tournamentSettings } = useConfig();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      // 可以添加页面刷新或重定向
      window.location.reload();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
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
    <div>
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-full max-w-7xl flex flex-col items-left justify-center px-4 sm:px-6 mt-4">
          <div className="relative w-full flex flex-col items-left justify-center px-4 sm:px-6">
            <div className="relative w-full flex justify-end items-right mt-40">
              {/* <Image src={'/newLogo.svg'} width={420} height={200} alt="AstarLogo" className="bottom-0" /> */}
              <NewStyleLogo className="scale-75 bottom-0" />
            </div>
          </div>
          <div>
          </div>
          {/* 导航按钮区域 */}
          <div className="w-full z-10 relative">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {!user ? (
                <a
                  href="/register"
                  className="p-6 col-span-2 flex flex-col rounded-lg bg-white items-left justify-end transition-all group relative border-b-4 border-pink-600 hover:border-gray-600 hover:bg-gray-200 active:scale-[0.99] hover:scale-[1.01]"
                >
                  <span className="">
                  </span>
                  <span
                    className="text-3xl font-bold text-gray-600 absolute right-2 bottom-2 pointer-events-none"
                    style={{ zIndex: 2 }}
                  >报名登录</span>
                </a>
              ) : (
                <RegistrationButton user={user} />
              )}
              <a
                href="/guide"
                className="p-3 flex flex-col rounded-lg bg-white items-left justify-end transition-all group relative border-b-4 border-pink-600 hover:border-gray-600 hover:bg-gray-200 active:scale-[0.99] hover:scale-[1.01]"
              >
                <span className="">
                  <BookMarked color="#E93B66" />
                </span>
                <span
                  className="text-3xl font-bold text-gray-600 absolute right-2 bottom-2 pointer-events-none"
                  style={{ zIndex: 2 }}
                >比赛手册</span>
              </a>
              <a
                href="/schedule"
                className="p-3 flex flex-col rounded-lg bg-white items-left justify-end transition-all group relative border-b-4 border-yellow-400 hover:border-gray-600 hover:bg-gray-200 active:scale-[0.99] hover:scale-[1.01]"
              >
                <span className="">
                  <CalendarDays color="#F8D211" />
                </span>
                <span className="text-3xl text-gray-600 font-bold absolute right-2 bottom-2 pointer-events-none"
                  style={{ zIndex: 2 }}>赛程安排</span>
              </a>

              <a
                href="/mappool"
                className="p-3 flex flex-col rounded-lg bg-white items-left justify-end transition-all group relative border-b-4 border-orange-400 hover:border-gray-600 hover:bg-gray-200 active:scale-[0.99] hover:scale-[1.01]"
              >
                <span className="">
                  <Table2 color="orange" />
                </span>
                <span className="text-3xl font-bold text-gray-600 absolute right-2 bottom-2 pointer-events-none"
                  style={{ zIndex: 2 }}>图池</span>
              </a>
              <a
                href="/contact"
                className="p-3 flex flex-col rounded-lg bg-white items-left justify-end transition-all group relative border-b-4 border-blue-400 hover:border-gray-600 hover:bg-gray-200 active:scale-[0.99] hover:scale-[1.01]"
              >
                <span className="">
                  <Contact color="#3BB8E9" />
                </span>
                <span className="text-3xl font-bold text-gray-600 absolute right-2 bottom-2 pointer-events-none"
                  style={{ zIndex: 2 }}>联系我们</span>
              </a>
              {!user ? (
                <div></div>
              ) : (
                <div className="col-span-2 flex flex-row w-full gap-2 items-end justify-between">
                  <a
                    href="https://qm.qq.com/q/sFydxoQtaw"
                    className="p-3 text-xl relative group font-bold text-gray-600 text-right flex w-full flex-col rounded-lg bg-white justify-end hover:transition-colors group relative border-b-4 border-gray-600 hover:border-gray-600 hover:bg-gray-200"
                  >QQ Group
                    <Image src={'/QQGroupQRcode.png'} alt="QQ Group QRcode" width={300} height={300} className="bg-white p-5 rounded-lg w-full absolute bottom-15 right-0 z-3 invisible group-hover:visible" />
                  </a>
                  <a
                    href="https://space.bilibili.com/11872433"
                    className="p-3 text-xl font-bold text-gray-600 text-right flex w-full flex-col rounded-lg bg-white justify-end hover:transition-colors group relative border-b-4 border-gray-600 hover:border-gray-600 hover:bg-gray-200"
                  >Bilibili
                  </a>
                  <a
                    href="https://live.bilibili.com/725565"
                    className="p-3 text-xl font-bold text-gray-600 text-right flex w-full flex-col rounded-lg bg-white justify-end hover:transition-colors group relative border-b-4 border-gray-600 hover:border-gray-600 hover:bg-gray-200"
                  >Live
                  </a>
                </div>
              )}

            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 mt-4 gap-4 w-full z-0 relative">
            <div className='md:col-span-2 bg-white rounded-lg p-3 z-2 min-h-[400px] md:min-h-[500px]'>
              {/* 新闻列表区域 */}
              <div className="overflow-y-auto">
                <NewsListWithPagination />
              </div>
            </div>

            {!user ? (
              <div><div className="col-span-2 flex flex-col w-full gap-2 items-end justify-between">
                <a
                  href="https://qm.qq.com/q/sFydxoQtaw"
                  className="p-3 text-xl relative group font-bold text-gray-600 text-right flex w-full flex-col rounded-lg bg-white justify-end hover:transition-all group relative border-b-4 border-gray-600 hover:border-gray-600 hover:bg-gray-200"
                >QQ Group
                </a>
                <a
                  href="https://space.bilibili.com/11872433"
                  className="p-3 text-xl font-bold text-gray-600 text-right flex w-full flex-col rounded-lg bg-white justify-end hover:transition-all group relative border-b-4 border-gray-600 hover:border-gray-600 hover:bg-gray-200"
                >Bilibili
                </a>
                <a
                  href="https://live.bilibili.com/725565"
                  className="p-3 text-xl font-bold text-gray-600 text-right flex w-full flex-col rounded-lg bg-white justify-end hover:transition-all group relative border-b-4 border-gray-600 hover:border-gray-600 hover:bg-gray-200"
                >Live
                </a>
              </div></div>
            ) : (
              <UserProfile user={user} onLogout={handleLogout} />
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
