package com.laya.game.game.player;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PlayerRoleTest {
    @Test
    void serializesAutoIncrementIdAsStringForClient() {
        PlayerRole role = new PlayerRole(9_007_199_254_740_993L, "account-1", "Player", 1, 0, 100);

        assertEquals("9007199254740993", role.toInitData().playerId());
    }
}
