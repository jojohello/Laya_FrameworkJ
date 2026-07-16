package com.laya.game.game.guide;

public record GuideProgress(int guideId, String status, int currentStepId, int scriptVersion) {
    public boolean completed() {
        return "completed".equals(status);
    }
}
