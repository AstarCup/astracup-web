"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import localFont from "next/font/local";
import UserProfile from './UserProfile';
import { UserSession } from '@/lib/session';

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
    const [user, setUser] = useState<UserSession | null>(null);
    const [showUserProfile, setShowUserProfile] = useState(false);
    const [permissions, setPermissions] = useState({
        isMapSelector: false,
        isReplayTester: false,
        isAdmin: false
    });
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleDocumentClick = (event: MouseEvent) => {
            // Check if the click is outside the navbar menu
            const target = event.target as Element;
            if (!target.closest('.navbar-menu') && !target.closest('.user-profile-container')) {
                setClickedGroup(null);
                setShowUserProfile(false);
            }
        };

        if (clickedGroup || showUserProfile) {
            document.addEventListener('click', handleDocumentClick);
        }

        return () => {
            document.removeEventListener('click', handleDocumentClick);
        };
    }, [clickedGroup, showUserProfile]);

    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);

    // 获取用户session和权限
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // 获取用户session
                const sessionResponse = await fetch('/api/session/get');
                const sessionData = await sessionResponse.json();
                if (sessionData.success) {
                    setUser(sessionData.session);

                    // 获取用户权限
                    const permissionsResponse = await fetch('/api/user-permissions');
                    const permissionsData = await permissionsResponse.json();
                    if (permissionsData.success) {
                        setPermissions(permissionsData.permissions);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            }
        };

        fetchUserData();
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            setShowUserProfile(false);
            // 可以添加页面刷新或重定向
            window.location.reload();
        } catch (error) {
            console.error('Failed to logout:', error);
        }
    };

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
    // 动态构建导航组
    const navGroups = [
        {
            name: '主页与新闻',
            svg: '',
            links: [
                { name: 'HOME', href: '/', tip: '主页', svg: '' },
                { name: 'NEWS', href: '/news', tip: '新闻', svg: '' },
            ]
        },
        {
            name: '赛事信息',
            svg: '',
            links: [
                { name: 'GUIDE', href: `/guide`, tip: '赛事规则', svg: '' },
                { name: 'SCHEDULE', href: `/schedule`, tip: '赛程安排', svg: '' },
                { name: 'MAPPOOL', href: `/mapool`, tip: '图池', svg: '' },
                { name: 'REGISTRATIONS', href: '/registrations', tip: '所有报名玩家', svg: '' },
            ]
        },
        {
            name: '其他',
            svg: '',
            links: [
                { name: 'CONTACT', href: '/contact', tip: '联系我们', svg: '' },
                { name: 'PHOTOS', href: `/photos`, tip: '历届荣誉展示', svg: '' }
            ]
        },
        // 管理菜单 - 根据权限动态显示
        ...(permissions.isMapSelector || permissions.isReplayTester || permissions.isAdmin ? [{
            name: '管理',
            svg: '',
            links: [
                ...(permissions.isMapSelector || permissions.isAdmin ? [
                    { name: '选图系统', href: '/map-selection', tip: '地图选择管理', svg: '' }
                ] : []),
                ...(permissions.isReplayTester || permissions.isAdmin ? [
                    { name: '上传Replay', href: '/replay-collection', tip: '上传和收集Replay', svg: '' }
                ] : []),
                ...(permissions.isAdmin ? [
                    { name: '调试页面', href: '/debug', tip: '系统调试和测试', svg: '' }
                ] : [])
            ].filter(Boolean)
        }] : [])
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

                        {/* Right Side Container */}
                        <div className="flex items-center space-x-4">
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
                                                {group.svg ? (
                                                    <span
                                                        className="w-4 h-4 flex-shrink-0"
                                                        dangerouslySetInnerHTML={{ __html: group.svg }}
                                                    />
                                                ) : (
                                                    <span className="w-4 h-4 bg-transparent flex-shrink-0"></span>
                                                )}
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
                                                                className={`flex-1 p-3 text-left text-sm font-medium flex items-center gap-2 relative text-gray-800 ${isActive(link.href) ? 'bg-[#3BE9D8] font-bold' : ''}`}
                                                                onClick={() => {
                                                                    setActiveLink(link.href);
                                                                    setHoveredGroup(null);
                                                                    setClickedGroup(null);
                                                                }}
                                                            >
                                                                {link.svg ? (
                                                                    <span
                                                                        className="w-4 h-4 flex-shrink-0"
                                                                        dangerouslySetInnerHTML={{ __html: link.svg }}
                                                                    />
                                                                ) : (
                                                                    <span className="w-4 h-4 bg-transparent flex-shrink-0"></span>
                                                                )}
                                                                <div className="flex flex-col justify-center">
                                                                    <div className="text-xs opacity-75 font-bold mb-1 leading-tight">{link.name}</div>
                                                                    <div className="text-2xl font-bold leading-tight">{link.tip}</div>
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

                            {/* User Profile */}
                            <div className="hidden xl:flex items-center ml-4 user-profile-container">
                                {user ? (
                                    <div className="relative">
                                        <img
                                            src={user.avatar_url}
                                            alt={user.username}
                                            width={40}
                                            height={40}
                                            className="rounded-full outline outline-2 outline-[#E93B66] cursor-pointer hover:outline-[#3BE9D8] transition-all duration-200"
                                            onClick={() => setShowUserProfile(!showUserProfile)}
                                            onMouseEnter={() => setShowUserProfile(true)}
                                            onMouseLeave={() => setTimeout(() => setShowUserProfile(false), 300)}
                                            onError={(e) => {
                                                e.currentTarget.src = '/default-avatar.png';
                                            }}
                                        />
                                        {showUserProfile && (
                                            <div
                                                className="absolute top-full right-0 mt-2 bg-[#3d3d3d] shadow-lg p-4 min-w-80 z-50"
                                                onMouseEnter={() => setShowUserProfile(true)}
                                                onMouseLeave={() => setShowUserProfile(false)}
                                            >
                                                <UserProfile user={user} onLogout={handleLogout} />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => window.location.href = '/register'}
                                        className="bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-4 py-2 rounded-md transition-colors duration-200 font-medium"
                                    >
                                        登录
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Mobile User Profile */}
                        <div className="xl:hidden flex items-center mr-2">
                            {user ? (
                                <img
                                    src={user.avatar_url}
                                    alt={user.username}
                                    width={32}
                                    height={32}
                                    className="rounded-full outline outline-2 outline-[#E93B66]"
                                    onError={(e) => {
                                        e.currentTarget.src = '/default-avatar.png';
                                    }}
                                />
                            ) : (
                                <button
                                    onClick={() => window.location.href = '/register'}
                                    className="bg-[#E93B66] hover:bg-[#3BE9D8] text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                                >
                                    登录
                                </button>
                            )}
                        </div>

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
                                            className={`flex-1 p-3 text-left text-sm font-medium flex items-center gap-2 relative ${isActive(link.href) ? 'bg-[#3BE9D8] font-bold' : 'text-gray-800 '}`}
                                            onClick={() => {
                                                setActiveLink(link.href);
                                                setMobileMenuOpen(false);
                                            }}
                                        >
                                            {link.svg ? (
                                                <span
                                                    className="w-4 h-4 flex-shrink-0"
                                                    dangerouslySetInnerHTML={{ __html: link.svg }}
                                                />
                                            ) : (
                                                <span className="w-4 h-4 bg-transparent flex-shrink-0"></span>
                                            )}
                                            <div className="flex flex-col justify-center">
                                                <div className="text-xs opacity-75 font-bold mb-1 leading-tight">{link.name}</div>
                                                <div className="text-2xl font-bold leading-tight">{link.tip}</div>
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
