// MySQL 数据库存储实现
import mysql from 'mysql2/promise';

// 数据库连接配置
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

// 初始化数据库表
export const initDatabase = async (): Promise<void> => {
    try {
        const connection = await getPool().getConnection();

        // 创建注册表
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        osuId VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(255) NOT NULL,
        inGameName VARCHAR(255),
        timezone VARCHAR(50),
        availability TEXT,
        registeredAt DATETIME NOT NULL,
        avatar_url TEXT,
        pp FLOAT,
        global_rank INT,
        country_rank INT,
        approved BOOLEAN DEFAULT FALSE COMMENT '审核状态：0-待审核，1-审核通过',
        approvedAt DATETIME NULL COMMENT '审核通过时间',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_osuId (osuId),
        INDEX idx_username (username),
        INDEX idx_approved (approved)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        connection.release();
        // console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

export interface Registration {
    osuId: string;
    username: string;
    inGameName: string;
    timezone: string;
    availability: string;
    registeredAt: string;
    avatar_url: string;
    pp: number;
    global_rank: number | null;
    country_rank: number | null;
    approved: boolean;
    approvedAt: string | null;
}

// MySQL 存储实现
const mysqlStorage = {
    // 读取所有注册信息
    getRegistrations: async (): Promise<Registration[]> => {
        try {
            const connection = await getPool().getConnection();

            // 首先检查表结构，确定是否有approved字段
            let hasApprovedField = false;
            try {
                const [columns] = await connection.execute(`
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'registrations' 
                    AND COLUMN_NAME = 'approved'
                `);
                hasApprovedField = (columns as any[]).length > 0;
            } catch (error) {
                console.warn('Error checking table structure:', error);
                // 如果检查失败，假设没有approved字段
                hasApprovedField = false;
            }

            let query: string;
            if (hasApprovedField) {
                query = `
                    SELECT 
                      osuId, username, inGameName, timezone, availability,
                      registeredAt, avatar_url, pp, global_rank, country_rank,
                      approved, approvedAt
                    FROM registrations 
                    ORDER BY registeredAt DESC
                `;
            } else {
                query = `
                    SELECT 
                      osuId, username, inGameName, timezone, availability,
                      registeredAt, avatar_url, pp, global_rank, country_rank
                    FROM registrations 
                    ORDER BY registeredAt DESC
                `;
            }

            const [rows] = await connection.execute(query);

            connection.release();

            return (rows as any[]).map(row => ({
                osuId: row.osuId,
                username: row.username,
                inGameName: row.inGameName || row.username,
                timezone: row.timezone || '',
                availability: row.availability || '',
                registeredAt: new Date(row.registeredAt).toISOString(),
                avatar_url: row.avatar_url,
                pp: row.pp,
                global_rank: row.global_rank,
                country_rank: row.country_rank,
                approved: hasApprovedField ? (row.approved || false) : false,
                approvedAt: hasApprovedField ? (row.approvedAt ? new Date(row.approvedAt).toISOString() : null) : null,
            }));
        } catch (error) {
            console.error('Error reading from database:', error);
            return [];
        }
    },

    // 添加新注册
    addRegistration: async (registration: Omit<Registration, 'registeredAt'>): Promise<void> => {
        const connection = await getPool().getConnection();

        try {
            await connection.beginTransaction();

            // 检查是否已存在
            const [existingRows] = await connection.execute(
                'SELECT osuId FROM registrations WHERE osuId = ?',
                [registration.osuId]
            );

            const existing = (existingRows as any[]).length > 0;

            if (existing) {
                // 更新现有用户信息
                await connection.execute(`
          UPDATE registrations SET
            username = ?, inGameName = ?, timezone = ?, availability = ?,
            avatar_url = ?, pp = ?, global_rank = ?, country_rank = ?, updatedAt = CURRENT_TIMESTAMP
          WHERE osuId = ?
        `, [
                    registration.username,
                    registration.inGameName || registration.username,
                    registration.timezone || '',
                    registration.availability || '',
                    registration.avatar_url,
                    registration.pp,
                    registration.global_rank,
                    registration.country_rank,
                    registration.osuId
                ]);
            } else {
                // 插入新用户
                await connection.execute(`
          INSERT INTO registrations 
          (osuId, username, inGameName, timezone, availability, registeredAt, avatar_url, pp, global_rank, country_rank)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
                    registration.osuId,
                    registration.username,
                    registration.inGameName || registration.username,
                    registration.timezone || '',
                    registration.availability || '',
                    new Date(),
                    registration.avatar_url,
                    registration.pp,
                    registration.global_rank,
                    registration.country_rank
                ]);
            }

            await connection.commit();
            // console.log('Registration saved to database successfully');

        } catch (error) {
            await connection.rollback();
            console.error('Error writing to database:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // 检查用户是否已注册
    isUserRegistered: async (osuId: string): Promise<boolean> => {
        try {
            const connection = await getPool().getConnection();

            const [rows] = await connection.execute(
                'SELECT 1 FROM registrations WHERE osuId = ?',
                [osuId]
            );

            connection.release();
            return (rows as any[]).length > 0;
        } catch (error) {
            console.error('Error checking registration status:', error);
            return false;
        }
    },

    // 获取用户注册信息
    getUserRegistration: async (osuId: string): Promise<Registration | null> => {
        try {
            const connection = await getPool().getConnection();

            // 首先检查表结构，确定是否有approved字段
            let hasApprovedField = false;
            try {
                const [columns] = await connection.execute(`
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'registrations' 
                    AND COLUMN_NAME = 'approved'
                `);
                hasApprovedField = (columns as any[]).length > 0;
            } catch (error) {
                console.warn('Error checking table structure:', error);
                // 如果检查失败，假设没有approved字段
                hasApprovedField = false;
            }

            let query: string;
            if (hasApprovedField) {
                query = `
                    SELECT 
                      osuId, username, inGameName, timezone, availability,
                      registeredAt, avatar_url, pp, global_rank, country_rank,
                      approved, approvedAt
                    FROM registrations WHERE osuId = ?
                `;
            } else {
                query = `
                    SELECT 
                      osuId, username, inGameName, timezone, availability,
                      registeredAt, avatar_url, pp, global_rank, country_rank
                    FROM registrations WHERE osuId = ?
                `;
            }

            const [rows] = await connection.execute(query, [osuId]);

            connection.release();

            const row = (rows as any[])[0];
            if (!row) return null;

            return {
                osuId: row.osuId,
                username: row.username,
                inGameName: row.inGameName || row.username,
                timezone: row.timezone || '',
                availability: row.availability || '',
                registeredAt: new Date(row.registeredAt).toISOString(),
                avatar_url: row.avatar_url,
                pp: row.pp,
                global_rank: row.global_rank,
                country_rank: row.country_rank,
                approved: hasApprovedField ? (row.approved || false) : false,
                approvedAt: hasApprovedField ? (row.approvedAt ? new Date(row.approvedAt).toISOString() : null) : null,
            };
        } catch (error) {
            console.error('Error getting user registration:', error);
            return null;
        }
    },

    // 获取所有注册用户数量
    getRegistrationCount: async (): Promise<number> => {
        try {
            const connection = await getPool().getConnection();

            const [rows] = await connection.execute(
                'SELECT COUNT(*) as count FROM registrations'
            );

            connection.release();
            return (rows as any[])[0]?.count || 0;
        } catch (error) {
            console.error('Error getting registration count:', error);
            return 0;
        }
    },

    // 删除用户注册信息
    deleteRegistration: async (osuId: string): Promise<boolean> => {
        try {
            const connection = await getPool().getConnection();

            const [result] = await connection.execute(
                'DELETE FROM registrations WHERE osuId = ?',
                [osuId]
            );

            connection.release();

            const affectedRows = (result as any).affectedRows;
            return affectedRows > 0;
        } catch (error) {
            console.error('Error deleting registration:', error);
            return false;
        }
    },

    // 审核通过用户注册
    approveRegistration: async (osuId: string): Promise<boolean> => {
        try {
            const connection = await getPool().getConnection();

            // 首先检查表结构，确定是否有approved字段
            let hasApprovedField = false;
            try {
                const [columns] = await connection.execute(`
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'registrations' 
                    AND COLUMN_NAME = 'approved'
                `);
                hasApprovedField = (columns as any[]).length > 0;
            } catch (error) {
                console.warn('Error checking table structure:', error);
                // 如果检查失败，假设没有approved字段
                hasApprovedField = false;
            }

            if (!hasApprovedField) {
                connection.release();
                console.error('Cannot approve registration: approved field does not exist in database');
                return false;
            }

            const [result] = await connection.execute(
                'UPDATE registrations SET approved = TRUE, approvedAt = NOW() WHERE osuId = ?',
                [osuId]
            );

            connection.release();

            const affectedRows = (result as any).affectedRows;
            return affectedRows > 0;
        } catch (error) {
            console.error('Error approving registration:', error);
            return false;
        }
    }
};

// 导出函数（保持与原有接口兼容）
export const getRegistrations = mysqlStorage.getRegistrations;
export const isUserRegistered = mysqlStorage.isUserRegistered;
export const addRegistration = mysqlStorage.addRegistration;
export const getUserRegistration = mysqlStorage.getUserRegistration;
export const getRegistrationCount = mysqlStorage.getRegistrationCount;
export const deleteRegistration = mysqlStorage.deleteRegistration;
export const approveRegistration = mysqlStorage.approveRegistration;

// 默认导出初始化函数
export default initDatabase;
