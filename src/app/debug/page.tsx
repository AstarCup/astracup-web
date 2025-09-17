"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAdminUser, UserSession } from "@/lib/session";
import { TournamentRegistration } from "@/lib/edge-registrations";

export default function DebugPage() {
    const router = useRouter();
    const [envInfo, setEnvInfo] = useState<Record<string, string>>({});
    const [serverEnvInfo, setServerEnvInfo] = useState<Record<string, string>>({});
    const [userSession, setUserSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
    const [registrationsLoading, setRegistrationsLoading] = useState(false);
    const [deletingUser, setDeletingUser] = useState<string | null>(null);

    // Staff 生成器相关状态
    const [staffUsername, setStaffUsername] = useState('');
    const [staffRole, setStaffRole] = useState('organizers');
    const [staffDescription, setStaffDescription] = useState('');
    const [staffLoading, setStaffLoading] = useState(false);
    const [generatedStaffData, setGeneratedStaffData] = useState<any>(null);

    useEffect(() => {
        // 检查用户会话和权限
        fetch('/api/session/get', {
            credentials: 'include' // 确保发送cookie
        })
            .then(response => response.json())
            .then(data => {
                // console.log('Debug session data:', data);
                if (data.success && data.session) {
                    setUserSession(data.session);
                    setIsAdmin(data.session.username === 'AeCw');
                } else {
                    // 未登录，重定向到首页
                    router.push('/');
                }
            })
            .catch(error => {
                console.error('Failed to fetch session:', error);
                router.push('/');
            });

        // 获取客户端环境变量信息
        const clientInfo = {
            OSU_CLIENT_ID: process.env.OSU_CLIENT_ID || "NOT_SET (Client)",
            OSU_CLIENT_SECRET: process.env.OSU_CLIENT_SECRET ? "SET" : "NOT_SET (Client)",
            OSU_REDIRECT_URI: process.env.OSU_REDIRECT_URI || "NOT_SET (Client)",
            NODE_ENV: process.env.NODE_ENV || "NOT_SET (Client)",
        };

        setEnvInfo(clientInfo);

        // 从服务器API获取环境变量信息
        fetch('/api/debug/env')
            .then(response => response.json())
            .then(data => {
                setServerEnvInfo(data.environment);
                setLoading(false);
            })
            .catch(error => {
                console.error('Failed to fetch server env:', error);
                setLoading(false);
            });
    }, [router]);

    // 获取注册用户列表
    const fetchRegistrations = async () => {
        try {
            setRegistrationsLoading(true);
            const response = await fetch('/api/edge-registrations');

            if (!response.ok) {
                throw new Error('Failed to fetch registrations');
            }

            const data = await response.json();
            setRegistrations(data.registrations || []);
        } catch (error) {
            console.error('Error fetching registrations:', error);
            alert('获取注册数据失败');
        } finally {
            setRegistrationsLoading(false);
        }
    };

    // 删除用户注册信息
    const handleDeleteRegistration = async (osuId: string, username: string) => {
        if (!confirm(`确定要删除用户 ${username} (ID: ${osuId}) 的注册信息吗？此操作不可恢复！`)) {
            return;
        }

        try {
            setDeletingUser(osuId);
            const response = await fetch('/api/debug/delete-registration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ osuId }),
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);
                // 刷新注册列表
                fetchRegistrations();
            } else {
                alert(`删除失败: ${data.error}`);
            }
        } catch (error) {
            console.error('Error deleting registration:', error);
            alert('删除用户注册信息时发生错误');
        } finally {
            setDeletingUser(null);
        }
    };

    // 审核通过用户注册
    const handleApproveRegistration = async (osuId: string, username: string) => {
        if (!confirm(`确定要审核通过用户 ${username} (ID: ${osuId}) 的注册信息吗？`)) {
            return;
        }

        try {
            setDeletingUser(osuId);
            const response = await fetch('/api/debug/approve-registration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ osuId }),
            });

            const data = await response.json();

            if (data.success) {
                alert(data.message);
                // 刷新注册列表
                fetchRegistrations();
            } else {
                alert(`审核失败: ${data.error}`);
            }
        } catch (error) {
            console.error('Error approving registration:', error);
            alert('审核用户注册信息时发生错误');
        } finally {
            setDeletingUser(null);
        }
    };

    // 生成 Staff 数据
    const generateStaffData = async () => {
        if (!staffUsername.trim()) {
            alert('请输入用户名');
            return;
        }

        setStaffLoading(true);
        try {
            const response = await fetch(`/api/osu-user?username=${encodeURIComponent(staffUsername)}`);
            console.log('API 响应状态:', response.status);

            if (response.ok) {
                const userData = await response.json();

                // 调试：打印原始数据
                console.log('原始用户数据:', userData);
                console.log('Cover 数据:', userData.cover);
                console.log('Avatar URL:', userData.avatar_url);

                // 检查是否有 cover 数据但是为 undefined 或 null
                if (userData.cover === undefined) {
                    console.log('Cover 字段为 undefined');
                } else if (userData.cover === null) {
                    console.log('Cover 字段为 null');
                } else {
                    console.log('Cover 字段存在:', userData.cover);
                }

                // 角色映射
                const roleMapping: Record<string, string> = {
                    'organizers': '主办方',
                    'administrators': '管理团队',
                    'referees': '裁判',
                    'mappool_selectors': '图池选择',
                    'streamers': '直播团队',
                    'commentators': '解说团队',
                    'designers': '设计团队'
                };

                const staffData = {
                    name: userData.username,
                    osuId: userData.id.toString(),
                    avatarUrl: userData.avatar_url || `https://a.ppy.sh/${userData.id}`,
                    role: roleMapping[staffRole] || staffRole,
                    description: staffDescription.trim() || `${roleMapping[staffRole] || staffRole} 成员`,
                    coverUrl: userData.cover?.custom_url || userData.cover?.url || null
                };

                setGeneratedStaffData(staffData);
            } else {
                alert('获取用户数据失败');
            }
        } catch (error) {
            console.error('Error generating staff data:', error);
            alert('生成 Staff 数据时发生错误');
        } finally {
            setStaffLoading(false);
        }
    };    // 复制 JSON 到剪贴板
    const copyToClipboard = () => {
        if (generatedStaffData) {
            navigator.clipboard.writeText(JSON.stringify(generatedStaffData, null, 2));
            alert('已复制到剪贴板');
        }
    };

    // 如果用户未登录或不是管理员，显示提示信息
    if (!userSession || (userSession && !isAdmin)) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
                    <h1 className="text-3xl font-bold text-red-600 mb-6">
                        {!userSession ? '请先登录' : '权限不足'}
                    </h1>
                    <p className="text-lg text-gray-700 mb-4">
                        {!userSession
                            ? '您需要登录后才能访问此页面'
                            : '您没有权限访问调试页面'
                        }
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
                    >
                        返回首页
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">调试面板 - 管理员权限</h1>

                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-3">环境变量状态</h2>
                    <div className="bg-gray-100 p-4 rounded-md">
                        <pre className="text-sm">
                            {JSON.stringify(envInfo, null, 2)}
                        </pre>
                    </div>
                </div>

                {loading ? (
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-3">服务器环境变量</h2>
                        <div className="bg-blue-50 p-4 rounded-md">
                            <p className="text-sm">加载中...</p>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-3">服务器环境变量</h2>
                        <div className="bg-blue-50 p-4 rounded-md">
                            <pre className="text-sm">
                                {JSON.stringify(serverEnvInfo, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-3">数据库操作</h2>
                    <div className="bg-green-50 p-4 rounded-md space-y-3">
                        <button
                            onClick={async () => {
                                try {
                                    const response = await fetch('/api/init-database');
                                    const data = await response.json();
                                    alert(`数据库初始化结果: ${JSON.stringify(data)}`);
                                } catch (error) {
                                    alert('数据库初始化失败: ' + error);
                                }
                            }}
                            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 mr-3"
                        >
                            初始化数据库
                        </button>

                        <button
                            onClick={async () => {
                                try {
                                    const response = await fetch('/api/edge-registrations');
                                    const data = await response.json();
                                    alert(`注册数据: ${JSON.stringify(data.registrations, null, 2)}`);
                                } catch (error) {
                                    alert('获取注册数据失败: ' + error);
                                }
                            }}
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mr-3"
                        >
                            查看注册数据
                        </button>

                        <button
                            onClick={async () => {
                                if (confirm('确定要清空所有注册数据吗？此操作不可恢复！')) {
                                    try {
                                        const response = await fetch('/api/debug/clear-registrations', {
                                            method: 'POST'
                                        });
                                        const data = await response.json();
                                        alert(`清空结果: ${JSON.stringify(data)}`);
                                    } catch (error) {
                                        alert('清空数据失败: ' + error);
                                    }
                                }
                            }}
                            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 mr-3"
                        >
                            清空注册数据
                        </button>

                        <button
                            onClick={async () => {
                                if (confirm('确定要升级数据库吗？这将在现有表结构上添加审核状态字段。')) {
                                    try {
                                        const response = await fetch('/api/debug/upgrade-database', {
                                            method: 'POST'
                                        });
                                        const data = await response.json();
                                        alert(`升级结果: ${JSON.stringify(data)}`);
                                    } catch (error) {
                                        alert('数据库升级失败: ' + error);
                                    }
                                }
                            }}
                            className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
                        >
                            升级数据库
                        </button>

                        <p className="text-sm text-green-700 mt-2">
                            数据库管理操作（仅管理员可用）
                        </p>
                    </div>
                </div>

                {/* 报名用户管理 */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-3">报名用户管理</h2>
                    <div className="bg-purple-50 p-4 rounded-md space-y-3">
                        <button
                            onClick={fetchRegistrations}
                            disabled={registrationsLoading}
                            className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {registrationsLoading ? '加载中...' : '获取报名用户列表'}
                        </button>

                        {registrationsLoading && (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                                <p className="mt-2 text-sm text-purple-700">正在加载报名数据...</p>
                            </div>
                        )}

                        {registrations.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-purple-800 mb-3">
                                    已报名用户 ({registrations.length} 人)
                                </h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {registrations.map((player) => (
                                        <div key={player.osuId} className="bg-white rounded-lg p-4 border border-purple-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <img
                                                        src={player.avatar_url}
                                                        alt={player.username}
                                                        width={40}
                                                        height={40}
                                                        className="rounded-full"
                                                        onError={(e) => {
                                                            e.currentTarget.src = '/default-avatar.png';
                                                        }}
                                                    />
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{player.username}</h4>
                                                        <p className="text-sm text-gray-500">ID: {player.osuId}</p>
                                                        <p className="text-sm text-gray-500">
                                                            PP: {Math.round(player.pp).toLocaleString()} |
                                                            排名: {player.global_rank ? `#${player.global_rank.toLocaleString()}` : '未排名'} |
                                                            地区: {player.country} (#{player.country_rank ? player.country_rank.toLocaleString() : '未排名'})
                                                        </p>
                                                        <p className={`text-xs ${player.approved ? 'text-green-600' : 'text-yellow-600'}`}>
                                                            {player.approved ? '✓ 已审核通过' : '⏳ 待审核'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    {!player.approved && (
                                                        <button
                                                            onClick={() => handleApproveRegistration(player.osuId, player.username)}
                                                            disabled={deletingUser === player.osuId}
                                                            className="bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {deletingUser === player.osuId ? '审核中...' : '审核通过'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteRegistration(player.osuId, player.username)}
                                                        disabled={deletingUser === player.osuId}
                                                        className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {deletingUser === player.osuId ? '删除中...' : '删除'}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-xs text-gray-500">
                                                报名时间: {new Date(player.registeredAt).toLocaleString('zh-CN')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {registrations.length === 0 && !registrationsLoading && (
                            <div className="text-center py-4 text-purple-700">
                                <p>暂无报名用户数据，点击上方按钮获取</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Staff 数据生成器 */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-3">Staff 数据生成器</h2>
                    <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    osu! 用户名
                                </label>
                                <input
                                    type="text"
                                    value={staffUsername}
                                    onChange={(e) => setStaffUsername(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="输入 osu! 用户名"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    角色类型
                                </label>
                                <select
                                    value={staffRole}
                                    onChange={(e) => setStaffRole(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="organizers">主办方</option>
                                    <option value="administrators">管理团队</option>
                                    <option value="referees">裁判团队</option>
                                    <option value="mappool_selectors">图池选择</option>
                                    <option value="streamers">直播团队</option>
                                    <option value="commentators">解说团队</option>
                                    <option value="designers">设计团队</option>
                                </select>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                描述（可选）
                            </label>
                            <input
                                type="text"
                                value={staffDescription}
                                onChange={(e) => setStaffDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="留空将使用默认描述"
                            />
                        </div>
                        <button
                            onClick={generateStaffData}
                            disabled={staffLoading}
                            className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                        >
                            {staffLoading ? '生成中...' : '生成 Staff 数据'}
                        </button>

                        {generatedStaffData && (
                            <div className="bg-white border border-purple-300 rounded-md p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-medium text-purple-800">生成的 Staff 数据</h3>
                                    <button
                                        onClick={copyToClipboard}
                                        className="bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600"
                                    >
                                        复制 JSON
                                    </button>
                                </div>
                                <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">
                                    {JSON.stringify(generatedStaffData, null, 2)}
                                </pre>
                                <div className="mt-3 text-sm text-purple-700">
                                    <p><strong>说明：</strong></p>
                                    <ul className="list-disc list-inside mt-1">
                                        <li>将生成的 JSON 数据复制到对应的 staff.json 文件中</li>
                                        <li>coverUrl 字段包含用户的封面图片URL，可用于背景显示</li>
                                        <li>如果用户没有封面图片，coverUrl 将为 null</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <h3 className="text-lg font-medium text-yellow-800 mb-2">调试说明</h3>
                    <ul className="list-disc list-inside text-yellow-700 space-y-1">
                        <li>如果 OSU_CLIENT_ID 显示为 NOT_SET，说明环境变量未正确配置</li>
                        <li>请在 Vercel 项目设置中配置环境变量</li>
                        <li>配置后需要重新部署项目</li>
                        <li>OSU_CLIENT_SECRET 出于安全原因只显示是否设置，不显示具体值</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
