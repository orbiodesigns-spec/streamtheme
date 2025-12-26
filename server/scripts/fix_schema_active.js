require('dotenv').config();
const { db } = require('./config/db');

async function fixSchema() {
    try {
        console.log('Adding is_active to users table...');

        // Check if column exists
        const [rows] = await db.query("SHOW COLUMNS FROM users LIKE 'is_active'");
        if (rows.length > 0) {
            console.log('Column is_active already exists.');
        } else {
            // Add column
            await db.query("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER created_at");
            console.log('✅ Added is_active column successfully.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to update schema:', err);
        process.exit(1);
    }
}

fixSchema();
