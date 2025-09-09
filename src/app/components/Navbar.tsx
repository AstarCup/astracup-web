"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import siteConfig from '@/config/site-config.json';
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
        { name: 'HOME', href: '/', tip: '首页' },
        { name: 'NEWS', href: '/news', tip: '新闻' },
        { name: 'GUIDE', href: `/${siteConfig.nowSeason}/guide`, tip: '赛事规则' },
        { name: 'SCHEDULE', href: `/${siteConfig.nowSeason}/schedule`, tip: '赛程安排' },
        { name: 'MAPPOOL', href: `/${siteConfig.nowSeason}/mapool`, tip: '图池' },
        { name: 'REGISTRATIONS', href: '/registrations', tip: '所有报名玩家' },
        { name: 'CONTACT', href: '/contact', tip: '联系我们' },
        { name: 'PHOTOS', href: `/${siteConfig.nowSeason}/photos`, tip: '历届荣誉展示' }
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <nav className={`${audiowide.className} antialiased`}>
            <div className="fixed top-0 left-0 w-full z-50 object-center font-bold">
                <img src="/NavbarBackground.svg" alt="Background" className="absolute inset-0 object-cover bg-center" style={{ zIndex: -1 }} />
                <div className="max-w-7xl mx-auto px-2">
                    <div className="flex justify-between items-center h-30">
                        {/* Logo */}
                        <div className="text-xl font-bold">
                            <Link href="/"><Image src='/AstaraCup.svg' alt='AstataCup' width={220} height={90} /></Link>
                        </div>

                        {/* Desktop Menu */}
                        <ul className="hidden md:flex space-x-8 text-[#FFFFFF] p-2 m-2">
                            {navLinks.map((link) => (
                                <li key={link.href} className="flex flex-col items-center relative text-shadow-lg">
                                    {activeLink === link.href && (
                                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 text-white text-2xl text-[#E93B66] text-left z-10 whitespace-nowrap">
                                            {link.tip}
                                        </span>
                                    )}
                                    <Link
                                        href={link.href}
                                        className={`hover:text-[#3BE9D8] transition duration-200 ${isActive(link.href) ? 'text-[#E93B66] font-semibold background-white' : ''}`}
                                        onClick={() => setActiveLink(link.href)}
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>


                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden flex flex-col items-left space-y-1 p-2"
                            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                            aria-expanded={isMobileMenuOpen}
                            aria-label="Toggle mobile menu"
                        >
                            <span className={`block w-4 h-0.5 bg-[#F38181] transition-transform ${isMobileMenuOpen ? 'rotate-45' : ''}`}></span>
                            <span className={`block w-4 h-0.5 bg-[#F38181] ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                            <span className={`block w-4 h-0.5 bg-[#F38181] transition-transform ${isMobileMenuOpen ? '-rotate-45' : ''}`}></span>
                        </button>
                    </div>

                    {/* Mobile Menu Panel */}
                    <div
                        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-120 py-4 opacity-100' : 'max-h-0 opacity-90'
                            }`}
                    >
                        <ul className="flex flex-col space-y-3 bg-[#F38181] p-4">
                            {navLinks.map((link) => (
                                <li key={link.href} className="flex flex-col items-center">
                                    {activeLink === link.href && (
                                        <span className="mb-1 text-xs text-white">{link.tip}</span>
                                    )}
                                    <Link
                                        href={link.href}
                                        className={`block py-3 px-4 rounded text-center hover:bg-gray-700 transition ${isActive(link.href) ? 'bg-gray-700 font-semibold' : ''}`}
                                        onClick={() => {
                                            setActiveLink(link.href);
                                            setMobileMenuOpen(false);
                                        }}
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </nav>
    );
}
