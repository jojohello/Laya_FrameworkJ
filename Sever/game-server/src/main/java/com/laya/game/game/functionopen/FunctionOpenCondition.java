package com.laya.game.game.functionopen;

import com.laya.game.game.configStruct.FunctionOpenConfig;
import java.util.Map;

public interface FunctionOpenCondition {
    boolean matches(FunctionOpenConfig config, Map<String, Object> eventData);
}
