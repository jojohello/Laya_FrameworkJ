-- 创建用户表
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_status (status)
);

-- 创建用户会话表
CREATE TABLE user_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    gateway_ip VARCHAR(45),
    gateway_port INT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_active_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    force_logout_reason VARCHAR(255),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_status (status),
    INDEX idx_gateway (gateway_ip, gateway_port)
);

-- 创建网关分配表
CREATE TABLE gateway_allocations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    gateway_ip VARCHAR(45) NOT NULL,
    gateway_port INT NOT NULL,
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ALLOCATED',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_gateway (gateway_ip, gateway_port),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at),
    INDEX idx_allocated_at (allocated_at),
    UNIQUE KEY uk_user_gateway (user_id, gateway_ip, gateway_port, status)
);

-- 插入默认管理员用户
INSERT INTO users (username, password, email, status) VALUES 
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBaLyEm5vtkfOi', 'admin@laya.com', 'ACTIVE');

-- 创建索引以优化查询性能
CREATE INDEX idx_user_sessions_active ON user_sessions(user_id, status, last_active_time);
CREATE INDEX idx_gateway_allocations_active ON gateway_allocations(status, expires_at);
CREATE INDEX idx_gateway_allocations_user_status ON gateway_allocations(user_id, status);
