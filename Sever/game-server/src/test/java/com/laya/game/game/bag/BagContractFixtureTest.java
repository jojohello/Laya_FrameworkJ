package com.laya.game.game.bag;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.laya.game.game.protocol.payload.bag.BagPayloads;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BagContractFixtureTest {
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void snapshotResponseMatchesCanonicalFixture() throws Exception {
        BagPayloads.BagSnapshotResponse response = new BagPayloads.BagSnapshotResponse(true,
                new BagPayloads.BagSnapshot(BagPayloads.BagType.MAIN, 40, "7", List.of(
                        new BagPayloads.BagItem(1001, 3), new BagPayloads.BagItem(1002, 12))), null);

        assertEquals(readFixture("snapshot-response.json").toString(), mapper.writeValueAsString(response));
    }

    @Test
    void deltaMatchesCanonicalFixture() throws Exception {
        BagPayloads.BagDelta delta = new BagPayloads.BagDelta(BagPayloads.BagType.MAIN, "7", "8", List.of(
                new BagPayloads.BagChange(1001, 2, 5),
                new BagPayloads.BagChange(1002, -12, 0)));

        assertEquals(readFixture("delta.json").toString(), mapper.writeValueAsString(delta));
    }

    @Test
    void loginInitMatchesCanonicalFixture() throws Exception {
        BagPayloads.BagInitData initData = new BagPayloads.BagInitData(List.of(
                new BagPayloads.BagSnapshot(BagPayloads.BagType.MAIN, 40, "7", List.of(
                        new BagPayloads.BagItem(1001, 3)))));
        assertEquals(readFixture("init-data.json").toString(), mapper.writeValueAsString(initData));
    }

    private JsonNode readFixture(String name) throws Exception {
        Path current = Path.of("").toAbsolutePath();
        while (current != null) {
            Path candidate = current.resolve("Protocol/contracts/bag/fixtures").resolve(name);
            if (Files.isRegularFile(candidate)) return mapper.readTree(candidate.toFile());
            current = current.getParent();
        }
        throw new IllegalStateException("bag contract fixture not found: " + name);
    }
}
