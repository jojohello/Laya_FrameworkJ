package com.laya.game.game.handler;

import com.laya.game.game.functionopen.FunctionOpenService;
import com.laya.game.game.player.PlayerInitData;
import com.laya.game.game.player.PlayerProgressService;
import com.laya.game.game.protocol.GameMessage;
import com.laya.game.game.protocol.MessageIds;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class PlayerLevelUpHandler implements MessageHandler {
    private final PlayerProgressService playerProgressService;
    private final FunctionOpenService functionOpenService;

    public PlayerLevelUpHandler(PlayerProgressService playerProgressService, FunctionOpenService functionOpenService) {
        this.playerProgressService = playerProgressService;
        this.functionOpenService = functionOpenService;
    }

    @Override
    public Short getMessageId() { return MessageIds.PLAYER_LEVEL_UP_REQUEST; }

    @Override
    public void handle(GameMessage message, MessageContext context) {
        String userId = context.getUserId() != null ? context.getUserId() : message.getUserId();
        if (userId == null || userId.isBlank()) return;
        Long playerId = context.getPlayerId();
        if (playerId == null) {
            sendError(context, "player_not_selected");
            return;
        }
        PlayerProgressService.LevelUpResult result = playerProgressService.levelUpFromOne(playerId);
        PlayerInitData player = result.player();
        GameMessage response = new GameMessage();
        response.setMsgId(MessageIds.PLAYER_LEVEL_UP_RESPONSE);
        response.setUserId(userId);
        response.setData(player == null ? Map.of("success", false, "reason", "level_not_one")
                : Map.of("success", true, "player", player));
        context.sendResponse(response);
        if (result.battleFunctionOpened()) {
            functionOpenService.sendOpenedPush(userId, 1001, context);
        }
    }

    private void sendError(MessageContext context, String reason) {
        GameMessage response = new GameMessage();
        response.setMsgId(MessageIds.ERROR);
        response.setData(Map.of("reason", reason));
        context.sendResponse(response);
    }
}
