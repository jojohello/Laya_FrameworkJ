package com.laya.game.game.functionopen;

import com.laya.game.game.configStruct.FunctionOpenConfig;
import java.util.Map;

public class SimpleFunctionOpenCondition implements FunctionOpenCondition {
    @Override
    public boolean matches(FunctionOpenConfig config, Map<String, Object> eventData) {
        if (config.getConditionType() == null || config.getConditionType().isBlank()) return true;
        if (eventData == null) return false;
        Object value = eventData.get(config.getConditionType());
        return value != null && String.valueOf(value).equals(config.getConditionValue());
    }
}
