// 临时解决方案：在Vercel环境中禁用文件系统注册存储
// 使用内存存储代替，实际部署时应使用数据库

let memoryRegistrations: any[] = [];

// 模拟文件系统操作的内存实现
const memoryStorage = {
    getRegistrations: (): any[] => {
        return memoryRegistrations;
    },

    addRegistration: (registration: any): void => {
        // 检查是否已存在
        if (!memoryRegistrations.some(reg => reg.osuId === registration.osuId)) {
            memoryRegistrations.push({
                ...registration,
                registeredAt: new Date().toISOString(),
            });
        }
    }
};

export interface Registration {
    osuId: string;
    username: string;
    inGameName: string;
    discord: string;
    timezone: string;
    availability: string;
    registeredAt: string;
    avatar_url: string;
    pp: number;
    global_rank: number | null;
    country_rank: number | null;
}

// 读取所有注册信息
export function getRegistrations(): Registration[] {
    try {
        return memoryStorage.getRegistrations();
    } catch (error) {
        console.error('Error reading registrations:', error);
        return [];
    }
}

// 检查用户是否已注册
export function isUserRegistered(osuId: string): boolean {
    const registrations = getRegistrations();
    return registrations.some(reg => reg.osuId === osuId);
}

// 添加新注册
export function addRegistration(registration: Omit<Registration, 'registeredAt'>): void {
    try {
        memoryStorage.addRegistration(registration);
    } catch (error) {
        console.error('Error adding registration:', error);
        throw new Error('Failed to save registration');
    }
}

// 获取用户注册信息
export function getUserRegistration(osuId: string): Registration | null {
    const registrations = getRegistrations();
    return registrations.find(reg => reg.osuId === osuId) || null;
}

// 获取所有注册用户数量
export function getRegistrationCount(): number {
    return getRegistrations().length;
}
