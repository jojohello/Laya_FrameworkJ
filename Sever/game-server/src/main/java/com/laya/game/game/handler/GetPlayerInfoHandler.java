package com.laya.game.game.handler;

import com.laya.game.game.player.PlayerRepository;
import com.laya.game.game.player.PlayerRole;
import com.laya.game.game.protocol.GameMessage;
import com.laya.game.game.protocol.MessageIds;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class GetPlayerInfoHandler implements MessageHandler {
    private final PlayerRepository playerRepository;

    public GetPlayerInfoHandler(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    @Override
    public Short getMessageId() {
        return MessageIds.GET_PLAYER_INFO;
    }

    @Override
    public void handle(GameMessage message, MessageContext context) {
        String userId = context.getUserId() != null ? context.getUserId() : message.getUserId();
        if (userId == null || userId.isBlank()) {
            sendError(context, "account_not_authenticated");
            return;
        }
        Long playerId = context.getPlayerId();
        PlayerRole player = playerId == null ? null : playerRepository.find(playerId);
        if (player == null || !userId.equals(player.userId())) {
            sendError(context, "player_not_selected");
            return;
        }
        GameMessage response = new GameMessage();
        response.setMsgId(MessageIds.PLAYER_INFO);
        response.setUserId(userId);
        response.setData(Map.of("player", player.toInitData()));
        context.sendResponse(response);
    }

    private void sendError(MessageContext context, String reason) {
        GameMessage response = new GameMessage();
        response.setMsgId(MessageIds.ERROR);
        response.setData(Map.of("reason", reason));
        context.sendResponse(response);
    }
}
