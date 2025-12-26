require('dotenv').config();
const { db } = require('./config/db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        const username = 'admin';
        const password = 'adminpassword123'; // Change this heavily in production
        const hash = await bcrypt.hash(password, 10);

        console.log(`Creating Admin: ${username}`);

        await db.query(
            'INSERT INTO admins (username, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = ?',
            [username, hash, hash]
        );

        console.log('✅ Admin user created successfully.');
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to create admin:', err);
        process.exit(1);
    }
}

createAdmin();
