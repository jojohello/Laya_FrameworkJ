-- 登录服务器数据库初始化脚本

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL UNIQUE COMMENT '用户唯一标识',
    third_party_type VARCHAR(20) NOT NULL COMMENT '第三方类型',
    third_party_user_id VARCHAR(200) NOT NULL COMMENT '第三方用户ID',
    nickname VARCHAR(100) COMMENT '用户昵称',
    avatar VARCHAR(500) COMMENT '用户头像',
    device_info TEXT COMMENT '设备信息',
    platform VARCHAR(50) COMMENT '平台信息',
    version VARCHAR(20) COMMENT '版本号',
    extra_params TEXT COMMENT '额外参数',
    last_login_time DATETIME COMMENT '最后登录时间',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否启用',

    INDEX idx_user_id (user_id),
    UNIQUE KEY uk_third_party_identity (third_party_type, third_party_user_id),
    INDEX idx_nickname (nickname),
    INDEX idx_created_time (created_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 登录记录表
CREATE TABLE IF NOT EXISTS login_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL COMMENT '用户ID',
    token VARCHAR(1000) NOT NULL COMMENT 'JWT Token',
    login_timestamp BIGINT NOT NULL COMMENT '登录时间戳',
    login_time DATETIME NOT NULL COMMENT '登录时间',
    third_party_type VARCHAR(20) NOT NULL COMMENT '第三方类型',
    device_id VARCHAR(200) COMMENT '设备ID',
    client_ip VARCHAR(50) COMMENT '客户端IP',
    device_info TEXT COMMENT '设备信息',
    platform VARCHAR(50) COMMENT '平台信息',
    version VARCHAR(20) COMMENT '版本号',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否活跃',
    expire_time DATETIME COMMENT '过期时间',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    INDEX idx_user_id (user_id),
    INDEX idx_token (token(100)),
    INDEX idx_login_time (login_time),
    INDEX idx_is_active (is_active),
    INDEX idx_expire_time (expire_time),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='登录记录表';

-- 插入一些测试数据
INSERT IGNORE INTO users (user_id, third_party_type, third_party_user_id, nickname, created_time) VALUES
('guest_1703123456789', 'GUEST', 'test_device_001', '游客_3456789', NOW()),
('wechat_1703123456790', 'WECHAT', 'wx_openid_test_001', '微信用户_test001', NOW()),
('qq_1703123456791', 'QQ', 'qq_unionid_test_001', 'QQ用户_test001', NOW());
