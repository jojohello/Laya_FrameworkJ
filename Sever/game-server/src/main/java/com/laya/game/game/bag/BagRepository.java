package com.laya.game.game.bag;

import org.springframework.jdbc.core.JdbcTemplate;
import com.laya.game.game.redis.RedisService;
import com.laya.game.game.player.PlayerRepository;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Repository;
import java.util.ArrayList;
import java.util.List;

@Repository
public class BagRepository {
    private final JdbcTemplate jdbcTemplate;
    private final RedisService redisService;
    public BagRepository(JdbcTemplate jdbcTemplate, RedisService redisService, PlayerRepository playerRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.redisService = redisService;
    }
    public void initializeSchema() {
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS player_inventory_item (player_id BIGINT NOT NULL, item_id INT NOT NULL, count BIGINT NOT NULL, PRIMARY KEY (player_id, item_id))");
        if (tableExists("player_bag_item") && !migrationApplied("account-bag-to-player-v1")) {
            jdbcTemplate.update("INSERT IGNORE INTO player_inventory_item (player_id, item_id, count) "
                    + "SELECT roles.player_id, legacy.item_id, legacy.count FROM player_bag_item legacy "
                    + "JOIN (SELECT user_id, MIN(player_id) player_id FROM player_role GROUP BY user_id HAVING COUNT(*) = 1) roles ON roles.user_id = legacy.user_id");
            markMigrationApplied("account-bag-to-player-v1");
        }
    }
    public BagInitData find(long playerId) {
        List<BagInitData.BagItem> items = new ArrayList<>();
        jdbcTemplate.query("SELECT item_id, count FROM player_inventory_item WHERE player_id = ? AND count > 0", (RowCallbackHandler) rs -> items.add(new BagInitData.BagItem(rs.getInt("item_id"), rs.getLong("count"))), playerId);
        return new BagInitData(40, items);
    }

    public long changeItemCount(long playerId, int itemId, long delta) {
        jdbcTemplate.update("INSERT IGNORE INTO player_inventory_item (player_id, item_id, count) VALUES (?, ?, 0)", playerId, itemId);
        int affected = jdbcTemplate.update("UPDATE player_inventory_item SET count = count + ? WHERE player_id = ? AND item_id = ? AND count + ? >= 0",
                delta, playerId, itemId, delta);
        if (affected == 0) throw new IllegalStateException("bag item count cannot become negative");
        Long count = jdbcTemplate.queryForObject("SELECT count FROM player_inventory_item WHERE player_id = ? AND item_id = ?",
                Long.class, playerId, itemId);
        long result = count == null ? 0 : count;
        try {
            redisService.hSet("game:bag:" + playerId, String.valueOf(itemId), result);
        } catch (RuntimeException ignored) {
            // MySQL remains authoritative; the next snapshot rebuilds the cache.
        }
        return result;
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
