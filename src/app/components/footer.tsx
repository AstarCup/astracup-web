'use client';
import React, { useState, useEffect } from "react";
import Image from 'next/image';

export default function Footer() {
    const [version, setVersion] = useState('loading...');
    const [isVisible, setIsVisible] = useState(false);

    const handleBackToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 监听滚动事件
    useEffect(() => {
        const handleScroll = () => {
            // 当页面滚动超过200px时显示按钮
            const shouldShow = window.scrollY > 200;
            setIsVisible(shouldShow);
        };

        // 添加滚动事件监听
        window.addEventListener('scroll', handleScroll);

        // 初始检查一次
        handleScroll();

        // 清理函数
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                const response = await fetch('/api/version');
                const data = await response.json();
                setVersion(data.version);
            } catch (error) {
                console.error('Failed to fetch version:', error);
                setVersion('unknown');
            }
        };

        fetchVersion();
    }, []);
    return (
        <>
            {/* 返回顶部按钮 - 固定在页面右下角 */}
            <button
                onClick={handleBackToTop}
                style={{
                    position: "fixed",
                    right: 20,
                    bottom: 20,
                    padding: "0px 10px 0px 10px",
                    background: "#E93B66",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: "background 0.2s, opacity 0.3s, transform 0.3s",
                    zIndex: 1000,
                    pointerEvents: isVisible ? 'auto' : 'none',
                }}
                className="return-top-btn"
                onMouseOver={e => (e.currentTarget.style.background = '#3BE9D8')}
                onMouseOut={e => (e.currentTarget.style.background = '#E93B66')}
            >
                <Image src="/icons/returnTop.svg" alt="返回顶部" width={60} height={60} />
            </button>

            <footer
                style={{
                    width: "100%",
                    height: "300px",
                    minHeight: "300px",
                    background: "url('/footer.svg') no-repeat center/contain",
                    backgroundPosition: "center bottom",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    letterSpacing: "1px",
                    position: "relative",
                    padding: "20px",
                    gap: "20px",
                    // 允许图片溢出footer区域
                    overflow: "visible",
                }}
                className="footer-responsive"
            >
                {/* 版权声明 */}
                <div style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                }}>
                    <span style={{ fontSize: '1rem', marginBottom: '8px' }}>
                        © {new Date().getFullYear()} Astara Cup. All rights reserved.
                    </span>
                    <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                        <p>Ciallo～ (∠・ω&lt; )⌒☆</p>
                        <p>{version}</p>
                    </span>
                </div>

                {/* 友情链接 */}
                <div style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        alignItems: 'flex-start'
                    }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '8px' }}>
                            友情链接
                        </span>
                        <a
                            href="https://osu.ppy.sh/"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: '#fff',
                                textDecoration: 'none',
                                fontSize: '0.95rem',
                                transition: 'color 0.3s'
                            }}
                            onMouseOver={e => (e.currentTarget.style.color = '#3BE9D8')}
                            onMouseOut={e => (e.currentTarget.style.color = '#fff')}
                        >
                            osu! 官网
                        </a>
                        <a
                            href="https://lazer.g0v0.top"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: '#fff',
                                textDecoration: 'none',
                                fontSize: '0.95rem',
                                transition: 'color 0.3s'
                            }}
                            onMouseOver={e => (e.currentTarget.style.color = '#3BE9D8')}
                            onMouseOut={e => (e.currentTarget.style.color = '#fff')}
                        >
                            osu!lazer 咕哦服
                        </a>

                    </div>
                </div>
            </footer>

            <style jsx>{`
                @media (min-width: 768px) {
                    .return-top-btn {
                        right: 40px !important;
                        bottom: 30px !important;
                    }
                    .return-top-btn img {
                        width: 80px !important;
                        height: 80px !important;
                    }
                }
                @media (max-width: 640px) {
                    .return-top-btn {
                        right: 15px !important;
                        bottom: 15px !important;
                    }
                    .return-top-btn img {
                        width: 50px !important;
                        height: 50px !important;
                    }
                }
            `}</style>
        </>
    );
}
