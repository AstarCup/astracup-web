// 选图系统数据库管理
import mysql from 'mysql2/promise';
import { getUserById } from './osu-api';
import { get } from '@vercel/edge-config';
import { verifyMapSelectionAuth } from './permissions';

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
            connectionLimit: 30, // 增加连接限制
            queueLimit: 0, // 无限制队列
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
    title_unicode: string;      // 歌曲标题（Unicode/原曲名）
    artist: string;             // 艺术家
    artist_unicode: string;     // 艺术家（Unicode/原曲名）
    version: string;            // 难度名称
    creator: string;            // 作图者
    starRating: number;         // 星级
    bpm: number;                // BPM
    totalLength: number;        // 总长度（秒）
    maxCombo: number;           // 最大连击数
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
    selectedByUsername: string; // 选图者的用户名
    selectedByAvatar: string;   // 选图者的头像URL
    selectedAt: string;         // 选图时间
    season: string;             // 赛季标识，如 "s1", "s2"
    category: string;           // 类别，如 "qualification", "ro32", "ro16" 等
    url: string;                // beatmap URL
    coverUrl: string;           // 封面URL
    approved: boolean;          // 是否过审
    padding?: boolean;          // 是否为padding状态
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
        } catch (error: unknown) {
            // 如果约束不存在，忽略错误
            const mysqlError = error as { code?: string; message?: string };
            if (mysqlError.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('Unique constraint removal:', mysqlError.message);
            }
        }

        // 检查并添加新字段（用于已存在的表）
        try {
            // 检查ar字段是否存在
            await connection.execute(`SELECT ar FROM map_selections LIMIT 1`);
        } catch (error: unknown) {
            const mysqlError = error as { code?: string };
            if (mysqlError.code === 'ER_BAD_FIELD_ERROR') {
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
        } catch (error: unknown) {
            const mysqlError = error as { code?: string };
            if (mysqlError.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Adding modPosition field...');
                await connection.execute(`
                    ALTER TABLE map_selections 
                    ADD COLUMN modPosition INT NOT NULL DEFAULT 1 AFTER selectedMods
                `);
                console.log('Successfully added modPosition field');
            }
        }

        // 检查并添加padding字段
        try {
            await connection.execute(`SELECT padding FROM map_selections LIMIT 1`);
        } catch (error: unknown) {
            const mysqlError = error as { code?: string };
            if (mysqlError.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Adding padding field...');
                await connection.execute(`
                    ALTER TABLE map_selections 
                    ADD COLUMN padding BOOLEAN DEFAULT FALSE AFTER approved
                `);
                console.log('Successfully added padding field');
            }
        }

        // 检查并添加coverUrl字段
        try {
            await connection.execute(`SELECT coverUrl FROM map_selections LIMIT 1`);
        } catch (error: unknown) {
            const mysqlError = error as { code?: string };
            if (mysqlError.code === 'ER_BAD_FIELD_ERROR') {
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
        } catch (error: unknown) {
            const mysqlError = error as { code?: string };
            if (mysqlError.code === 'ER_BAD_FIELD_ERROR') {
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
        } catch (error: unknown) {
            const mysqlError = error as { code?: string };
            if (mysqlError.code === 'ER_BAD_FIELD_ERROR') {
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
        } catch (error: unknown) {
            const mysqlError = error as { code?: string };
            if (mysqlError.code === 'ER_BAD_FIELD_ERROR') {
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
        } catch (error: unknown) {
            const mysqlError = error as { code?: string };
            if (mysqlError.code === 'ER_BAD_FIELD_ERROR') {
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
        } catch (error: unknown) {
            const mysqlError = error as { code?: string };
            if (mysqlError.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Adding customModName field...');
                await connection.execute(`
                    ALTER TABLE map_selections 
                    ADD COLUMN customModName VARCHAR(50) DEFAULT NULL AFTER customDTRate
                `);
                console.log('Successfully added customModName field');
            }
        }

        // 检查并添加maxCombo字段
        try {
            await connection.execute(`SELECT maxCombo FROM map_selections LIMIT 1`);
        } catch (error: unknown) {
            const mysqlError = error as { code?: string };
            if (mysqlError.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Adding maxCombo field...');
                await connection.execute(`
                    ALTER TABLE map_selections 
                    ADD COLUMN maxCombo INT NOT NULL DEFAULT 0 AFTER totalLength
                `);
                console.log('Successfully added maxCombo field');
            }
        }

        // 检查并添加title_unicode字段
        try {
            await connection.execute(`SELECT title_unicode FROM map_selections LIMIT 1`);
        } catch (error: unknown) {
            const mysqlError = error as { code?: string };
            if (mysqlError.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Adding title_unicode field...');
                await connection.execute(`
                    ALTER TABLE map_selections 
                    ADD COLUMN title_unicode VARCHAR(255) DEFAULT NULL AFTER title
                `);
                console.log('Successfully added title_unicode field');
            }
        }

        // 检查并添加artist_unicode字段
        try {
            await connection.execute(`SELECT artist_unicode FROM map_selections LIMIT 1`);
        } catch (error: unknown) {
            const mysqlError = error as { code?: string };
            if (mysqlError.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Adding artist_unicode field...');
                await connection.execute(`
                    ALTER TABLE map_selections 
                    ADD COLUMN artist_unicode VARCHAR(255) DEFAULT NULL AFTER artist
                `);
                console.log('Successfully added artist_unicode field');
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
    async getMapSelections(season: string = 's1', category?: string, padding?: boolean): Promise<MapSelection[]> {
        try {
            const connection = await getPool().getConnection();
            let query = 'SELECT * FROM map_selections WHERE season = ?';
            const params: (string | boolean | undefined)[] = [season];

            // 如果category是"all"或undefined，则不添加category过滤条件
            if (category && category !== 'all') {
                query += ' AND category = ?';
                params.push(category);
            }

            if (padding !== undefined) {
                query += ' AND padding = ?';
                params.push(padding);
            }

            query += ' ORDER BY selectedAt DESC';

            const [rows] = await connection.execute(query, params);
            connection.release();

            return (rows as any[]).map(row => ({
                id: row.id,
                beatmapId: row.beatmapId,
                beatmapsetId: row.beatmapsetId,
                title: row.title,
                title_unicode: row.title_unicode || row.title, // 如果unicode字段为空，使用普通标题
                artist: row.artist,
                artist_unicode: row.artist_unicode || row.artist, // 如果unicode字段为空，使用普通艺术家
                version: row.version,
                creator: row.creator,
                starRating: parseFloat(row.starRating),
                bpm: parseFloat(row.bpm),
                totalLength: row.totalLength,
                maxCombo: row.maxCombo || 0,
                ar: parseFloat(row.ar) || 0,
                cs: parseFloat(row.cs) || 0,
                od: parseFloat(row.od) || 0,
                hp: parseFloat(row.hp) || 0,
                selectedMods: row.selectedMods,
                modPosition: row.modPosition || 1,
                customDTRate: row.customDTRate ? parseFloat(row.customDTRate) : undefined,
                customModName: row.customModName || undefined,
                comment: row.comment || '',
                selectedBy: row.selectedBy,
                selectedByUsername: row.selectedByUsername || `User_${row.selectedBy}`, // 使用存储的用户名
                selectedByAvatar: row.selectedByAvatar || '', // 使用存储的头像URL
                selectedAt: row.selectedAt,
                season: row.season,
                category: row.category,
                url: row.url,
                coverUrl: row.coverUrl || '',
                approved: Boolean(row.approved),
                padding: Boolean(row.padding)
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

            // 确保所有参数都有有效值，将 undefined 转换为 null
            const params = [
                selection.beatmapId,
                selection.beatmapsetId,
                selection.title,
                selection.title_unicode || selection.title, // 如果unicode字段为空，使用普通标题
                selection.artist,
                selection.artist_unicode || selection.artist, // 如果unicode字段为空，使用普通艺术家
                selection.version,
                selection.creator,
                selection.starRating,
                selection.bpm,
                selection.totalLength,
                selection.maxCombo || 0,
                selection.ar,
                selection.cs,
                selection.od,
                selection.hp,
                selection.selectedMods,
                selection.modPosition,
                selection.customDTRate !== undefined ? selection.customDTRate : null,
                selection.customModName !== undefined ? selection.customModName : null,
                selection.comment,
                selection.selectedBy,
                selection.selectedByUsername !== undefined ? selection.selectedByUsername : null,
                selection.selectedByAvatar !== undefined ? selection.selectedByAvatar : null,
                selection.season,
                selection.category,
                selection.url,
                selection.coverUrl,
                selection.approved
            ];

            // 调试日志
            console.log('Inserting map selection with params:', params);

            const [result] = await connection.execute(`
                INSERT INTO map_selections (
                    beatmapId, beatmapsetId, title, title_unicode, artist, artist_unicode, version, creator,
                    starRating, bpm, totalLength, maxCombo, ar, cs, od, hp, selectedMods, modPosition, customDTRate, customModName, comment,
                    selectedBy, selectedByUsername, selectedByAvatar, selectedAt, season, category, url, coverUrl, approved
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)
            `, params);

            connection.release();
            const insertResult = result as mysql.ResultSetHeader;
            return insertResult.affectedRows > 0;
        } catch (error) {
            console.error('Error adding map selection:', error);
            return false;
        }
    },

    // 删除选图
    async deleteMapSelection(id: number, selectedBy?: string): Promise<boolean> {
        try {
            const connection = await getPool().getConnection();

            let query = 'DELETE FROM map_selections WHERE id = ?';
            const params: (number | string)[] = [id];

            // 如果提供了selectedBy，则添加用户权限检查
            if (selectedBy) {
                query += ' AND selectedBy = ?';
                params.push(selectedBy);
            }

            const [result] = await connection.execute(query, params);

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
    async updateMapSelection(id: number, updates: Partial<Pick<MapSelection, 'selectedMods' | 'comment' | 'approved' | 'padding' | 'customModName' | 'customDTRate' | 'title' | 'version' | 'category' | 'totalLength' | 'maxCombo' | 'starRating' | 'bpm' | 'ar' | 'cs' | 'od' | 'hp'>>, selectedBy: string): Promise<boolean> {
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

            if (updates.padding !== undefined) {
                setClause.push('padding = ?');
                params.push(updates.padding);
            }

            if (updates.customModName !== undefined) {
                setClause.push('customModName = ?');
                params.push(updates.customModName);
            }

            if (updates.customDTRate !== undefined) {
                setClause.push('customDTRate = ?');
                params.push(updates.customDTRate);
            }

            // 新增：基础属性更新
            if (updates.title !== undefined) {
                setClause.push('title = ?');
                params.push(updates.title);
            }
            if (updates.version !== undefined) {
                setClause.push('version = ?');
                params.push(updates.version);
            }
            if (updates.category !== undefined) {
                setClause.push('category = ?');
                params.push(updates.category);
            }
            if (updates.totalLength !== undefined) {
                setClause.push('totalLength = ?');
                params.push(updates.totalLength);
            }

            if (updates.maxCombo !== undefined) {
                setClause.push('maxCombo = ?');
                params.push(updates.maxCombo);
            }

            // update modded attributes
            if (updates.ar !== undefined) {
                setClause.push('ar = ?');
                params.push(updates.ar);
            }
            if (updates.cs !== undefined) {
                setClause.push('cs = ?');
                params.push(updates.cs);
            }
            if (updates.od !== undefined) {
                setClause.push('od = ?');
                params.push(updates.od);
            }
            if (updates.hp !== undefined) {
                setClause.push('hp = ?');
                params.push(updates.hp);
            }
            if (updates.starRating !== undefined) {
                setClause.push('starRating = ?');
                params.push(updates.starRating);
            }
            if (updates.bpm !== undefined) {
                setClause.push('bpm = ?');
                params.push(updates.bpm);
            }

            if (setClause.length === 0) {
                connection.release();
                return false;
            }

            // 检查当前用户是否为管理员
            const isAdmin = await verifyAdminAuth(selectedBy);
            const isMapSelector = await verifyMapSelectionAuth(selectedBy);

            // 权限逻辑：
            // 1. 管理员可以更新任何字段
            // 2. 选图员可以更新任何字段（包括非自己创建的选图）
            // 3. 其他用户只能更新自己创建的选图
            let whereClause = 'WHERE id = ?';
            const queryParams = [...params, id];

            // 管理员和选图员可以更新任何选图
            if (!isAdmin && !isMapSelector) {
                // 非管理员和非选图员只能更新自己创建的选图
                whereClause += ' AND selectedBy = ?';
                queryParams.push(selectedBy);
            }

            const [result] = await connection.execute(
                `UPDATE map_selections SET ${setClause.join(', ')} ${whereClause}`,
                queryParams
            );

            connection.release();
            const updateResult = result as mysql.ResultSetHeader;
            console.log('Database update result:', {
                sql: `UPDATE map_selections SET ${setClause.join(', ')} ${whereClause}`,
                params: queryParams,
                affectedRows: updateResult.affectedRows,
                changedRows: updateResult.changedRows,
                isAdmin: isAdmin,
                isMapSelector: isMapSelector
            });
            return updateResult.affectedRows > 0;
        } catch (error) {
            console.error('Error updating map selection:', error);
            return false;
        }
    }
};

// 管理员权限验证函数
export const verifyAdminAuth = async (osuId: string): Promise<boolean> => {
    try {
        let adminList: string[] = [];

        // 优先尝试从Edge Config获取管理员列表
        if (process.env.EDGE_CONFIG) {
            const adminConfig = await get('admin');
            if (adminConfig && Array.isArray(adminConfig)) {
                adminList = adminConfig.filter((id): id is string =>
                    typeof id === 'string' && id.trim() !== ''
                );
            }
        }

        // 如果Edge Config没有数据，尝试从环境变量获取
        if (adminList.length === 0 && process.env.ADMIN_IDS) {
            adminList = process.env.ADMIN_IDS
                .split(',')
                .map(id => id.trim())
                .filter(id => id !== '');
        }

        // 如果都没有数据，使用默认测试ID（开发环境）
        if (adminList.length === 0 && process.env.NODE_ENV === 'development') {
            adminList = ['2']; // peppy的ID作为示例
        }

        // 检查osu ID是否在管理员列表中
        const userIdStr = osuId.toString();
        const userIdNum = parseInt(osuId);

        return adminList.some(adminId => {
            const adminIdStr = adminId.toString();
            const adminIdNum = parseInt(adminId);

            // 比较字符串和数字形式
            return adminIdStr === userIdStr || adminIdNum === userIdNum;
        });
    } catch (error) {
        console.error('Error verifying admin auth:', error);
        return false;
    }
};

// 导出函数
export const getMapSelections = mapSelectionStorage.getMapSelections;
export const addMapSelection = mapSelectionStorage.addMapSelection;
export const deleteMapSelection = mapSelectionStorage.deleteMapSelection;
export const updateMapSelection = mapSelectionStorage.updateMapSelection;

export default initMapSelectionDatabase;
