package com.laya.game.game.init;

import com.laya.game.game.player.PlayerRepository;
import org.springframework.stereotype.Component;

@Component
public class PlayerInitDataProvider implements GameInitDataProvider {
    private final PlayerRepository repository;
    public PlayerInitDataProvider(PlayerRepository repository) { this.repository = repository; }
    @Override public String sectionName() { return "player"; }
    @Override public Object build(GamePlayerContext context) { return context.player().toInitData(); }
}
