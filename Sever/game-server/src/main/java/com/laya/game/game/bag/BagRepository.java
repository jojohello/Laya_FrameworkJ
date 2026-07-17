package com.laya.game.game.bag;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import com.laya.game.game.util.ExactLong;

import java.util.ArrayList;
import java.util.List;

@Repository
public class BagRepository {
    private final JdbcTemplate jdbcTemplate;

    public BagRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public BagInitData find(long playerId) {
        List<BagInitData.BagItem> items = new ArrayList<>();
        jdbcTemplate.query(
                "SELECT item_id, count FROM player_inventory_item "
                        + "WHERE player_id = ? AND count > 0",
                (RowCallbackHandler) rs ->
                        items.add(new BagInitData.BagItem(
                                rs.getInt("item_id"),
                                ExactLong.requireJavaScriptSafeNonNegative(rs.getLong("count"), "bag item count"))),
                playerId);
        return new BagInitData(40, items);
    }

    @Transactional
    public long changeItemCount(long playerId, int itemId, long delta) {
        jdbcTemplate.update(
                "INSERT IGNORE INTO player_inventory_item "
                        + "(player_id, item_id, count) VALUES (?, ?, 0)",
                playerId, itemId);
        Long current = jdbcTemplate.queryForObject(
                "SELECT count FROM player_inventory_item WHERE player_id = ? AND item_id = ? FOR UPDATE",
                Long.class, playerId, itemId);
        long next = ExactLong.addNonNegative(current == null ? 0 : current, delta, "bag item count");
        ExactLong.requireJavaScriptSafeNonNegative(next, "bag item count");
        jdbcTemplate.update(
                "UPDATE player_inventory_item SET count = ? WHERE player_id = ? AND item_id = ?",
                next, playerId, itemId);
        return next;
    }
}
