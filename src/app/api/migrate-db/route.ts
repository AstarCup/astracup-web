import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/mysql-registrations';

export async function GET() {
    try {
        console.log('Starting database migration...');
        await initDatabase();
        console.log('Database migration completed successfully');
        return NextResponse.json({ success: true, message: 'Database migration completed' });
    } catch (error) {
        console.error('Database migration failed:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}