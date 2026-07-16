package com.laya.game.game.functionopen;

import com.laya.game.game.redis.RedisService;
import com.laya.game.game.player.PlayerRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public class FunctionOpenRepository {
    private final JdbcTemplate jdbcTemplate;
    private final RedisService redisService;

    public FunctionOpenRepository(JdbcTemplate jdbcTemplate, RedisService redisService,
                                  PlayerRepository playerRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.redisService = redisService;
    }

    public void initializeSchema() {
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS player_function_open (" +
                "player_id BIGINT NOT NULL, function_id INT NOT NULL, " +
                "opened_at BIGINT NOT NULL, version BIGINT NOT NULL, " +
                "PRIMARY KEY (player_id, function_id))");
        if (tableExists("user_function_open") && !migrationApplied("account-function-open-to-player-v1")) {
            jdbcTemplate.update("INSERT IGNORE INTO player_function_open (player_id, function_id, opened_at, version) "
                    + "SELECT roles.player_id, legacy.function_id, legacy.opened_at, legacy.version FROM user_function_open legacy "
                    + "JOIN (SELECT user_id, MIN(player_id) player_id FROM player_role GROUP BY user_id HAVING COUNT(*) = 1) roles ON roles.user_id = legacy.user_id");
            markMigrationApplied("account-function-open-to-player-v1");
        }
    }

    public List<FunctionOpenState> findOpened(long playerId) {
        return jdbcTemplate.query("SELECT function_id, opened_at, version FROM player_function_open WHERE player_id = ?",
                (rs, rowNum) -> new FunctionOpenState(rs.getInt("function_id"), true,
                        rs.getLong("opened_at"), rs.getLong("version")), playerId);
    }

    @Transactional
    public boolean open(long playerId, int functionId) {
        long now = System.currentTimeMillis();
        int affected = jdbcTemplate.update("INSERT IGNORE INTO player_function_open " +
                "(player_id, function_id, opened_at, version) VALUES (?, ?, ?, 1)",
                playerId, functionId, now);
        if (affected > 0) {
            try {
                redisService.hSet("game:function-open:" + playerId, String.valueOf(functionId),
                        new FunctionOpenState(functionId, true, now, 1));
            } catch (RuntimeException ignored) {
                // MySQL is authoritative; the next full load can rebuild the cache.
            }
            return true;
        }
        return false;
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?", Integer.class, tableName);
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
