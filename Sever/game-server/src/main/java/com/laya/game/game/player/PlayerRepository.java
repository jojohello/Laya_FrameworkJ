package com.laya.game.game.player;

import org.springframework.jdbc.core.JdbcTemplate;
import com.laya.game.game.redis.RedisService;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PostConstruct;
import java.util.List;

@Repository
public class PlayerRepository {
    private final JdbcTemplate jdbcTemplate;
    private final RedisService redisService;
    public PlayerRepository(JdbcTemplate jdbcTemplate, RedisService redisService) { this.jdbcTemplate = jdbcTemplate; this.redisService = redisService; }
    @PostConstruct
    public void initializeSchema() {
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS game_schema_migration (migration_key VARCHAR(128) NOT NULL PRIMARY KEY, applied_at BIGINT NOT NULL)");
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS player_role ("
                + "player_id BIGINT NOT NULL AUTO_INCREMENT, "
                + "user_id VARCHAR(128) NOT NULL, "
                + "name VARCHAR(128) NOT NULL, "
                + "level INT NOT NULL, exp BIGINT NOT NULL, stamina INT NOT NULL, "
                + "PRIMARY KEY (player_id), "
                + "UNIQUE KEY uk_player_role_user_name (user_id, name), "
                + "KEY idx_player_role_user_id (user_id))");
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS player_account_role_state ("
                + "user_id VARCHAR(128) NOT NULL PRIMARY KEY, selected_player_id BIGINT NULL)");
        if (tableExists("player_state") && !migrationApplied("account-player-to-role-v1")) {
            jdbcTemplate.update("INSERT IGNORE INTO player_role (user_id, name, level, exp, stamina) "
                    + "SELECT user_id, name, level, exp, stamina FROM player_state");
            markMigrationApplied("account-player-to-role-v1");
        }
    }

    @Transactional
    public PlayerRole resolveOrCreate(String userId) {
        jdbcTemplate.update("INSERT IGNORE INTO player_account_role_state (user_id, selected_player_id) VALUES (?, NULL)", userId);
        jdbcTemplate.queryForObject("SELECT user_id FROM player_account_role_state WHERE user_id = ? FOR UPDATE", String.class, userId);
        List<PlayerRole> roles = findByUserId(userId);
        if (roles.isEmpty()) {
            jdbcTemplate.update("INSERT INTO player_role (user_id, name, level, exp, stamina) VALUES (?, ?, 1, 0, 100)",
                    userId, PlayerNameGenerator.createDefaultName());
            roles = findByUserId(userId);
        }
        if (roles.size() != 1) throw new PlayerSelectionRequiredException(userId);
        jdbcTemplate.update("UPDATE player_account_role_state SET selected_player_id = ? WHERE user_id = ?",
                roles.get(0).playerId(), userId);
        return roles.get(0);
    }

    public List<PlayerRole> findByUserId(String userId) {
        return jdbcTemplate.query("SELECT player_id, user_id, name, level, exp, stamina FROM player_role WHERE user_id = ? ORDER BY player_id",
                (rs, rowNum) -> new PlayerRole(rs.getLong("player_id"), rs.getString("user_id"),
                        rs.getString("name"), rs.getInt("level"), rs.getLong("exp"), rs.getInt("stamina")), userId);
    }

    public PlayerRole find(long playerId) {
        List<PlayerRole> rows = jdbcTemplate.query("SELECT player_id, user_id, name, level, exp, stamina FROM player_role WHERE player_id = ?",
                (rs, rowNum) -> new PlayerRole(rs.getLong("player_id"), rs.getString("user_id"),
                        rs.getString("name"), rs.getInt("level"), rs.getLong("exp"), rs.getInt("stamina")), playerId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public boolean updateProgress(long playerId, int level, long exp, int stamina) {
        int affected = jdbcTemplate.update("UPDATE player_role SET level = ?, exp = ?, stamina = ? WHERE player_id = ?",
                level, exp, stamina, playerId);
        if (affected == 0) return false;
        try {
            redisService.hSet("game:player:" + playerId, "level", level);
            redisService.hSet("game:player:" + playerId, "exp", exp);
            redisService.hSet("game:player:" + playerId, "stamina", stamina);
        } catch (RuntimeException ignored) {
            // MySQL remains authoritative; the next snapshot rebuilds the cache.
        }
        return true;
    }

    public PlayerInitData levelUpFromOne(long playerId) {
        int affected = jdbcTemplate.update("UPDATE player_role SET level = level + 1, exp = 0 WHERE player_id = ? AND level = 1", playerId);
        if (affected == 0) return null;
        PlayerRole player = find(playerId);
        if (player == null) return null;
        try {
            redisService.hSet("game:player:" + playerId, "level", player.level());
            redisService.hSet("game:player:" + playerId, "exp", player.exp());
            redisService.hSet("game:player:" + playerId, "stamina", player.stamina());
        } catch (RuntimeException ignored) {
            // MySQL remains authoritative.
        }
        return player.toInitData();
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
                Integer.class, tableName);
        return count != null && count > 0;
    }

    private boolean migrationApplied(String key) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM game_schema_migration WHERE migration_key = ?", Integer.class, key);
        return count != null && count > 0;
    }

    private void markMigrationApplied(String key) {
        jdbcTemplate.update("INSERT IGNORE INTO game_schema_migration (migration_key, applied_at) VALUES (?, ?)", key, System.currentTimeMillis());
    }
}
