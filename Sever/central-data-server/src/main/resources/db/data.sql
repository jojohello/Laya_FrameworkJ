-- Laya Game Server Framework - Central Data Server Initial Data
-- Version: 1.0.0
-- Description: 中心数据服务器初始化数据

-- 插入默认网关服务器配置
INSERT INTO gateway_servers (id, name, host, port, region, max_connections, status) VALUES
('gateway-001', 'Gateway Server 1', 'localhost', 9001, 'local', 5000, 'OFFLINE'),
('gateway-002', 'Gateway Server 2', 'localhost', 9002, 'local', 5000, 'OFFLINE'),
('gateway-003', 'Gateway Server 3', 'localhost', 9003, 'local', 3000, 'OFFLINE');

-- 插入测试用户数据（仅用于开发环境）
INSERT INTO users (username, email, password_hash, salt, display_name, user_type, status) VALUES
('testuser1', 'test1@laya.game', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBaLyEbeZTOWxS', 'test_salt_001', '测试用户1', 'REGULAR', 'ACTIVE'),
('testuser2', 'test2@laya.game', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBaLyEbeZTOWxS', 'test_salt_002', '测试用户2', 'REGULAR', 'ACTIVE'),
('vipuser1', 'vip1@laya.game', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBaLyEbeZTOWxS', 'vip_salt_001', 'VIP用户1', 'VIP', 'ACTIVE'),
('guest001', NULL, '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBaLyEbeZTOWxS', 'guest_salt_001', '游客001', 'GUEST', 'ACTIVE');

-- 插入系统运行时配置
INSERT INTO system_configs (config_key, config_value, config_type, description) VALUES
('system.maintenance_mode', 'false', 'BOOLEAN', '系统维护模式'),
('system.registration_enabled', 'true', 'BOOLEAN', '是否允许用户注册'),
('system.guest_login_enabled', 'true', 'BOOLEAN', '是否允许游客登录'),
('rate_limit.login_per_minute', '10', 'INTEGER', '每分钟登录次数限制'),
('rate_limit.api_per_minute', '100', 'INTEGER', '每分钟API调用次数限制'),
('notification.email_enabled', 'false', 'BOOLEAN', '是否启用邮件通知'),
('notification.sms_enabled', 'false', 'BOOLEAN', '是否启用短信通知'),
('cache.user_session_ttl', '3600', 'INTEGER', '用户会话缓存TTL(秒)'),
('cache.gateway_allocation_ttl', '1800', 'INTEGER', '网关分配缓存TTL(秒)'),
('monitoring.metrics_enabled', 'true', 'BOOLEAN', '是否启用监控指标'),
('monitoring.health_check_interval', '60', 'INTEGER', '健康检查间隔(秒)');

-- 插入示例第三方登录配置（开发环境）
INSERT INTO user_third_party_logins (user_id, provider, third_party_id, third_party_username) VALUES
(2, 'WECHAT', 'wx_test_001', 'WeChat测试用户1'),
(3, 'QQ', 'qq_test_001', 'QQ测试用户1'),
(4, 'GOOGLE', 'google_test_001', 'Google测试用户1');

-- 插入初始操作日志
INSERT INTO operation_logs (user_id, operation_type, operation_desc, request_path, request_method, response_status, ip_address, execution_time) VALUES
(1, 'SYSTEM_INIT', '系统初始化完成', '/system/init', 'POST', 200, '127.0.0.1', 100),
(1, 'DATABASE_INIT', '数据库初始化完成', '/database/init', 'POST', 200, '127.0.0.1', 500);

-- 提交事务
COMMIT;

-- 显示初始化完成信息
SELECT 'Central Data Server initial data loaded successfully!' as message,
       (SELECT COUNT(*) FROM users) as total_users,
       (SELECT COUNT(*) FROM gateway_servers) as total_gateways,
       (SELECT COUNT(*) FROM system_configs) as total_configs;
