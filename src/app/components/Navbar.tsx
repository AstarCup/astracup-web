"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { UserSession } from '@/lib/permissions';
import MessageNotification from './ui/MessageNotification';
import { DynamicIcon } from 'lucide-react/dynamic';


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
    const [setVersionInfo] = useState<string>('');
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
            svg: 'house',
            links: [
                { name: 'HOME', href: '/', tip: '主页', svg: 'house' },
                { name: 'NEWS', href: '/news', tip: '新闻', svg: 'newspaper' },
                { name: 'BLOG', href: 'https://blog.rino.ink', tip: 'Acricle', svg: 'rss' },
            ]
        },
        {
            name: '赛事信息',
            svg: 'book-alert',
            links: [
                { name: 'GUIDE', href: `/guide`, tip: '赛事规则', svg: 'panel-top-dashed' },
                { name: 'SCHEDULE', href: `/schedule`, tip: '赛程安排', svg: 'calendar-check-2' },
                { name: 'MAPPOOL', href: `/mappool`, tip: '图池', svg: 'table-2' },
                { name: 'REGISTRATIONS', href: '/registrations', tip: '所有报名玩家', svg: 'users-round' },
            ]
        },
        {
            name: '其他',
            svg: 'circle',
            links: [
                { name: 'CONTACT', href: '/contact', tip: '联系我们', svg: 'contact' },
                { name: 'PHOTOS', href: `/photos`, tip: '历届荣誉展示', svg: 'trophy' }
            ]
        },
        // 管理菜单 - 根据权限动态显示，只有在权限加载完成且有权限时才显示
        ...(!permissionsLoading && (permissions.isMapSelector || permissions.isReplayTester || permissions.isAdmin || permissions.isReferee || permissions.isStreamer || permissions.isCommentator) ? [{
            name: '管理',
            svg: 'user-star',
            links: [
                { name: 'STAFF PANEL', href: '/staff-dashboard', tip: '管理比赛安排', svg: 'user-star' }
            ]
        }] : [])
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <nav className={`antialiased select-none pointer-events-none justify-center w-full`}>
            <div className="fixed top-0 left-0 w-full z-50 object-center font-bold select-none mt-4">
                <div className=" mx-auto px-10 rounded-b-lg">
                    <div className="flex justify-between items-center h-20 select-none pointer-events-none">
                        {/* Logo */}
                        <div className="text-xl font-bold pointer-events-auto">
                            <Link href="/" className='flex flex-row items-center font-bold text-gray-400 hover:scale-[1.05] active:scale-[0.95] hover:-rotate-5 transition-all duration-200'><Image src='/colLogo.svg' alt='AstataCup' width={120} height={90} /></Link>
                        </div>

                        {/* Right Side Container */}
                        <div className="flex items-center space-x-4 pointer-events-auto bg-white px-4 rounded-lg">
                            {/* Desktop Menu */}
                            <ul className="hidden xl:flex space-x-8 text-gray-600 p-2 m-2 navbar-menu">
                                {navGroups.map((group) => (
                                    <li key={group.name} className="relative">
                                        <button
                                            className="flex gap-4 flex-col group items-center justify-center relative cursor-pointer hover:bg-gray-200 hover:font-bold rounded-lg border-b-4 border-white hover:border-pink-400 hover:text-[#E93B66] transition-all duration-200"
                                            onMouseEnter={() => handleMouseEnter(group.name)}
                                            onMouseLeave={handleMouseLeave}
                                            onClick={() => handleGroupClick(group.name)}
                                        >
                                            <span className={`flex items-center gap-2 px-2 py-1 transition-full duration-200 ${shouldShowGroup(group.name) ? 'text-gray-800' : 'text-gray-600'}`}>
                                                {group.name}
                                                {group.svg ? (
                                                    <DynamicIcon name={group.svg as any} className="w-6 h-6 flex-shrink-0 group-hover:scale-[1.1] group-active:scale-[0.9] transition-all duration-200" color='pink' />
                                                ) : (
                                                    <span className="w-4 h-4 bg-transparent flex-shrink-0"></span>
                                                )}
                                            </span>
                                            {shouldShowGroup(group.name) && (
                                                <div
                                                    className="absolute top-full left-0 mt-3 bg-transparent overflow-hidden z-50 duration-300 ease-in-out transform-full origin-top"
                                                    style={{
                                                        minWidth: '250px'
                                                    }}
                                                    onMouseEnter={() => handleMouseEnter(group.name)}
                                                    onMouseLeave={handleMouseLeave}
                                                >
                                                    {group.links.map((link) => (
                                                        <button key={link.href} className="rounded-lg bg-white hover:bg-gray-200 active:scale-[0.9] transition-full duration-200 min-h-20 flex mb-2 last:mb-0">
                                                            <Link
                                                                href={link.href}
                                                                className={`flex-1 p-3 text-left text-sm font-medium flex items-end gap-2 relative text-gray-800 border-pink-400 border-b-4 rounded-lg ${isActive(link.href) ? 'bg-gray-600 text-white border-gray-400 font-bold rounded-lg' : ''}`}
                                                            >
                                                                <div className="flex flex-col justify-end">
                                                                    <div className="text-xs opacity-75 font-bold mb-1 leading-tight">{link.name}</div>
                                                                    <div className="text-2xl font-bold leading-tight">{link.tip}</div>
                                                                </div>
                                                                {link.svg ? (
                                                                    <DynamicIcon name={link.svg as any} className="w-8 h-8 hover:scale-[1.1] active:scale-[0.9] transition-all duration-200" color={`${isActive(link.href) ? `white` : `pink`}`} />
                                                                ) : (
                                                                    <span className="w-4 h-4 bg-transparent flex-shrink-0"></span>
                                                                )}
                                                            </Link>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            {/* User Profile */}
                            <div className="hidden relative xl:flex items-center ml-4">
                                {user ? (

                                    <MessageNotification />
                                ) : (
                                    <div></div>
                                )}
                                <div className='mr-4'>
                                    <div className='absolute text-right text-4xl top-11 right-10 text-gray-300 z-1'>{user?.username || ''}</div>
                                </div>
                                {user ? (
                                    <Link href="/player-info" className='group relative w-20 h-20'>
                                        <Image
                                            src={avatarSrc}
                                            alt={user.username}
                                            width={80}
                                            height={80}
                                            className="absolute top-0 -right-10 rounded-lg cursor-pointer group-hover:border-b-20 border-pink-400 transition-all duration-200"
                                            onError={handleAvatarError}
                                        />
                                        <p className='absolute invisible text-right text-white -bottom-5 left-13 group-hover:visible'>Profile〉</p>
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => window.location.href = '/register'}
                                        className="bg-gray-200 hover:bg-gray-400 hover:text-white hover:scale-[1.1] active:scale-[0.9] font-bold text-gray-600 border-b-4 border-pink-200 px-4 py-2 rounded-md transition-all duration-200"
                                    >
                                        使用osu!登录
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Mobile Right Side */}
                        <div className="xl:hidden flex items-center justify-end space-x-2 pointer-events-auto">
                            {/* Mobile User Profile */}
                            <div className="flex items-center pointer-events-auto">
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
                                className="flex flex-col items-center space-y-1 p-2 pointer-events-auto"
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
                        className={`xl:hidden pointer-events-auto overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-screen py-0 opacity-100' : 'max-h-0 opacity-0'
                            }`}
                    >
                        <div className="max-h-120 overflow-y-auto p-4 bg-black/50">
                            <div className="space-y-6">
                                {navGroups.map((group) => (
                                    <div key={group.name}>
                                        {/* Group Title */}
                                        <div className="bg-white text-gray text-2xl px-4 py-2 mb-3 inline-flex items-center gap-3">
                                            {group.svg ? (
                                                <DynamicIcon name={group.svg as any} className="w-6 h-6 flex-shrink-0" />
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
                                                            <DynamicIcon name={link.svg as any} className="w-6 h-6 flex-shrink-0 filter brightness-0 saturate-0 opacity-80 transition-all duration-200" />
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
                                                <div className="text-gray-300 text-xs">比赛预约</div>
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
