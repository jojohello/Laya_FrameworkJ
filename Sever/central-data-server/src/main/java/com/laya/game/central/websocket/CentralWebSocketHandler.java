package com.laya.game.central.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.laya.game.central.model.GatewayAllocation;
import com.laya.game.central.model.UserSession;
import com.laya.game.central.service.GatewayService;
import com.laya.game.central.service.SessionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 中心数据服务器WebSocket处理器
 *
 * 处理WebSocket连接、消息传递和实时通信
 * 支持用户认证、心跳检测、消息广播等功能
 *
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@Component
public class CentralWebSocketHandler implements WebSocketHandler {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(CentralWebSocketHandler.class);
    private final SessionService sessionService;
    private final GatewayService gatewayService;
    private final ObjectMapper objectMapper;
    @Value("${laya.central.websocket.heartbeat-interval:30000}")
    private long heartbeatInterval;
    @Value("${laya.central.websocket.max-connections:10000}")
    private int maxConnections;
    // 存储WebSocket会话信息
    private final Map<String, WebSocketSessionInfo> sessions = new ConcurrentHashMap<>();
    // 用户ID到WebSocket会话ID的映射
    private final Map<String, String> userToSessionMap = new ConcurrentHashMap<>();
    // 心跳检测调度器
    private final ScheduledExecutorService heartbeatScheduler = Executors.newScheduledThreadPool(2);

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) throws Exception {
        String sessionId = session.getId();
        log.info("WebSocket connection established: {}", sessionId);
        // 检查连接数限制
        if (sessions.size() >= maxConnections) {
            log.warn("Maximum connections reached, closing new connection: {}", sessionId);
            session.close(CloseStatus.POLICY_VIOLATION.withReason("Maximum connections reached"));
            return;
        }
        // 创建会话信息
        WebSocketSessionInfo sessionInfo = new WebSocketSessionInfo(session, LocalDateTime.now(), null,  // 用户ID待认证后设置
        false // 未认证
        );
        sessions.put(sessionId, sessionInfo);
        // 发送欢迎消息
        sendMessage(session, new WebSocketMessage("WELCOME", "Connected to Laya Central Data Server", Map.of("sessionId", sessionId, "timestamp", System.currentTimeMillis(), "heartbeatInterval", heartbeatInterval)));
        // 启动心跳检测
        startHeartbeatCheck(sessionId);
    }

    @Override
    public void handleMessage(@NonNull WebSocketSession session, @NonNull org.springframework.web.socket.WebSocketMessage<?> message) throws Exception {
        String sessionId = session.getId();
        WebSocketSessionInfo sessionInfo = sessions.get(sessionId);
        if (sessionInfo == null) {
            log.warn("Received message from unknown session: {}", sessionId);
            return;
        }
        // 更新最后活跃时间
        sessionInfo.setLastActiveTime(LocalDateTime.now());
        try {
            // 解析消息
            String payload = message.getPayload().toString();
            WebSocketMessage incomingMessage = objectMapper.readValue(payload, WebSocketMessage.class);
            log.debug("Received WebSocket message: type={}, from={}", incomingMessage.getType(), sessionId);
            // 处理不同类型的消息
            switch (incomingMessage.getType()) {
            case "AUTH":
                handleAuthMessage(session, sessionInfo, incomingMessage);
                break;
            case "HEARTBEAT":
                handleHeartbeatMessage(session, sessionInfo, incomingMessage);
                break;
            case "USER_STATUS":
                handleUserStatusMessage(session, sessionInfo, incomingMessage);
                break;
            case "GATEWAY_REQUEST":
                handleGatewayRequestMessage(session, sessionInfo, incomingMessage);
                break;
            case "ACCOUNT_VERIFICATION":
                handleAccountVerificationMessage(session, sessionInfo, incomingMessage);
                break;
            default:
                log.warn("Unknown message type: {} from session: {}", incomingMessage.getType(), sessionId);
                sendErrorMessage(session, "Unknown message type: " + incomingMessage.getType());
            }
        } catch (Exception e) {
            log.error("Error handling WebSocket message from {}: {}", sessionId, e.getMessage(), e);
            sendErrorMessage(session, "Message processing error: " + e.getMessage());
        }
    }

    @Override
    public void handleTransportError(@NonNull WebSocketSession session, @NonNull Throwable exception) throws Exception {
        String sessionId = session.getId();
        log.error("WebSocket transport error for session {}: {}", sessionId, exception.getMessage(), exception);
        // 清理会话
        cleanupSession(sessionId);
    }

    @Override
    public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus closeStatus) throws Exception {
        String sessionId = session.getId();
        log.info("WebSocket connection closed: {}, status: {}", sessionId, closeStatus);
        // 清理会话
        cleanupSession(sessionId);
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    /**
     * 处理认证消息
     */
    @SuppressWarnings("unchecked")
    private void handleAuthMessage(WebSocketSession session, WebSocketSessionInfo sessionInfo, WebSocketMessage message) {
        try {
            Map<String, Object> data = (Map<String, Object>) message.getData();
            String userId = data.get("userId").toString();
            Long loginTimestamp = Long.valueOf(data.get("loginTimestamp").toString());
            String token = data.get("token").toString();
            // 验证三要素
            Optional<UserSession> userSessionOpt = sessionService.validateThreeFactors(userId, loginTimestamp, token);
            if (userSessionOpt.isPresent()) {
                // 认证成功
                sessionInfo.setUserId(userId);
                sessionInfo.setAuthenticated(true);
                // 更新用户到会话的映射
                String oldSessionId = userToSessionMap.put(userId, session.getId());
                if (oldSessionId != null && !oldSessionId.equals(session.getId())) {
                    // 如果用户已有其他WebSocket连接，关闭旧连接
                    WebSocketSessionInfo oldSessionInfo = sessions.get(oldSessionId);
                    if (oldSessionInfo != null) {
                        try {
                            oldSessionInfo.getSession().close(CloseStatus.NORMAL.withReason("New connection established"));
                        } catch (Exception e) {
                            log.warn("Failed to close old WebSocket session: {}", oldSessionId);
                        }
                    }
                }
                // 发送认证成功消息
                sendMessage(session, new WebSocketMessage("AUTH_SUCCESS", "Authentication successful", Map.of("userId", userId, "timestamp", System.currentTimeMillis())));
                log.info("User {} authenticated via WebSocket session: {}", userId, session.getId());
            } else {
                // 认证失败
                sendMessage(session, new WebSocketMessage("AUTH_FAILED", "Authentication failed", Map.of("timestamp", System.currentTimeMillis())));
                log.warn("Authentication failed for WebSocket session: {}", session.getId());
            }
        } catch (Exception e) {
            log.error("Error processing auth message: {}", e.getMessage(), e);
            sendErrorMessage(session, "Authentication error");
        }
    }

    /**
     * 处理心跳消息
     */
    private void handleHeartbeatMessage(WebSocketSession session, WebSocketSessionInfo sessionInfo, WebSocketMessage message) {
        // 发送心跳响应
        sendMessage(session, new WebSocketMessage("HEARTBEAT_RESPONSE", "pong", Map.of("timestamp", System.currentTimeMillis())));
        // 如果用户已认证，更新会话活跃时间
        if (sessionInfo.isAuthenticated() && sessionInfo.getUserId() != null) {
            try {
                sessionService.updateLastActiveTime(sessionInfo.getUserId());
            } catch (Exception e) {
                log.warn("Failed to update session active time for user {}: {}", sessionInfo.getUserId(), e.getMessage());
            }
        }
    }

    /**
     * 处理用户状态消息
     */
    private void handleUserStatusMessage(WebSocketSession session, WebSocketSessionInfo sessionInfo, WebSocketMessage message) {
        if (!sessionInfo.isAuthenticated()) {
            sendErrorMessage(session, "Authentication required");
            return;
        }
        // 广播用户状态变化给相关用户
        // 这里可以根据业务需求实现具体的状态广播逻辑
        log.debug("User status message from user {}: {}", sessionInfo.getUserId(), message.getData());
    }

    /**
     * 处理网关请求消息
     */
    private void handleGatewayRequestMessage(WebSocketSession session, WebSocketSessionInfo sessionInfo, WebSocketMessage message) {
        if (!sessionInfo.isAuthenticated()) {
            sendErrorMessage(session, "Authentication required");
            return;
        }
        // 处理网关分配请求
        // 这里可以与GatewayService集成，实现实时的网关分配
        log.debug("Gateway request from user {}: {}", sessionInfo.getUserId(), message.getData());
    }

    /**
     * 处理账号验证消息
     */
    @SuppressWarnings("unchecked")
    private void handleAccountVerificationMessage(WebSocketSession session, WebSocketSessionInfo sessionInfo, WebSocketMessage message) {
        if (!sessionInfo.isAuthenticated()) {
            sendErrorMessage(session, "Authentication required");
            return;
        }
        try {
            Map<String, Object> data = (Map<String, Object>) message.getData();
            String userId = data.get("userId").toString();
            log.info("Processing account verification for user {}: {}", userId, data);
            // [HOT] 补充：调用网关分配逻辑
            Optional<GatewayAllocation> allocationOpt = gatewayService.allocateGateway(userId, null, null);
            if (allocationOpt.isPresent()) {
                GatewayAllocation allocation = allocationOpt.get();
                log.info("Gateway allocated for user {}: {}:{}", userId, allocation.getGatewayIp(), allocation.getGatewayPort());
                // 发送分配结果给Login Server
                sendMessage(session, new WebSocketMessage("ACCOUNT_VERIFICATION_ACK", "Account verification and gateway allocation completed", Map.of("timestamp", System.currentTimeMillis(), "status", "success", "userId", userId, "gatewayInfo", Map.of("gatewayIp", allocation.getGatewayIp(), "gatewayPort", allocation.getGatewayPort(), "gatewayWsUrl", "ws://" + allocation.getGatewayIp() + ":" + allocation.getGatewayPort() + "/ws", "status", allocation.getStatus().toString()))));
            } else {
                log.error("Gateway allocation failed for user: {}", userId);
                sendMessage(session, new WebSocketMessage("ACCOUNT_VERIFICATION_FAILED", "Gateway allocation failed", Map.of("timestamp", System.currentTimeMillis(), "status", "failed", "userId", userId, "reason", "No available gateway servers")));
            }
        } catch (Exception e) {
            log.error("Account verification processing error: {}", e.getMessage(), e);
            sendErrorMessage(session, "Account verification failed: " + e.getMessage());
        }
    }

    /**
     * 发送消息到WebSocket客户端
     */
    private void sendMessage(WebSocketSession session, WebSocketMessage message) {
        try {
            if (session.isOpen()) {
                String json = objectMapper.writeValueAsString(message);
                session.sendMessage(new TextMessage(json));
            }
        } catch (IOException e) {
            log.error("Failed to send WebSocket message: {}", e.getMessage(), e);
        }
    }

    /**
     * 发送错误消息
     */
    private void sendErrorMessage(WebSocketSession session, String error) {
        sendMessage(session, new WebSocketMessage("ERROR", error, Map.of("timestamp", System.currentTimeMillis())));
    }

    /**
     * 启动心跳检测
     */
    private void startHeartbeatCheck(String sessionId) {
        heartbeatScheduler.scheduleAtFixedRate(() -> {
            WebSocketSessionInfo sessionInfo = sessions.get(sessionId);
            if (sessionInfo == null) {
                return; // 会话已清理
            }
            WebSocketSession session = sessionInfo.getSession();
            if (!session.isOpen()) {
                cleanupSession(sessionId);
                return;
            }
            // 检查是否超时
            LocalDateTime lastActive = sessionInfo.getLastActiveTime();
            if (lastActive.plusSeconds(heartbeatInterval / 1000 * 2).isBefore(LocalDateTime.now())) {
                log.warn("WebSocket session {} timed out, closing connection", sessionId);
                try {
                    session.close(CloseStatus.GOING_AWAY.withReason("Heartbeat timeout"));
                } catch (Exception e) {
                    log.error("Failed to close timed out session: {}", sessionId, e);
                }
                cleanupSession(sessionId);
            }
        }, heartbeatInterval, heartbeatInterval, TimeUnit.MILLISECONDS);
    }

    /**
     * 清理会话
     */
    private void cleanupSession(String sessionId) {
        WebSocketSessionInfo sessionInfo = sessions.remove(sessionId);
        if (sessionInfo != null && sessionInfo.getUserId() != null) {
            userToSessionMap.remove(sessionInfo.getUserId());
            log.info("Cleaned up WebSocket session for user {}: {}", sessionInfo.getUserId(), sessionId);
        }
    }

    /**
     * 向指定用户发送消息
     */
    public boolean sendMessageToUser(String userId, WebSocketMessage message) {
        String sessionId = userToSessionMap.get(userId);
        if (sessionId == null) {
            return false;
        }
        WebSocketSessionInfo sessionInfo = sessions.get(sessionId);
        if (sessionInfo == null || !sessionInfo.getSession().isOpen()) {
            userToSessionMap.remove(userId);
            return false;
        }
        sendMessage(sessionInfo.getSession(), message);
        return true;
    }

    /**
     * 广播消息给所有已认证用户
     */
    public void broadcastToAuthenticatedUsers(WebSocketMessage message) {
        sessions.values().stream().filter(WebSocketSessionInfo::isAuthenticated).filter(info -> info.getSession().isOpen()).forEach(info -> sendMessage(info.getSession(), message));
    }

    /**
     * 获取在线用户数
     */
    public int getOnlineUserCount() {
        return (int) sessions.values().stream().filter(WebSocketSessionInfo::isAuthenticated).count();
    }

    /**
     * 获取总连接数
     */
    public int getTotalConnectionCount() {
        return sessions.size();
    }

    /**
     * 清理资源，避免内存泄露
     */
    @PreDestroy
    public void destroy() {
        try {
            log.info("Shutting down WebSocket handler and cleaning up resources...");
            // 关闭所有WebSocket连接
            sessions.values().forEach(sessionInfo -> {
                try {
                    if (sessionInfo.getSession().isOpen()) {
                        sessionInfo.getSession().close(CloseStatus.GOING_AWAY.withReason("Server shutdown"));
                    }
                } catch (Exception e) {
                    log.warn("Error closing WebSocket session during shutdown: {}", e.getMessage());
                }
            });
            // 清理映射
            sessions.clear();
            userToSessionMap.clear();
            // 关闭线程池
            heartbeatScheduler.shutdown();
            try {
                if (!heartbeatScheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                    log.warn("Heartbeat scheduler did not terminate gracefully, forcing shutdown");
                    heartbeatScheduler.shutdownNow();
                }
            } catch (InterruptedException e) {
                log.warn("Interrupted while waiting for heartbeat scheduler to terminate");
                heartbeatScheduler.shutdownNow();
                Thread.currentThread().interrupt();
            }
            log.info("WebSocket handler cleanup completed");
        } catch (Exception e) {
            log.error("Error during WebSocket handler cleanup: {}", e.getMessage(), e);
        }
    }


    /**
     * WebSocket会话信息
     */
    private static class WebSocketSessionInfo {
        private final WebSocketSession session;
        private LocalDateTime lastActiveTime;
        private String userId;
        private boolean authenticated;

        public WebSocketSessionInfo(WebSocketSession session, LocalDateTime lastActiveTime, String userId, boolean authenticated) {
            this.session = session;
            this.lastActiveTime = lastActiveTime;
            this.userId = userId;
            this.authenticated = authenticated;
        }

        // Getters and Setters
        public WebSocketSession getSession() {
            return session;
        }

        public LocalDateTime getLastActiveTime() {
            return lastActiveTime;
        }

        public void setLastActiveTime(LocalDateTime lastActiveTime) {
            this.lastActiveTime = lastActiveTime;
        }

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public boolean isAuthenticated() {
            return authenticated;
        }

        public void setAuthenticated(boolean authenticated) {
            this.authenticated = authenticated;
        }
    }


    /**
     * WebSocket消息类
     */
    public static class WebSocketMessage {
        private String type;
        private String message;
        private Object data;

        public WebSocketMessage() {
        }

        public WebSocketMessage(String type, String message, Object data) {
            this.type = type;
            this.message = message;
            this.data = data;
        }

        // Getters and Setters
        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public Object getData() {
            return data;
        }

        public void setData(Object data) {
            this.data = data;
        }
    }

    @java.lang.SuppressWarnings("all")
    public CentralWebSocketHandler(final SessionService sessionService, final GatewayService gatewayService, final ObjectMapper objectMapper) {
        this.sessionService = sessionService;
        this.gatewayService = gatewayService;
        this.objectMapper = objectMapper;
    }
}
