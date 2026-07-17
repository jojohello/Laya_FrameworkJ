package com.laya.game.game.wallet;

import com.laya.game.game.config.ConfigManager;
import com.laya.game.game.configStruct.ItemConfig;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import com.laya.game.game.util.ExactLong;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Repository
public class WalletRepository {
    private final JdbcTemplate jdbcTemplate;
    private final ConfigManager configManager;

    public WalletRepository(JdbcTemplate jdbcTemplate, ConfigManager configManager) {
        this.jdbcTemplate = jdbcTemplate;
        this.configManager = configManager;
    }

    public WalletInitData findOrCreate(long playerId) {
        List<ItemConfig> currencies = configManager.getAll(ItemConfig.class).stream()
                .filter(item -> "Currency".equalsIgnoreCase(item.getType()))
                .toList();
        for (ItemConfig currency : currencies) {
            jdbcTemplate.update(
                    "INSERT IGNORE INTO player_wallet_balance "
                            + "(player_id, currency_item_id, balance) VALUES (?, ?, 0)",
                    playerId, currency.getID());
        }
        Map<Integer, String> balances = new LinkedHashMap<>();
        jdbcTemplate.query(
                "SELECT currency_item_id, balance FROM player_wallet_balance WHERE player_id = ?",
                (RowCallbackHandler) rs ->
                        balances.put(rs.getInt("currency_item_id"), ExactLong.toWire(rs.getLong("balance"))),
                playerId);
        return new WalletInitData(balances);
    }

    @Transactional
    public long changeBalance(long playerId, int currencyItemId, long delta) {
        jdbcTemplate.update(
                "INSERT IGNORE INTO player_wallet_balance "
                        + "(player_id, currency_item_id, balance) VALUES (?, ?, 0)",
                playerId, currencyItemId);
        Long current = jdbcTemplate.queryForObject(
                "SELECT balance FROM player_wallet_balance "
                        + "WHERE player_id = ? AND currency_item_id = ? FOR UPDATE",
                Long.class, playerId, currencyItemId);
        long next = ExactLong.addNonNegative(current == null ? 0 : current, delta, "wallet balance");
        jdbcTemplate.update(
                "UPDATE player_wallet_balance SET balance = ? "
                        + "WHERE player_id = ? AND currency_item_id = ?",
                next, playerId, currencyItemId);
        return next;
    }
}
