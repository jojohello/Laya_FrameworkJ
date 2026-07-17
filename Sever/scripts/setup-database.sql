-- Framework-J development database provisioning
-- Login is platform-global; each Game Server owns one private database.
-- Production deployment must use separate least-privilege users and secrets.

CREATE DATABASE IF NOT EXISTS laya_login
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS laya_game_1
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'laya_user'@'localhost' IDENTIFIED BY 'laya123456';
CREATE USER IF NOT EXISTS 'laya_user'@'127.0.0.1' IDENTIFIED BY 'laya123456';
GRANT ALL PRIVILEGES ON laya_login.* TO 'laya_user'@'localhost';
GRANT ALL PRIVILEGES ON laya_login.* TO 'laya_user'@'127.0.0.1';
GRANT ALL PRIVILEGES ON laya_game_1.* TO 'laya_user'@'localhost';
GRANT ALL PRIVILEGES ON laya_game_1.* TO 'laya_user'@'127.0.0.1';
FLUSH PRIVILEGES;

USE laya_login;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL UNIQUE,
    third_party_type VARCHAR(20) NOT NULL,
    third_party_user_id VARCHAR(200) NOT NULL,
    nickname VARCHAR(100),
    avatar VARCHAR(500),
    device_info TEXT,
    platform VARCHAR(50),
    version VARCHAR(20),
    extra_params TEXT,
    last_login_time DATETIME,
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    INDEX idx_user_id (user_id),
    INDEX idx_third_party (third_party_type, third_party_user_id),
    UNIQUE KEY uniq_third_party_user (third_party_type, third_party_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS login_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    token VARCHAR(1000) NOT NULL,
    login_timestamp BIGINT NOT NULL,
    login_time DATETIME NOT NULL,
    third_party_type VARCHAR(20) NOT NULL,
    device_id VARCHAR(200),
    client_ip VARCHAR(50),
    device_info TEXT,
    platform VARCHAR(50),
    version VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expire_time DATETIME,
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token(100)),
    INDEX idx_login_time (login_time),
    INDEX idx_is_active (is_active),
    INDEX idx_expire_time (expire_time),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Do not create gameplay tables here. Starting game-server-1 with
-- GAME_DB_NAME=laya_game_1 applies classpath:db/migration through Flyway.
