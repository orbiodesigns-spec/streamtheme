require('dotenv').config();
const { db } = require('./config/db');

async function fixStoreSchema() {
    try {
        console.log('Creating product_purchases table...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS product_purchases (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL,
                product_id BIGINT UNSIGNED NOT NULL,
                transaction_id VARCHAR(100) NOT NULL,
                price_paid DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created product_purchases table.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to update schema:', err);
        process.exit(1);
    }
}

fixStoreSchema();
