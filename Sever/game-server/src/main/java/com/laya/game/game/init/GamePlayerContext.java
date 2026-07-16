package com.laya.game.game.init;

import com.laya.game.game.player.PlayerRole;

public record GamePlayerContext(String userId, PlayerRole player) {
    public long playerId() {
        return player.playerId();
    }
}
