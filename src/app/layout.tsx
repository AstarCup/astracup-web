import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Metadata } from "next";
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/footer';
import NoiseBackground from './components/NoiseBackground';
import ParallaxBackground from './components/ParallaxBackground';
import { NotificationContainer } from './components/Notification';
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
  '/debug': '调试页面',
};

// 生成页面metadata的工具函数 - 在页面组件中使用
export function generatePageMetadata(pathname: string): Metadata {
  const title = pageTitles[pathname] || 'AstraCup 星域杯';

  return {
    title: title === 'AstraCup 星域杯' ? title : `${title} | AstraCup 星域杯`,
    description: "AstraCup 是一场专为广大 osu!lazer std 玩家 打造的线上赛事。",
    icons: {
      icon: "/favicon.ico",
    },
  };
}

// 示例：在页面中使用
// import { generatePageMetadata } from '@/app/layout';
// export const metadata = generatePageMetadata('/news'); // 会生成 "新闻 | AstraCup 星域杯"

export const metadata: Metadata = {
  title: "AstraCup 星域杯",
  description: "AstraCup 是一场专为广大 osu!lazer std 玩家 打造的线上赛事。",
  icons: {
    icon: "/favicon.ico",
  },
}

import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
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
      </body>
    </html>
  );
}