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
    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(GuideService.class);
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
        Set<Integer> activatedIds = new HashSet<>();
        for (GuideProgress item : progress) {
            if (item.completed()) completedIds.add(item.guideId());
            else activatedIds.add(item.guideId());
        }
        GuideConditionContext context = new GuideConditionContext(player.toInitData(), completedIds);
        List<GuideConfig> newlyActivated = configManager.getAll(GuideConfig.class).stream()
                .filter(GuideConfig::getEnabled)
                .filter(config -> !completedIds.contains(config.getID()))
                .filter(config -> !activatedIds.contains(config.getID()))
                .filter(config -> conditionRegistry.matches(config, context))
                .sorted(Comparator.comparingInt(GuideConfig::getPriority).reversed()
                        .thenComparingInt(GuideConfig::getID))
                .toList();
        long activationOrder = System.currentTimeMillis() * 1000L;
        for (int i = 0; i < newlyActivated.size(); i++) {
            GuideConfig config = newlyActivated.get(i);
            repository.enqueueIfAbsent(player.playerId(), config.getID(), config.getVersion(), activationOrder + i);
            log.info("[GUIDE] Activated and queued: playerId={}, guideId={}, triggerType={}, version={}",
                    player.playerId(), config.getID(), config.getTriggerType(), config.getVersion());
        }
        List<Integer> queue = repository.findQueuedIds(player.playerId());
        log.info("[GUIDE] Queue snapshot: playerId={}, newlyActivated={}, availableIds={}",
                player.playerId(),
                newlyActivated.stream().map(GuideConfig::getID).toList(),
                queue);
        return queue;
    }

    public GuideProgress reportProgress(PlayerRole player, int guideId, String status, int stepId, int version) {
        GuideConfig config = configManager.get(GuideConfig.class, guideId);
        if (config == null || !config.getEnabled() || config.getVersion() != version) return null;
        if (!"inProgress".equals(status) && !"completed".equals(status)) return null;

        GuideProgress current = repository.find(player.playerId(), guideId);
        if (current != null && current.completed()) return current;
        if (current == null) {
            getAvailableGuideIds(player);
            current = repository.find(player.playerId(), guideId);
            if (current == null) return null;
        } else if (stepId < current.currentStepId()) {
            return current;
        }
        if ("queued".equals(current.status()) && !"inProgress".equals(status)) return null;
        List<Integer> queue = repository.findQueuedIds(player.playerId());
        if (queue.isEmpty() || queue.get(0) != guideId) return null;
        return repository.save(player.playerId(), guideId, status, Math.max(0, stepId), version);
    }
}
