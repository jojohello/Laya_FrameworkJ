package com.laya.game.game.player;

import com.laya.game.game.functionopen.FunctionOpenService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class PlayerProgressService {
    private static final int BATTLE_FUNCTION_ID = 1001;

    private final PlayerRepository playerRepository;
    private final FunctionOpenService functionOpenService;

    public PlayerProgressService(PlayerRepository playerRepository, FunctionOpenService functionOpenService) {
        this.playerRepository = playerRepository;
        this.functionOpenService = functionOpenService;
    }

    @Transactional
    public LevelUpResult levelUpFromOne(long playerId) {
        PlayerInitData player = playerRepository.levelUpFromOne(playerId);
        if (player == null) return new LevelUpResult(null, false);
        boolean functionOpened = functionOpenService.evaluateAndOpen(
                playerId, BATTLE_FUNCTION_ID, Map.of("testEvent", "open"));
        return new LevelUpResult(player, functionOpened);
    }

    public record LevelUpResult(PlayerInitData player, boolean battleFunctionOpened) {
        public boolean success() {
            return player != null;
        }
    }
}
