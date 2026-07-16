package com.laya.game.game.player;

public class PlayerSelectionRequiredException extends RuntimeException {
    public PlayerSelectionRequiredException(String userId) {
        super("Multiple players require explicit selection for user " + userId);
    }
}
