"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import localFont from "next/font/local";

const audiowide = localFont({
    src: "./font/Audiowide-Regular.ttf",
    display: "auto",
});

export default function Navbar() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeLink, setActiveLink] = useState<string>(pathname);
    const navLinks = [
        { name: 'HOME', href: '/', tip: '主页' },
        { name: 'NEWS', href: '/news', tip: '新闻' },
        { name: 'GUIDE', href: `/guide`, tip: '赛事规则' },
        { name: 'SCHEDULE', href: `/schedule`, tip: '赛程安排' },
        { name: 'MAPPOOL', href: `/mapool`, tip: '图池' },
        { name: 'REGISTRATIONS', href: '/registrations', tip: '所有报名玩家' },
        { name: 'CONTACT', href: '/contact', tip: '联系我们' },
        { name: 'PHOTOS', href: `/photos`, tip: '历届荣誉展示' }
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <nav className={`${audiowide.className} antialiased`}>
            <div className="fixed top-0 left-0 w-full z-50 object-center font-bold">

                <div className="absolute inset-0 backdrop-blur-lg" style={{
                    zIndex: -3,
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.3) 80%, rgba(0,0,0,0) 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.3) 80%, rgba(0,0,0,0) 100%)'
                }}></div>


                <div className="absolute inset-0" style={{
                    zIndex: -1,
                    background: 'linear-gradient(to bottom, rgba(233, 59, 102, 0.6) 0%, rgba(233, 59, 102, 0.3) 10%, rgba(233, 59, 102, 0.1) 30%, rgba(233, 59, 102, 0) 50%)'
                }}></div>

                <img src="/NavbarBackground.svg" alt="Background" className="absolute inset-0 object-cover bg-center opacity-90" style={{ zIndex: -2 }} />


                <div className="max-w-7xl mx-auto px-2">
                    <div className="flex justify-between items-center h-30">
                        {/* Logo */}
                        <div className="text-xl font-bold">
                            <Link href="/"><Image src='/AstaraCup.svg' alt='AstataCup' width={220} height={90} /></Link>
                        </div>

                        {/* Desktop Menu */}
                        <ul className="hidden xl:flex space-x-8 text-[#FFFFFF] p-2 m-2">
                            {navLinks.map((link) => (
                                <li key={link.href} className="flex flex-col items-center relative text-shadow-lg">
                                    {activeLink === link.href && (
                                        <span
                                            className="absolute -top-7 right-0 px-0 py-0 text-3xl z-10 whitespace-nowrap text-right"
                                            style={{
                                                color: '#3be9d8c2',
                                                WebkitTextStroke: '0px #ffffffff',
                                                fontWeight: 700,
                                                letterSpacing: '1px',
                                                direction: 'rtl',
                                                textAlign: 'right',
                                            }}
                                        >
                                            {link.tip}
                                        </span>
                                    )}
                                    <Link
                                        href={link.href}
                                        className={`hover:text-[#E93B66] transition duration-200 ${isActive(link.href) ? 'text-[#3BE9D8] font-semibold background-white' : ''}`}
                                        onClick={() => setActiveLink(link.href)}
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>


                        {/* Mobile Menu Button */}
                        <button
                            className="xl:hidden flex flex-col items-left space-y-1 p-2"
                            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                            aria-expanded={isMobileMenuOpen}
                            aria-label="Toggle mobile menu"
                        >
                            <span className={`block w-4 h-0.5 bg-[#3BE9D8] transition-transform ${isMobileMenuOpen ? 'rotate-45' : ''}`}></span>
                            <span className={`block w-4 h-0.5 bg-[#3BE9D8] ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                            <span className={`block w-4 h-0.5 bg-[#3BE9D8] transition-transform ${isMobileMenuOpen ? '-rotate-45' : ''}`}></span>
                        </button>
                    </div>

                    {/* Mobile Menu Panel */}
                    <div
                        className={`xl:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-180 py-4 opacity-99' : 'max-h-0 opacity-0'
                            }`}
                    >
                        <div className=" p-4">
                            <div className="grid grid-cols-2 gap-2">
                                {navLinks.map((link) => (
                                    <div key={link.href} className="border-b-4 border-[#E93B66] bg-white/100 hover:bg-[#3BE9D8] hover:border-[#ffffff] transition-colors duration-200 min-h-20 flex">
                                        <Link
                                            href={link.href}
                                            className={`flex-1 p-3 text-left text-sm font-medium flex flex-col justify-center relative ${isActive(link.href) ? 'bg-[#3BE9D8] text-white font-bold' : 'text-gray-800 hover:text-white'}`}
                                            onClick={() => {
                                                setActiveLink(link.href);
                                                setMobileMenuOpen(false);
                                            }}
                                        >
                                            {/* {link.name} decorative background */}
                                            <div className="absolute inset-0 z-0 opacity-80 pointer-events-none flex items-center justify-bottom">
                                                <span className="text-gray-400 text-3xl font-mono font-bold">
                                                    {link.name}
                                                </span>
                                            </div>

                                            <div className="text-xs opacity-75 font-bold mb-1 leading-tight relative z-10">{link.name}

                                            </div>
                                            <div className="text-2xl font-bold leading-tight inline-flex relative z-10">{link.tip}

                                            </div>

                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
