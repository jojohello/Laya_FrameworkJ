package com.laya.game.game.bag;

import java.util.Map;
import com.laya.game.game.protocol.payload.bag.BagPayloads;

record BagState(long playerId, BagPayloads.BagType bagType, int capacity, long version, Map<Integer, Long> items) {
}
