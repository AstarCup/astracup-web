'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";

export default function ParallaxBackground() {
    const [scrollY, setScrollY] = useState(0);
    const [windowHeight, setWindowHeight] = useState(1000); // 默认值
    const [offsets, setOffsets] = useState({ offset1: 0, offset2: -1000, offset3: 1000 });

    useEffect(() => {
        // 确保在客户端运行
        if (typeof window === 'undefined') return;

        const handleScroll = () => {
            const newScrollY = window.scrollY;
            setScrollY(newScrollY);

            // 计算循环位置（反向滚动）
            const parallaxOffset = (-newScrollY * 0.5) % windowHeight;
            setOffsets({
                offset1: parallaxOffset,
                offset2: parallaxOffset - windowHeight,
                offset3: parallaxOffset + windowHeight
            });
        };

        const handleResize = () => {
            const newHeight = window.innerHeight;
            setWindowHeight(newHeight);
            // 重新计算偏移（反向滚动）
            const parallaxOffset = (-scrollY * 0.5) % newHeight;
            setOffsets({
                offset1: parallaxOffset,
                offset2: parallaxOffset - newHeight,
                offset3: parallaxOffset + newHeight
            });
        };

        // 初始化
        setWindowHeight(window.innerHeight);
        handleScroll(); // 初始计算

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, [windowHeight, scrollY]);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -9998,
            overflow: 'visible',
            pointerEvents: 'none'
        }}>
            {/* 第一层背景 */}
            <Image
                src="/background-parallax.svg"
                alt="Parallax Background 1"
                className="object-cover object-center select-none pointer-events-none opacity-30"
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '120%',
                    top: `${offsets.offset1}px`,
                    left: 0,
                    willChange: 'transform'
                }}
                width={1000}
                height={600}
            />
            {/* 第二层背景（上方循环） */}
            <Image
                src="/background-parallax.svg"
                alt="Parallax Background 2"
                className="object-cover object-center select-none pointer-events-none opacity-30"
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '120%',
                    top: `${offsets.offset2}px`,
                    left: 0,
                    willChange: 'transform'
                }}
                width={1000}
                height={600}
            />
            {/* 第三层背景（下方循环） */}
            <Image
                src="/background-parallax.svg"
                alt="Parallax Background 3"
                className="object-cover object-center select-none pointer-events-none opacity-30"
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '120%',
                    top: `${offsets.offset3}px`,
                    left: 0,
                    willChange: 'transform'
                }}
                width={1000}
                height={600}
            />
        </div>
    );
}