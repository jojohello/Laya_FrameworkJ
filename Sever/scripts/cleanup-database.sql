-- Cleanup Database Script
-- This script will remove all created database, tables and users

-- 1. Drop database (this will also drop all tables & indexes)
DROP DATABASE IF EXISTS laya_game;

-- 2. Drop user
DROP USER IF EXISTS 'laya_user'@'localhost';
DROP USER IF EXISTS 'laya_user'@'127.0.0.1';

-- 3. Flush privileges
FLUSH PRIVILEGES;

-- 4. Show result
SELECT 'Database cleanup completed!' as status;
