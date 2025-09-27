'use client';

import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Metadata } from "next";
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/footer';
import NoiseBackground from './components/ui/NoiseBackground';
import ParallaxBackground from './components/ui/ParallaxBackground';
import { NotificationContainer } from './components/ui/Notification';
import { ConfigProvider, useConfig } from './components/ConfigProvider';
import Image from "next/image";

// 页面标题映射
const pageTitles: Record<string, string> = {
  '/': '主页',
  '/news': '新闻',
  '/guide': '赛事规则',
  '/schedule': '赛程安排',
  '/mappool': '图池',
  '/registrations': '所有报名玩家',
  '/contact': '联系我们',
  '/photos': '历届荣誉展示',
  '/register': '注册登录',
  '/map-selection': '地图选择',
  '/replay-collection': '回放收集',
};


// Loading组件
function LoadingScreen({ isLoading }: { isLoading: boolean }) {
  return (
    <div className={`fixed inset-0 z-50 bg-black transition-opacity duration-1000 ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
      <div className="flex items-center justify-center h-full">
        {/* 左边2/3大小的image */}
        <div className={`flex-1 flex justify-end pr-4 transition-transform duration-1000 ${isLoading ? 'translate-x-0' : '-translate-x-full'
          }`}>
          <Image
            src="/icons/1.svg"
            alt="Loading icon 1"
            width={120}
            height={120}
            className="filter brightness-0 invert opacity-80"
          />
        </div>
        {/* 右边1/3大小的image */}
        <div className={`flex-1 flex justify-start pl-4 transition-transform duration-1000 ${isLoading ? 'translate-x-0' : 'translate-x-full'
          }`}>
          <Image
            src="/icons/2.svg"
            alt="Loading icon 2"
            width={60}
            height={60}
            className="filter brightness-0 invert opacity-80"
          />
        </div>
      </div>
    </div>
  );
}

// 应用内容组件
function AppContent({ children }: { children: React.ReactNode }) {
  const { isLoading } = useConfig();

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      {!isLoading && (
        <>
          <NoiseBackground />
          <ParallaxBackground />
          <Image
            src="/background-top.svg"
            alt="Background"
            className="object-cover object-center z-0 select-none pointer-events-none opacity-50"
            style={{ position: 'fixed', zIndex: -9999, width: '100%', height: '100%', top: 0, left: 0 }}
            width={1000}
            height={500}
          />
          <Navbar />
          <Analytics />
          <SpeedInsights />
          <main className={`pt-20`}>
            {children}
          </main>
          <Footer />
          <NotificationContainer />
        </>
      )}
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="zh">
      <head>
        <meta name="theme-color" content="#3d3d3d" />
        <meta name="msapplication-TileColor" content="#3d3d3d" />
      </head>
      <body className={`antialiased`}>
        <ConfigProvider>
          <AppContent>
            {children}
          </AppContent>
        </ConfigProvider>
      </body>
    </html>
  );
}