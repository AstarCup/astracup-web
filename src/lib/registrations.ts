// 使用 MySQL 数据库进行持久化存储
import {
    getRegistrations as mysqlGetRegistrations,
    isUserRegistered as mysqlIsUserRegistered,
    addRegistration as mysqlAddRegistration,
    getUserRegistration as mysqlGetUserRegistration,
    getRegistrationCount as mysqlGetRegistrationCount,
    deleteRegistration as mysqlDeleteRegistration
} from './mysql-registrations';

export interface Registration {
    osuId: string;
    username: string;
    inGameName: string;
    timezone: string;
    availability: string;
    registeredAt: string;
    avatar_url: string;
    pp: number;
    global_rank: number | null;
    country_rank: number | null;
    country: string;
    approved: boolean;
    approvedAt: string | null;
}

// 读取所有注册信息
export const getRegistrations = mysqlGetRegistrations;

// 检查用户是否已注册
export const isUserRegistered = mysqlIsUserRegistered;

// 添加新注册
export const addRegistration = mysqlAddRegistration;

// 获取用户注册信息
export const getUserRegistration = mysqlGetUserRegistration;

// 获取所有注册用户数量
export const getRegistrationCount = mysqlGetRegistrationCount;

// 删除用户注册信息
export const deleteRegistration = mysqlDeleteRegistration;
