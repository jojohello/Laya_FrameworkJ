package com.laya.game.game.init;

import com.laya.game.game.guide.GuideService;
import org.springframework.stereotype.Component;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class GuideInitDataProvider implements GameInitDataProvider {
    private final GuideService guideService;

    public GuideInitDataProvider(GuideService guideService) {
        this.guideService = guideService;
    }

    @Override
    public String sectionName() {
        return "guide";
    }

    @Override
    public Object build(GamePlayerContext context) {
        Map<String, Object> section = new LinkedHashMap<>();
        section.put("availableIds", guideService.getAvailableGuideIds(context.player()));
        section.put("progress", guideService.getProgress(context.playerId()));
        return section;
    }
}
