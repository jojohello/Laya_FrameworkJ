package com.laya.game.game.handler;

import com.laya.game.game.functionopen.FunctionOpenService;
import com.laya.game.game.player.PlayerInitData;
import com.laya.game.game.player.PlayerRepository;
import com.laya.game.game.player.PlayerRole;
import com.laya.game.game.protocol.GameMessage;
import com.laya.game.game.protocol.MessageIds;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class PlayerLevelUpHandler implements MessageHandler {
    private final PlayerRepository playerRepository;
    private final FunctionOpenService functionOpenService;

    public PlayerLevelUpHandler(PlayerRepository playerRepository, FunctionOpenService functionOpenService) {
        this.playerRepository = playerRepository;
        this.functionOpenService = functionOpenService;
    }

    @Override
    public Short getMessageId() { return MessageIds.PLAYER_LEVEL_UP_REQUEST; }

    @Override
    public void handle(GameMessage message, MessageContext context) {
        String userId = context.getUserId() != null ? context.getUserId() : message.getUserId();
        if (userId == null || userId.isBlank()) return;
        PlayerRole selectedPlayer = playerRepository.resolveOrCreate(userId);
        PlayerInitData player = playerRepository.levelUpFromOne(selectedPlayer.playerId());
        GameMessage response = new GameMessage();
        response.setMsgId(MessageIds.PLAYER_LEVEL_UP_RESPONSE);
        response.setUserId(userId);
        response.setData(player == null ? Map.of("success", false, "reason", "level_not_one")
                : Map.of("success", true, "player", player));
        context.sendResponse(response);
        if (player != null) {
            functionOpenService.evaluateAndOpen(userId, selectedPlayer.playerId(), 1001, Map.of("testEvent", "open"), context);
        }
    }
}
