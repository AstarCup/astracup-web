"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import localFont from "next/font/local";
import { UserSession } from '@/lib/permissions';
import MessageNotification from './ui/MessageNotification';

const audiowide = localFont({
    src: "../font/Audiowide-Regular.ttf",
    display: "auto",
});

export default function Navbar() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
    const [clickedGroup, setClickedGroup] = useState<string | null>(null);
    const [user, setUser] = useState<UserSession | null>(null);
    const [avatarSrc, setAvatarSrc] = useState<string>('');
    const [permissions, setPermissions] = useState({
        isMapSelector: false,
        isReplayTester: false,
        isAdmin: false,
        isStreamer: false,
        isReferee: false,
        isCommentator: false
    });
    const [permissionsLoading, setPermissionsLoading] = useState(true);
    const [versionInfo, setVersionInfo] = useState<string>('');
    const [iconCache, setIconCache] = useState<Map<string, boolean>>(new Map());
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleAvatarError = () => {
        setAvatarSrc('/default-avatar.png');
    };

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

    // 获取版本信息
    useEffect(() => {
        const getVersionInfo = async () => {
            try {
                // 获取版本信息
                const response = await fetch('/api/version');
                if (response.ok) {
                    const data = await response.json();
                    if (data.version) {
                        setVersionInfo(data.version);
                        return;
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch version info:', error);
            }

            // 如果获取不到，使用本地时间格式作为fallback
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            setVersionInfo(`${year}${month}${day}-${hours}${minutes}`);
        };

        getVersionInfo();
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
                    setAvatarSrc(sessionData.session?.avatar_url || '');

                    // 通过API获取用户权限
                    if (sessionData.session?.osuId) {
                        setPermissionsLoading(true);
                        try {
                            const permissionsResponse = await fetch(`/api/user-permissions?osuId=${sessionData.session.osuId}`);
                            if (permissionsResponse.ok) {
                                const permissionsData = await permissionsResponse.json();
                                setPermissions(permissionsData.permissions);
                            }
                        } catch (error) {
                            console.error('Failed to fetch user permissions:', error);
                        } finally {
                            setPermissionsLoading(false);
                        }
                    } else {
                        setPermissionsLoading(false);
                    }
                } else {
                    setPermissionsLoading(false);
                }
            } catch (error) {
                console.error('Failed to fetch user data:', error);
                setPermissionsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // 预加载图标
    useEffect(() => {
        const preloadIconsAsync = async () => {
            const allIcons = [
                // 主导航图标
                '/icons/home.svg',
                '/icons/news.svg',
                '/icons/tournament.svg',
                '/icons/guide-sm.svg',
                '/icons/table-fill.svg',
                '/icons/mapool-sm.svg',
                '/icons/register.svg',
                '/icons/others.svg',
                '/icons/contacts.svg',
                '/icons/photos.svg',
                '/icons/admin-fill.svg',
                '/icons/upload.svg',
                '/icons/debug.svg'
            ];

            for (const iconPath of allIcons) {
                setIconCache(prevCache => {
                    if (prevCache.has(iconPath)) {
                        return prevCache; // 已缓存，跳过
                    }

                    // 异步预加载
                    fetch(iconPath)
                        .then(response => {
                            setIconCache(prevCache => {
                                const newCache = new Map(prevCache);
                                newCache.set(iconPath, response.ok);
                                return newCache;
                            });
                        })
                        .catch(error => {
                            console.warn(`Failed to preload icon: ${iconPath}`, error);
                            setIconCache(prevCache => {
                                const newCache = new Map(prevCache);
                                newCache.set(iconPath, false);
                                return newCache;
                            });
                        });

                    // 立即标记为正在加载
                    const newCache = new Map(prevCache);
                    newCache.set(iconPath, false);
                    return newCache;
                });
            }
        };

        preloadIconsAsync();
    }, []); // 只在组件挂载时执行一次

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



    // Check if a group should be shown (either hovered or clicked)
    const shouldShowGroup = (groupName: string) => {
        return hoveredGroup === groupName || clickedGroup === groupName;
    };
    // 动态构建导航组
    const navGroups = [
        {
            name: '主页与新闻',
            svg: '/icons/home.svg',
            links: [
                { name: 'HOME', href: '/', tip: '主页', svg: '/icons/home.svg' },
                { name: 'NEWS', href: '/news', tip: '新闻', svg: '/icons/news.svg' },
            ]
        },
        {
            name: '赛事信息',
            svg: '/icons/tournament.svg',
            links: [
                { name: 'GUIDE', href: `/guide`, tip: '赛事规则', svg: '/icons/guide-sm.svg' },
                { name: 'SCHEDULE', href: `/schedule`, tip: '赛程安排', svg: '/icons/table-fill.svg' },
                { name: 'MAPPOOL', href: `/mapool`, tip: '图池', svg: '/icons/mapool-sm.svg' },
                { name: 'REGISTRATIONS', href: '/registrations', tip: '所有报名玩家', svg: '/icons/register.svg' },
            ]
        },
        {
            name: '其他',
            svg: '/icons/others.svg',
            links: [
                { name: 'CONTACT', href: '/contact', tip: '联系我们', svg: '/icons/contacts.svg' },
                { name: 'PHOTOS', href: `/photos`, tip: '历届荣誉展示', svg: '/icons/photos.svg' }
            ]
        },
        // 管理菜单 - 根据权限动态显示，只有在权限加载完成且有权限时才显示
        ...(!permissionsLoading && (permissions.isMapSelector || permissions.isReplayTester || permissions.isAdmin || permissions.isReferee || permissions.isStreamer || permissions.isCommentator) ? [{
            name: '管理',
            svg: '/icons/admin-fill.svg',
            links: [
                { name: 'STAFF PANEL', href: '/staff-dashboard', tip: '管理比赛安排', svg: '/icons/admin-fill.svg' }
            ]
        }] : [])
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <nav className={`${audiowide.className} antialiased`}>
            <div className="fixed top-0 left-0 w-full z-50 object-center font-bold">

                <div className="absolute inset-0" style={{
                    zIndex: -20,
                    background: 'linear-gradient(to bottom, rgba(0,0,0, 0.6) 10%, rgba(0,0,0, 0.3) 50%, rgba(0,0,0, 0.1) 80%, rgba(233, 59, 102, 0) 100%)'
                }}></div>
                <div className="absolute inset-0 backdrop-blur-lg" style={{
                    zIndex: -20,
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 10%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.3) 80%, rgba(0,0,0,0) 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 10%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.3) 80%, rgba(0,0,0,0) 100%)'
                }}></div>



                <Image src="/NavbarBackground.svg" alt="Background" fill className="absolute inset-0 object-cover bg-center bg-repeat-x" style={{ zIndex: -2 }} />


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
                                {/* 调试信息 - 仅开发环境显示 */}
                                {process.env.NODE_ENV === 'development' && (
                                    <li className="text-xs text-yellow-300 bg-black/50 px-2 py-1 rounded">
                                        权限加载: {permissionsLoading ? '加载中...' : '完成'} |
                                        用户: {user ? user.osuId : '未登录'} |
                                        管理员: {permissions.isAdmin ? '是' : '否'} |
                                        裁判: {permissions.isReferee ? '是' : '否'} |
                                        主播: {permissions.isStreamer ? '是' : '否'} |
                                        解说: {permissions.isCommentator ? '是' : '否'}
                                    </li>
                                )}
                                {navGroups.map((group) => (
                                    <li key={group.name} className="relative">
                                        <div
                                            className="flex flex-col items-center relative text-shadow-lg cursor-pointer hover:text-[#E93B66] transition duration-200"
                                            onMouseEnter={() => handleMouseEnter(group.name)}
                                            onMouseLeave={handleMouseLeave}
                                            onClick={() => handleGroupClick(group.name)}
                                        >
                                            <span className={`flex items-center gap-2 px-2 py-1 transition-colors duration-200 ${shouldShowGroup(group.name) ? 'bg-white text-gray-800' : 'text-[#FFFFFF]'}`}>
                                                {group.svg ? (
                                                    <Image
                                                        src={group.svg}
                                                        alt={group.name}
                                                        width={24}
                                                        height={24}
                                                        className={`flex-shrink-0 transition-all duration-200 ${shouldShowGroup(group.name) ? 'filter brightness-0 saturate-0 opacity-80' : ''}`}
                                                        loading="eager"
                                                        priority={true}
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
                                                        <div key={link.href} className="border-b-4 border-[#E93B66] bg-white hover:bg-[#3BE9D8] hover:border-[#ffffff] transition-colors duration-200 min-h-20 flex mb-2 last:mb-0">
                                                            <Link
                                                                href={link.href}
                                                                className={`flex-1 p-3 text-left text-sm font-medium flex items-center gap-2 relative text-gray-800 ${isActive(link.href) ? 'bg-[#3BE9D8] font-bold' : ''}`}
                                                            >
                                                                {link.svg ? (
                                                                    <Image
                                                                        src={link.svg}
                                                                        alt={link.name}
                                                                        width={48}
                                                                        height={48}
                                                                        className="flex-shrink-0 filter brightness-0 saturate-0 opacity-80 transition-all duration-200"
                                                                        loading="eager"
                                                                        priority={true}
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
                            <div className="hidden xl:flex items-center ml-4">
                                <MessageNotification />
                                {user ? (
                                    <Link href="/player-info">
                                        <Image
                                            src={avatarSrc}
                                            alt={user.username}
                                            width={40}
                                            height={40}
                                            className="rounded-full outline outline-2 outline-[#E93B66] cursor-pointer hover:outline-[#3BE9D8] hover:scale-110 hover:shadow-lg hover:shadow-[#E93B66]/50 transition-all duration-200"
                                            onError={handleAvatarError}
                                        />
                                    </Link>
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

                        {/* Mobile Right Side */}
                        <div className="xl:hidden flex items-center justify-end space-x-2">
                            {/* Mobile User Profile */}
                            <div className="flex items-center">
                                {user ? (
                                    <Image
                                        src={avatarSrc}
                                        alt={user.username}
                                        width={32}
                                        height={32}
                                        className="rounded-full outline outline-2 outline-[#E93B66]"
                                        onError={handleAvatarError}
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
                                className="flex flex-col items-center space-y-1 p-2"
                                onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                                aria-expanded={isMobileMenuOpen}
                                aria-label="Toggle mobile menu"
                            >
                                <span className={`block w-4 h-0.5 bg-[#3BE9D8] transition-transform ${isMobileMenuOpen ? 'rotate-45' : ''}`}></span>
                                <span className={`block w-4 h-0.5 bg-[#3BE9D8] ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                                <span className={`block w-4 h-0.5 bg-[#3BE9D8] transition-transform ${isMobileMenuOpen ? '-rotate-45' : ''}`}></span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Panel */}
                    <div
                        className={`xl:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-screen py-0 opacity-100' : 'max-h-0 opacity-0'
                            }`}
                    >
                        <div className="max-h-120 overflow-y-auto p-4 bg-black/50">
                            <div className="space-y-6">
                                {navGroups.map((group) => (
                                    <div key={group.name}>
                                        {/* Group Title */}
                                        <div className="bg-white text-gray text-2xl px-4 py-2 mb-3 inline-flex items-center gap-3">
                                            {group.svg ? (
                                                <Image
                                                    src={group.svg}
                                                    alt={group.name}
                                                    width={24}
                                                    height={24}
                                                    className="flex-shrink-0 filter brightness-0"
                                                    loading="eager"
                                                    priority={true}
                                                />
                                            ) : (
                                                <span className="w-4 h-4 bg-transparent flex-shrink-0"></span>
                                            )}
                                            <span className="font-bold text-sm">{group.name}</span>
                                        </div>
                                        {/* Group Links Grid */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {group.links.map((link) => (
                                                <div key={link.href} className="border-b-4 border-[#E93B66] bg-white/100 hover:bg-[#3BE9D8] hover:border-[#ffffff] transition-colors duration-200 min-h-16 flex overflow-hidden">
                                                    <Link
                                                        href={link.href}
                                                        className={`flex-1 p-3 text-left text-sm font-medium flex items-center gap-2 relative ${isActive(link.href) ? 'bg-[#3BE9D8] font-bold' : 'text-gray-800'}`}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                    >
                                                        {link.svg ? (
                                                            <Image
                                                                src={link.svg}
                                                                alt={link.name}
                                                                width={32}
                                                                height={32}
                                                                className="flex-shrink-0 filter brightness-0 saturate-0 opacity-80 transition-all duration-200"
                                                                loading="eager"
                                                                priority={true}
                                                            />
                                                        ) : (
                                                            <span className="w-4 h-4 bg-transparent flex-shrink-0"></span>
                                                        )}
                                                        <div className="flex flex-col justify-center">
                                                            <div className="text-xs opacity-75 font-bold mb-1 leading-tight">{link.name}</div>
                                                            <div className="text-lg font-bold leading-tight">{link.tip}</div>
                                                        </div>
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Mobile User Profile */}
                            {user && (
                                <div className="mt-4 pt-4 border-t border-gray-300">
                                    <Link href="/player-info" onClick={() => setMobileMenuOpen(false)}>
                                        <div className="flex items-center gap-3 p-3 bg-[#3d3d3d] rounded-md cursor-pointer hover:bg-[#4d4d4d] transition-colors duration-200">
                                            <Image
                                                src={avatarSrc}
                                                alt={user.username}
                                                width={40}
                                                height={40}
                                                className="rounded-full outline outline-2 outline-[#E93B66]"
                                                onError={handleAvatarError}
                                            />
                                            <div className="flex-1">
                                                <div className="text-white font-bold text-sm">{user.username}</div>
                                                <div className="text-gray-300 text-xs">点击查看详细信息</div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
