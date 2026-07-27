package com.laya.game.game.handler;

import com.laya.game.game.battle.BattleSettlementService;
import com.laya.game.game.protocol.GameMessage;
import com.laya.game.game.protocol.MessageIds;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class BattleEnterHandler implements MessageHandler {
    private final BattleSettlementService settlementService;

    public BattleEnterHandler(BattleSettlementService settlementService) {
        this.settlementService = settlementService;
    }

    @Override public Short getMessageId() { return MessageIds.BATTLE_ENTER_REQUEST; }

    @Override
    public void handle(GameMessage message, MessageContext context) {
        Long playerId = context.getPlayerId();
        if (playerId == null) { send(context, Map.of("success", false, "reason", "player_not_selected")); return; }
        int stageId = readPositiveInt(message.getData(), "stageId");
        BattleSettlementService.EnterResult result = settlementService.enter(playerId, stageId);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("success", result.success());
        payload.put("stageId", result.stageId());
        if (result.battleSessionId() != null) payload.put("battleSessionId", result.battleSessionId());
        if (result.reason() != null) payload.put("reason", result.reason());
        send(context, payload);
    }

    private int readPositiveInt(Object data, String field) {
        if (!(data instanceof Map<?, ?> map)) return 0;
        Object value = map.get(field);
        if (value instanceof Number number) return Math.max(0, number.intValue());
        try { return Math.max(0, Integer.parseInt(String.valueOf(value))); } catch (Exception ignored) { return 0; }
    }

    private void send(MessageContext context, Map<String, Object> data) {
        GameMessage response = new GameMessage();
        response.setMsgId(MessageIds.BATTLE_ENTER_RESPONSE);
        response.setData(data);
        context.sendResponse(response);
    }
}
