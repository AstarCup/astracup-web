import mysql from 'mysql2/promise';

async function testConnection() {
    const config = {
        host: 'hk-1.vps.ty0.icu',
        user: 'lbw',
        password: 'hRXRtFJzHZMDeKp2',
        database: 'lbw',
        port: 3306
    };

    try {
        console.log('Testing database connection...');
        const conn = await mysql.createConnection(config);
        console.log('Connection successful!');

        // Test if tables exist
        const [rows] = await conn.execute('SHOW TABLES');
        console.log('Existing tables:', rows);

        await conn.end();
    } catch (error) {
        console.error('Connection failed:', (error as Error).message);
    }
}

testConnection();