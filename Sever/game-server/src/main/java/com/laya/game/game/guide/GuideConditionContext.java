package com.laya.game.game.guide;

import com.laya.game.game.player.PlayerInitData;
import java.util.Set;

public record GuideConditionContext(PlayerInitData player, Set<Integer> completedGuideIds) {
}
