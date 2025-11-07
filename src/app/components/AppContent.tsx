'use client';

import { useConfig } from '../components/ConfigProvider';
import { usePathname } from 'next/navigation';
import Image from "next/image";
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/footer';
import NoiseBackground from '../components/ui/NoiseBackground';
import ParallaxBackground from '../components/ui/ParallaxBackground';
import { NotificationContainer } from '../components/ui/Notification';

// Loading组件
function LoadingScreen({ isLoading }: { isLoading: boolean }) {
    return (
        <div className={`fixed inset-0 z-50 bg-black transition-opacity duration-1000 ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}>
            <div className="relative w-full h-full">
                {/* 下边图片（原来右边的）- 全屏显示 */}
                <div className={`absolute inset-0 transition-transform duration-1000 ${isLoading ? 'translate-x-0' : 'translate-x-full'
                    }`}>
                    <Image
                        src="/loading-right.svg"
                        alt="Loading icon 2"
                        fill
                        className="object-cover"
                    />
                </div>
                {/* 上边图片（原来左边的）- 全屏显示 */}
                <div className={`absolute inset-0 transition-transform duration-1000 ${isLoading ? 'translate-x-0' : '-translate-x-full'
                    }`}>
                    <Image
                        src="/loading-left.svg"
                        alt="Loading icon 1"
                        fill
                        className="object-cover"
                    />
                </div>
            </div>
        </div>
    );
}

// 应用内容组件
export function AppContent({ children }: { children: React.ReactNode }) {
    const { isLoading } = useConfig();
    const pathname = usePathname();

    // 定义需要隐藏组件的页面路径
    const HIDE_COMPONENTS_PAGES = [
        '/obs-overlay',
    ];

    // 检查当前页面是否需要隐藏组件
    const shouldHideComponents = HIDE_COMPONENTS_PAGES.some(page =>
        pathname?.startsWith(page)
    );

    return (
        <>
            {!shouldHideComponents && <LoadingScreen isLoading={isLoading} />}
            {!isLoading && (
                <>
                    {!shouldHideComponents && (
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
                        </>
                    )}
                    <main className={`${!shouldHideComponents ? 'pt-30' : ''}`}>
                        {children}
                    </main>
                    {!shouldHideComponents && (
                        <>
                            <Footer />
                            <NotificationContainer />
                        </>
                    )}
                </>
            )}
        </>
    );
}
