'use client';

import { useConfig } from '../components/ConfigProvider';
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
export function AppContent({ children }: { children: React.ReactNode }) {
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