package com.laya.game.game.session;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Game Server 内的已选角色会话。
 *
 * Gateway 提供可信的 userId/sessionId，Game Server 在登录阶段解析并选择 playerId。
 * 后续业务消息只能使用这里绑定的 playerId，不能接受客户端直接指定角色。
 */
@Component
public class GameSessionRegistry {
    private final Map<String, GameSessionIdentity> bySessionId = new ConcurrentHashMap<>();
    private final Map<String, String> sessionIdByUserId = new ConcurrentHashMap<>();

    public void bind(String sessionId, String userId, long playerId) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new IllegalArgumentException("sessionId is required");
        }
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }
        String previousSessionId = sessionIdByUserId.put(userId, sessionId);
        if (previousSessionId != null && !previousSessionId.equals(sessionId)) {
            bySessionId.remove(previousSessionId);
        }
        bySessionId.put(sessionId, new GameSessionIdentity(sessionId, userId, playerId));
    }

    public Long findPlayerId(String sessionId, String userId) {
        if (sessionId == null || sessionId.isBlank()) return null;
        GameSessionIdentity identity = bySessionId.get(sessionId);
        if (identity == null) return null;
        if (userId != null && !userId.equals(identity.userId())) return null;
        return identity.playerId();
    }

    public void remove(String sessionId) {
        if (sessionId == null) return;
        GameSessionIdentity removed = bySessionId.remove(sessionId);
        if (removed != null) {
            sessionIdByUserId.remove(removed.userId(), sessionId);
        }
    }

    record GameSessionIdentity(String sessionId, String userId, long playerId) {}
}
