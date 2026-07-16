package com.laya.game.game.player;

import java.util.concurrent.ThreadLocalRandom;

public final class PlayerNameGenerator {
    private PlayerNameGenerator() {}

    public static String createDefaultName() {
        return "Player" + System.currentTimeMillis() + ThreadLocalRandom.current().nextInt(100, 1000);
    }
}
