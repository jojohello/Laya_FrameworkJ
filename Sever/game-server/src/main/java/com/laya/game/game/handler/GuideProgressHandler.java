package com.laya.game.game.handler;

import com.laya.game.game.guide.GuideProgress;
import com.laya.game.game.guide.GuideService;
import com.laya.game.game.player.PlayerRepository;
import com.laya.game.game.player.PlayerRole;
import com.laya.game.game.protocol.GameMessage;
import com.laya.game.game.protocol.MessageIds;
import org.springframework.stereotype.Component;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class GuideProgressHandler implements MessageHandler {
    private final GuideService guideService;
    private final PlayerRepository playerRepository;

    public GuideProgressHandler(GuideService guideService, PlayerRepository playerRepository) {
        this.guideService = guideService;
        this.playerRepository = playerRepository;
    }

    @Override
    public Short getMessageId() {
        return MessageIds.GUIDE_PROGRESS_REQUEST;
    }

    @Override
    public void handle(GameMessage message, MessageContext context) {
        String userId = context.getUserId() != null ? context.getUserId() : message.getUserId();
        if (userId == null || userId.isBlank()) return;
        Object rawData = message.getData();
        Map<?, ?> data = rawData instanceof Map<?, ?> map ? map : Map.of();
        int guideId = number(data, "guideId");
        int stepId = number(data, "stepId");
        int version = number(data, "version");
        Object statusValue = data.get("status");
        String status = statusValue == null ? "" : String.valueOf(statusValue);
        Long playerId = context.getPlayerId();
        PlayerRole player = playerId == null ? null : playerRepository.find(playerId);
        if (player == null || !userId.equals(player.userId())) {
            sendError(context, "player_not_selected");
            return;
        }
        GuideProgress progress = guideService.reportProgress(player, guideId, status, stepId, version);

        Map<String, Object> responseData = new LinkedHashMap<>();
        responseData.put("success", progress != null);
        responseData.put("guideId", guideId);
        if (progress != null) responseData.put("progress", progress);
        else responseData.put("reason", "guide_progress_rejected");

        GameMessage response = new GameMessage();
        response.setMsgId(MessageIds.GUIDE_PROGRESS_RESPONSE);
        response.setUserId(userId);
        response.setData(responseData);
        context.sendResponse(response);
    }

    private int number(Map<?, ?> data, String key) {
        Object value = data.get(key);
        return value instanceof Number number ? number.intValue() : 0;
    }

    private void sendError(MessageContext context, String reason) {
        GameMessage response = new GameMessage();
        response.setMsgId(MessageIds.ERROR);
        response.setData(Map.of("reason", reason));
        context.sendResponse(response);
    }
}
