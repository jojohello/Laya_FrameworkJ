package com.laya.game.game.protocol.payload.bag;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.List;

/** Generated from Protocol/contracts/bag/schema.json. Do not edit. */
public final class BagPayloads {
    private BagPayloads() {}

    public enum BagType {
        MAIN("main"),
        WAREHOUSE("warehouse");

        private final String wireValue;

        BagType(String wireValue) { this.wireValue = wireValue; }

        @JsonValue
        public String wireValue() { return wireValue; }

        @JsonCreator
        public static BagType fromWire(String value) {
            for (BagType candidate : values()) {
                if (candidate.wireValue.equals(value)) return candidate;
            }
            throw new IllegalArgumentException("unknown BagType: " + value);
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BagSnapshotRequest(BagType bagType) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BagItem(int itemId, long count) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BagSnapshot(BagType bagType, int capacity, String version, List<BagItem> items) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BagChange(int itemId, long delta, long count) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BagDelta(BagType bagType, String baseVersion, String version, List<BagChange> changes) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BagSnapshotResponse(boolean success, BagSnapshot snapshot, String reason) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BagInitData(List<BagSnapshot> bags) {}

}
