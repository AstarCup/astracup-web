// 使用 Vercel Blob Store 进行持久化存储
import { put, list } from '@vercel/blob';

const BLOB_STORE_KEY = 'users/registrations.json';
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// Blob Store 存储实现
const blobStorage = {
    getRegistrations: async (): Promise<any[]> => {
        if (!BLOB_TOKEN) {
            console.warn('BLOB_READ_WRITE_TOKEN not configured, using empty array');
            return [];
        }

        try {
            // 列出所有blob并查找我们的注册数据blob
            const { blobs } = await list({
                token: BLOB_TOKEN,
                prefix: 'users/'
            });

            const registrationBlob = blobs.find(blob => blob.pathname === BLOB_STORE_KEY);

            if (!registrationBlob) {
                // Blob 不存在，返回空数组
                console.log('No registration blob found, returning empty array');
                return [];
            }

            // 获取blob内容
            console.log('Fetching registration blob from:', registrationBlob.url);
            const response = await fetch(registrationBlob.url);
            if (!response.ok) {
                throw new Error(`Blob fetch failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Retrieved registrations:', data.length, 'records');
            return data;
        } catch (error) {
            console.error('Error reading from blob store:', error);
            return [];
        }
    },

    addRegistration: async (registration: any): Promise<void> => {
        if (!BLOB_TOKEN) {
            throw new Error('BLOB_READ_WRITE_TOKEN not configured');
        }

        try {
            const registrations = await blobStorage.getRegistrations();

            // 检查是否已存在
            const existingIndex = registrations.findIndex(reg => reg.osuId === registration.osuId);

            if (existingIndex === -1) {
                // 新用户注册
                const newRegistration = {
                    ...registration,
                    registeredAt: new Date().toISOString(),
                };
                registrations.push(newRegistration);
            } else {
                // 更新现有用户信息
                registrations[existingIndex] = {
                    ...registrations[existingIndex],
                    ...registration,
                    registeredAt: registrations[existingIndex].registeredAt, // 保持原有注册时间
                };
            }

            // 更新 Blob Store - 使用正确的SDK方法
            console.log('Saving registrations to blob store:', registrations.length, 'records');
            const result = await put(BLOB_STORE_KEY, JSON.stringify(registrations), {
                access: 'public',
                addRandomSuffix: false,
                token: BLOB_TOKEN,
                contentType: 'application/json',
                allowOverwrite: true, // 允许覆盖现有文件
            });
            console.log('Blob saved successfully:', result.url);
        } catch (error) {
            console.error('Error writing to blob store:', error);
            throw error;
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
export async function getRegistrations(): Promise<Registration[]> {
    try {
        return await blobStorage.getRegistrations();
    } catch (error) {
        console.error('Error reading registrations:', error);
        return [];
    }
}

// 检查用户是否已注册
export async function isUserRegistered(osuId: string): Promise<boolean> {
    const registrations = await getRegistrations();
    return registrations.some(reg => reg.osuId === osuId);
}

// 添加新注册
export async function addRegistration(registration: Omit<Registration, 'registeredAt'>): Promise<void> {
    try {
        await blobStorage.addRegistration(registration);
    } catch (error) {
        console.error('Error adding registration:', error);
        throw new Error('Failed to save registration');
    }
}

// 获取用户注册信息
export async function getUserRegistration(osuId: string): Promise<Registration | null> {
    const registrations = await getRegistrations();
    return registrations.find(reg => reg.osuId === osuId) || null;
}

// 获取所有注册用户数量
export async function getRegistrationCount(): Promise<number> {
    const registrations = await getRegistrations();
    return registrations.length;
}
