import { NextResponse } from 'next/server';

export async function GET() {
    // 检查环境变量
    const envVars = {
        OSU_CLIENT_ID: process.env.OSU_CLIENT_ID || 'NOT_SET',
        OSU_CLIENT_SECRET: process.env.OSU_CLIENT_SECRET ? 'SET' : 'NOT_SET',
        OSU_REDIRECT_URI: process.env.OSU_REDIRECT_URI || 'NOT_SET',
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV || 'NOT_SET',
        VERCEL_URL: process.env.VERCEL_URL || 'NOT_SET',
    };

    return NextResponse.json({
        message: 'Environment variables debug',
        environment: envVars,
        timestamp: new Date().toISOString(),
    });
}
