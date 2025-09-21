import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Metadata } from "next";
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/footer';
import NoiseBackground from './components/NoiseBackground';
import { NotificationContainer } from './components/Notification';
import Image from "next/image";

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NoiseBackground />
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
