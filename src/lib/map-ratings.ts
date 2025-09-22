// 评分和评论系统数据库管理
import mysql from 'mysql2/promise';
import { getPool } from './map-selection';

// 评分数据类型定义
export interface MapRating {
    id: number;
    mapSelectionId: number;     // 关联的选图ID
    userId: string;             // 评分用户的osu ID
    username: string;           // 评分用户的用户名
    avatar_url: string;         // 用户头像URL
    rating: number | null;      // 评分 (1-5)，可为空（只评论）
    comment: string;            // 评论内容
    createdAt: string;          // 创建时间
    updatedAt: string;          // 更新时间
}

// 评分统计数据类型
export interface RatingStats {
    averageRating: number;      // 平均评分
    totalRatings: number;       // 总评分数量
    ratingDistribution: {       // 评分分布
        [key: number]: number;  // 评分值: 数量
    };
}

// 初始化评分数据库表
export const initMapRatingsDatabase = async (): Promise<void> => {
    try {
        const connection = await getPool().getConnection();

        // 创建评分表
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS map_ratings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mapSelectionId INT NOT NULL,
                userId VARCHAR(255) NOT NULL,
                username VARCHAR(255) NOT NULL,
                rating TINYINT NULL,
                comment TEXT,
                avatar_url VARCHAR(500) NOT NULL DEFAULT '',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX im (mapSelectionId),
                INDEX iu (userId),
                INDEX ir (rating)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 删除旧的唯一约束（如果存在），允许同一用户对同一谱面发表多个评论
        try {
            await connection.execute(`
                ALTER TABLE map_ratings DROP INDEX um
            `);
            console.log('Removed unique constraint from map_ratings table');
        } catch (error: any) {
            // 如果约束不存在，忽略错误
            if (error.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('Error removing unique constraint:', error.message);
            }
        }

        // 删除可能存在的其他唯一约束
        try {
            await connection.execute(`
                ALTER TABLE map_ratings DROP INDEX unique_user_rating
            `);
            console.log('Removed unique_user_rating constraint from map_ratings table');
        } catch (error: any) {
            // 如果约束不存在，忽略错误
            if (error.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('Error removing unique_user_rating constraint:', error.message);
            }
        }

        // 检查并添加avatar_url字段（如果不存在）
        try {
            const [columns] = await connection.execute(`SHOW COLUMNS FROM map_ratings LIKE 'avatar_url'`);
            if ((columns as any[]).length === 0) {
                // avatar_url字段不存在，添加它
                await connection.execute(`
                    ALTER TABLE map_ratings
                    ADD COLUMN avatar_url VARCHAR(500) NOT NULL DEFAULT ''
                `);
                console.log('Added avatar_url column to map_ratings table');
            }
        } catch (alterError) {
            console.log('Error checking/adding avatar_url column:', (alterError as Error).message);
        }

        connection.release();
        console.log('Map ratings database initialized successfully');
    } catch (error) {
        console.error('Error initializing map ratings database:', error);
        throw error;
    }
};

// 评分数据库操作类
export const mapRatingsStorage = {
    // 获取指定选图的评分
    async getRatingsForMap(mapSelectionId: number): Promise<MapRating[]> {
        try {
            const connection = await getPool().getConnection();

            const [rows] = await connection.execute(
                'SELECT * FROM map_ratings WHERE mapSelectionId = ? ORDER BY createdAt DESC',
                [mapSelectionId]
            );

            connection.release();

            return (rows as any[]).map(row => ({
                id: row.id,
                mapSelectionId: row.mapSelectionId,
                userId: row.userId,
                username: row.username,
                avatar_url: row.avatar_url || '',
                rating: row.rating,
                comment: row.comment || '',
                createdAt: row.createdAt,
                updatedAt: row.updatedAt
            }));
        } catch (error) {
            console.error('Error getting map ratings:', error);
            return [];
        }
    },

    // 获取用户对指定选图的评分
    async getUserRating(mapSelectionId: number, userId: string): Promise<MapRating | null> {
        try {
            const connection = await getPool().getConnection();

            const [rows] = await connection.execute(
                'SELECT * FROM map_ratings WHERE mapSelectionId = ? AND userId = ?',
                [mapSelectionId, userId]
            );

            connection.release();

            const result = rows as any[];
            if (result.length === 0) {
                return null;
            }

            const row = result[0];
            return {
                id: row.id,
                mapSelectionId: row.mapSelectionId,
                userId: row.userId,
                username: row.username,
                avatar_url: row.avatar_url || '',
                rating: row.rating,
                comment: row.comment || '',
                createdAt: row.createdAt,
                updatedAt: row.updatedAt
            };
        } catch (error) {
            console.error('Error getting user rating:', error);
            return null;
        }
    },

    // 添加新评分（允许同一用户对同一谱面发表多个评论）
    async addRating(
        mapSelectionId: number,
        userId: string,
        username: string,
        rating: number | null,
        comment: string,
        avatar_url: string = ''
    ): Promise<boolean> {
        try {
            const connection = await getPool().getConnection();

            // 总是添加新评分 - 允许同一用户对同一谱面发表多个评论
            const [result] = await connection.execute(
                'INSERT INTO map_ratings (mapSelectionId, userId, username, rating, comment, avatar_url) VALUES (?, ?, ?, ?, ?, ?)',
                [mapSelectionId, userId, username, rating, comment, avatar_url]
            );

            connection.release();
            const insertResult = result as mysql.ResultSetHeader;
            return insertResult.affectedRows > 0;
        } catch (error) {
            console.error('Error adding rating:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            return false;
        }
    },

    // 删除评分
    async deleteRating(mapSelectionId: number, userId: string): Promise<boolean> {
        try {
            const connection = await getPool().getConnection();

            const [result] = await connection.execute(
                'DELETE FROM map_ratings WHERE mapSelectionId = ? AND userId = ?',
                [mapSelectionId, userId]
            );

            connection.release();
            const deleteResult = result as mysql.ResultSetHeader;
            return deleteResult.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting rating:', error);
            return false;
        }
    },

    // 按记录ID删除评分（需要用户权限验证）
    async deleteRatingById(id: number, userId: string): Promise<boolean> {
        try {
            const connection = await getPool().getConnection();

            // 首先检查这条记录是否属于当前用户
            const [checkResult] = await connection.execute(
                'SELECT userId FROM map_ratings WHERE id = ?',
                [id]
            );

            const checkRows = checkResult as any[];
            if (checkRows.length === 0) {
                connection.release();
                return false; // 记录不存在
            }

            if (checkRows[0].userId !== userId) {
                connection.release();
                return false; // 没有权限删除别人的评论
            }

            // 删除记录
            const [result] = await connection.execute(
                'DELETE FROM map_ratings WHERE id = ?',
                [id]
            );

            connection.release();
            const deleteResult = result as mysql.ResultSetHeader;
            return deleteResult.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting rating by id:', error);
            return false;
        }
    },

    // 获取评分统计
    async getRatingStats(mapSelectionId: number): Promise<RatingStats> {
        try {
            const connection = await getPool().getConnection();

            // 获取平均评分和总数量
            const [statsRows] = await connection.execute(
                'SELECT AVG(rating) as averageRating, COUNT(*) as totalRatings FROM map_ratings WHERE mapSelectionId = ?',
                [mapSelectionId]
            );

            // 获取评分分布
            const [distributionRows] = await connection.execute(
                'SELECT rating, COUNT(*) as count FROM map_ratings WHERE mapSelectionId = ? GROUP BY rating ORDER BY rating',
                [mapSelectionId]
            );

            connection.release();

            const statsResult = statsRows as any[];
            const distributionResult = distributionRows as any[];

            const averageRating = statsResult[0]?.averageRating ? parseFloat(statsResult[0].averageRating) : 0;
            const totalRatings = statsResult[0]?.totalRatings || 0;

            const ratingDistribution: { [key: number]: number } = {};
            for (let i = 1; i <= 5; i++) {
                ratingDistribution[i] = 0;
            }

            distributionResult.forEach(row => {
                ratingDistribution[row.rating] = row.count;
            });

            return {
                averageRating,
                totalRatings,
                ratingDistribution
            };
        } catch (error) {
            console.error('Error getting rating stats:', error);
            return {
                averageRating: 0,
                totalRatings: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            };
        }
    },

    // 获取用户的所有评分
    async getUserRatings(userId: string): Promise<MapRating[]> {
        try {
            const connection = await getPool().getConnection();

            const [rows] = await connection.execute(
                'SELECT * FROM map_ratings WHERE userId = ? ORDER BY createdAt DESC',
                [userId]
            );

            connection.release();

            return (rows as any[]).map(row => ({
                id: row.id,
                mapSelectionId: row.mapSelectionId,
                userId: row.userId,
                username: row.username,
                avatar_url: row.avatar_url || '',
                rating: row.rating,
                comment: row.comment || '',
                createdAt: row.createdAt,
                updatedAt: row.updatedAt
            }));
        } catch (error) {
            console.error('Error getting user ratings:', error);
            return [];
        }
    }
};

// 导出函数
export const getRatingsForMap = mapRatingsStorage.getRatingsForMap;
export const getUserRating = mapRatingsStorage.getUserRating;
export const addRating = mapRatingsStorage.addRating;
export const deleteRating = mapRatingsStorage.deleteRating;
export const deleteRatingById = mapRatingsStorage.deleteRatingById;
export const getRatingStats = mapRatingsStorage.getRatingStats;
export const getUserRatings = mapRatingsStorage.getUserRatings;

export default initMapRatingsDatabase;
