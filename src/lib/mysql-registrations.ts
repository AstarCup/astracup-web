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

        // 创建staff房间分配表（如果不存在）
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS staff_room_assignments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_id INT NOT NULL COMMENT '房间ID',
                staff_osuId VARCHAR(255) NOT NULL COMMENT 'staff osuId',
                staff_username VARCHAR(255) NOT NULL COMMENT 'staff 用户名',
                staff_role ENUM('referee', 'streamer', 'commentator') NOT NULL COMMENT 'staff角色：referee-裁判，streamer-直播，commentator-解说',
                status ENUM('pending', 'confirmed', 'declined') DEFAULT 'pending' COMMENT '分配状态：pending-待确认，confirmed-已确认，declined-已拒绝',
                assigned_by VARCHAR(255) NOT NULL COMMENT '分配者osuId',
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                responded_at DATETIME NULL COMMENT '响应时间',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (room_id) REFERENCES match_rooms(id) ON DELETE CASCADE,
                UNIQUE KEY unique_staff_room (room_id, staff_osuId, staff_role),
                INDEX idx_room (room_id),
                INDEX idx_staff (staff_osuId),
                INDEX idx_role (staff_role),
                INDEX idx_status (status),
                INDEX idx_assigned_by (assigned_by)
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

        // 检查并移除 player_matchups 表中不需要的字段
        try {
            // 检查 room_id 字段是否存在，如果存在则修改为可为NULL
            const [roomIdColumns] = await connection.execute(
                `SHOW COLUMNS FROM player_matchups LIKE 'room_id'`
            );

            if ((roomIdColumns as any[]).length > 0) {
                console.log('Modifying room_id column in player_matchups table to allow NULL');

                // 先删除外键约束（如果存在）
                try {
                    await connection.execute(
                        `ALTER TABLE player_matchups DROP FOREIGN KEY player_matchups_ibfk_1`
                    );
                    console.log('✅ Foreign key constraint removed');
                } catch (fkError) {
                    console.log('Foreign key constraint might not exist or already removed, continuing...');
                }

                // 修改字段为可为NULL
                await connection.execute(
                    `ALTER TABLE player_matchups MODIFY COLUMN room_id INT NULL`
                );
                console.log('✅ Column room_id modified to allow NULL values');
            }
        } catch (columnError) {
            console.error('Error modifying room_id column in player_matchups:', columnError);
            // 继续处理，不中断整个初始化过程
        }

        // 创建比赛设置表（如果不存在）
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS tournament_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tournament_name VARCHAR(255) NOT NULL COMMENT '比赛名称',
                max_pp_for_registration FLOAT DEFAULT 7000 COMMENT '报名最高PP限制',
                min_pp_for_registration FLOAT DEFAULT 0 COMMENT '报名最低PP限制',
                current_season VARCHAR(50) DEFAULT 's1' COMMENT '当前赛季',
                current_season_stage VARCHAR(50) DEFAULT 'registration' COMMENT '当前赛季阶段',
                admin_group TEXT COMMENT '管理员组（JSON格式）',
                map_selection_group TEXT COMMENT '选图组（JSON格式）',
                map_testing_group TEXT COMMENT '测图组（JSON格式）',
                streamer_group TEXT COMMENT '直播员组（JSON格式）',
                referee_group TEXT COMMENT '裁判员组（JSON格式）',
                commentator_group TEXT COMMENT '解说员组（JSON格式）',
                registration_enabled BOOLEAN DEFAULT TRUE COMMENT '当前阶段是否可报名',
                mappool_visible BOOLEAN DEFAULT FALSE COMMENT '当前阶段是否可展示图池',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_current_season (current_season),
                INDEX idx_current_stage (current_season_stage)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 创建比赛分数表（如果不存在）
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS match_scores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_id BIGINT NOT NULL COMMENT '房间ID',
                room_name VARCHAR(255) NOT NULL COMMENT '房间名称',
                room_category VARCHAR(50) COMMENT '房间类型',
                room_type VARCHAR(50) COMMENT '房间模式',
                starts_at DATETIME NULL COMMENT '房间开始时间',
                ends_at DATETIME NULL COMMENT '房间结束时间',
                participant_count INT DEFAULT 0 COMMENT '参与人数',
                host_osuId VARCHAR(255) COMMENT '房主osuId',
                host_username VARCHAR(255) COMMENT '房主用户名',
                playlist_count INT DEFAULT 0 COMMENT '图池数量',
                user_id BIGINT NOT NULL COMMENT '用户ID',
                username VARCHAR(255) NOT NULL COMMENT '用户名',
                playlist_id BIGINT COMMENT '图池ID',
                beatmap_id BIGINT COMMENT '谱面ID',
                total_score BIGINT DEFAULT 0 COMMENT '总分',
                accuracy DECIMAL(5,2) DEFAULT 0 COMMENT '准确率',
                max_combo INT DEFAULT 0 COMMENT '最大连击',
                mods VARCHAR(255) COMMENT '使用的mods',
                \`rank\` VARCHAR(10) COMMENT '排名',
                passed BOOLEAN DEFAULT TRUE COMMENT '是否通过',
                statistics JSON COMMENT '统计数据',
                pp DECIMAL(10,2) DEFAULT 0 COMMENT 'PP值',
                ended_at DATETIME NULL COMMENT '分数结束时间',
                saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '保存时间',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_score (room_id, user_id, playlist_id, beatmap_id),
                INDEX idx_room_id (room_id),
                INDEX idx_user_id (user_id),
                INDEX idx_username (username),
                INDEX idx_playlist_id (playlist_id),
                INDEX idx_beatmap_id (beatmap_id),
                INDEX idx_saved_at (saved_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // 检查tournament_settings表是否有数据，如果没有则插入默认数据
        const [settingsRows] = await connection.execute(
            `SELECT COUNT(*) as count FROM tournament_settings`
        );

        if ((settingsRows as any[])[0].count === 0) {
            console.log('Inserting default tournament settings');
            await connection.execute(`
                INSERT INTO tournament_settings (
                    tournament_name,
                    max_pp_for_registration,
                    min_pp_for_registration,
                    current_season,
                    current_season_stage,
                    admin_group,
                    map_selection_group,
                    map_testing_group,
                    streamer_group,
                    referee_group,
                    commentator_group,
                    registration_enabled,
                    mappool_visible
                ) VALUES (
                    'Astra Cup',
                    7000,
                    0,
                    's1',
                    'registration',
                    '[]',
                    '[]',
                    '[]',
                    '[]',
                    '[]',
                    '[]',
                    TRUE,
                    FALSE
                )
            `);
            console.log('✅ Default tournament settings inserted');
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
    player1_avatar_url?: string;
    player2_osuId: string;
    player2_username: string;
    player2_avatar_url?: string;
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
    player1_avatar_url?: string;
    player2_osuId: string;
    player2_username: string;
    player2_avatar_url?: string;
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

export interface StaffRoomAssignment {
    id: number;
    room_id: number;
    staff_osuId: string;
    staff_username: string;
    staff_role: 'referee' | 'streamer' | 'commentator';
    status: 'pending' | 'confirmed' | 'declined';
    assigned_by: string;
    assigned_at: string;
    responded_at?: string | null;
    created_at: string;
    updated_at: string;
    room?: {
        id: number;
        room_name: string;
        round_number: number;
        match_date: string;
        match_time: string;
        match_number: number;
    };
    staff_avatar_url?: string;
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

// 锦标赛报名接口
export interface TournamentRegistration {
    osuId: string;
    username: string;
    avatar_url: string;
    pp: number;
    global_rank: number | null;
    country_rank: number | null;
    country: string;
    teamName: string; // 队伍名，初始为空
    seedPosition: number | null; // seed位，初始为null
    agreedToTerms: boolean; // 是否同意条款
    approved: boolean; // 审核状态
    approvedAt: string | null; // 审核通过时间
    registeredAt: string;
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

    // 添加锦标赛报名
    addTournamentRegistration: async (registration: Omit<TournamentRegistration, 'registeredAt'>): Promise<boolean> => {
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
                        username = ?, timezone = ?, availability = ?,
                        avatar_url = ?, pp = ?, global_rank = ?, country_rank = ?, country = ?, updatedAt = CURRENT_TIMESTAMP
                    WHERE osuId = ?
                `, [
                    registration.username,
                    '', // timezone - TournamentRegistration 没有这个字段
                    '', // availability - TournamentRegistration 没有这个字段
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
                    registration.username, // inGameName 默认为 username
                    '', // timezone
                    '', // availability
                    new Date(),
                    registration.avatar_url,
                    registration.pp,
                    registration.global_rank,
                    registration.country_rank,
                    registration.country || ''
                ]);
            }

            await connection.commit();
            return true;

        } catch (error) {
            await connection.rollback();
            console.error('Error writing tournament registration to database:', error);
            return false;
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

    // 获取所有比赛房间（包含比赛预约信息）
    getMatchRoomsWithSchedules: async (): Promise<any[]> => {
        try {
            const connection = await getPool().getConnection();

            const [rows] = await connection.execute(`
                SELECT
                    mr.*,
                    ms.id as schedule_id,
                    ms.player1_osuId,
                    ms.player1_username,
                    ms.player2_osuId,
                    ms.player2_username,
                    ms.red_player_osuId,
                    ms.blue_player_osuId,
                    ms.red_score,
                    ms.blue_score,
                    ms.status as match_status,
                    ms.match_link,
                    ms.replay_link,
                    r1.avatar_url as player1_avatar_url,
                    r2.avatar_url as player2_avatar_url
                FROM match_rooms mr
                LEFT JOIN match_schedules ms ON mr.id = ms.room_id
                LEFT JOIN registrations r1 ON ms.player1_osuId = r1.osuId COLLATE utf8mb4_unicode_ci
                LEFT JOIN registrations r2 ON ms.player2_osuId = r2.osuId COLLATE utf8mb4_unicode_ci
                ORDER BY mr.match_date DESC, mr.match_time DESC, mr.id ASC
            `);

            connection.release();

            // 按房间分组，返回每个房间及其比赛信息
            const roomMap = new Map();

            (rows as any[]).forEach(row => {
                const roomId = row.id;
                if (!roomMap.has(roomId)) {
                    roomMap.set(roomId, {
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
                        updated_at: row.updated_at,
                        schedules: []
                    });
                }

                // 如果有比赛预约，添加到房间的schedules数组中
                if (row.schedule_id) {
                    roomMap.get(roomId).schedules.push({
                        id: row.schedule_id,
                        player1_osuId: row.player1_osuId,
                        player1_username: row.player1_username,
                        player1_avatar_url: row.player1_avatar_url,
                        player2_osuId: row.player2_osuId,
                        player2_username: row.player2_username,
                        player2_avatar_url: row.player2_avatar_url,
                        red_player_osuId: row.red_player_osuId,
                        blue_player_osuId: row.blue_player_osuId,
                        red_score: row.red_score,
                        blue_score: row.blue_score,
                        status: row.match_status,
                        match_link: row.match_link,
                        replay_link: row.replay_link
                    });
                }
            });

            return Array.from(roomMap.values());
        } catch (error) {
            console.error('Error getting match rooms with schedules:', error);
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
                `SELECT pm.*,
                        r1.avatar_url as player1_avatar_url,
                        r2.avatar_url as player2_avatar_url
                 FROM player_matchups pm
                 LEFT JOIN registrations r1 ON pm.player1_osuId = r1.osuId COLLATE utf8mb4_unicode_ci
                 LEFT JOIN registrations r2 ON pm.player2_osuId = r2.osuId COLLATE utf8mb4_unicode_ci
                 ORDER BY pm.created_at ASC`
            );

            connection.release();

            return (rows as any[]).map(row => ({
                id: row.id,
                player1_osuId: row.player1_osuId,
                player1_username: row.player1_username,
                player1_avatar_url: row.player1_avatar_url,
                player2_osuId: row.player2_osuId,
                player2_username: row.player2_username,
                player2_avatar_url: row.player2_avatar_url,
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
            const params: any[] = [status];

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
                SELECT ms.*, mr.room_name, mr.round_number, mr.match_date, mr.match_time, mr.match_number,
                       r1.avatar_url as player1_avatar_url, r2.avatar_url as player2_avatar_url
                FROM match_schedules ms
                JOIN match_rooms mr ON ms.room_id = mr.id
                LEFT JOIN registrations r1 ON ms.player1_osuId = r1.osuId COLLATE utf8mb4_unicode_ci
                LEFT JOIN registrations r2 ON ms.player2_osuId = r2.osuId COLLATE utf8mb4_unicode_ci
                WHERE ms.player1_osuId = ? OR ms.player2_osuId = ?
                ORDER BY mr.match_date DESC, mr.match_time DESC
            `, [osuId, osuId]);

            connection.release();

            return (rows as any[]).map(row => ({
                id: row.id,
                room_id: row.room_id,
                player1_osuId: row.player1_osuId,
                player1_username: row.player1_username,
                player1_avatar_url: row.player1_avatar_url,
                player2_osuId: row.player2_osuId,
                player2_username: row.player2_username,
                player2_avatar_url: row.player2_avatar_url,
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

            // 如果状态被设置为取消，需要将对应的对战重新设置为可预约
            if (status === 'cancelled') {
                // 获取预约信息
                const [scheduleRows] = await connection.execute(
                    'SELECT player1_osuId, player2_osuId FROM match_schedules WHERE id = ?',
                    [id]
                );

                if ((scheduleRows as any[]).length > 0) {
                    const schedule = (scheduleRows as any[])[0];
                    const { player1_osuId, player2_osuId } = schedule;

                    // 查找对应的对战并将其状态设置为available
                    await connection.execute(
                        'UPDATE player_matchups SET status = ? WHERE player1_osuId = ? AND player2_osuId = ? AND status = ?',
                        ['available', player1_osuId, player2_osuId, 'scheduled']
                    );
                }
            }

            let query = 'UPDATE match_schedules SET status = ?';
            const params: any[] = [status];

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
                SELECT ms.*, mr.room_name, mr.round_number, mr.match_date, mr.match_time, mr.match_number,
                       r1.avatar_url as player1_avatar_url, r2.avatar_url as player2_avatar_url
                FROM match_schedules ms
                JOIN match_rooms mr ON ms.room_id = mr.id
                LEFT JOIN registrations r1 ON ms.player1_osuId = r1.osuId COLLATE utf8mb4_unicode_ci
                LEFT JOIN registrations r2 ON ms.player2_osuId = r2.osuId COLLATE utf8mb4_unicode_ci
                ORDER BY mr.match_date DESC, mr.match_time DESC
            `);

            connection.release();

            return (rows as any[]).map(row => ({
                id: row.id,
                room_id: row.room_id,
                player1_osuId: row.player1_osuId,
                player1_username: row.player1_username,
                player1_avatar_url: row.player1_avatar_url,
                player2_osuId: row.player2_osuId,
                player2_username: row.player2_username,
                player2_avatar_url: row.player2_avatar_url,
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
    },

    // 获取staff房间分配列表 - 从match_schedules表获取裁判和解说员信息
    getStaffRoomAssignments: async (): Promise<StaffRoomAssignment[]> => {
        try {
            const connection = await getPool().getConnection();

            const [rows] = await connection.execute(`
                SELECT
                    sra.id,
                    sra.room_id,
                    sra.staff_osuId,
                    sra.staff_username,
                    sra.staff_role,
                    sra.status,
                    sra.assigned_by,
                    sra.assigned_at,
                    sra.responded_at,
                    sra.created_at,
                    sra.updated_at,
                    mr.room_name, mr.round_number, mr.match_date, mr.match_time, mr.match_number,
                    r.avatar_url as staff_avatar_url,
                    ms.player1_username, ms.player2_username
                FROM staff_room_assignments sra
                JOIN match_rooms mr ON sra.room_id = mr.id
                LEFT JOIN registrations r ON sra.staff_osuId = r.osuId COLLATE utf8mb4_unicode_ci
                LEFT JOIN match_schedules ms ON sra.room_id = ms.room_id
                ORDER BY mr.room_name ASC, sra.staff_role ASC, sra.created_at DESC
            `);

            connection.release();

            return (rows as any[]).map(row => ({
                id: row.id,
                room_id: row.room_id,
                staff_osuId: row.staff_osuId,
                staff_username: row.staff_username,
                staff_role: row.staff_role,
                status: row.status,
                assigned_by: row.assigned_by,
                assigned_at: row.assigned_at,
                responded_at: row.responded_at,
                created_at: row.created_at,
                updated_at: row.updated_at,
                room: {
                    id: row.room_id,
                    room_name: row.room_name,
                    round_number: row.round_number,
                    match_date: row.match_date,
                    match_time: row.match_time,
                    match_number: row.match_number
                },
                staff_avatar_url: row.staff_avatar_url,
                // 添加比赛信息
                match_info: {
                    player1_username: row.player1_username,
                    player2_username: row.player2_username
                }
            }));
        } catch (error) {
            console.error('Error getting staff room assignments:', error);
            return [];
        }
    },

    // 获取可供staff选择的房间列表
    getAvailableRoomsForStaff: async (): Promise<any[]> => {
        try {
            const connection = await getPool().getConnection();

            const [rows] = await connection.execute(`
                SELECT
                    mr.id,
                    mr.room_name,
                    mr.round_number,
                    mr.match_date,
                    mr.match_time,
                    mr.match_number,
                    mr.status,
                    mr.max_participants,
                    mr.description,
                    ms.player1_username,
                    ms.player2_username,
                    ms.referee_username,
                    ms.commentator_username,
                    -- 统计每个房间的staff数量
                    COUNT(DISTINCT CASE WHEN sra.staff_role = 'referee' AND sra.status = 'confirmed' THEN sra.id END) as referee_count,
                    COUNT(DISTINCT CASE WHEN sra.staff_role = 'commentator' AND sra.status = 'confirmed' THEN sra.id END) as commentator_count,
                    COUNT(DISTINCT CASE WHEN sra.staff_role = 'streamer' AND sra.status = 'confirmed' THEN sra.id END) as streamer_count
                FROM match_rooms mr
                LEFT JOIN match_schedules ms ON mr.id = ms.room_id
                LEFT JOIN staff_room_assignments sra ON mr.id = sra.room_id AND sra.status = 'confirmed'
                WHERE mr.status IN ('open', 'in_progress')
                GROUP BY mr.id, mr.room_name, mr.round_number, mr.match_date, mr.match_time, mr.match_number, mr.status, mr.max_participants, mr.description, ms.player1_username, ms.player2_username, ms.referee_username, ms.commentator_username
                ORDER BY mr.match_date ASC, mr.match_time ASC, mr.room_name ASC
            `);

            connection.release();

            return (rows as any[]).map(row => ({
                id: row.id,
                room_name: row.room_name,
                round_number: row.round_number,
                match_date: row.match_date,
                match_time: row.match_time,
                match_number: row.match_number,
                status: row.status,
                max_participants: row.max_participants,
                description: row.description,
                player1_username: row.player1_username,
                player2_username: row.player2_username,
                referee_username: row.referee_username,
                commentator_username: row.commentator_username,
                staff_counts: {
                    referee: row.referee_count || 0,
                    commentator: row.commentator_count || 0,
                    streamer: row.streamer_count || 0
                }
            }));
        } catch (error) {
            console.error('Error getting available rooms for staff:', error);
            return [];
        }
    },

    // 创建staff房间分配
    createStaffRoomAssignment: async (assignment: Omit<StaffRoomAssignment, 'id' | 'assigned_at' | 'created_at' | 'updated_at'>): Promise<number> => {
        try {
            const connection = await getPool().getConnection();

            const [result] = await connection.execute(
                `INSERT INTO staff_room_assignments (
                    room_id, staff_osuId, staff_username, staff_role, status, assigned_by
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    assignment.room_id, assignment.staff_osuId, assignment.staff_username,
                    assignment.staff_role, assignment.status || 'pending', assignment.assigned_by
                ]
            );

            connection.release();

            return (result as any).insertId;
        } catch (error) {
            console.error('Error creating staff room assignment:', error);
            throw error;
        }
    },

    // 更新staff房间分配状态
    updateStaffRoomAssignmentStatus: async (id: number, status: StaffRoomAssignment['status']): Promise<boolean> => {
        try {
            const connection = await getPool().getConnection();

            const [result] = await connection.execute(
                'UPDATE staff_room_assignments SET status = ?, responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [status, id]
            );

            connection.release();

            return (result as any).affectedRows > 0;
        } catch (error) {
            console.error('Error updating staff room assignment status:', error);
            return false;
        }
    },

    // 删除staff房间分配
    deleteStaffRoomAssignment: async (id: number): Promise<boolean> => {
        try {
            const connection = await getPool().getConnection();

            const [result] = await connection.execute(
                'DELETE FROM staff_room_assignments WHERE id = ?',
                [id]
            );

            connection.release();

            return (result as any).affectedRows > 0;
        } catch (error) {
            console.error('Error deleting staff room assignment:', error);
            return false;
        }
    },

    // 获取指定房间的staff分配 - 从match_schedules表获取裁判和解说员信息
    getRoomStaffAssignments: async (roomId: number): Promise<StaffRoomAssignment[]> => {
        try {
            const connection = await getPool().getConnection();

            const [rows] = await connection.execute(`
                SELECT
                    CONCAT('referee_', ms.id) as id,
                    ms.room_id,
                    ms.referee_osuId as staff_osuId,
                    ms.referee_username as staff_username,
                    'referee' as staff_role,
                    'confirmed' as status,
                    ms.created_by as assigned_by,
                    ms.created_at as assigned_at,
                    NULL as responded_at,
                    ms.created_at,
                    ms.updated_at,
                    r1.avatar_url as staff_avatar_url,
                    ms.player1_username, ms.player2_username, ms.scheduled_time
                FROM match_schedules ms
                LEFT JOIN registrations r1 ON ms.referee_osuId = r1.osuId COLLATE utf8mb4_unicode_ci
                WHERE ms.room_id = ? AND ms.referee_osuId IS NOT NULL AND ms.referee_username IS NOT NULL
                UNION ALL
                SELECT
                    CONCAT('commentator_', ms.id) as id,
                    ms.room_id,
                    ms.commentator_osuId as staff_osuId,
                    ms.commentator_username as staff_username,
                    'commentator' as staff_role,
                    'confirmed' as status,
                    ms.created_by as assigned_by,
                    ms.created_at as assigned_at,
                    NULL as responded_at,
                    ms.created_at,
                    ms.updated_at,
                    r2.avatar_url as staff_avatar_url,
                    ms.player1_username, ms.player2_username, ms.scheduled_time
                FROM match_schedules ms
                LEFT JOIN registrations r2 ON ms.commentator_osuId = r2.osuId COLLATE utf8mb4_unicode_ci
                WHERE ms.room_id = ? AND ms.commentator_osuId IS NOT NULL AND ms.commentator_username IS NOT NULL
                ORDER BY staff_role ASC
            `, [roomId, roomId]);

            connection.release();

            return (rows as any[]).map(row => ({
                id: row.id,
                room_id: row.room_id,
                staff_osuId: row.staff_osuId,
                staff_username: row.staff_username,
                staff_role: row.staff_role,
                status: row.status,
                assigned_by: row.assigned_by,
                assigned_at: row.assigned_at,
                responded_at: row.responded_at,
                created_at: row.created_at,
                updated_at: row.updated_at,
                staff_avatar_url: row.staff_avatar_url,
                // 添加比赛信息
                match_info: {
                    player1_username: row.player1_username,
                    player2_username: row.player2_username,
                    scheduled_time: row.scheduled_time
                }
            }));
        } catch (error) {
            console.error('Error getting room staff assignments:', error);
            return [];
        }
    },

    // 获取比赛设置
    getTournamentSettings: async (): Promise<any> => {
        try {
            const connection = await getPool().getConnection();

            const [rows] = await connection.execute(`
                SELECT * FROM tournament_settings ORDER BY id DESC LIMIT 1
            `);

            connection.release();

            if ((rows as any[]).length === 0) {
                return null;
            }

            const row = (rows as any[])[0];
            return {
                id: row.id,
                tournament_name: row.tournament_name,
                max_pp_for_registration: row.max_pp_for_registration,
                min_pp_for_registration: row.min_pp_for_registration,
                current_season: row.current_season,
                current_season_stage: row.current_season_stage,
                admin_group: row.admin_group ? JSON.parse(row.admin_group) : [],
                map_selection_group: row.map_selection_group ? JSON.parse(row.map_selection_group) : [],
                map_testing_group: row.map_testing_group ? JSON.parse(row.map_testing_group) : [],
                streamer_group: row.streamer_group ? JSON.parse(row.streamer_group) : [],
                referee_group: row.referee_group ? JSON.parse(row.referee_group) : [],
                commentator_group: row.commentator_group ? JSON.parse(row.commentator_group) : [],
                registration_enabled: row.registration_enabled,
                mappool_visible: row.mappool_visible,
                created_at: row.created_at,
                updated_at: row.updated_at
            };
        } catch (error) {
            console.error('Error getting tournament settings:', error);
            return null;
        }
    },

    // 更新比赛设置
    updateTournamentSettings: async (settings: any): Promise<boolean> => {
        try {
            const connection = await getPool().getConnection();

            const updateData = {
                tournament_name: settings.tournament_name,
                max_pp_for_registration: settings.max_pp_for_registration,
                min_pp_for_registration: settings.min_pp_for_registration,
                current_season: settings.current_season,
                current_season_stage: settings.current_season_stage,
                admin_group: JSON.stringify(settings.admin_group || []),
                map_selection_group: JSON.stringify(settings.map_selection_group || []),
                map_testing_group: JSON.stringify(settings.map_testing_group || []),
                streamer_group: JSON.stringify(settings.streamer_group || []),
                referee_group: JSON.stringify(settings.referee_group || []),
                commentator_group: JSON.stringify(settings.commentator_group || []),
                registration_enabled: settings.registration_enabled,
                mappool_visible: settings.mappool_visible
            };

            // 检查是否存在设置记录
            const [existingRows] = await connection.execute(
                `SELECT id FROM tournament_settings ORDER BY id DESC LIMIT 1`
            );

            if ((existingRows as any[]).length === 0) {
                // 插入新记录
                await connection.execute(`
                    INSERT INTO tournament_settings (
                        tournament_name, max_pp_for_registration, min_pp_for_registration,
                        current_season, current_season_stage, admin_group, map_selection_group,
                        map_testing_group, streamer_group, referee_group, commentator_group,
                        registration_enabled, mappool_visible
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    updateData.tournament_name,
                    updateData.max_pp_for_registration,
                    updateData.min_pp_for_registration,
                    updateData.current_season,
                    updateData.current_season_stage,
                    updateData.admin_group,
                    updateData.map_selection_group,
                    updateData.map_testing_group,
                    updateData.streamer_group,
                    updateData.referee_group,
                    updateData.commentator_group,
                    updateData.registration_enabled,
                    updateData.mappool_visible
                ]);
            } else {
                // 更新现有记录
                await connection.execute(`
                    UPDATE tournament_settings SET
                        tournament_name = ?, max_pp_for_registration = ?, min_pp_for_registration = ?,
                        current_season = ?, current_season_stage = ?, admin_group = ?,
                        map_selection_group = ?, map_testing_group = ?, streamer_group = ?,
                        referee_group = ?, commentator_group = ?, registration_enabled = ?,
                        mappool_visible = ?, updated_at = CURRENT_TIMESTAMP
                    ORDER BY id DESC LIMIT 1
                `, [
                    updateData.tournament_name,
                    updateData.max_pp_for_registration,
                    updateData.min_pp_for_registration,
                    updateData.current_season,
                    updateData.current_season_stage,
                    updateData.admin_group,
                    updateData.map_selection_group,
                    updateData.map_testing_group,
                    updateData.streamer_group,
                    updateData.referee_group,
                    updateData.commentator_group,
                    updateData.registration_enabled,
                    updateData.mappool_visible
                ]);
            }

            connection.release();
            return true;
        } catch (error) {
            console.error('Error updating tournament settings:', error);
            return false;
        }
    },

    // 保存比赛分数到数据库
    saveMatchScores: async (room: any, scores: any[]): Promise<{ success: boolean; scores_count: number; error?: string }> => {
        const connection = await getPool().getConnection();

        try {
            await connection.beginTransaction();

            // 检查房间是否已经保存过
            const [existingScores] = await connection.execute(
                'SELECT COUNT(*) as count FROM match_scores WHERE room_id = ?',
                [room.id]
            );

            const existingCount = (existingScores as any[])[0]?.count || 0;
            if (existingCount > 0) {
                await connection.rollback();
                return {
                    success: false,
                    scores_count: 0,
                    error: '该房间已经保存过'
                };
            }

            // 批量插入分数数据
            const insertPromises = scores.map(score => {
                return connection.execute(`
                    INSERT INTO match_scores (
                        room_id, room_name, room_category, room_type, starts_at, ends_at,
                        participant_count, host_osuId, host_username, playlist_count,
                        user_id, username, playlist_id, beatmap_id, total_score, accuracy,
                        max_combo, mods, \`rank\`, passed, statistics, pp, ended_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    room.id,
                    room.name,
                    room.category,
                    room.type,
                    room.starts_at ? new Date(room.starts_at) : null,
                    room.ends_at ? new Date(room.ends_at) : null,
                    room.participant_count,
                    room.host?.id,
                    room.host?.username,
                    room.playlist?.length || 0,
                    score.user_id,
                    score.username,
                    score.playlistId,
                    score.beatmapId,
                    score.total_score,
                    score.accuracy,
                    score.max_combo,
                    score.mods?.join(',') || '',
                    score.rank,
                    score.passed,
                    JSON.stringify(score.statistics || {}),
                    score.pp,
                    score.ended_at ? new Date(score.ended_at) : null
                ]);
            });

            await Promise.all(insertPromises);
            await connection.commit();

            return {
                success: true,
                scores_count: scores.length
            };

        } catch (error) {
            await connection.rollback();
            console.error('Error saving match scores to database:', error);
            return {
                success: false,
                scores_count: 0,
                error: '保存分数时发生数据库错误'
            };
        } finally {
            connection.release();
        }
    },

    // 更新比赛分数到数据库
    updateMatchScores: async (room: any, scores: any[]): Promise<{ success: boolean; scores_count: number; error?: string }> => {
        const connection = await getPool().getConnection();

        try {
            await connection.beginTransaction();

            // 检查房间是否存在
            const [existingScores] = await connection.execute(
                'SELECT COUNT(*) as count FROM match_scores WHERE room_id = ?',
                [room.id]
            );

            const existingCount = (existingScores as any[])[0]?.count || 0;
            if (existingCount === 0) {
                await connection.rollback();
                return {
                    success: false,
                    scores_count: 0,
                    error: '该房间尚未保存，请先保存房间'
                };
            }

            // 删除该房间原有的分数数据
            await connection.execute(
                'DELETE FROM match_scores WHERE room_id = ?',
                [room.id]
            );

            // 批量插入新的分数数据
            const insertPromises = scores.map(score => {
                return connection.execute(`
                    INSERT INTO match_scores (
                        room_id, room_name, room_category, room_type, starts_at, ends_at,
                        participant_count, host_osuId, host_username, playlist_count,
                        user_id, username, playlist_id, beatmap_id, total_score, accuracy,
                        max_combo, mods, \`rank\`, passed, statistics, pp, ended_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    room.id,
                    room.name,
                    room.category,
                    room.type,
                    room.starts_at ? new Date(room.starts_at) : null,
                    room.ends_at ? new Date(room.ends_at) : null,
                    room.participant_count,
                    room.host?.id,
                    room.host?.username,
                    room.playlist?.length || 0,
                    score.user_id,
                    score.username,
                    score.playlistId,
                    score.beatmapId,
                    score.total_score,
                    score.accuracy,
                    score.max_combo,
                    score.mods?.join(',') || '',
                    score.rank,
                    score.passed,
                    JSON.stringify(score.statistics || {}),
                    score.pp,
                    score.ended_at ? new Date(score.ended_at) : null
                ]);
            });

            await Promise.all(insertPromises);
            await connection.commit();

            return {
                success: true,
                scores_count: scores.length
            };

        } catch (error) {
            await connection.rollback();
            console.error('Error updating match scores in database:', error);
            return {
                success: false,
                scores_count: 0,
                error: '更新分数时发生数据库错误'
            };
        } finally {
            connection.release();
        }
    },

    // 获取已保存的房间列表
    getSavedRooms: async (): Promise<any[]> => {
        try {
            const connection = await getPool().getConnection();

            const [rows] = await connection.execute(`
                SELECT 
                    room_id as id,
                    room_name as name,
                    room_category as category,
                    room_type as type,
                    starts_at,
                    ends_at,
                    participant_count,
                    host_username,
                    playlist_count,
                    COUNT(*) as scores_count,
                    MAX(saved_at) as saved_at
                FROM match_scores 
                GROUP BY room_id, room_name, room_category, room_type, starts_at, ends_at, participant_count, host_username, playlist_count
                ORDER BY saved_at DESC
            `);

            connection.release();

            return (rows as any[]).map(row => ({
                id: row.id,
                name: row.name,
                category: row.category,
                type: row.type,
                starts_at: row.starts_at,
                ends_at: row.ends_at,
                participant_count: row.participant_count,
                host: { username: row.host_username },
                playlist_count: row.playlist_count,
                scores_count: row.scores_count,
                saved_at: row.saved_at
            }));
        } catch (error) {
            console.error('Error getting saved rooms:', error);
            return [];
        }
    },

    // 获取特定房间的保存数据
    getRoomScores: async (roomId: number): Promise<{ room: any; scores: any[] }> => {
        try {
            const connection = await getPool().getConnection();

            // 获取房间信息
            const [roomRows] = await connection.execute(`
                SELECT 
                    room_id as id,
                    room_name as name,
                    room_category as category,
                    room_type as type,
                    starts_at,
                    ends_at,
                    participant_count,
                    host_osuId,
                    host_username,
                    playlist_count,
                    MAX(saved_at) as saved_at
                FROM match_scores 
                WHERE room_id = ?
                GROUP BY room_id, room_name, room_category, room_type, starts_at, ends_at, participant_count, host_osuId, host_username, playlist_count
            `, [roomId]);

            // 获取分数数据
            const [scoreRows] = await connection.execute(`
                SELECT 
                    user_id, username, playlist_id, beatmap_id, total_score, accuracy,
                    max_combo, mods, rank, passed, statistics, pp, ended_at, saved_at
                FROM match_scores 
                WHERE room_id = ?
                ORDER BY playlist_id, total_score DESC
            `, [roomId]);

            connection.release();

            const room = (roomRows as any[])[0] || null;
            const scores = (scoreRows as any[]).map(row => ({
                user_id: row.user_id,
                username: row.username,
                playlistId: row.playlist_id,
                beatmapId: row.beatmap_id,
                total_score: row.total_score,
                accuracy: row.accuracy,
                max_combo: row.max_combo,
                mods: row.mods ? row.mods.split(',') : [],
                rank: row.rank,
                passed: row.passed,
                statistics: row.statistics ? JSON.parse(row.statistics) : {},
                pp: row.pp,
                ended_at: row.ended_at,
                saved_at: row.saved_at
            }));

            return { room, scores };
        } catch (error) {
            console.error('Error getting room scores:', error);
            return { room: null, scores: [] };
        }
    }
};

// 导出函数（保持与原有接口兼容）
export const getRegistrations = mysqlStorage.getRegistrations;
export const isUserRegistered = mysqlStorage.isUserRegistered;
export const addRegistration = mysqlStorage.addRegistration;
export const addTournamentRegistration = mysqlStorage.addTournamentRegistration;
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

// 获取锦标赛报名数据（转换 Registration 为 TournamentRegistration）
export const getTournamentRegistrations = async (): Promise<TournamentRegistration[]> => {
    const registrations = await getRegistrations();
    return registrations.map(reg => ({
        osuId: reg.osuId,
        username: reg.username,
        avatar_url: reg.avatar_url,
        pp: reg.pp,
        global_rank: reg.global_rank,
        country_rank: reg.country_rank,
        country: reg.country,
        teamName: '', // 默认空值
        seedPosition: null, // 默认 null
        agreedToTerms: true, // 假设已同意条款
        approved: reg.approved,
        approvedAt: reg.approvedAt,
        registeredAt: reg.registeredAt
    }));
};

// 检查用户是否已报名（锦标赛报名）
export const isTournamentUserRegistered = async (osuId: string): Promise<boolean> => {
    try {
        const registrations = await getTournamentRegistrations();
        return registrations.some(reg => reg.osuId === osuId);
    } catch (error) {
        console.error('Error checking tournament user registration:', error);
        return false;
    }
};

// 获取用户报名信息（锦标赛报名）
export const getTournamentUserRegistration = async (osuId: string): Promise<TournamentRegistration | null> => {
    try {
        const registrations = await getTournamentRegistrations();
        return registrations.find(reg => reg.osuId === osuId) || null;
    } catch (error) {
        console.error('Error getting tournament user registration:', error);
        return null;
    }
};

// 获取报名总数（锦标赛报名）
export const getTournamentRegistrationCount = async (): Promise<number> => {
    try {
        const registrations = await getTournamentRegistrations();
        return registrations.length;
    } catch (error) {
        console.error('Error getting tournament registration count:', error);
        return 0;
    }
};

// Staff房间分配相关函数
export const getStaffRoomAssignments = mysqlStorage.getStaffRoomAssignments;
export const getAvailableRoomsForStaff = mysqlStorage.getAvailableRoomsForStaff;
export const createStaffRoomAssignment = mysqlStorage.createStaffRoomAssignment;
export const updateStaffRoomAssignmentStatus = mysqlStorage.updateStaffRoomAssignmentStatus;
export const deleteStaffRoomAssignment = mysqlStorage.deleteStaffRoomAssignment;
export const getRoomStaffAssignments = mysqlStorage.getRoomStaffAssignments;
export const getMatchRoomsWithSchedules = mysqlStorage.getMatchRoomsWithSchedules;

// 比赛设置相关函数
export const getTournamentSettings = mysqlStorage.getTournamentSettings;
export const updateTournamentSettings = mysqlStorage.updateTournamentSettings;

// 比赛分数相关函数
export const saveMatchScores = mysqlStorage.saveMatchScores;
export const updateMatchScores = mysqlStorage.updateMatchScores;
export const getSavedRooms = mysqlStorage.getSavedRooms;
export const getRoomScores = mysqlStorage.getRoomScores;
