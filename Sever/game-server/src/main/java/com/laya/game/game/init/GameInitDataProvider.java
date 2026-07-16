package com.laya.game.game.init;

public interface GameInitDataProvider {
    String sectionName();
    Object build(GamePlayerContext context);
}
