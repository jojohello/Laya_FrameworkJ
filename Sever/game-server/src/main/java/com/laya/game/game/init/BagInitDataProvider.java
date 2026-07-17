package com.laya.game.game.init;

import com.laya.game.game.bag.BagRepository;
import org.springframework.stereotype.Component;

@Component
public class BagInitDataProvider implements GameInitDataProvider {
    private final BagRepository repository;
    public BagInitDataProvider(BagRepository repository) { this.repository = repository; }
    @Override public String sectionName() { return "bag"; }
    @Override public Object build(GamePlayerContext context) { return repository.find(context.playerId()); }
}
