package com.laya.game.game.bag;
import java.util.List;
public record BagInitData(int capacity, List<BagItem> items) {
    public record BagItem(int itemId, long count) {}
}
