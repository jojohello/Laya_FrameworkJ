package com.laya.game.game.guide;

import com.laya.game.game.configStruct.GuideConfig;

public interface GuideCondition {
    String type();
    boolean matches(GuideConfig config, GuideConditionContext context);
}
