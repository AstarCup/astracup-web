import mysql from 'mysql2/promise';
import { getPool } from './map-selection';

export const migrateMapRatingsTable = async (): Promise<void> => {
    try {
        const connection = await getPool().getConnection();

        console.log('Starting map ratings table migration...');

        // 检查rating字段是否为NOT NULL
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'map_ratings'
            AND COLUMN_NAME = 'rating'
        `);

        const ratingColumn = (columns as any[])[0];

        if (ratingColumn && ratingColumn.IS_NULLABLE === 'NO') {
            console.log('Migrating rating column to allow NULL values...');

            // 修改rating字段为可空
            await connection.execute(`
                ALTER TABLE map_ratings
                MODIFY COLUMN rating TINYINT NULL
            `);

            console.log('Rating column migrated successfully');
        } else {
            console.log('Rating column is already nullable');
        }

        // 检查是否有CHECK约束需要移除
        try {
            const [constraints] = await connection.execute(`
                SELECT CONSTRAINT_NAME
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'map_ratings'
                AND CONSTRAINT_TYPE = 'CHECK'
            `);

            for (const constraint of constraints as any[]) {
                if (constraint.CONSTRAINT_NAME.includes('rating')) {
                    console.log(`Dropping CHECK constraint: ${constraint.CONSTRAINT_NAME}`);
                    await connection.execute(`
                        ALTER TABLE map_ratings
                        DROP CHECK ${constraint.CONSTRAINT_NAME}
                    `);
                }
            }
        } catch (constraintError) {
            console.log('No CHECK constraints to remove or error checking constraints:', (constraintError as Error).message);
        }

        // 检查并添加avatar_url字段（如果不存在）
        try {
            const [avatarColumns] = await connection.execute(`SHOW COLUMNS FROM map_ratings LIKE 'avatar_url'`);
            if ((avatarColumns as any[]).length === 0) {
                console.log('Adding avatar_url column...');
                await connection.execute(`
                    ALTER TABLE map_ratings
                    ADD COLUMN avatar_url VARCHAR(500) NOT NULL DEFAULT ''
                `);
                console.log('Added avatar_url column to map_ratings table');
            } else {
                console.log('avatar_url column already exists');
            }
        } catch (alterError) {
            console.log('Error checking/adding avatar_url column:', (alterError as Error).message);
        }

        // 删除旧的唯一约束（如果存在），允许同一用户对同一谱面发表多个评论
        try {
            await connection.execute(`
                ALTER TABLE map_ratings DROP INDEX um
            `);
            console.log('Removed unique constraint "um" from map_ratings table');
        } catch (error: any) {
            // 如果约束不存在，忽略错误
            if (error.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('Error removing unique constraint "um":', error.message);
            }
        }

        // 删除可能存在的其他唯一约束
        try {
            await connection.execute(`
                ALTER TABLE map_ratings DROP INDEX unique_user_rating
            `);
            console.log('Removed unique constraint "unique_user_rating" from map_ratings table');
        } catch (error: any) {
            // 如果约束不存在，忽略错误
            if (error.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('Error removing unique constraint "unique_user_rating":', error.message);
            }
        }

        connection.release();
        console.log('Map ratings table migration completed successfully');
    } catch (error) {
        console.error('Error migrating map ratings table:', error);
        throw error;
    }
};