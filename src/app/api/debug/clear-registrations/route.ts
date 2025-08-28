import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(request: NextRequest) {
    try {
        // 数据库连接配置
        const dbConfig = {
            host: process.env.MYSQL_HOST,
            port: parseInt(process.env.MYSQL_PORT || '3306'),
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        };

        const connection = await mysql.createConnection(dbConfig);

        try {
            // 清空注册表
            await connection.execute('TRUNCATE TABLE registrations');

            connection.end();

            return NextResponse.json({
                success: true,
                message: '所有注册数据已成功清空'
            });
        } catch (error) {
            connection.end();
            throw error;
        }
    } catch (error) {
        console.error('Error clearing registrations:', error);
        return NextResponse.json(
            {
                success: false,
                error: '清空注册数据失败',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
