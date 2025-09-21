// 选图系统数据库管理
import mysql from 'mysql2/promise';
import { getUserById } from './osu-api';

// 数据库连接配置（复用现有配置）
const dbConfig = {
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
};

// 创建数据库连接池
let pool: mysql.Pool | null = null;

export const getPool = (): mysql.Pool => {
    if (!pool) {
        pool = mysql.createPool({
            ...dbConfig,
            connectionLimit: 10,
        });
    }
    return pool;
};

// 选图数据类型定义
export interface MapSelection {
    id: number;
    beatmapId: number;          // beatmap ID
    beatmapsetId: number;       // beatmapset ID
    title: string;              // 歌曲标题
    artist: string;             // 艺术家
    version: string;            // 难度名称
    creator: string;            // 作图者
    starRating: number;         // 星级
    bpm: number;                // BPM
    totalLength: number;        // 总长度（秒）
    ar: number;                 // Approach Rate
    cs: number;                 // Circle Size
    od: number;                 // Overall Difficulty
    hp: number;                 // Health Points (HP Drain Rate)
    selectedMods: string;       // 选择的mod，如 "NM", "HD", "HR" 等
    modPosition: number;        // mod位数，如 nm1的1, hd2的2
    customDTRate?: number;      // 自定义DT倍率（可选）
    customModName?: string;     // 自定义mod名称（用于LZ mod）
    comment: string;            // 注释信息
    selectedBy: string;         // 选图者的osu ID
    selectedAt: string;         // 选图时间
    season: string;             // 赛季标识，如 "s1", "s2"
    category: string;           // 类别，如 "qualification", "ro32", "ro16" 等
    url: string;                // beatmap URL
    coverUrl: string;           // 封面URL
    approved: boolean;          // 是否过审
}

// 初始化选图数据库表
export const initMapSelectionDatabase = async (): Promise<void> => {
    try {
        const connection = await getPool().getConnection();

        // 创建选图表
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS map_selections (
                id INT AUTO_INCREMENT PRIMARY KEY,
                beatmapId INT NOT NULL,
                beatmapsetId INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                artist VARCHAR(255) NOT NULL,
                version VARCHAR(255) NOT NULL,
                creator VARCHAR(255) NOT NULL,
                starRating DECIMAL(5,2) NOT NULL DEFAULT 0.00,
                bpm DECIMAL(6,2) NOT NULL DEFAULT 0.00,
                totalLength INT NOT NULL DEFAULT 0,
                ar DECIMAL(4,2) NOT NULL DEFAULT 0.00,
                cs DECIMAL(4,2) NOT NULL DEFAULT 0.00,
                od DECIMAL(4,2) NOT NULL DEFAULT 0.00,
                hp DECIMAL(4,2) NOT NULL DEFAULT 0.00,
                selectedMods VARCHAR(50) NOT NULL DEFAULT 'NM',
                modPosition INT NOT NULL DEFAULT 1,
                comment TEXT,
                selectedBy VARCHAR(255) NOT NULL,
                selectedAt DATETIME NOT NULL,
                season VARCHAR(50) NOT NULL DEFAULT 's1',
                category VARCHAR(50) NOT NULL DEFAULT 'qualification',
                url TEXT NOT NULL,
                coverUrl TEXT,
                approved BOOLEAN DEFAULT FALSE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_beatmapId (beatmapId),
                INDEX idx_selectedBy (selectedBy),
                INDEX idx_season_category (season, category)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 移除唯一约束（如果存在）
        try {
            await connection.execute(`
                ALTER TABLE map_selections DROP INDEX unique_beatmap_season_category
            `);
            console.log('Removed unique constraint to allow duplicate beatmaps');
        } catch (error: any) {
            // 如果约束不存在，忽略错误
            if (error.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('Unique constraint removal:', error.message);
            }
        }

        // 检查并添加新字段（用于已存在的表）
        try {
            // 检查ar字段是否存在
            await connection.execute(`SELECT ar FROM map_selections LIMIT 1`);
        } catch (error: any) {
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Adding new difficulty fields to existing table...');

                // 添加AR字段
                await connection.execute(`
                    ALTER TABLE map_selections 
                    ADD COLUMN ar DECIMAL(4,2) NOT NULL DEFAULT 0.00 AFTER totalLength
                `);

                // 添加CS字段
                await connection.execute(`
                    ALTER TABLE map_selections 
                    ADD COLUMN cs DECIMAL(4,2) NOT NULL DEFAULT 0.00 AFTER ar
                `);

                // 添加OD字段
                await connection.execute(`
                    ALTER TABLE map_selections 
                    ADD COLUMN od DECIMAL(4,2) NOT NULL DEFAULT 0.00 AFTER cs
                `);

                // 添加HP字段
                await connection.execute(`
                    ALTER TABLE map_selections 
                    ADD COLUMN hp DECIMAL(4,2) NOT NULL DEFAULT 0.00 AFTER od
                `);

                console.log('Successfully added difficulty fields: ar, cs, od, hp');
            }
        }

        // 检查并添加modPosition字段
        try {
            await connection.execute(`SELECT modPosition FROM map_selections LIMIT 1`);
        } catch (error: any) {
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Adding modPosition field...');
                await connection.execute(`
                    ALTER TABLE map_selections 
                    ADD COLUMN modPosition INT NOT NULL DEFAULT 1 AFTER selectedMods
                `);
                console.log('Successfully added modPosition field');
            }
        }

        // 检查并添加coverUrl字段
        try {
            await connection.execute(`SELECT coverUrl FROM map_selections LIMIT 1`);
        } catch (error: any) {
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Adding coverUrl field...');
                await connection.execute(`
                    ALTER TABLE map_selections 
                    ADD COLUMN coverUrl TEXT AFTER url
                `);
                console.log('Successfully added coverUrl field');
            }
        }

        // 检查并添加approved字段
        try {
            await connection.execute(`SELECT approved FROM map_selections LIMIT 1`);
        } catch (error: any) {
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Adding approved field...');
                await connection.execute(`
                    ALTER TABLE map_selections 
                    ADD COLUMN approved BOOLEAN DEFAULT FALSE AFTER coverUrl
                `);
                console.log('Successfully added approved field');
            }
        }

        // 检查并添加selectedByUsername字段
        try {
            await connection.execute(`SELECT selectedByUsername FROM map_selections LIMIT 1`);
        } catch (error: any) {
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Adding selectedByUsername field...');
                await connection.execute(`
                    ALTER TABLE map_selections 
                    ADD COLUMN selectedByUsername VARCHAR(255) AFTER selectedBy
                `);
                console.log('Successfully added selectedByUsername field');
            }
        }

        // 检查并添加selectedByAvatar字段
        try {
            await connection.execute(`SELECT selectedByAvatar FROM map_selections LIMIT 1`);
        } catch (error: any) {
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Adding selectedByAvatar field...');
                await connection.execute(`
                    ALTER TABLE map_selections 
                    ADD COLUMN selectedByAvatar VARCHAR(500) AFTER selectedByUsername
                `);
                console.log('Successfully added selectedByAvatar field');
            }
        }

        // 检查并添加customDTRate字段
        try {
            await connection.execute(`SELECT customDTRate FROM map_selections LIMIT 1`);
        } catch (error: any) {
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Adding customDTRate field...');
                await connection.execute(`
                    ALTER TABLE map_selections 
                    ADD COLUMN customDTRate DECIMAL(4,2) DEFAULT NULL AFTER selectedByAvatar
                `);
                console.log('Successfully added customDTRate field');
            }
        }

        // 检查并添加customModName字段
        try {
            await connection.execute(`SELECT customModName FROM map_selections LIMIT 1`);
        } catch (error: any) {
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Adding customModName field...');
                await connection.execute(`
                    ALTER TABLE map_selections 
                    ADD COLUMN customModName VARCHAR(50) DEFAULT NULL AFTER customDTRate
                `);
                console.log('Successfully added customModName field');
            }
        }

        connection.release();
        console.log('Map selection database initialized successfully');
    } catch (error) {
        console.error('Error initializing map selection database:', error);
        throw error;
    }
};

// 选图数据库操作类
export const mapSelectionStorage = {
    // 获取所有选图
    async getMapSelections(season: string = 's1', category?: string): Promise<MapSelection[]> {
        try {
            const connection = await getPool().getConnection();
            let query = 'SELECT * FROM map_selections WHERE season = ?';
            const params: any[] = [season];

            if (category) {
                query += ' AND category = ?';
                params.push(category);
            }

            query += ' ORDER BY selectedAt DESC';

            const [rows] = await connection.execute(query, params);
            connection.release();

            return (rows as any[]).map(row => ({
                id: row.id,
                beatmapId: row.beatmapId,
                beatmapsetId: row.beatmapsetId,
                title: row.title,
                artist: row.artist,
                version: row.version,
                creator: row.creator,
                starRating: parseFloat(row.starRating),
                bpm: parseFloat(row.bpm),
                totalLength: row.totalLength,
                ar: parseFloat(row.ar) || 0,
                cs: parseFloat(row.cs) || 0,
                od: parseFloat(row.od) || 0,
                hp: parseFloat(row.hp) || 0,
                selectedMods: row.selectedMods,
                modPosition: row.modPosition || 1,
                comment: row.comment || '',
                selectedBy: row.selectedBy,
                selectedByUsername: row.selectedByUsername || `User_${row.selectedBy}`, // 使用存储的用户名
                selectedAt: row.selectedAt,
                season: row.season,
                category: row.category,
                url: row.url,
                coverUrl: row.coverUrl || '',
                approved: Boolean(row.approved)
            }));
        } catch (error) {
            console.error('Error getting map selections:', error);
            return [];
        }
    },

    // 添加选图
    async addMapSelection(selection: Omit<MapSelection, 'id' | 'selectedAt'> & { selectedByUsername?: string; selectedByAvatar?: string }): Promise<boolean> {
        try {
            const connection = await getPool().getConnection();

            const [result] = await connection.execute(`
                INSERT INTO map_selections (
                    beatmapId, beatmapsetId, title, artist, version, creator,
                    starRating, bpm, totalLength, ar, cs, od, hp, selectedMods, modPosition, customDTRate, customModName, comment,
                    selectedBy, selectedByUsername, selectedByAvatar, selectedAt, season, category, url, coverUrl, approved
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)
            `, [
                selection.beatmapId,
                selection.beatmapsetId,
                selection.title,
                selection.artist,
                selection.version,
                selection.creator,
                selection.starRating,
                selection.bpm,
                selection.totalLength,
                selection.ar,
                selection.cs,
                selection.od,
                selection.hp,
                selection.selectedMods,
                selection.modPosition,
                selection.customDTRate || null,
                selection.customModName || null,
                selection.comment,
                selection.selectedBy,
                selection.selectedByUsername || null, // 存储用户名
                selection.selectedByAvatar || null,   // 存储头像
                selection.season,
                selection.category,
                selection.url,
                selection.coverUrl,
                selection.approved
            ]);

            connection.release();
            const insertResult = result as mysql.ResultSetHeader;
            return insertResult.affectedRows > 0;
        } catch (error) {
            console.error('Error adding map selection:', error);
            return false;
        }
    },

    // 删除选图
    async deleteMapSelection(id: number, selectedBy: string): Promise<boolean> {
        try {
            const connection = await getPool().getConnection();

            const [result] = await connection.execute(
                'DELETE FROM map_selections WHERE id = ? AND selectedBy = ?',
                [id, selectedBy]
            );

            connection.release();
            const deleteResult = result as mysql.ResultSetHeader;
            return deleteResult.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting map selection:', error);
            return false;
        }
    },

    // 检查beatmap是否已被选择
    async isBeatmapSelected(beatmapId: number, season: string, category: string): Promise<boolean> {
        try {
            const connection = await getPool().getConnection();

            const [rows] = await connection.execute(
                'SELECT COUNT(*) as count FROM map_selections WHERE beatmapId = ? AND season = ? AND category = ?',
                [beatmapId, season, category]
            );

            connection.release();
            const result = rows as any[];
            return result[0].count > 0;
        } catch (error) {
            console.error('Error checking beatmap selection:', error);
            return false;
        }
    },

    // 更新选图信息
    async updateMapSelection(id: number, updates: Partial<Pick<MapSelection, 'selectedMods' | 'comment' | 'approved'>>, selectedBy: string): Promise<boolean> {
        try {
            const connection = await getPool().getConnection();

            const setClause = [];
            const params = [];

            if (updates.selectedMods !== undefined) {
                setClause.push('selectedMods = ?');
                params.push(updates.selectedMods);
            }

            if (updates.comment !== undefined) {
                setClause.push('comment = ?');
                params.push(updates.comment);
            }

            if (updates.approved !== undefined) {
                setClause.push('approved = ?');
                params.push(updates.approved);
            }

            if (setClause.length === 0) {
                connection.release();
                return false;
            }

            params.push(id, selectedBy);

            const [result] = await connection.execute(
                `UPDATE map_selections SET ${setClause.join(', ')} WHERE id = ? AND selectedBy = ?`,
                params
            );

            connection.release();
            const updateResult = result as mysql.ResultSetHeader;
            return updateResult.affectedRows > 0;
        } catch (error) {
            console.error('Error updating map selection:', error);
            return false;
        }
    }
};

// 导出函数
export const getMapSelections = mapSelectionStorage.getMapSelections;
export const addMapSelection = mapSelectionStorage.addMapSelection;
export const deleteMapSelection = mapSelectionStorage.deleteMapSelection;
export const updateMapSelection = mapSelectionStorage.updateMapSelection;

export default initMapSelectionDatabase;
