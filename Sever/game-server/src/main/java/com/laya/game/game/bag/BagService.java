package com.laya.game.game.bag;

import com.laya.game.game.config.ConfigManager;
import com.laya.game.game.configStruct.ItemConfig;
import com.laya.game.game.util.ExactLong;
import com.laya.game.game.protocol.payload.bag.BagPayloads;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class BagService {
    private final BagRepository repository;
    private final ConfigManager configManager;

    public BagService(BagRepository repository, ConfigManager configManager) {
        this.repository = repository;
        this.configManager = configManager;
    }

    public BagPayloads.BagSnapshot snapshot(long playerId, BagPayloads.BagType bagType) {
        return repository.find(playerId, bagType);
    }

    public BagPayloads.BagInitData initialData(long playerId) {
        return new BagPayloads.BagInitData(List.of(snapshot(playerId, BagPayloads.BagType.MAIN)));
    }

    @Transactional
    public BagPayloads.BagDelta changeItemCounts(long playerId, BagPayloads.BagType bagType,
                                                  Map<Integer, Long> requestedDeltas) {
        Map<Integer, Long> deltas = normalizeDeltas(requestedDeltas);
        if (deltas.isEmpty()) return null;

        BagState state = repository.findForUpdate(playerId, bagType);
        Map<Integer, Long> nextItems = new TreeMap<>(state.items());
        Map<Integer, Long> changedCounts = new LinkedHashMap<>();
        List<BagPayloads.BagChange> changes = new ArrayList<>();
        for (Map.Entry<Integer, Long> entry : deltas.entrySet()) {
            int itemId = entry.getKey();
            long delta = entry.getValue();
            long oldCount = nextItems.getOrDefault(itemId, 0L);
            long nextCount = ExactLong.addNonNegative(oldCount, delta, "bag item count");
            ExactLong.requireJavaScriptSafeNonNegative(nextCount, "bag item count");
            if (nextCount == 0) nextItems.remove(itemId);
            else nextItems.put(itemId, nextCount);
            changedCounts.put(itemId, nextCount);
            changes.add(new BagPayloads.BagChange(itemId, delta, nextCount));
        }

        validateCapacity(state.capacity(), nextItems);
        final long nextVersion;
        try {
            nextVersion = Math.addExact(state.version(), 1L);
        } catch (ArithmeticException exception) {
            throw new IllegalStateException("bag_version_overflow", exception);
        }
        if (nextVersion < 0) throw new IllegalStateException("bag_version_overflow");
        repository.saveChanges(playerId, bagType, changedCounts, nextVersion);
        return new BagPayloads.BagDelta(
                bagType, ExactLong.toWire(state.version()), ExactLong.toWire(nextVersion), List.copyOf(changes));
    }

    private Map<Integer, Long> normalizeDeltas(Map<Integer, Long> requestedDeltas) {
        Map<Integer, Long> normalized = new TreeMap<>();
        if (requestedDeltas == null) return normalized;
        for (Map.Entry<Integer, Long> entry : requestedDeltas.entrySet()) {
            int itemId = entry.getKey() == null ? 0 : entry.getKey();
            long delta = entry.getValue() == null ? 0 : entry.getValue();
            if (itemId <= 0) throw new IllegalStateException("bag_item_invalid");
            if (delta == 0) continue;
            normalized.merge(itemId, delta, (left, right) -> {
                try {
                    return Math.addExact(left, right);
                } catch (ArithmeticException exception) {
                    throw new IllegalStateException("bag_item_delta_overflow", exception);
                }
            });
        }
        normalized.entrySet().removeIf(entry -> entry.getValue() == 0);
        return normalized;
    }

    private void validateCapacity(int capacity, Map<Integer, Long> items) {
        long usedSlots = 0;
        for (Map.Entry<Integer, Long> entry : items.entrySet()) {
            ItemConfig item = configManager.get(ItemConfig.class, entry.getKey());
            if (item == null || "Currency".equalsIgnoreCase(item.getType()) || item.getMaxStack() <= 0) {
                throw new IllegalStateException("bag_item_invalid:" + entry.getKey());
            }
            long count = entry.getValue();
            long slots = count == 0 ? 0 : ((count - 1) / item.getMaxStack()) + 1;
            try {
                usedSlots = Math.addExact(usedSlots, slots);
            } catch (ArithmeticException exception) {
                throw new IllegalStateException("bag_capacity_overflow", exception);
            }
            if (usedSlots > capacity) throw new IllegalStateException("bag_capacity_exceeded");
        }
    }
}
