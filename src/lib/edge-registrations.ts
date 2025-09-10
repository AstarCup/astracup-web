// Edge Config 报名数据存储工具
// 通过API端点操作Edge Config

export interface TournamentRegistration {
    osuId: string;
    username: string;
    avatar_url: string;
    pp: number;
    global_rank: number | null;
    country_rank: number | null;
    country: string;
    teamName: string; // 队伍名，初始为空
    seedPosition: number | null; // seed位，初始为null
    agreedToTerms: boolean; // 是否同意条款
    approved: boolean; // 审核状态
    approvedAt: string | null; // 审核通过时间
    registeredAt: string;
}

// 获取所有报名数据
export async function getRegistrations(): Promise<TournamentRegistration[]> {
    try {
        const response = await fetch('/api/edge-registrations');
        if (!response.ok) {
            throw new Error('Failed to fetch registrations');
        }
        const data = await response.json();
        return data.registrations || [];
    } catch (error) {
        console.error('Error getting registrations:', error);
        return [];
    }
}

// 检查用户是否已报名
export async function isUserRegistered(osuId: string): Promise<boolean> {
    try {
        const registrations = await getRegistrations();
        return registrations.some(reg => reg.osuId === osuId);
    } catch (error) {
        console.error('Error checking user registration:', error);
        return false;
    }
}

// 添加新报名
export async function addRegistration(registration: Omit<TournamentRegistration, 'registeredAt'>): Promise<boolean> {
    try {
        const response = await fetch('/api/edge-registrations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registration),
        });

        if (!response.ok) {
            throw new Error('Failed to add registration');
        }

        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Error adding registration:', error);
        throw new Error('Failed to save registration');
    }
}

// 获取用户报名信息
export async function getUserRegistration(osuId: string): Promise<TournamentRegistration | null> {
    try {
        const registrations = await getRegistrations();
        return registrations.find(reg => reg.osuId === osuId) || null;
    } catch (error) {
        console.error('Error getting user registration:', error);
        return null;
    }
}

// 获取报名总数
export async function getRegistrationCount(): Promise<number> {
    try {
        const registrations = await getRegistrations();
        return registrations.length;
    } catch (error) {
        console.error('Error getting registration count:', error);
        return 0;
    }
}
