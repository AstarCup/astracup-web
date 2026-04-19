"use client";

import { useConfig } from "../components/ConfigProvider";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/footer";
import { NotificationContainer } from "../components/ui/Notification";

// Loading组件
function LoadingScreen({ isLoading }: { isLoading: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-50 bg-black transition-opacity duration-1000 ${isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
    >
      <div className="relative w-full h-full">
        {/* 下边图片（原来右边的）- 全屏显示 */}
        {/* <div className={`absolute inset-0 transition-transform duration-1000 ${isLoading ? 'translate-x-0' : 'translate-x-full'
                    }`}>
                    <Image
                        src="/loading-right.svg"
                        alt="Loading icon 2"
                        fill
                        className="object-cover"
                    />
                </div> */}
        {/* 上边图片（原来左边的）- 全屏显示 */}
        {/* <div className={`absolute inset-0 transition-transform duration-1000 ${isLoading ? 'translate-x-0' : '-translate-x-full'
                    }`}>
                    <Image
                        src="/loading-left.svg"
                        alt="Loading icon 1"
                        fill
                        className="object-cover"
                    />
                </div> */}
      </div>
    </div>
  );
}

// 应用内容组件
export function AppContent({ children }: { children: React.ReactNode }) {
  const { isLoading } = useConfig();
  const pathname = usePathname();

  // 定义需要隐藏组件的页面路径
  const HIDE_COMPONENTS_PAGES = ["/obs-overlay", "/staff-dashboard"];

  const isHomePage = pathname === "/";
  const bannerHeight = isHomePage ? "h-240" : "h-120";

  const shouldHideComponents = HIDE_COMPONENTS_PAGES.some((page) =>
    pathname?.startsWith(page),
  );

  return (
    <>
      {!shouldHideComponents && <LoadingScreen isLoading={isLoading} />}
      {!isLoading && (
        <div className="min-h-screen flex flex-col">
          {!shouldHideComponents && (
            <>
              <Navbar />
            </>
          )}
          <main className={`flex-grow ${!shouldHideComponents ? "pt-10" : ""}`}>
            <div className="items-center justify-center">
              {/* Banner - 高度根据页面变化 */}
              <div className="absolute -top-20 -z-10 w-full">
                <div
                  className={`sticky w-full ${bannerHeight} transition-all duration-300`}
                >
                  <Image
                    src="/banner.png"
                    alt="Banner"
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority
                  />
                </div>
              </div>

              {children}
            </div>
          </main>
          {!shouldHideComponents && (
            <>
              <Footer />
              <NotificationContainer />
            </>
          )}
        </div>
      )}
    </>
  );
}
