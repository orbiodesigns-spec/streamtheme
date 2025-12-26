-- ==========================================
-- STREAM THEME MASTER - V3 FULL ACCESS MODEL
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
    trial_expiry DATETIME NULL, -- If set and > NOW(), user has trial access
    
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
    display_order INT DEFAULT 0
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
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
INSERT INTO layouts (id, name, description, thumbnail_url, is_active, display_order) VALUES
('neon-pulse', 'Neon Pulse', 'Vibrant cyber-aesthetic with pulsing borders.', 'https://placehold.co/600x400/1e1e1e/3b82f6?text=Neon+Pulse', TRUE, 1),
('clean-slate', 'Clean Slate', 'Minimalist white and grey theme.', 'https://placehold.co/600x400/ffffff/000000?text=Clean+Slate', TRUE, 2),
('dark-matter', 'Dark Matter', 'Deep space dark mode theme.', 'https://placehold.co/600x400/000000/666666?text=Dark+Matter', TRUE, 3),
('royal-gold', 'Royal Gold', 'Luxurious gold and black design.', 'https://placehold.co/600x400/1a1a1a/ffd700?text=Royal+Gold', TRUE, 4);
