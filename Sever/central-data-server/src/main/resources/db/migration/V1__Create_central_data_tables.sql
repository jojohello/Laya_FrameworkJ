-- Laya Game Server Framework - Central Data Server Database Schema
-- Version: 1.0.0
-- Description: 创建中心数据服务器的核心数据表

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    email VARCHAR(100) UNIQUE COMMENT '邮箱',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    salt VARCHAR(32) NOT NULL COMMENT '密码盐值',
    display_name VARCHAR(100) COMMENT '显示名称',
    avatar_url VARCHAR(500) COMMENT '头像URL',
    user_type ENUM('REGULAR', 'GUEST', 'ADMIN', 'VIP') NOT NULL DEFAULT 'REGULAR' COMMENT '用户类型',
    status ENUM('ACTIVE', 'INACTIVE', 'BANNED', 'PENDING') NOT NULL DEFAULT 'ACTIVE' COMMENT '用户状态',
    last_login_time TIMESTAMP NULL COMMENT '最后登录时间',
    last_login_ip VARCHAR(45) COMMENT '最后登录IP',
    login_count BIGINT DEFAULT 0 COMMENT '登录次数',
    failed_login_attempts INT DEFAULT 0 COMMENT '失败登录尝试次数',
    last_failed_login_time TIMESTAMP NULL COMMENT '最后失败登录时间',
    account_locked_until TIMESTAMP NULL COMMENT '账户锁定到期时间',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_user_type (user_type),
    INDEX idx_last_login_time (last_login_time),
    INDEX idx_created_time (created_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基础信息表';

-- 第三方登录信息表
CREATE TABLE IF NOT EXISTS user_third_party_logins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    provider ENUM('WECHAT', 'QQ', 'WEIBO', 'GOOGLE', 'FACEBOOK', 'APPLE') NOT NULL COMMENT '第三方平台',
    third_party_id VARCHAR(100) NOT NULL COMMENT '第三方用户ID',
    third_party_username VARCHAR(100) COMMENT '第三方用户名',
    access_token VARCHAR(500) COMMENT '访问令牌',
    refresh_token VARCHAR(500) COMMENT '刷新令牌',
    token_expires_at TIMESTAMP NULL COMMENT '令牌过期时间',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '绑定时间',
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    UNIQUE KEY uk_provider_third_party_id (provider, third_party_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_provider (provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户第三方登录信息表';

-- 用户会话表
CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '会话ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    session_token VARCHAR(255) NOT NULL UNIQUE COMMENT '会话令牌',
    login_timestamp BIGINT NOT NULL COMMENT '登录时间戳',
    device_info VARCHAR(500) COMMENT '设备信息',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent VARCHAR(1000) COMMENT '用户代理',
    location VARCHAR(200) COMMENT '登录地点',
    status ENUM('ACTIVE', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'ACTIVE' COMMENT '会话状态',
    last_active_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后活跃时间',
    expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at),
    INDEX idx_last_active_time (last_active_time),
    INDEX idx_login_timestamp (login_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会话表';

-- 网关分配表
CREATE TABLE IF NOT EXISTS gateway_allocations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '分配ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    gateway_id VARCHAR(100) NOT NULL COMMENT '网关服务器ID',
    gateway_host VARCHAR(255) NOT NULL COMMENT '网关主机地址',
    gateway_port INT NOT NULL COMMENT '网关端口',
    allocation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
    confirmed_time TIMESTAMP NULL COMMENT '确认连接时间',
    expires_at TIMESTAMP NOT NULL COMMENT '分配过期时间',
    status ENUM('ALLOCATED', 'CONFIRMED', 'EXPIRED', 'RELEASED') NOT NULL DEFAULT 'ALLOCATED' COMMENT '分配状态',
    connection_count INT DEFAULT 0 COMMENT '连接次数',
    last_heartbeat_time TIMESTAMP NULL COMMENT '最后心跳时间',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_gateway_id (gateway_id),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at),
    INDEX idx_allocation_time (allocation_time),
    INDEX idx_last_heartbeat_time (last_heartbeat_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='网关分配表';

-- 网关服务器信息表
CREATE TABLE IF NOT EXISTS gateway_servers (
    id VARCHAR(100) PRIMARY KEY COMMENT '网关服务器ID',
    name VARCHAR(100) NOT NULL COMMENT '网关名称',
    host VARCHAR(255) NOT NULL COMMENT '主机地址',
    port INT NOT NULL COMMENT '端口',
    region VARCHAR(50) COMMENT '地区',
    max_connections INT DEFAULT 10000 COMMENT '最大连接数',
    current_connections INT DEFAULT 0 COMMENT '当前连接数',
    cpu_usage DECIMAL(5,2) DEFAULT 0.00 COMMENT 'CPU使用率',
    memory_usage DECIMAL(5,2) DEFAULT 0.00 COMMENT '内存使用率',
    network_latency INT DEFAULT 0 COMMENT '网络延迟(ms)',
    status ENUM('ONLINE', 'OFFLINE', 'MAINTENANCE') NOT NULL DEFAULT 'OFFLINE' COMMENT '服务器状态',
    last_heartbeat_time TIMESTAMP NULL COMMENT '最后心跳时间',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_status (status),
    INDEX idx_region (region),
    INDEX idx_current_connections (current_connections),
    INDEX idx_last_heartbeat_time (last_heartbeat_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='网关服务器信息表';

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置ID',
    config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    config_type ENUM('STRING', 'INTEGER', 'BOOLEAN', 'JSON') NOT NULL DEFAULT 'STRING' COMMENT '配置类型',
    description VARCHAR(500) COMMENT '配置描述',
    is_encrypted BOOLEAN DEFAULT FALSE COMMENT '是否加密',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
    user_id BIGINT COMMENT '操作用户ID',
    operation_type VARCHAR(50) NOT NULL COMMENT '操作类型',
    operation_desc VARCHAR(500) COMMENT '操作描述',
    request_path VARCHAR(500) COMMENT '请求路径',
    request_method VARCHAR(10) COMMENT '请求方法',
    request_params TEXT COMMENT '请求参数',
    response_status INT COMMENT '响应状态码',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent VARCHAR(1000) COMMENT '用户代理',
    execution_time BIGINT COMMENT '执行时间(ms)',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_operation_type (operation_type),
    INDEX idx_created_time (created_time),
    INDEX idx_ip_address (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- 插入默认系统配置
INSERT INTO system_configs (config_key, config_value, config_type, description) VALUES
('jwt.secret', 'laya-game-server-jwt-secret-key-2024', 'STRING', 'JWT密钥'),
('jwt.expiration', '86400', 'INTEGER', 'JWT过期时间(秒)'),
('session.timeout', '7200', 'INTEGER', '会话超时时间(秒)'),
('session.max_per_user', '5', 'INTEGER', '每用户最大会话数'),
('gateway.allocation_timeout', '300', 'INTEGER', '网关分配超时时间(秒)'),
('gateway.max_allocations_per_user', '3', 'INTEGER', '每用户最大网关分配数'),
('security.password_min_length', '8', 'INTEGER', '密码最小长度'),
('security.max_login_attempts', '5', 'INTEGER', '最大登录尝试次数'),
('security.account_lock_duration', '1800', 'INTEGER', '账户锁定时长(秒)'),
('cleanup.inactive_sessions_days', '7', 'INTEGER', '清理非活跃会话天数'),
('cleanup.expired_allocations_hours', '24', 'INTEGER', '清理过期分配小时数'),
('websocket.max_connections', '10000', 'INTEGER', 'WebSocket最大连接数'),
('websocket.heartbeat_interval', '30000', 'INTEGER', 'WebSocket心跳间隔(毫秒)');

-- 插入默认管理员用户
INSERT INTO users (username, email, password_hash, salt, display_name, user_type, status) VALUES
('admin', 'admin@laya.game', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBaLyEbeZTOWxS', 'admin_salt_2024', '系统管理员', 'ADMIN', 'ACTIVE');

-- 创建索引优化查询性能
CREATE INDEX idx_users_composite ON users(status, user_type, last_login_time);
CREATE INDEX idx_sessions_composite ON user_sessions(user_id, status, expires_at);
CREATE INDEX idx_allocations_composite ON gateway_allocations(user_id, status, expires_at);
CREATE INDEX idx_logs_composite ON operation_logs(user_id, operation_type, created_time);

-- 创建视图用于统计查询
CREATE VIEW v_user_statistics AS
SELECT 
    DATE(created_time) as date,
    user_type,
    status,
    COUNT(*) as user_count
FROM users 
GROUP BY DATE(created_time), user_type, status;

CREATE VIEW v_session_statistics AS
SELECT 
    DATE(created_time) as date,
    status,
    COUNT(*) as session_count,
    COUNT(DISTINCT user_id) as unique_users
FROM user_sessions 
GROUP BY DATE(created_time), status;

CREATE VIEW v_gateway_load AS
SELECT 
    gs.id,
    gs.name,
    gs.host,
    gs.port,
    gs.region,
    gs.max_connections,
    gs.current_connections,
    ROUND((gs.current_connections / gs.max_connections) * 100, 2) as load_percentage,
    gs.cpu_usage,
    gs.memory_usage,
    gs.network_latency,
    gs.status,
    gs.last_heartbeat_time
FROM gateway_servers gs;

-- 创建存储过程用于数据清理
DELIMITER //

CREATE PROCEDURE CleanupExpiredSessions()
BEGIN
    DECLARE affected_rows INT DEFAULT 0;
    
    -- 删除过期的会话
    DELETE FROM user_sessions 
    WHERE status = 'EXPIRED' 
       OR expires_at < NOW() 
       OR (status = 'ACTIVE' AND last_active_time < DATE_SUB(NOW(), INTERVAL 7 DAY));
    
    SET affected_rows = ROW_COUNT();
    
    -- 记录清理日志
    INSERT INTO operation_logs (operation_type, operation_desc, execution_time, created_time)
    VALUES ('CLEANUP', CONCAT('Cleaned up ', affected_rows, ' expired sessions'), 0, NOW());
END //

CREATE PROCEDURE CleanupExpiredAllocations()
BEGIN
    DECLARE affected_rows INT DEFAULT 0;
    
    -- 删除过期的网关分配
    DELETE FROM gateway_allocations 
    WHERE status IN ('EXPIRED', 'RELEASED') 
       OR expires_at < NOW();
    
    SET affected_rows = ROW_COUNT();
    
    -- 记录清理日志
    INSERT INTO operation_logs (operation_type, operation_desc, execution_time, created_time)
    VALUES ('CLEANUP', CONCAT('Cleaned up ', affected_rows, ' expired allocations'), 0, NOW());
END //

CREATE PROCEDURE CleanupOldLogs()
BEGIN
    DECLARE affected_rows INT DEFAULT 0;
    
    -- 删除30天前的操作日志
    DELETE FROM operation_logs 
    WHERE created_time < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    SET affected_rows = ROW_COUNT();
    
    -- 记录清理日志
    INSERT INTO operation_logs (operation_type, operation_desc, execution_time, created_time)
    VALUES ('CLEANUP', CONCAT('Cleaned up ', affected_rows, ' old operation logs'), 0, NOW());
END //

DELIMITER ;

-- 创建定时任务事件（需要开启事件调度器）
-- SET GLOBAL event_scheduler = ON;

/*
CREATE EVENT IF NOT EXISTS cleanup_expired_sessions
ON SCHEDULE EVERY 1 HOUR
DO
  CALL CleanupExpiredSessions();

CREATE EVENT IF NOT EXISTS cleanup_expired_allocations
ON SCHEDULE EVERY 30 MINUTE
DO
  CALL CleanupExpiredAllocations();

CREATE EVENT IF NOT EXISTS cleanup_old_logs
ON SCHEDULE EVERY 1 DAY
STARTS '2024-01-01 02:00:00'
DO
  CALL CleanupOldLogs();
*/

-- 数据库初始化完成
SELECT 'Laya Game Server Central Data Database initialized successfully!' as message;
