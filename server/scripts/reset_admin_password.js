require('dotenv').config({ path: '../.env' }); // Load .env from parent dir
const { db } = require('../config/db');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
    try {
        const username = 'admin';
        const password = 'Himanshu@k9311995415';
        const hash = await bcrypt.hash(password, 10);

        console.log(`Resetting Admin: ${username}`);

        // Using ON DUPLICATE KEY UPDATE to handle both insert and update
        await db.query(
            'INSERT INTO admins (username, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = ?',
            [username, hash, hash]
        );

        console.log('✅ Admin credentials updated successfully.');
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to reset admin:', err);
        process.exit(1);
    }
}

resetAdmin();
