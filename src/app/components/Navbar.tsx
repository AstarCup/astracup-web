"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import localFont from "next/font/local";

const audiowide = localFont({
    src: "./font/Audiowide-Regular.ttf",
    display: "auto",
});

export default function Navbar() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeLink, setActiveLink] = useState<string>(pathname);
    const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
    const [clickedGroup, setClickedGroup] = useState<string | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleDocumentClick = (event: MouseEvent) => {
            // Check if the click is outside the navbar menu
            const target = event.target as Element;
            if (!target.closest('.navbar-menu')) {
                setClickedGroup(null);
            }
        };

        if (clickedGroup) {
            document.addEventListener('click', handleDocumentClick);
        }

        return () => {
            document.removeEventListener('click', handleDocumentClick);
        };
    }, [clickedGroup]);

    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);

    const handleMouseEnter = (groupName: string) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        setHoveredGroup(groupName);
    };

    const handleMouseLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredGroup(null);
        }, 300); // 300ms delay before hiding
    };

    const handleGroupClick = (groupName: string) => {
        if (clickedGroup === groupName) {
            setClickedGroup(null);
        } else {
            setClickedGroup(groupName);
        }
    };

    const handleClickOutside = () => {
        setClickedGroup(null);
    };

    // Check if a group should be shown (either hovered or clicked)
    const shouldShowGroup = (groupName: string) => {
        return hoveredGroup === groupName || clickedGroup === groupName;
    };
    const navGroups = [
        {
            name: '主页与新闻',
            links: [
                { name: 'HOME', href: '/', tip: '主页' },
                { name: 'NEWS', href: '/news', tip: '新闻' },
            ]
        },
        {
            name: '赛事信息',
            links: [
                { name: 'GUIDE', href: `/guide`, tip: '赛事规则' },
                { name: 'SCHEDULE', href: `/schedule`, tip: '赛程安排' },
                { name: 'MAPPOOL', href: `/mapool`, tip: '图池' },
                { name: 'REGISTRATIONS', href: '/registrations', tip: '所有报名玩家' },
            ]
        },
        {
            name: '其他',
            links: [

                { name: 'CONTACT', href: '/contact', tip: '联系我们' },
                { name: 'PHOTOS', href: `/photos`, tip: '历届荣誉展示' }
            ]
        }
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

                <img src="/NavbarBackground.svg" alt="Background" className="absolute inset-0 object-cover bg-center opacity-90 bg-repeat-x" style={{ zIndex: -2 }} />


                <div className="max-w-7xl mx-auto px-2">
                    <div className="flex justify-between items-center h-30">
                        {/* Logo */}
                        <div className="text-xl font-bold">
                            <Link href="/"><Image src='/AstaraCup.svg' alt='AstataCup' width={220} height={90} /></Link>
                        </div>

                        {/* Desktop Menu */}
                        <ul className="hidden xl:flex space-x-8 text-[#FFFFFF] p-2 m-2 navbar-menu">
                            {navGroups.map((group, groupIndex) => (
                                <li key={group.name} className="relative">
                                    <div
                                        className="flex flex-col items-center relative text-shadow-lg cursor-pointer hover:text-[#E93B66] transition duration-200"
                                        onMouseEnter={() => handleMouseEnter(group.name)}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => handleGroupClick(group.name)}
                                    >
                                        <span className={`flex items-center gap-2 px-2 py-1 transition-colors duration-200 ${shouldShowGroup(group.name) ? 'bg-white text-gray-800' : 'text-[#FFFFFF]'}`}>
                                            <span className="w-4 h-4 bg-transparent"></span>
                                            {group.name}
                                        </span>
                                        {shouldShowGroup(group.name) && (
                                            <div
                                                className="absolute top-full right-0 mt-2 bg-transparent overflow-hidden z-50 transition-all duration-300 ease-in-out transform origin-top"
                                                style={{
                                                    minWidth: '250px'
                                                }}
                                                onMouseEnter={() => handleMouseEnter(group.name)}
                                                onMouseLeave={handleMouseLeave}
                                            >
                                                {group.links.map((link) => (
                                                    <div key={link.href} className="border-b-4 border-[#E93B66] bg-white/100 hover:bg-[#3BE9D8] hover:border-[#ffffff] transition-colors duration-200 min-h-20 flex mb-2 last:mb-0">
                                                        <Link
                                                            href={link.href}
                                                            className={`flex-1 p-3 text-left text-sm font-medium flex flex-col justify-center relative text-gray-800 ${isActive(link.href) ? 'bg-[#3BE9D8] font-bold' : ''}`}
                                                            onClick={() => {
                                                                setActiveLink(link.href);
                                                                setHoveredGroup(null);
                                                                setClickedGroup(null);
                                                            }}
                                                        >
                                                            <div className="text-xs opacity-75 font-bold mb-1 leading-tight relative z-10">{link.name}
                                                            </div>
                                                            <div className="text-2xl font-bold leading-tight inline-flex relative z-10">{link.tip}
                                                            </div>
                                                        </Link>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
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
                                {navGroups.flatMap(group => group.links).map((link) => (
                                    <div key={link.href} className="border-b-4 border-[#E93B66] bg-white/100 hover:bg-[#3BE9D8] hover:border-[#ffffff] transition-colors duration-200 min-h-20 flex">
                                        <Link
                                            href={link.href}
                                            className={`flex-1 p-3 text-left text-sm font-medium flex flex-col justify-center relative ${isActive(link.href) ? 'bg-[#3BE9D8] font-bold' : 'text-gray-800 '}`}
                                            onClick={() => {
                                                setActiveLink(link.href);
                                                setMobileMenuOpen(false);
                                            }}
                                        >
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
