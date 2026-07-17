package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * 将旧账号维度 gameplay 表迁移到 playerId 维度。
 * INSERT IGNORE 保证已完成人工迁移的数据库也可以安全执行。
 */
public class V2__Migrate_legacy_game_data extends BaseJavaMigration {
    @Override
    public void migrate(Context context) throws Exception {
        Connection connection = context.getConnection();
        ensureGuideActivationColumn(connection);
        migratePlayers(connection);
        populateSelectedPlayers(connection);
        migrateGuide(connection);
        migrateFunctionOpen(connection);
        migrateWallet(connection);
        migrateBag(connection);
    }

    private void ensureGuideActivationColumn(Connection connection) throws SQLException {
        if (!tableExists(connection, "player_guide_state")
                || columnExists(connection, "player_guide_state", "activated_at")) return;
        execute(connection, "ALTER TABLE player_guide_state ADD COLUMN activated_at BIGINT NULL AFTER script_version");
        execute(connection, "UPDATE player_guide_state SET activated_at = started_at WHERE activated_at IS NULL");
        execute(connection, "ALTER TABLE player_guide_state MODIFY COLUMN activated_at BIGINT NOT NULL");
    }

    private void migratePlayers(Connection connection) throws SQLException {
        if (!tableExists(connection, "player_state")) return;
        execute(connection, "INSERT IGNORE INTO player_role (user_id, name, level, exp, stamina) "
                + "SELECT user_id, name, level, exp, stamina FROM player_state");
    }

    private void populateSelectedPlayers(Connection connection) throws SQLException {
        execute(connection, "INSERT INTO player_account_role_state (user_id, selected_player_id) "
                + "SELECT user_id, IF(COUNT(*) = 1, MIN(player_id), NULL) FROM player_role GROUP BY user_id "
                + "ON DUPLICATE KEY UPDATE selected_player_id = "
                + "IF(selected_player_id IS NULL, VALUES(selected_player_id), selected_player_id)");
    }

    private void migrateGuide(Connection connection) throws SQLException {
        if (!tableExists(connection, "player_guide_progress") || !tableExists(connection, "player_state")) return;
        execute(connection, "INSERT IGNORE INTO player_guide_state "
                + "(player_id, guide_id, status, current_step_id, script_version, activated_at, started_at, completed_at) "
                + "SELECT role.player_id, progress.guide_id, progress.status, progress.current_step_id, "
                + "progress.script_version, progress.started_at, progress.started_at, progress.completed_at "
                + "FROM player_guide_progress progress "
                + "JOIN player_state legacy ON legacy.player_id = progress.player_id "
                + "JOIN (SELECT user_id, MIN(player_id) player_id FROM player_role "
                + "GROUP BY user_id HAVING COUNT(*) = 1) role ON role.user_id = legacy.user_id");
    }

    private void migrateFunctionOpen(Connection connection) throws SQLException {
        if (!tableExists(connection, "user_function_open")) return;
        execute(connection, "INSERT IGNORE INTO player_function_open (player_id, function_id, opened_at, version) "
                + "SELECT roles.player_id, legacy.function_id, legacy.opened_at, legacy.version "
                + "FROM user_function_open legacy "
                + "JOIN (SELECT user_id, MIN(player_id) player_id FROM player_role "
                + "GROUP BY user_id HAVING COUNT(*) = 1) roles ON roles.user_id = legacy.user_id");
    }

    private void migrateWallet(Connection connection) throws SQLException {
        if (!tableExists(connection, "player_wallet")) return;
        execute(connection, "INSERT IGNORE INTO player_wallet_balance (player_id, currency_item_id, balance) "
                + "SELECT roles.player_id, legacy.currency_item_id, legacy.balance FROM player_wallet legacy "
                + "JOIN (SELECT user_id, MIN(player_id) player_id FROM player_role "
                + "GROUP BY user_id HAVING COUNT(*) = 1) roles ON roles.user_id = legacy.user_id");
    }

    private void migrateBag(Connection connection) throws SQLException {
        if (!tableExists(connection, "player_bag_item")) return;
        execute(connection, "INSERT IGNORE INTO player_inventory_item (player_id, item_id, count) "
                + "SELECT roles.player_id, legacy.item_id, legacy.count FROM player_bag_item legacy "
                + "JOIN (SELECT user_id, MIN(player_id) player_id FROM player_role "
                + "GROUP BY user_id HAVING COUNT(*) = 1) roles ON roles.user_id = legacy.user_id");
    }

    private boolean tableExists(Connection connection, String tableName) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT COUNT(*) FROM information_schema.tables "
                        + "WHERE table_schema = DATABASE() AND table_name = ?")) {
            statement.setString(1, tableName);
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                return result.getInt(1) > 0;
            }
        }
    }

    private boolean columnExists(Connection connection, String tableName, String columnName) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT COUNT(*) FROM information_schema.columns "
                        + "WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?")) {
            statement.setString(1, tableName);
            statement.setString(2, columnName);
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                return result.getInt(1) > 0;
            }
        }
    }

    private void execute(Connection connection, String sql) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            statement.executeUpdate(sql);
        }
    }
}
