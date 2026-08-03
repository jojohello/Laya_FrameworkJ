package com.laya.game.game.bag;

import com.laya.game.game.util.ExactLong;
import com.laya.game.game.protocol.payload.bag.BagPayloads;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Repository
public class BagRepository {
    private final JdbcTemplate jdbcTemplate;

    public BagRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public BagPayloads.BagSnapshot find(long playerId, BagPayloads.BagType bagType) {
        return toSnapshot(loadState(playerId, bagType, false));
    }

    BagState findForUpdate(long playerId, BagPayloads.BagType bagType) {
        return loadState(playerId, bagType, true);
    }

    void saveChanges(long playerId, BagPayloads.BagType bagType, Map<Integer, Long> changedCounts, long nextVersion) {
        for (Map.Entry<Integer, Long> entry : changedCounts.entrySet()) {
            jdbcTemplate.update(
                    "INSERT IGNORE INTO player_container_item (player_id, bag_type, item_id, count) VALUES (?, ?, ?, 0)",
                    playerId, bagType.wireValue(), entry.getKey());
            jdbcTemplate.update(
                    "UPDATE player_container_item SET count = ? WHERE player_id = ? AND bag_type = ? AND item_id = ?",
                    entry.getValue(), playerId, bagType.wireValue(), entry.getKey());
        }
        int updated = jdbcTemplate.update(
                "UPDATE player_container_state SET version = ? WHERE player_id = ? AND bag_type = ?",
                nextVersion, playerId, bagType.wireValue());
        if (updated != 1) throw new IllegalStateException("bag_state_update_failed");
    }

    private BagState loadState(long playerId, BagPayloads.BagType bagType, boolean forUpdate) {
        if (bagType == null) throw new IllegalArgumentException("bag_type_required");
        jdbcTemplate.update(
                "INSERT IGNORE INTO player_container_state (player_id, bag_type, capacity, version) VALUES (?, ?, ?, 0)",
                playerId, bagType.wireValue(), defaultCapacity(bagType));
        String stateSql = "SELECT capacity, version FROM player_container_state WHERE player_id = ? AND bag_type = ?"
                + (forUpdate ? " FOR UPDATE" : "");
        Map<String, Object> row = jdbcTemplate.queryForMap(stateSql, playerId, bagType.wireValue());
        int capacity = ((Number) row.get("capacity")).intValue();
        long version = ((Number) row.get("version")).longValue();
        if (capacity < 1 || version < 0) throw new IllegalStateException("bag_state_invalid");

        Map<Integer, Long> items = new TreeMap<>();
        jdbcTemplate.query(
                "SELECT item_id, count FROM player_container_item WHERE player_id = ? AND bag_type = ? AND count > 0 ORDER BY item_id",
                (RowCallbackHandler) rs -> {
                    int itemId = rs.getInt("item_id");
                    long count = ExactLong.requireJavaScriptSafeNonNegative(rs.getLong("count"), "bag item count");
                    if (itemId <= 0 || items.put(itemId, count) != null) {
                        throw new IllegalStateException("bag_item_invalid");
                    }
                },
                playerId, bagType.wireValue());
        return new BagState(playerId, bagType, capacity, version, Map.copyOf(items));
    }

    private int defaultCapacity(BagPayloads.BagType bagType) {
        return bagType == BagPayloads.BagType.MAIN ? 40 : 200;
    }

    private BagPayloads.BagSnapshot toSnapshot(BagState state) {
        List<BagPayloads.BagItem> items = new ArrayList<>();
        new TreeMap<>(state.items()).forEach((itemId, count) ->
                items.add(new BagPayloads.BagItem(itemId, count)));
        return new BagPayloads.BagSnapshot(state.bagType(), state.capacity(), ExactLong.toWire(state.version()), List.copyOf(items));
    }
}
