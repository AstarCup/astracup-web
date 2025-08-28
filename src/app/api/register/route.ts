import { NextRequest, NextResponse } from 'next/server';
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
function getRegistrations(): Registration[] {
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
function isUserRegistered(osuId: string): boolean {
    const registrations = getRegistrations();
    return registrations.some(reg => reg.osuId === osuId);
}

// 添加新注册
function addRegistration(registration: Omit<Registration, 'registeredAt'>): void {
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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // 验证必要字段
        if (!body.osuId || !body.username) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 检查是否已注册
        if (isUserRegistered(body.osuId)) {
            return NextResponse.json(
                { error: 'User already registered' },
                { status: 409 }
            );
        }

        // 添加注册
        addRegistration(body);

        return NextResponse.json(
            { message: 'Registration successful' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Registration API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const registrations = getRegistrations();
        return NextResponse.json(registrations);
    } catch (error) {
        console.error('Get registrations error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
