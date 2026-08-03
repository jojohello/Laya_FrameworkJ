package com.laya.game.game.bag;

import com.laya.game.game.config.ConfigManager;
import com.laya.game.game.configStruct.ItemConfig;
import com.laya.game.game.protocol.payload.bag.BagPayloads;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
class BagServiceTest {
    private final FakeBagRepository repository = new FakeBagRepository();
    private final FakeConfigManager configManager = new FakeConfigManager();
    private final BagService service = new BagService(repository, configManager);

    @Test
    void appliesBatchWithOneVersionIncrementAndAbsoluteCounts() {
        repository.state = new BagState(7L, BagPayloads.BagType.MAIN, 4, 11L, Map.of(1001, 3L, 1002, 12L));
        configManager.items = Map.of(1001, item(1001, 10), 1002, item(1002, 20));

        BagPayloads.BagDelta delta = service.changeItemCounts(7L, BagPayloads.BagType.MAIN, Map.of(1001, 2L, 1002, -12L));

        assertEquals(BagPayloads.BagType.MAIN, delta.bagType());
        assertEquals("11", delta.baseVersion());
        assertEquals("12", delta.version());
        assertEquals(2, delta.changes().size());
        assertEquals(Map.of(1001, 5L, 1002, 0L), repository.savedCounts);
        assertEquals(12L, repository.savedVersion);
    }

    @Test
    void rejectsCapacityOverflowBeforeWriting() {
        repository.state = new BagState(7L, BagPayloads.BagType.WAREHOUSE, 1, 2L, Map.of(1001, 10L));
        configManager.items = Map.of(1001, item(1001, 10), 1002, item(1002, 10));

        assertThrows(IllegalStateException.class,
                () -> service.changeItemCounts(7L, BagPayloads.BagType.WAREHOUSE, Map.of(1002, 1L)));
        assertEquals(null, repository.savedCounts);
    }

    @Test
    void maxStackTenUsesTwoSlotsForElevenGems() {
        repository.state = new BagState(7L, BagPayloads.BagType.MAIN, 2, 3L, Map.of());
        configManager.items = Map.of(1101, item(1101, 10));

        BagPayloads.BagDelta delta = service.changeItemCounts(
                7L, BagPayloads.BagType.MAIN, Map.of(1101, 11L));

        assertEquals(11L, repository.savedCounts.get(1101));
        assertEquals("4", delta.version());
    }

    @Test
    void rejectsNegativeResultBeforeWriting() {
        repository.state = new BagState(7L, BagPayloads.BagType.MAIN, 40, 2L, Map.of(1001, 1L));

        assertThrows(IllegalStateException.class,
                () -> service.changeItemCounts(7L, BagPayloads.BagType.MAIN, Map.of(1001, -2L)));
        assertEquals(null, repository.savedCounts);
    }

    @Test
    void rejectsVersionOverflowBeforeWriting() {
        repository.state = new BagState(7L, BagPayloads.BagType.MAIN, 40, Long.MAX_VALUE, Map.of());
        configManager.items = Map.of(1001, item(1001, 10));

        assertThrows(IllegalStateException.class,
                () -> service.changeItemCounts(7L, BagPayloads.BagType.MAIN, Map.of(1001, 1L)));
        assertEquals(null, repository.savedCounts);
    }

    private ItemConfig item(int id, int maxStack) {
        return new ItemConfig(id, "Material", 1, maxStack, "");
    }

    private static final class FakeBagRepository extends BagRepository {
        private BagState state;
        private Map<Integer, Long> savedCounts;
        private long savedVersion = -1;

        private FakeBagRepository() { super(null); }
        @Override BagState findForUpdate(long playerId, BagPayloads.BagType bagType) {
            assertEquals(state.bagType(), bagType);
            return state;
        }
        @Override void saveChanges(long playerId, BagPayloads.BagType bagType,
                                   Map<Integer, Long> changedCounts, long nextVersion) {
            assertEquals(state.bagType(), bagType);
            savedCounts = Map.copyOf(changedCounts);
            savedVersion = nextVersion;
        }
    }

    private static final class FakeConfigManager extends ConfigManager {
        private Map<Integer, ItemConfig> items = Map.of();
        @Override public <T> T get(Class<T> configClass, int id) {
            return configClass.cast(items.get(id));
        }
    }
}
