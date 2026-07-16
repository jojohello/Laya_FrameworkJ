package com.laya.game.game.guide;

import com.laya.game.game.configStruct.GuideConfig;
import org.springframework.stereotype.Component;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class GuideConditionRegistry {
    private final Map<String, GuideCondition> conditions = new HashMap<>();

    public GuideConditionRegistry(List<GuideCondition> conditionList) {
        for (GuideCondition condition : conditionList) {
            GuideCondition old = conditions.put(condition.type(), condition);
            if (old != null) {
                throw new IllegalStateException("Duplicate Guide condition: " + condition.type());
            }
        }
    }

    public boolean matches(GuideConfig config, GuideConditionContext context) {
        GuideCondition condition = conditions.get(config.getTriggerType());
        return condition != null && condition.matches(config, context);
    }
}
