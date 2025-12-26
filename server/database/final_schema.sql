-- ==========================================
-- STREAM THEME MASTER - FINAL V3 SCHEMA
-- Based on server.js initDb references
-- ==========================================

DROP DATABASE IF EXISTS stream_theme_master;
CREATE DATABASE stream_theme_master;
USE stream_theme_master;

-- 1. USERS
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    age INT,
    
    -- Verification
    is_email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(100),
    
    -- Trial Access
    trial_used BOOLEAN DEFAULT FALSE,
    trial_expiry DATETIME NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. PLANS (Global Access Tiers)
CREATE TABLE subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_months INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0
);

-- 3. SUBSCRIPTIONS (Global Access)
CREATE TABLE subscriptions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    plan_id VARCHAR(50) NOT NULL,
    
    start_date DATETIME NOT NULL,
    expiry_date DATETIME NOT NULL,
    
    price_paid DECIMAL(10, 2) NOT NULL,
    order_id VARCHAR(100), -- Razorpay Order ID
    payment_id VARCHAR(100), -- Razorpay Payment ID
    status ENUM('ACTIVE', 'EXPIRED') DEFAULT 'ACTIVE',
    
    public_token VARCHAR(64),
    layout_id VARCHAR(50) DEFAULT 'master-standard',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

-- 4. LAYOUTS (Themes)
CREATE TABLE layouts (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(255),
    preview_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    
    -- Pricing
    base_price DECIMAL(10, 2) DEFAULT 0.00,
    price_1mo DECIMAL(10, 2),
    price_3mo DECIMAL(10, 2),
    price_6mo DECIMAL(10, 2),
    price_1yr DECIMAL(10, 2)
);

-- 5. THEME CUSTOMIZATIONS (User Settings)
CREATE TABLE theme_customizations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    layout_id VARCHAR(50) NOT NULL,
    
    config JSON NOT NULL,
    public_token VARCHAR(64) UNIQUE NOT NULL, -- For OBS
    
    active_session_id VARCHAR(100),
    last_heartbeat DATETIME,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (layout_id) REFERENCES layouts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_layout (user_id, layout_id)
);

-- 6. SUPPORT QUERIES
CREATE TABLE support_queries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status ENUM('OPEN', 'CLOSED') DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. PRODUCTS (Digital Downloads)
CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    thumbnail_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. COUPONS
CREATE TABLE coupons (
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
);

-- 9. ADMINS
CREATE TABLE admins (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. SETTINGS
CREATE TABLE settings (
    key_name VARCHAR(50) PRIMARY KEY,
    value TEXT
);

-- 11. TRANSACTIONS (Payment Logs)
CREATE TABLE transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    order_id VARCHAR(100),
    payment_id VARCHAR(100),
    amount DECIMAL(10, 2),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ==========================================
-- SEED DATA
-- ==========================================

-- Plans
INSERT INTO subscription_plans (id, name, description, price, duration_months, display_order) VALUES
('monthly', 'Monthly Access', 'Full access for 1 month', 299.00, 1, 1),
('semi_annual', 'Semi-Annual Access', 'Popular! Full access for 6 months', 1599.00, 6, 2),
('yearly', 'Yearly Access', 'Best Value! Full access for 1 year', 2999.00, 12, 3);

-- Layouts (Standard Set)
-- Note: 'master-standard' is the default layout used in server.js
INSERT INTO layouts (id, name, description, thumbnail_url, is_active, display_order, base_price) VALUES
('master-standard', 'Master Standard', 'The classic reliable layout for everyday streaming.', 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', TRUE, 1, 0.00);
