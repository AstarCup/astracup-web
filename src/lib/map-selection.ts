// 选图系统数据库管理
import mysql from 'mysql2/promise';

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

const getPool = (): mysql.Pool => {
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
    selectedMods: string;       // 选择的mod，如 "NM", "HD", "HR" 等
    comment: string;            // 注释信息
    selectedBy: string;         // 选图者的osu ID
    selectedAt: string;         // 选图时间
    season: string;             // 赛季标识，如 "s1", "s2"
    category: string;           // 类别，如 "qualification", "ro32", "ro16" 等
    url: string;                // beatmap URL
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
                selectedMods VARCHAR(50) NOT NULL DEFAULT 'NM',
                comment TEXT,
                selectedBy VARCHAR(255) NOT NULL,
                selectedAt DATETIME NOT NULL,
                season VARCHAR(50) NOT NULL DEFAULT 's1',
                category VARCHAR(50) NOT NULL DEFAULT 'qualification',
                url TEXT NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_beatmapId (beatmapId),
                INDEX idx_selectedBy (selectedBy),
                INDEX idx_season_category (season, category),
                INDEX idx_selectedAt (selectedAt),
                UNIQUE KEY unique_beatmap_season_category (beatmapId, season, category)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

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
                selectedMods: row.selectedMods,
                comment: row.comment || '',
                selectedBy: row.selectedBy,
                selectedAt: row.selectedAt,
                season: row.season,
                category: row.category,
                url: row.url
            }));
        } catch (error) {
            console.error('Error getting map selections:', error);
            return [];
        }
    },

    // 添加选图
    async addMapSelection(selection: Omit<MapSelection, 'id' | 'selectedAt'>): Promise<boolean> {
        try {
            const connection = await getPool().getConnection();

            const [result] = await connection.execute(`
                INSERT INTO map_selections (
                    beatmapId, beatmapsetId, title, artist, version, creator,
                    starRating, bpm, totalLength, selectedMods, comment,
                    selectedBy, selectedAt, season, category, url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)
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
                selection.selectedMods,
                selection.comment,
                selection.selectedBy,
                selection.season,
                selection.category,
                selection.url
            ]);

            connection.release();
            const insertResult = result as mysql.ResultSetHeader;
            return insertResult.affectedRows > 0;
        } catch (error) {
            console.error('Error adding map selection:', error);
            if (error instanceof Error && error.message.includes('Duplicate entry')) {
                throw new Error('该beatmap已经在此赛季和类别中被选择过了');
            }
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
    async updateMapSelection(id: number, updates: Partial<Pick<MapSelection, 'selectedMods' | 'comment'>>, selectedBy: string): Promise<boolean> {
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
export const isBeatmapSelected = mapSelectionStorage.isBeatmapSelected;
export const updateMapSelection = mapSelectionStorage.updateMapSelection;

export default initMapSelectionDatabase;
