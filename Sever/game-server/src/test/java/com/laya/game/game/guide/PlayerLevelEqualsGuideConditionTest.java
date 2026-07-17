package com.laya.game.game.guide;

import com.laya.game.game.configStruct.GuideConfig;
import com.laya.game.game.player.PlayerInitData;
import org.junit.jupiter.api.Test;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PlayerLevelEqualsGuideConditionTest {
    private final PlayerLevelEqualsGuideCondition condition = new PlayerLevelEqualsGuideCondition();

    @Test
    void matchesConfiguredPlayerLevel() {
        assertTrue(condition.matches(config("1"), context(1)));
        assertFalse(condition.matches(config("1"), context(2)));
    }

    @Test
    void rejectsInvalidTriggerArgument() {
        assertFalse(condition.matches(config("invalid"), context(1)));
    }

    private GuideConfig config(String triggerArgs) {
        return new GuideConfig(1001, "playerLevelEquals", triggerArgs, 10001, 100, 1, true);
    }

    private GuideConditionContext context(int level) {
        return new GuideConditionContext(
                new PlayerInitData("player-test", "Player", level, "0", 100),
                Set.of());
    }
}
