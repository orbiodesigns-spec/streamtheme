require('dotenv').config();
const mysql = require('mysql2');

// --- DB SETUP (Optimized for Low RAM) ---
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    // Lower connection limit for 2GB RAM server. 
    // MySQL takes ~100MB+ per connection if not tuned. 5 is safe for nodejs.
    connectionLimit: parseInt(process.env.DB_CONN_LIMIT) || 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

const db = pool.promise();

pool.on('connection', (connection) => {
    // console.log('New DB Connection established');
});

pool.on('enqueue', () => {
    // console.log('Waiting for available connection slot');
});

// Test database connection on startup
pool.getConnection((err, connection) => {
    if (err) {
        console.error(`❌ Database connection failed: ${err.message}`);
        console.error('Check your .env file and ensure MySQL is running');
    } else {
        console.log('✓ Database connected successfully');
        connection.release();
    }
});

// Ping DB every minute to keep connection fresh
setInterval(async () => {
    try {
        await db.query('SELECT 1');
    } catch (err) {
        console.error(`DB Ping Failed: ${err.message}`);
    }
}, 60000);

module.exports = { db, pool };
