require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const { db } = require('./config/db');

// --- ROUTES ---
const authRoutes = require('./routes/auth.routes');
const publicRoutes = require('./routes/public.routes');
const adminRoutes = require('./routes/admin.routes');
const userRoutes = require('./routes/users.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Rate Limiting
app.set('trust proxy', 1);
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // Increased for dev/testing
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'TOO_MANY_REQUESTS',
            message: 'Too many requests. Please try again after some time.'
        });
    }
});

app.use(limiter);

// CORS
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173', // Must be explicit for credentials
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// --- DB INITIALIZATION (V3 Schema) ---
// Note: Ideally move this to a migration script, but keeping here for simplicity as requested 'optimization'
async function initDb() {
    console.log("Checking Database Schema (V3)...");
    try {
        // 1. Users
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                phone_number VARCHAR(20),
                age INT,
                is_email_verified BOOLEAN DEFAULT FALSE,
                verification_token VARCHAR(100),
                trial_used BOOLEAN DEFAULT FALSE,
                trial_expiry DATETIME NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 2. Plans
        await db.query(`
            CREATE TABLE IF NOT EXISTS subscription_plans (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                duration_months INT NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                display_order INT DEFAULT 0
            )
        `);

        // 3. Subscriptions
        await db.query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL,
                plan_id VARCHAR(50) NOT NULL,
                start_date DATETIME NOT NULL,
                expiry_date DATETIME NOT NULL,
                price_paid DECIMAL(10, 2) NOT NULL,
                order_id VARCHAR(100),
                payment_id VARCHAR(100),
                status ENUM('ACTIVE', 'EXPIRED') DEFAULT 'ACTIVE',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                public_token VARCHAR(64),
                layout_id VARCHAR(50) DEFAULT 'master-standard',
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
            )
        `);

        // 4. Layouts
        await db.query(`
            CREATE TABLE IF NOT EXISTS layouts (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                thumbnail_url VARCHAR(255),
                preview_url VARCHAR(255),
                is_active BOOLEAN DEFAULT TRUE,
                is_featured BOOLEAN DEFAULT FALSE,
                display_order INT DEFAULT 0,
                base_price DECIMAL(10, 2) DEFAULT 0.00,
                price_1mo DECIMAL(10, 2),
                price_3mo DECIMAL(10, 2),
                price_6mo DECIMAL(10, 2),
                price_1yr DECIMAL(10, 2)    
            )
        `);

        // 5. Theme Customizations
        await db.query(`
            CREATE TABLE IF NOT EXISTS theme_customizations (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL,
                layout_id VARCHAR(50) NOT NULL,
                config JSON NOT NULL,
                public_token VARCHAR(64) UNIQUE NOT NULL,
                active_session_id VARCHAR(100),
                last_heartbeat DATETIME,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (layout_id) REFERENCES layouts(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_layout (user_id, layout_id)
            )
        `);

        // Seed Plans if empty
        const [plans] = await db.query('SELECT * FROM subscription_plans');
        if (plans.length === 0) {
            console.log('Seeding Default Plans...');
            await db.query(`INSERT INTO subscription_plans (id, name, description, price, duration_months, display_order) VALUES
                ('monthly', 'Monthly Access', 'Full access for 1 month', 299.00, 1, 1),
                ('semi_annual', 'Semi-Annual Access', 'Popular! Full access for 6 months', 1599.00, 6, 2),
                ('yearly', 'Yearly Access', 'Best Value! Full access for 1 year', 2999.00, 12, 3)`);
        }

        // Seed Layouts if empty
        const [layouts] = await db.query('SELECT * FROM layouts');
        if (layouts.length === 0) {
            console.log('Seeding Default Layouts...');
            await db.query(`INSERT INTO layouts (id, name, description, thumbnail_url, is_active, display_order) VALUES
                ('master-standard', 'Master Standard', 'The classic reliable layout for everyday streaming.', 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', TRUE, 1)`);
        }


        // 6. Support Queries
        await db.query(`
            CREATE TABLE IF NOT EXISTS support_queries (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                subject VARCHAR(255),
                message TEXT NOT NULL,
                status ENUM('OPEN', 'CLOSED') DEFAULT 'OPEN',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 7. Products (Digital Downloads)
        await db.query(`
            CREATE TABLE IF NOT EXISTS products (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                file_url VARCHAR(500) NOT NULL,
                file_type VARCHAR(50),
                thumbnail_url VARCHAR(500),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 8. Coupons
        await db.query(`
            CREATE TABLE IF NOT EXISTS coupons (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(50) NOT NULL UNIQUE,
                discount_type ENUM('PERCENT', 'FIXED') NOT NULL,
                discount_value DECIMAL(10, 2) NOT NULL,
                description TEXT,
                layout_id VARCHAR(50),
                max_uses INT DEFAULT -1,
                used_count INT DEFAULT 0,
                expiry_date DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (layout_id) REFERENCES layouts(id) ON DELETE SET NULL
            )
        `);

        // 9. Admins
        await db.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 10. Settings
        await db.query(`
            CREATE TABLE IF NOT EXISTS settings (
                key_name VARCHAR(50) PRIMARY KEY,
                value TEXT
            )
        `);

        // 11. Transactions (Payment Logs)
        await db.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED,
                order_id VARCHAR(100),
                payment_id VARCHAR(100),
                amount DECIMAL(10, 2),
                status VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        console.log("✓ Database Schema Verified (V3).");

        // Seed Admins if empty
        // Ensure Default Admin Credentials (Force Update on Startup)
        const defaultAdmin = 'admin';
        const defaultPass = 'Himanshu@k9311995415';
        const defaultHash = await bcrypt.hash(defaultPass, 10);

        // Check if admin exists
        const [existingAdmins] = await db.query('SELECT * FROM admins WHERE username = ?', [defaultAdmin]);

        if (existingAdmins.length === 0) {
            console.log('Seeding Default Admin...');
            await db.query('INSERT INTO admins (username, password_hash) VALUES (?, ?)', [defaultAdmin, defaultHash]);
        } else {
            // Update password to ensure it matches expectations (fix for VPS "wrong credential" issue)
            console.log('Enforcing Default Admin Password...');
            await db.query('UPDATE admins SET password_hash = ? WHERE username = ?', [defaultHash, defaultAdmin]);
        }
    } catch (err) {
        console.error(`DB Init Failed: ${err.message}`);
    }
}

// Call init
initDb();

// --- MOUNT ROUTES ---
app.use('/api', publicRoutes); // Public routes (layouts, products, etc) - NO AUTH
app.use('/api/auth', authRoutes); // Auth routes (login, register, me)
app.use('/api/admin', adminRoutes); // Admin routes (stats, users, manage)
app.use('/api', userRoutes);  // User actions (subscribe, payment, config save) - REQUIRES AUTH (middleware inside)

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        const [result] = await db.query('SELECT 1');
        res.json({
            status: 'healthy',
            database: 'connected',
            message: 'Server and database are running properly'
        });
    } catch (err) {
        res.status(500).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: err.message,
            message: 'Database connection failed'
        });
    }
});

// --- ERROR HANDLERS ---
process.on('uncaughtException', (err) => {
    console.error(`FATAL: Uncaught Exception: ${err.message}\n${err.stack}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(`FATAL: Unhandled Rejection at: ${promise} reason: ${reason}`);
});

process.on('SIGINT', () => {
    console.log('Server shutting down (SIGINT)...');
    process.exit(0);
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
