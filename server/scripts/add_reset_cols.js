require('dotenv').config();
const { db } = require('./config/db');

async function migrate() {
    console.log("Adding password reset columns...");
    try {
        await db.query("ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(100) DEFAULT NULL");
        await db.query("ALTER TABLE users ADD COLUMN password_reset_expiry DATETIME DEFAULT NULL");
        console.log("✓ Columns added.");
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("columns already exist.");
        } else {
            console.error("Migration failed:", err);
        }
    }
    process.exit();
}

migrate();
