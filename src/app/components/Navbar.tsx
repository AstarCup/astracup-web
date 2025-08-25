"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import siteConfig from '@/config/site-config.json';


export default function Navbar() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navLinks = [
        { name: '主页', href: '/' },
        { name: '新闻', href: '/news' },
        { name: '赛事手册', href: `/${siteConfig.nowSeason}/guide` },
        { name: '赛程安排', href: `/${siteConfig.nowSeason}/schedule` },
        { name: '图池', href: `/${siteConfig.nowSeason}/mapool` },
        { name: '联系我们', href: '/contact' },
        { name: '荣誉', href: `/${siteConfig.nowSeason}/photos` }
    ];


    const isActive = (href: string) => pathname === href;

    return (
        <nav className="text-white fixed w-full top-0 z-80">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="text-xl font-bold">
                        <Link href="/"><Image src='/AstaraCup.svg' alt='AstataCup' width={120} height={60} /></Link>
                    </div>

                    {/* Desktop Menu */}
                    <ul className="hidden md:flex space-x-8 text-[#F38181] p-2 m-2">
                        {navLinks.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`hover:text-[#FCE38A] transition duration-200 ${isActive(link.href) ? 'text-[#95E1D3] font-semibold' : ''
                                        }`}
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
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`block py-3 px-4 rounded text-center hover:bg-gray-700 transition ${isActive(link.href) ? 'bg-gray-700 font-semibold' : ''
                                        }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </nav>
    );
}