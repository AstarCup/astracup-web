import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // 返回服务器环境变量信息（不包含敏感信息）
        const environment = {
            OSU_CLIENT_ID: process.env.OSU_CLIENT_ID ? "SET" : "NOT_SET",
            OSU_CLIENT_SECRET: process.env.OSU_CLIENT_SECRET ? "SET" : "NOT_SET",
            OSU_REDIRECT_URI: process.env.OSU_REDIRECT_URI || "NOT_SET",
            NODE_ENV: process.env.NODE_ENV || "development",
            MYSQL_HOST: process.env.MYSQL_HOST ? "SET" : "NOT_SET",
            MYSQL_DATABASE: process.env.MYSQL_DATABASE ? "SET" : "NOT_SET",
            NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "NOT_SET"
        };

        return NextResponse.json({ environment });
    } catch (error) {
        console.error('Error in debug env endpoint:', error);
        return NextResponse.json(
            { error: 'Failed to get environment info' },
            { status: 500 }
        );
    }
}
