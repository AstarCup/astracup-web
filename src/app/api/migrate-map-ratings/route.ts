import { NextRequest, NextResponse } from 'next/server';
import { migrateMapRatingsTable } from '@/lib/migrate-map-ratings';

export async function GET(request: NextRequest) {
    try {
        await migrateMapRatingsTable();
        return NextResponse.json({
            success: true,
            message: 'Map ratings table migrated successfully'
        });
    } catch (error) {
        console.error('Error migrating map ratings table:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to migrate map ratings table',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}