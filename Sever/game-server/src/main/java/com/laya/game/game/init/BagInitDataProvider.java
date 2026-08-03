package com.laya.game.game.init;

import com.laya.game.game.bag.BagService;
import org.springframework.stereotype.Component;

@Component
public class BagInitDataProvider implements GameInitDataProvider {
    private final BagService bagService;
    public BagInitDataProvider(BagService bagService) { this.bagService = bagService; }
    @Override public String sectionName() { return "bag"; }
    @Override public Object build(GamePlayerContext context) { return bagService.initialData(context.playerId()); }
}
