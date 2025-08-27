import fs from 'fs';
import path from 'path';

const REGISTRATIONS_FILE = path.join(process.cwd(), 'data', 'registrations.json');

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

// 确保数据目录存在
function ensureDataDirectory() {
    const dataDir = path.dirname(REGISTRATIONS_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

// 读取所有注册信息
export function getRegistrations(): Registration[] {
    try {
        ensureDataDirectory();
        if (!fs.existsSync(REGISTRATIONS_FILE)) {
            return [];
        }
        const data = fs.readFileSync(REGISTRATIONS_FILE, 'utf8');
        return JSON.parse(data);
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
        ensureDataDirectory();
        const registrations = getRegistrations();
        const newRegistration: Registration = {
            ...registration,
            registeredAt: new Date().toISOString(),
        };

        // 检查是否已注册，避免重复
        if (!isUserRegistered(registration.osuId)) {
            registrations.push(newRegistration);
            fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(registrations, null, 2));
        }
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
