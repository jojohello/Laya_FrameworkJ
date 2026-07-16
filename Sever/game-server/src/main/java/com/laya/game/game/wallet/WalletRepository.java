package com.laya.game.game.wallet;

import com.laya.game.game.config.ConfigManager;
import com.laya.game.game.configStruct.ItemConfig;
import com.laya.game.game.redis.RedisService;
import com.laya.game.game.player.PlayerRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Repository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Repository
public class WalletRepository {
    private final JdbcTemplate jdbcTemplate;
    private final ConfigManager configManager;
    private final RedisService redisService;
    public WalletRepository(JdbcTemplate jdbcTemplate, ConfigManager configManager, RedisService redisService,
                            PlayerRepository playerRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.configManager = configManager;
        this.redisService = redisService;
    }
    public void initializeSchema() {
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS player_wallet_balance (player_id BIGINT NOT NULL, currency_item_id INT NOT NULL, balance BIGINT NOT NULL, PRIMARY KEY (player_id, currency_item_id))");
        if (tableExists("player_wallet") && !migrationApplied("account-wallet-to-player-v1")) {
            jdbcTemplate.update("INSERT IGNORE INTO player_wallet_balance (player_id, currency_item_id, balance) "
                    + "SELECT roles.player_id, legacy.currency_item_id, legacy.balance FROM player_wallet legacy "
                    + "JOIN (SELECT user_id, MIN(player_id) player_id FROM player_role GROUP BY user_id HAVING COUNT(*) = 1) roles ON roles.user_id = legacy.user_id");
            markMigrationApplied("account-wallet-to-player-v1");
        }
    }
    public WalletInitData findOrCreate(long playerId) {
        List<ItemConfig> currencies = configManager.getAll(ItemConfig.class).stream().filter(item -> "Currency".equalsIgnoreCase(item.getType())).toList();
        for (ItemConfig currency : currencies) jdbcTemplate.update("INSERT IGNORE INTO player_wallet_balance (player_id, currency_item_id, balance) VALUES (?, ?, 0)", playerId, currency.getID());
        Map<Integer, Long> balances = new LinkedHashMap<>();
        jdbcTemplate.query("SELECT currency_item_id, balance FROM player_wallet_balance WHERE player_id = ?", (RowCallbackHandler) rs -> balances.put(rs.getInt("currency_item_id"), rs.getLong("balance")), playerId);
        return new WalletInitData(balances);
    }

    public long changeBalance(long playerId, int currencyItemId, long delta) {
        jdbcTemplate.update("INSERT IGNORE INTO player_wallet_balance (player_id, currency_item_id, balance) VALUES (?, ?, 0)", playerId, currencyItemId);
        int affected = jdbcTemplate.update("UPDATE player_wallet_balance SET balance = balance + ? WHERE player_id = ? AND currency_item_id = ? AND balance + ? >= 0",
                delta, playerId, currencyItemId, delta);
        if (affected == 0) throw new IllegalStateException("wallet balance cannot become negative");
        Long balance = jdbcTemplate.queryForObject("SELECT balance FROM player_wallet_balance WHERE player_id = ? AND currency_item_id = ?",
                Long.class, playerId, currencyItemId);
        long result = balance == null ? 0 : balance;
        try {
            redisService.hSet("game:wallet:" + playerId, String.valueOf(currencyItemId), result);
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
