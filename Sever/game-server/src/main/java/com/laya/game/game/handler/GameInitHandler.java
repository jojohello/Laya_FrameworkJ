package com.laya.game.game.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.laya.game.game.init.GameInitDataProvider;
import com.laya.game.game.init.GamePlayerContext;
import com.laya.game.game.player.PlayerRepository;
import com.laya.game.game.player.PlayerRole;
import com.laya.game.game.protocol.GameMessage;
import com.laya.game.game.protocol.MessageIds;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class GameInitHandler implements MessageHandler {
    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(GameInitHandler.class);
    private final List<GameInitDataProvider> providers;
    private final ObjectMapper objectMapper;
    private final int maxPayloadBytes;
    private final PlayerRepository playerRepository;

    public GameInitHandler(List<GameInitDataProvider> providers, ObjectMapper objectMapper,
                           @Value("${laya.game.init.max-payload-bytes:262144}") int maxPayloadBytes,
                           PlayerRepository playerRepository) {
        this.providers = providers;
        this.objectMapper = objectMapper;
        this.maxPayloadBytes = maxPayloadBytes;
        this.playerRepository = playerRepository;
    }

    @Override
    public Short getMessageId() { return MessageIds.GAME_INIT_REQUEST; }

    @Override
    public void handle(GameMessage message, MessageContext context) {
        String userId = context.getUserId() != null ? context.getUserId() : message.getUserId();
        if (userId == null || userId.isBlank()) return;

        Long playerId = context.getPlayerId();
        if (playerId == null) {
            sendError(context, "player_not_selected");
            return;
        }
        PlayerRole player = playerRepository.find(playerId);
        if (player == null || !userId.equals(player.userId())) {
            sendError(context, "selected_player_not_found");
            return;
        }
        GamePlayerContext playerContext = new GamePlayerContext(userId, player);
        Map<String, Object> sections = new LinkedHashMap<>();
        List<String> errors = new ArrayList<>();
        for (GameInitDataProvider provider : providers) {
            try {
                sections.put(provider.sectionName(), provider.build(playerContext));
            } catch (RuntimeException e) {
                errors.add(provider.sectionName());
                log.error("[GAME_INIT] Failed to build section: userId={}, playerId={}, section={}",
                        userId, player.playerId(), provider.sectionName(), e);
            }
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("snapshotVersion", System.currentTimeMillis());
        data.put("sections", sections);
        if (!errors.isEmpty()) data.put("errors", errors);
        try {
            int bytes = objectMapper.writeValueAsString(data).getBytes(StandardCharsets.UTF_8).length;
            if (bytes > maxPayloadBytes) {
                data.put("sections", Map.of());
                data.put("errors", List.of("payload_too_large"));
                log.warn("[GAME_INIT] Snapshot rejected because it is too large: userId={}, playerId={}, bytes={}, limit={}",
                        userId, player.playerId(), bytes, maxPayloadBytes);
            } else {
                log.info("[GAME_INIT] Snapshot ready: userId={}, playerId={}, sections={}, errors={}, bytes={}",
                        userId, player.playerId(), sections.keySet(), errors, bytes);
            }
        } catch (Exception e) {
            data.put("sections", Map.of());
            data.put("errors", List.of("serialization_failed"));
            log.error("[GAME_INIT] Snapshot serialization preflight failed: userId={}, playerId={}",
                    userId, player.playerId(), e);
        }
        GameMessage response = new GameMessage();
        response.setMsgId(MessageIds.GAME_INIT_RESPONSE);
        response.setUserId(userId);
        response.setData(data);
        context.sendResponse(response);
    }

    private void sendError(MessageContext context, String reason) {
        GameMessage response = new GameMessage();
        response.setMsgId(MessageIds.ERROR);
        response.setData(Map.of("reason", reason));
        context.sendResponse(response);
    }
}
