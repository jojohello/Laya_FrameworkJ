package com.laya.game.game.player;

public record PlayerRole(long playerId, String userId, String name, int level, long exp, int stamina) {
    public PlayerInitData toInitData() {
        return new PlayerInitData(Long.toString(playerId), name, level, exp, stamina);
    }
}
