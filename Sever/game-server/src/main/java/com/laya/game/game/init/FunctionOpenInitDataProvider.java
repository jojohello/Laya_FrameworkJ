package com.laya.game.game.init;

import com.laya.game.game.functionopen.FunctionOpenService;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class FunctionOpenInitDataProvider implements GameInitDataProvider {
    private final FunctionOpenService service;
    public FunctionOpenInitDataProvider(FunctionOpenService service) { this.service = service; }
    @Override public String sectionName() { return "functionOpen"; }
    @Override public Object build(GamePlayerContext context) {
        return Map.of("states", service.getStates(context.playerId()));
    }
}
