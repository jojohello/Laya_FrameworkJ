package com.laya.game.game.handler;

import com.laya.game.game.functionopen.FunctionOpenService;
import com.laya.game.game.protocol.GameMessage;
import com.laya.game.game.protocol.MessageIds;
import com.laya.game.game.player.PlayerRepository;
import org.springframework.stereotype.Component;

@Component
public class FunctionOpenHandler implements MessageHandler {
    private final FunctionOpenService service;
    private final PlayerRepository playerRepository;

    public FunctionOpenHandler(FunctionOpenService service, PlayerRepository playerRepository) {
        this.service = service;
        this.playerRepository = playerRepository;
    }

    @Override
    public Short getMessageId() {
        return MessageIds.FUNCTION_OPEN_STATES;
    }

    @Override
    public void handle(GameMessage message, MessageContext context) {
        String userId = context.getUserId() != null ? context.getUserId() : message.getUserId();
        if (userId == null || userId.isBlank()) return;
        service.sendFullState(userId, playerRepository.resolveOrCreate(userId).playerId(), context);
    }
}
