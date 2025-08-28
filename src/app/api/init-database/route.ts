import { NextRequest, NextResponse } from 'next/server';
import initDatabase from '@/lib/mysql-registrations';

export async function GET(request: NextRequest) {
    try {
        await initDatabase();
        return NextResponse.json({
            success: true,
            message: 'Database initialized successfully'
        });
    } catch (error) {
        console.error('Error initializing database:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to initialize database',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
