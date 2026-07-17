-- Non-destructive development migration from the historical mixed laya_game
-- database into one global Login database and game-server-1's private database.
-- The source database is intentionally retained for rollback and reconciliation.

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

CREATE TABLE IF NOT EXISTS laya_login.users LIKE laya_game.users;
INSERT IGNORE INTO laya_login.users SELECT * FROM laya_game.users;

CREATE TABLE IF NOT EXISTS laya_login.login_records LIKE laya_game.login_records;
INSERT IGNORE INTO laya_login.login_records SELECT * FROM laya_game.login_records;

CREATE TABLE IF NOT EXISTS laya_game_1.game_schema_migration LIKE laya_game.game_schema_migration;
INSERT IGNORE INTO laya_game_1.game_schema_migration SELECT * FROM laya_game.game_schema_migration;

CREATE TABLE IF NOT EXISTS laya_game_1.player_role LIKE laya_game.player_role;
INSERT IGNORE INTO laya_game_1.player_role SELECT * FROM laya_game.player_role;

CREATE TABLE IF NOT EXISTS laya_game_1.player_account_role_state LIKE laya_game.player_account_role_state;
INSERT IGNORE INTO laya_game_1.player_account_role_state SELECT * FROM laya_game.player_account_role_state;

CREATE TABLE IF NOT EXISTS laya_game_1.player_guide_state LIKE laya_game.player_guide_state;
INSERT IGNORE INTO laya_game_1.player_guide_state SELECT * FROM laya_game.player_guide_state;

CREATE TABLE IF NOT EXISTS laya_game_1.player_function_open LIKE laya_game.player_function_open;
INSERT IGNORE INTO laya_game_1.player_function_open SELECT * FROM laya_game.player_function_open;

CREATE TABLE IF NOT EXISTS laya_game_1.player_wallet_balance LIKE laya_game.player_wallet_balance;
INSERT IGNORE INTO laya_game_1.player_wallet_balance SELECT * FROM laya_game.player_wallet_balance;

CREATE TABLE IF NOT EXISTS laya_game_1.player_inventory_item LIKE laya_game.player_inventory_item;
INSERT IGNORE INTO laya_game_1.player_inventory_item SELECT * FROM laya_game.player_inventory_item;
