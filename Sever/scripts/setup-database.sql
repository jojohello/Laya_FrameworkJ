-- Laya Game Database Initialization Script
-- Execute in XAMPP phpMyAdmin or MySQL command line

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS laya_game
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 2. Create User
CREATE USER IF NOT EXISTS 'laya_user'@'localhost' IDENTIFIED BY 'laya123456';

-- 3. Grant Privileges
GRANT ALL PRIVILEGES ON laya_game.* TO 'laya_user'@'localhost';
GRANT ALL PRIVILEGES ON laya_game.* TO 'laya_user'@'127.0.0.1';

-- 4. Flush Privileges
FLUSH PRIVILEGES;

-- 5. Use Database
USE laya_game;

-- 6. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL UNIQUE COMMENT 'User unique identifier',
    third_party_type VARCHAR(20) NOT NULL COMMENT 'Third party type',
    third_party_user_id VARCHAR(200) NOT NULL COMMENT 'Third party user ID',
    nickname VARCHAR(100) COMMENT 'User nickname',
    avatar VARCHAR(500) COMMENT 'User avatar',
    device_info TEXT COMMENT 'Device information',
    platform VARCHAR(50) COMMENT 'Platform information',
    version VARCHAR(20) COMMENT 'Version number',
    extra_params TEXT COMMENT 'Extra parameters',
    last_login_time DATETIME COMMENT 'Last login time',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
    enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Is enabled',

    INDEX idx_user_id (user_id),
    INDEX idx_third_party (third_party_type, third_party_user_id),
    INDEX idx_nickname (nickname),
    INDEX idx_created_time (created_time),
    UNIQUE KEY uniq_third_party_user (third_party_type, third_party_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Users table';

-- 7. Create Login Records Table
CREATE TABLE IF NOT EXISTS login_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL COMMENT 'User ID',
    token VARCHAR(1000) NOT NULL COMMENT 'JWT Token',
    login_timestamp BIGINT NOT NULL COMMENT 'Login timestamp',
    login_time DATETIME NOT NULL COMMENT 'Login time',
    third_party_type VARCHAR(20) NOT NULL COMMENT 'Third party type',
    device_id VARCHAR(200) COMMENT 'Device ID',
    client_ip VARCHAR(50) COMMENT 'Client IP',
    device_info TEXT COMMENT 'Device information',
    platform VARCHAR(50) COMMENT 'Platform information',
    version VARCHAR(20) COMMENT 'Version number',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Is active',
    expire_time DATETIME COMMENT 'Expire time',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',

    INDEX idx_user_id (user_id),
    INDEX idx_token (token(100)),
    INDEX idx_login_time (login_time),
    INDEX idx_is_active (is_active),
    INDEX idx_expire_time (expire_time),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Login records table';

-- 8. Insert Test Data
INSERT IGNORE INTO users (user_id, third_party_type, third_party_user_id, nickname, created_time) VALUES
('guest_1703123456789', 'GUEST', 'test_device_001', 'Guest_3456789', NOW()),
('wechat_1703123456790', 'WECHAT', 'wx_openid_test_001', 'WeChat_User_test001', NOW()),
('qq_1703123456791', 'QQ', 'qq_unionid_test_001', 'QQ_User_test001', NOW());

-- 9. Show Creation Results
SELECT 'Database setup completed!' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'laya_game';
