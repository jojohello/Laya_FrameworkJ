package com.laya.game.game.player;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class PlayerNameGeneratorTest {
    @Test
    void createsTimestampBasedNumericDefaultName() {
        String first = PlayerNameGenerator.createDefaultName();
        String second = PlayerNameGenerator.createDefaultName();

        assertTrue(first.matches("Player\\d{16,}"));
        assertTrue(second.matches("Player\\d{16,}"));
    }
}
