package com.laya.game.game.guide;

import com.laya.game.game.configStruct.GuideConfig;
import org.springframework.stereotype.Component;

@Component
public class PlayerLevelEqualsGuideCondition implements GuideCondition {
    @Override
    public String type() {
        return "playerLevelEquals";
    }

    @Override
    public boolean matches(GuideConfig config, GuideConditionContext context) {
        if (context.player() == null) return false;
        try {
            return context.player().level() == Integer.parseInt(config.getTriggerArgs());
        } catch (NumberFormatException ignored) {
            return false;
        }
    }
}
