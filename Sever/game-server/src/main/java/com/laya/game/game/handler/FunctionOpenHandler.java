package com.laya.game.game.handler;

import com.laya.game.game.functionopen.FunctionOpenService;
import com.laya.game.game.protocol.GameMessage;
import com.laya.game.game.protocol.MessageIds;
import org.springframework.stereotype.Component;

@Component
public class FunctionOpenHandler implements MessageHandler {
    private final FunctionOpenService service;
    public FunctionOpenHandler(FunctionOpenService service) {
        this.service = service;
    }

    @Override
    public Short getMessageId() {
        return MessageIds.FUNCTION_OPEN_STATES;
    }

    @Override
    public void handle(GameMessage message, MessageContext context) {
        String userId = context.getUserId() != null ? context.getUserId() : message.getUserId();
        if (userId == null || userId.isBlank()) return;
        Long playerId = context.getPlayerId();
        if (playerId == null) {
            GameMessage response = new GameMessage();
            response.setMsgId(MessageIds.ERROR);
            response.setData(java.util.Map.of("reason", "player_not_selected"));
            context.sendResponse(response);
            return;
        }
        service.sendFullState(userId, playerId, context);
    }
}
