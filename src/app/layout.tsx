import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Metadata } from "next";
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/footer';

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
        <Navbar />
        <Analytics />
        <SpeedInsights />
        <main className={`pt-50`}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
