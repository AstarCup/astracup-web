import mysql from 'mysql2/promise';

async function createMessagesTable() {
    const conn = await mysql.createConnection({
        host: 'hk-1.vps.ty0.icu',
        user: 'lbw',
        password: 'hRXRtFJzHZMDeKp2',
        database: 'lbw',
        port: 3306
    });

    await conn.execute(`
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
            INDEX idx_receiver (receiver_osuId),
            INDEX idx_sender (sender_osuId),
            INDEX idx_type (type),
            INDEX idx_status (status),
            INDEX idx_related_matchup (related_matchup_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('Messages table created successfully');
    await conn.end();
}

createMessagesTable().catch(console.error);