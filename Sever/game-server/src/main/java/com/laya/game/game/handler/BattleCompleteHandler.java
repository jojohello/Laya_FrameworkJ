package com.laya.game.game.handler;

import com.laya.game.game.battle.BattleSettlementService;
import com.laya.game.game.protocol.GameMessage;
import com.laya.game.game.protocol.MessageIds;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class BattleCompleteHandler implements MessageHandler {
    private final BattleSettlementService settlementService;

    public BattleCompleteHandler(BattleSettlementService settlementService) {
        this.settlementService = settlementService;
    }

    @Override public Short getMessageId() { return MessageIds.BATTLE_COMPLETE_REQUEST; }

    @Override
    public void handle(GameMessage message, MessageContext context) {
        Long playerId = context.getPlayerId();
        if (playerId == null) { send(context, Map.of("success", false, "reason", "player_not_selected")); return; }
        Map<?, ?> data = message.getData() instanceof Map<?, ?> map ? map : Map.of();
        Object sessionValue = data.get("battleSessionId");
        String sessionId = sessionValue == null ? "" : String.valueOf(sessionValue);
        boolean victory = "victory".equals(String.valueOf(data.get("result")));
        BattleSettlementService.CompleteResult result = settlementService.complete(playerId, sessionId, victory);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("success", result.success());
        payload.put("victory", result.victory());
        payload.put("rewarded", result.rewarded());
        payload.put("rewards", result.rewards());
        if (result.wallet() != null) payload.put("wallet", result.wallet());
        if (result.reason() != null) payload.put("reason", result.reason());
        send(context, payload);
    }

    private void send(MessageContext context, Map<String, Object> data) {
        GameMessage response = new GameMessage();
        response.setMsgId(MessageIds.BATTLE_COMPLETE_RESPONSE);
        response.setData(data);
        context.sendResponse(response);
    }
}
