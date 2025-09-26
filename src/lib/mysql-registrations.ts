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

        // 创建注册表（如果不存在）
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
                country VARCHAR(32),
                approved BOOLEAN DEFAULT FALSE COMMENT '审核状态：0-待审核，1-审核通过',
                approvedAt DATETIME NULL COMMENT '审核通过时间',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_osuId (osuId),
                INDEX idx_username (username),
                INDEX idx_approved (approved)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 创建比赛房间表（如果不存在）
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS match_rooms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_name VARCHAR(255) NOT NULL COMMENT '房间名称',
                round_number INT NOT NULL COMMENT '轮次',
                match_date DATE NOT NULL COMMENT '比赛日期',
                match_time TIME NOT NULL COMMENT '比赛时间',
                match_number INT NOT NULL COMMENT '比赛场次',
                max_participants INT DEFAULT 2 COMMENT '最大参赛人数',
                status ENUM('open', 'full', 'closed') DEFAULT 'open' COMMENT '房间状态：open-开放报名，full-已满员，closed-已关闭',
                description TEXT COMMENT '房间描述',
                created_by VARCHAR(255) NOT NULL COMMENT '创建者osuId',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_round (round_number),
                INDEX idx_date (match_date),
                INDEX idx_status (status),
                INDEX idx_created_by (created_by)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 创建比赛预约表（如果不存在）
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS match_schedules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_id INT NOT NULL COMMENT '所属房间ID',
                player1_osuId VARCHAR(255) NOT NULL COMMENT '选手1 osuId',
                player1_username VARCHAR(255) NOT NULL COMMENT '选手1 用户名',
                player2_osuId VARCHAR(255) NOT NULL COMMENT '选手2 osuId',
                player2_username VARCHAR(255) NOT NULL COMMENT '选手2 用户名',
                red_player_osuId VARCHAR(255) COMMENT '红方选手osuId',
                blue_player_osuId VARCHAR(255) COMMENT '蓝方选手osuId',
                red_score INT DEFAULT 0 COMMENT '红方分数',
                blue_score INT DEFAULT 0 COMMENT '蓝方分数',
                status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '状态：pending-待确认，confirmed-已确认，completed-已完成，cancelled-已取消',
                replay_link TEXT COMMENT '直播回放链接',
                match_link TEXT COMMENT '比赛链接',
                referee_osuId VARCHAR(255) COMMENT '裁判osuId',
                referee_username VARCHAR(255) COMMENT '裁判用户名',
                commentator_osuId VARCHAR(255) COMMENT '直播解说osuId',
                commentator_username VARCHAR(255) COMMENT '直播解说用户名',
                created_by VARCHAR(255) NOT NULL COMMENT '创建者osuId',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (room_id) REFERENCES match_rooms(id) ON DELETE CASCADE,
                INDEX idx_room (room_id),
                INDEX idx_player1 (player1_osuId),
                INDEX idx_player2 (player2_osuId),
                INDEX idx_status (status),
                INDEX idx_created_by (created_by)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 创建玩家对战列表表（如果不存在）
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS player_matchups (
                id INT AUTO_INCREMENT PRIMARY KEY,
                player1_osuId VARCHAR(255) NOT NULL COMMENT '选手1 osuId',
                player1_username VARCHAR(255) NOT NULL COMMENT '选手1 用户名',
                player2_osuId VARCHAR(255) NOT NULL COMMENT '选手2 osuId',
                player2_username VARCHAR(255) NOT NULL COMMENT '选手2 用户名',
                status ENUM('available', 'scheduled', 'completed') DEFAULT 'available' COMMENT '状态：available-可预约，scheduled-已预约，completed-已完成',
                created_by VARCHAR(255) NOT NULL COMMENT '创建者osuId',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_matchup (player1_osuId, player2_osuId),
                INDEX idx_player1 (player1_osuId),
                INDEX idx_player2 (player2_osuId),
                INDEX idx_status (status),
                INDEX idx_created_by (created_by)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 创建消息通知表（如果不存在）
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sender_osuId VARCHAR(255) NOT NULL COMMENT '发送者osuId',
                sender_username VARCHAR(255) NOT NULL COMMENT '发送者用户名',
                receiver_osuId VARCHAR(255) NOT NULL COMMENT '接收者osuId',
                receiver_username VARCHAR(255) NOT NULL COMMENT '接收者用户名',
                type ENUM('match_invitation', 'match_response', 'system') DEFAULT 'system' COMMENT '消息类型',
                title VARCHAR(255) NOT NULL COMMENT '消息标题',
                content TEXT NOT NULL COMMENT '消息内容',
                related_matchup_id INT NULL COMMENT '相关对战ID',
                status ENUM('unread', 'read', 'responded') DEFAULT 'unread' COMMENT '消息状态',
                response_action VARCHAR(50) NULL COMMENT '响应动作：accept/decline',
                response_time DATETIME NULL COMMENT '响应时间',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (related_matchup_id) REFERENCES player_matchups(id) ON DELETE SET NULL,
                INDEX idx_receiver (receiver_osuId),
                INDEX idx_sender (sender_osuId),
                INDEX idx_type (type),
                INDEX idx_status (status),
                INDEX idx_related_matchup (related_matchup_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 检查并添加缺失的字段（表结构升级）
        const requiredColumns = [
            { name: 'approved', type: 'BOOLEAN DEFAULT FALSE COMMENT \'审核状态：0-待审核，1-审核通过\'' },
            { name: 'approvedAt', type: 'DATETIME NULL COMMENT \'审核通过时间\'' },
            { name: 'country', type: 'VARCHAR(32)' }
        ];

        for (const column of requiredColumns) {
            try {
                // 检查字段是否存在
                const [existingColumns] = await connection.execute(
                    `SHOW COLUMNS FROM registrations LIKE '${column.name}'`
                );

                if ((existingColumns as any[]).length === 0) {
                    console.log(`Adding missing column: ${column.name}`);
                    await connection.execute(
                        `ALTER TABLE registrations ADD COLUMN ${column.name} ${column.type}`
                    );
                    console.log(`✅ Column ${column.name} added successfully`);
                }
            } catch (columnError) {
                console.error(`Error checking/adding column ${column.name}:`, columnError);
                // 继续处理其他字段，不中断整个初始化过程
            }
        }

        connection.release();
        console.log('Database initialized and upgraded successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

export interface MatchRoom {
    id: number;
    room_name: string;
    round_number: number;
    match_date: string;
    match_time: string;
    match_number: number;
    max_participants: number;
    status: 'open' | 'full' | 'closed';
    description?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface PlayerMatchup {
    id: number;
    player1_osuId: string;
    player1_username: string;
    player2_osuId: string;
    player2_username: string;
    status: 'available' | 'scheduled' | 'completed';
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface MatchSchedule {
    id: number;
    room_id: number;
    player1_osuId: string;
    player1_username: string;
    player2_osuId: string;
    player2_username: string;
    red_player_osuId?: string;
    blue_player_osuId?: string;
    red_score: number;
    blue_score: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    replay_link?: string;
    match_link?: string;
    referee_osuId?: string;
    referee_username?: string;
    commentator_osuId?: string;
    commentator_username?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    room?: MatchRoom; // 关联的房间信息
}

export interface Message {
    id: number;
    sender_osuId: string;
    sender_username: string;
    receiver_osuId: string;
    receiver_username: string;
    type: 'match_invitation' | 'match_response' | 'system';
    title: string;
    content: string;
    related_matchup_id?: number;
    status: 'unread' | 'read' | 'responded';
    response_action?: string;
    response_time?: string | null;
    created_at: string;
    updated_at: string;
}

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
    country: string;
    approved: boolean;
    approvedAt: string | null;
}

// MySQL 存储实现
const mysqlStorage = {
    // 读取所有注册信息
    getRegistrations: async (): Promise<Registration[]> => {
        try {
            const connection = await getPool().getConnection();

            const [rows] = await connection.execute(`
                                SELECT 
                                    osuId, username, inGameName, timezone, availability,
                                    registeredAt, avatar_url, pp, global_rank, country_rank, country,
                                    approved, approvedAt
                                FROM registrations 
                                ORDER BY registeredAt DESC
                        `);

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
                country: row.country || '',
                approved: row.approved || false,
                approvedAt: row.approvedAt ? new Date(row.approvedAt).toISOString() : null,
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
                        avatar_url = ?, pp = ?, global_rank = ?, country_rank = ?, country = ?, updatedAt = CURRENT_TIMESTAMP
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
                    registration.country || '',
                    registration.osuId
                ]);
            } else {
                // 插入新用户
                await connection.execute(`
                    INSERT INTO registrations 
                    (osuId, username, inGameName, timezone, availability, registeredAt, avatar_url, pp, global_rank, country_rank, country)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    registration.country_rank,
                    registration.country || ''
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

            const [rows] = await connection.execute(`
                                SELECT 
                                    osuId, username, inGameName, timezone, availability,
                                    registeredAt, avatar_url, pp, global_rank, country_rank, country,
                                    approved, approvedAt
                                FROM registrations WHERE osuId = ?
                        `, [osuId]);

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
                country: row.country || '',
                approved: row.approved || false,
                approvedAt: row.approvedAt ? new Date(row.approvedAt).toISOString() : null,
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
    },

    // 创建比赛房间
    createMatchRoom: async (room: Omit<MatchRoom, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
        try {
            const connection = await getPool().getConnection();

            const [result] = await connection.execute(`
                INSERT INTO match_rooms (
                    room_name, round_number, match_date, match_time, match_number,
                    max_participants, status, description, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                room.room_name, room.round_number, room.match_date, room.match_time, room.match_number,
                room.max_participants, room.status, room.description || null, room.created_by
            ]);

            connection.release();

            return (result as any).insertId;
        } catch (error) {
            console.error('Error creating match room:', error);
            throw error;
        }
    },

    // 获取所有比赛房间
    getMatchRooms: async (): Promise<MatchRoom[]> => {
        try {
            const connection = await getPool().getConnection();

            const [rows] = await connection.execute(`
                SELECT * FROM match_rooms
                ORDER BY match_date DESC, match_time DESC
            `);

            connection.release();

            return (rows as any[]).map(row => ({
                id: row.id,
                room_name: row.room_name,
                round_number: row.round_number,
                match_date: row.match_date,
                match_time: row.match_time,
                match_number: row.match_number,
                max_participants: row.max_participants,
                status: row.status,
                description: row.description,
                created_by: row.created_by,
                created_at: row.created_at,
                updated_at: row.updated_at
            }));
        } catch (error) {
            console.error('Error getting match rooms:', error);
            return [];
        }
    },

    // 获取单个比赛房间
    getMatchRoom: async (id: number): Promise<MatchRoom | null> => {
        try {
            const connection = await getPool().getConnection();

            const [rows] = await connection.execute(`
                SELECT * FROM match_rooms WHERE id = ?
            `, [id]);

            connection.release();

            const row = (rows as any[])[0];
            if (!row) return null;

            return {
                id: row.id,
                room_name: row.room_name,
                round_number: row.round_number,
                match_date: row.match_date,
                match_time: row.match_time,
                match_number: row.match_number,
                max_participants: row.max_participants,
                status: row.status,
                description: row.description,
                created_by: row.created_by,
                created_at: row.created_at,
                updated_at: row.updated_at
            };
        } catch (error) {
            console.error('Error getting match room:', error);
            return null;
        }
    },

    // 更新比赛房间状态
    updateMatchRoomStatus: async (id: number, status: MatchRoom['status']): Promise<boolean> => {
        try {
            const connection = await getPool().getConnection();

            const [result] = await connection.execute(
                'UPDATE match_rooms SET status = ? WHERE id = ?',
                [status, id]
            );

            connection.release();

            return (result as any).affectedRows > 0;
        } catch (error) {
            console.error('Error updating match room status:', error);
            return false;
        }
    },

    // 删除比赛房间
    deleteMatchRoom: async (id: number): Promise<boolean> => {
        try {
            const connection = await getPool().getConnection();

            const [result] = await connection.execute(
                'DELETE FROM match_rooms WHERE id = ?',
                [id]
            );

            connection.release();

            return (result as any).affectedRows > 0;
        } catch (error) {
            console.error('Error deleting match room:', error);
            return false;
        }
    },

    // 创建玩家对战列表
    createPlayerMatchup: async (matchup: Omit<PlayerMatchup, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
        try {
            const connection = await getPool().getConnection();

            const [result] = await connection.execute(`
                INSERT INTO player_matchups (
                    player1_osuId, player1_username, player2_osuId, player2_username,
                    status, created_by
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                matchup.player1_osuId, matchup.player1_username,
                matchup.player2_osuId, matchup.player2_username,
                matchup.status, matchup.created_by
            ]);

            connection.release();

            return (result as any).insertId;
        } catch (error) {
            console.error('Error creating player matchup:', error);
            throw error;
        }
    },

    // 获取玩家对战列表
    getPlayerMatchups: async (): Promise<PlayerMatchup[]> => {
        try {
            const connection = await getPool().getConnection();

            const [rows] = await connection.execute(
                'SELECT * FROM player_matchups ORDER BY created_at ASC'
            );

            connection.release();

            return (rows as any[]).map(row => ({
                id: row.id,
                player1_osuId: row.player1_osuId,
                player1_username: row.player1_username,
                player2_osuId: row.player2_osuId,
                player2_username: row.player2_username,
                status: row.status,
                created_by: row.created_by,
                created_at: row.created_at,
                updated_at: row.updated_at
            }));
        } catch (error) {
            console.error('Error getting player matchups:', error);
            return [];
        }
    },

    // 更新玩家对战状态
    updatePlayerMatchupStatus: async (id: number, status: PlayerMatchup['status']): Promise<boolean> => {
        try {
            const connection = await getPool().getConnection();

            const [result] = await connection.execute(
                'UPDATE player_matchups SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [status, id]
            );

            connection.release();

            return (result as any).affectedRows > 0;
        } catch (error) {
            console.error('Error updating player matchup status:', error);
            return false;
        }
    },

    // 删除玩家对战
    deletePlayerMatchup: async (id: number): Promise<boolean> => {
        try {
            const connection = await getPool().getConnection();

            const [result] = await connection.execute(
                'DELETE FROM player_matchups WHERE id = ?',
                [id]
            );

            connection.release();

            return (result as any).affectedRows > 0;
        } catch (error) {
            console.error('Error deleting player matchup:', error);
            return false;
        }
    },

    // 创建消息通知
    createMessage: async (message: Omit<Message, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
        try {
            const connection = await getPool().getConnection();

            const [result] = await connection.execute(
                `INSERT INTO messages (
                    sender_osuId, sender_username, receiver_osuId, receiver_username,
                    type, title, content, related_matchup_id, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    message.sender_osuId, message.sender_username, message.receiver_osuId, message.receiver_username,
                    message.type, message.title, message.content, message.related_matchup_id, message.status
                ]
            );

            connection.release();

            return (result as any).insertId;
        } catch (error) {
            console.error('Error creating message:', error);
            throw error;
        }
    },

    // 获取用户消息
    getUserMessages: async (osuId: string): Promise<Message[]> => {
        try {
            const connection = await getPool().getConnection();

            const [rows] = await connection.execute(
                'SELECT * FROM messages WHERE receiver_osuId = ? ORDER BY created_at DESC',
                [osuId]
            );

            connection.release();

            return (rows as any[]).map(row => ({
                id: row.id,
                sender_osuId: row.sender_osuId,
                sender_username: row.sender_username,
                receiver_osuId: row.receiver_osuId,
                receiver_username: row.receiver_username,
                type: row.type,
                title: row.title,
                content: row.content,
                related_matchup_id: row.related_matchup_id,
                status: row.status,
                response_action: row.response_action,
                response_time: row.response_time ? new Date(row.response_time).toISOString() : null,
                created_at: new Date(row.created_at).toISOString(),
                updated_at: new Date(row.updated_at).toISOString()
            }));
        } catch (error) {
            console.error('Error getting user messages:', error);
            return [];
        }
    },

    // 更新消息状态
    updateMessageStatus: async (id: number, status: Message['status'], response_action?: string): Promise<boolean> => {
        try {
            const connection = await getPool().getConnection();

            let query = 'UPDATE messages SET status = ?, updated_at = CURRENT_TIMESTAMP';
            let params: any[] = [status];

            if (response_action) {
                query += ', response_action = ?, response_time = CURRENT_TIMESTAMP';
                params.push(response_action);
            }

            query += ' WHERE id = ?';
            params.push(id);

            const [result] = await connection.execute(query, params);

            connection.release();

            return (result as any).affectedRows > 0;
        } catch (error) {
            console.error('Error updating message status:', error);
            return false;
        }
    },

    // 获取用户相关的比赛预约
    getUserMatchSchedules: async (osuId: string): Promise<MatchSchedule[]> => {
        try {
            const connection = await getPool().getConnection();

            const [rows] = await connection.execute(`
                SELECT ms.*, mr.room_name, mr.round_number, mr.match_date, mr.match_time, mr.match_number
                FROM match_schedules ms
                JOIN match_rooms mr ON ms.room_id = mr.id
                WHERE ms.player1_osuId = ? OR ms.player2_osuId = ?
                ORDER BY mr.match_date DESC, mr.match_time DESC
            `, [osuId, osuId]);

            connection.release();

            return (rows as any[]).map(row => ({
                id: row.id,
                room_id: row.room_id,
                player1_osuId: row.player1_osuId,
                player1_username: row.player1_username,
                player2_osuId: row.player2_osuId,
                player2_username: row.player2_username,
                red_player_osuId: row.red_player_osuId,
                blue_player_osuId: row.blue_player_osuId,
                red_score: row.red_score,
                blue_score: row.blue_score,
                status: row.status,
                replay_link: row.replay_link,
                match_link: row.match_link,
                referee_osuId: row.referee_osuId,
                referee_username: row.referee_username,
                commentator_osuId: row.commentator_osuId,
                commentator_username: row.commentator_username,
                created_by: row.created_by,
                created_at: row.created_at,
                updated_at: row.updated_at,
                room: {
                    id: row.room_id,
                    room_name: row.room_name,
                    round_number: row.round_number,
                    match_date: row.match_date,
                    match_time: row.match_time,
                    match_number: row.match_number,
                    max_participants: row.max_participants,
                    status: row.status,
                    description: row.description,
                    created_by: row.created_by,
                    created_at: row.created_at,
                    updated_at: row.updated_at
                }
            }));
        } catch (error) {
            console.error('Error getting user match schedules:', error);
            return [];
        }
    },

    // 更新比赛预约状态
    updateMatchScheduleStatus: async (id: number, status: MatchSchedule['status'], additionalData?: Partial<MatchSchedule>): Promise<boolean> => {
        try {
            const connection = await getPool().getConnection();

            let query = 'UPDATE match_schedules SET status = ?';
            let params: any[] = [status];

            if (additionalData) {
                const updates: string[] = [];
                Object.entries(additionalData).forEach(([key, value]) => {
                    if (value !== undefined && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
                        updates.push(`${key} = ?`);
                        params.push(value);
                    }
                });
                if (updates.length > 0) {
                    query += ', ' + updates.join(', ');
                }
            }

            query += ' WHERE id = ?';
            params.push(id);

            const [result] = await connection.execute(query, params);

            connection.release();

            return (result as any).affectedRows > 0;
        } catch (error) {
            console.error('Error updating match schedule status:', error);
            return false;
        }
    },

    // 获取所有比赛预约（管理员用）
    getAllMatchSchedules: async (): Promise<MatchSchedule[]> => {
        try {
            const connection = await getPool().getConnection();

            const [rows] = await connection.execute(`
                SELECT ms.*, mr.room_name, mr.round_number, mr.match_date, mr.match_time, mr.match_number
                FROM match_schedules ms
                JOIN match_rooms mr ON ms.room_id = mr.id
                ORDER BY mr.match_date DESC, mr.match_time DESC
            `);

            connection.release();

            return (rows as any[]).map(row => ({
                id: row.id,
                room_id: row.room_id,
                player1_osuId: row.player1_osuId,
                player1_username: row.player1_username,
                player2_osuId: row.player2_osuId,
                player2_username: row.player2_username,
                red_player_osuId: row.red_player_osuId,
                blue_player_osuId: row.blue_player_osuId,
                red_score: row.red_score,
                blue_score: row.blue_score,
                status: row.status,
                replay_link: row.replay_link,
                match_link: row.match_link,
                referee_osuId: row.referee_osuId,
                referee_username: row.referee_username,
                commentator_osuId: row.commentator_osuId,
                commentator_username: row.commentator_username,
                created_by: row.created_by,
                created_at: row.created_at,
                updated_at: row.updated_at,
                room: {
                    id: row.room_id,
                    room_name: row.room_name,
                    round_number: row.round_number,
                    match_date: row.match_date,
                    match_time: row.match_time,
                    match_number: row.match_number,
                    max_participants: row.max_participants,
                    status: row.status,
                    description: row.description,
                    created_by: row.created_by,
                    created_at: row.created_at,
                    updated_at: row.updated_at
                }
            }));
        } catch (error) {
            console.error('Error getting all match schedules:', error);
            return [];
        }
    },

    // 创建比赛预约
    createMatchSchedule: async (schedule: Omit<MatchSchedule, 'id' | 'created_at' | 'updated_at' | 'room'>): Promise<number> => {
        try {
            const connection = await getPool().getConnection();

            const [result] = await connection.execute(`
                INSERT INTO match_schedules (
                    room_id, player1_osuId, player1_username, player2_osuId, player2_username,
                    red_player_osuId, blue_player_osuId, red_score, blue_score,
                    status, replay_link, match_link, referee_osuId, referee_username,
                    commentator_osuId, commentator_username, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                schedule.room_id, schedule.player1_osuId, schedule.player1_username,
                schedule.player2_osuId, schedule.player2_username,
                schedule.red_player_osuId || null, schedule.blue_player_osuId || null,
                schedule.red_score, schedule.blue_score, schedule.status,
                schedule.replay_link || null, schedule.match_link || null,
                schedule.referee_osuId || null, schedule.referee_username || null,
                schedule.commentator_osuId || null, schedule.commentator_username || null,
                schedule.created_by
            ]);

            connection.release();

            return (result as any).insertId;
        } catch (error) {
            console.error('Error creating match schedule:', error);
            throw error;
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

// 比赛预约相关导出
export const createMatchSchedule = mysqlStorage.createMatchSchedule;
export const getUserMatchSchedules = mysqlStorage.getUserMatchSchedules;
export const updateMatchScheduleStatus = mysqlStorage.updateMatchScheduleStatus;
export const getAllMatchSchedules = mysqlStorage.getAllMatchSchedules;

// 比赛房间相关导出
export const createMatchRoom = mysqlStorage.createMatchRoom;
export const getMatchRooms = mysqlStorage.getMatchRooms;
export const getMatchRoom = mysqlStorage.getMatchRoom;
export const updateMatchRoomStatus = mysqlStorage.updateMatchRoomStatus;
export const deleteMatchRoom = mysqlStorage.deleteMatchRoom;

// 玩家对战列表相关导出
export const createPlayerMatchup = mysqlStorage.createPlayerMatchup;
export const getPlayerMatchups = mysqlStorage.getPlayerMatchups;
export const updatePlayerMatchupStatus = mysqlStorage.updatePlayerMatchupStatus;
export const deletePlayerMatchup = mysqlStorage.deletePlayerMatchup;

// 消息通知相关导出
export const createMessage = mysqlStorage.createMessage;
export const getUserMessages = mysqlStorage.getUserMessages;
export const updateMessageStatus = mysqlStorage.updateMessageStatus;

// 默认导出初始化函数
export default initDatabase;
