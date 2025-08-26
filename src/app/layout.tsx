import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";

import "./globals.css";
import Navbar from '@/app/components/Navbar';

const alimama = localFont({
  src: '/font/AlimamaFangYuan.woff2',
  display: "swap",
});

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
    <html lang="en">
      <body className={`${alimama.className} ${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Navbar />
        <main className={`pt-16`}>
          {children}
        </main>
      </body>
    </html>
  );
}
