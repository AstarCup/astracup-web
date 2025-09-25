import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
    host: 'hk-1.vps.ty0.icu',
    port: 3306,
    user: 'lbw',
    password: 'hRXRtFJzHZMDeKp2',
    database: 'lbw',
};

async function initDatabase() {
    try {
        const connection = await mysql.createConnection(dbConfig);

        console.log('Connected to database, initializing tables...');

        // Create match_rooms table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS match_rooms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_name VARCHAR(255) NOT NULL,
                round_number INT NOT NULL,
                match_date DATE NOT NULL,
                match_time TIME NOT NULL,
                match_number INT NOT NULL,
                max_participants INT DEFAULT 2,
                status ENUM('open', 'full', 'closed') DEFAULT 'open',
                description TEXT,
                created_by VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_round_match (round_number, match_number),
                INDEX idx_status (status)
            )
        `);
        console.log('Created match_rooms table');

        // Create match_schedules table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS match_schedules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_id INT NOT NULL,
                player1_osuId VARCHAR(255) NOT NULL,
                player1_username VARCHAR(255) NOT NULL,
                player2_osuId VARCHAR(255) NOT NULL,
                player2_username VARCHAR(255) NOT NULL,
                red_player_osuId VARCHAR(255),
                blue_player_osuId VARCHAR(255),
                red_score INT DEFAULT 0,
                blue_score INT DEFAULT 0,
                status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
                replay_link TEXT,
                match_link TEXT,
                referee_osuId VARCHAR(255),
                referee_username VARCHAR(255),
                commentator_osuId VARCHAR(255),
                commentator_username VARCHAR(255),
                created_by VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (room_id) REFERENCES match_rooms(id) ON DELETE CASCADE,
                INDEX idx_room_id (room_id),
                INDEX idx_status (status),
                INDEX idx_players (player1_osuId, player2_osuId)
            )
        `);
        console.log('Created match_schedules table');

        // Create player_matchups table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS player_matchups (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_id INT NOT NULL,
                player1_osuId VARCHAR(255) NOT NULL,
                player1_username VARCHAR(255) NOT NULL,
                player2_osuId VARCHAR(255) NOT NULL,
                player2_username VARCHAR(255) NOT NULL,
                status ENUM('available', 'scheduled', 'completed') DEFAULT 'available',
                created_by VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (room_id) REFERENCES match_rooms(id) ON DELETE CASCADE,
                INDEX idx_room_id (room_id),
                INDEX idx_status (status),
                INDEX idx_players (player1_osuId, player2_osuId)
            )
        `);
        console.log('Created player_matchups table');

        await connection.end();
        console.log('Database initialization completed successfully!');
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
}

async function main() {
    try {
        console.log('Initializing database...');
        await initDatabase();
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
}

main();