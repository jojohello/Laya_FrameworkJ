package com.laya.game.game.guide;

import com.laya.game.game.config.ConfigManager;
import com.laya.game.game.configStruct.GuideConfig;
import com.laya.game.game.player.PlayerRole;
import org.springframework.stereotype.Service;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class GuideService {
    private final ConfigManager configManager;
    private final GuideRepository repository;
    private final GuideConditionRegistry conditionRegistry;

    public GuideService(ConfigManager configManager, GuideRepository repository,
                        GuideConditionRegistry conditionRegistry) {
        this.configManager = configManager;
        this.repository = repository;
        this.conditionRegistry = conditionRegistry;
    }

    public List<GuideProgress> getProgress(long playerId) {
        return repository.findAll(playerId);
    }

    public List<Integer> getAvailableGuideIds(PlayerRole player) {
        List<GuideProgress> progress = repository.findAll(player.playerId());
        Set<Integer> completedIds = new HashSet<>();
        Set<Integer> inProgressIds = new HashSet<>();
        for (GuideProgress item : progress) {
            if (item.completed()) completedIds.add(item.guideId());
            else inProgressIds.add(item.guideId());
        }
        GuideConditionContext context = new GuideConditionContext(player.toInitData(), completedIds);
        return configManager.getAll(GuideConfig.class).stream()
                .filter(GuideConfig::getEnabled)
                .filter(config -> !completedIds.contains(config.getID()))
                .filter(config -> inProgressIds.contains(config.getID()) || conditionRegistry.matches(config, context))
                .sorted(Comparator.comparingInt(GuideConfig::getPriority).reversed()
                        .thenComparingInt(GuideConfig::getID))
                .map(GuideConfig::getID)
                .toList();
    }

    public GuideProgress reportProgress(PlayerRole player, int guideId, String status, int stepId, int version) {
        GuideConfig config = configManager.get(GuideConfig.class, guideId);
        if (config == null || !config.getEnabled() || config.getVersion() != version) return null;
        if (!"inProgress".equals(status) && !"completed".equals(status)) return null;

        GuideProgress current = repository.find(player.playerId(), guideId);
        if (current != null && current.completed()) return current;
        if (current == null) {
            if (!"inProgress".equals(status) || !getAvailableGuideIds(player).contains(guideId)) return null;
        } else if (stepId < current.currentStepId()) {
            return current;
        }
        return repository.save(player.playerId(), guideId, status, Math.max(0, stepId), version);
    }
}
