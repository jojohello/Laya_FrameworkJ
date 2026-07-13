-- 中心数据服务器数据库初始化脚本
-- 使用方法: mysql -u root -p < init-database.sql

-- 创建数据库
CREATE DATABASE IF NOT EXISTS laya_central DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS laya_central_dev DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS laya_central_test DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER IF NOT EXISTS 'laya_user'@'%' IDENTIFIED BY 'laya_password_2024';
CREATE USER IF NOT EXISTS 'laya_dev'@'%' IDENTIFIED BY 'laya_dev_2024';
CREATE USER IF NOT EXISTS 'laya_test'@'%' IDENTIFIED BY 'laya_test_2024';

-- 授权
GRANT ALL PRIVILEGES ON laya_central.* TO 'laya_user'@'%';
GRANT ALL PRIVILEGES ON laya_central_dev.* TO 'laya_dev'@'%';
GRANT ALL PRIVILEGES ON laya_central_test.* TO 'laya_test'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 显示创建的数据库
SHOW DATABASES LIKE 'laya_central%';

-- 显示创建的用户
SELECT User, Host FROM mysql.user WHERE User LIKE 'laya_%';

USE laya_central;

-- 验证数据库连接
SELECT 'Database laya_central initialized successfully!' AS status;
