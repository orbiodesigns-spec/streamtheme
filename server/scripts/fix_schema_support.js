require('dotenv').config();
const { db } = require('./config/db');

async function fixSupportSchema() {
    try {
        console.log('Adding status to support_queries table...');

        // Check if column exists
        const [rows] = await db.query("SHOW COLUMNS FROM support_queries LIKE 'status'");
        if (rows.length > 0) {
            console.log('Column status already exists.');
        } else {
            // Add column
            await db.query("ALTER TABLE support_queries ADD COLUMN status ENUM('OPEN', 'CLOSED') DEFAULT 'OPEN' AFTER message");
            console.log('✅ Added status column successfully.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to update schema:', err);
        process.exit(1);
    }
}

fixSupportSchema();
