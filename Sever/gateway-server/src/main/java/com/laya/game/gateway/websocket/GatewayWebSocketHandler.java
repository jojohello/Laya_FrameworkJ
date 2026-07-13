package com.laya.game.gateway.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.laya.game.gateway.gameserver.GameServerConnectionManager;
import com.laya.game.gateway.model.ClientSession;
import com.laya.game.gateway.protocol.MessageIds;
import com.laya.game.gateway.service.WaitingConnectionService;
import com.laya.game.gateway.service.CentralServerClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Gateway WebSocket处理器
 *
 * 处理客户端WebSocket连接、消息传递和会话管理
 * 实现等待连接验证、心跳检测、消息路由等功能
 *
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@Component
public class GatewayWebSocketHandler implements WebSocketHandler, GameServerConnectionManager.GameServerMessageForwarder {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GatewayWebSocketHandler.class);
    private final WaitingConnectionService waitingConnectionService;
    private final CentralServerClient centralServerClient;
    private final GameServerConnectionManager gameServerConnectionManager;
    private final ObjectMapper objectMapper;
    @Value("${laya.gateway.websocket.heartbeat-interval:30000}")
    private long heartbeatInterval;
    @Value("${laya.gateway.websocket.max-connections:10000}")
    private int maxConnections;
    @Value("${laya.gateway.websocket.connection-timeout:30000}")
    private long connectionTimeout;
    // 存储客户端会话信息
    private final Map<String, ClientSession> sessions = new ConcurrentHashMap<>();
    // 用户ID到会话ID的映射
    private final Map<String, String> userToSessionMap = new ConcurrentHashMap<>();
    // 心跳检测调度器
    private final ScheduledExecutorService heartbeatScheduler = Executors.newScheduledThreadPool(2);

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) throws Exception {
        String sessionId = session.getId();
        String remoteAddress = session.getRemoteAddress() != null ? session.getRemoteAddress().toString() : "unknown";
        log.info("Client WebSocket connection established: sessionId={}, remote={}", sessionId, remoteAddress);
        // 检查连接数限制
        if (sessions.size() >= maxConnections) {
            log.warn("Maximum connections reached ({}), closing new connection: {}", maxConnections, sessionId);
            session.close(CloseStatus.POLICY_VIOLATION.withReason("Maximum connections reached"));
            return;
        }
        // 创建客户端会话
        ClientSession clientSession = new ClientSession(sessionId, session, remoteAddress, LocalDateTime.now(), false,  // 未认证
        null // 用户ID待验证后设置
        );
        sessions.put(sessionId, clientSession);
        // 注意：客户端会在 AUTH 认证成功后收到 AUTH_SUCCESS 消息
        // 不需要发送额外的 WELCOME 消息
        // 启动心跳检测
        startHeartbeatCheck(sessionId);
    }

    @Override
    public void handleMessage(@NonNull WebSocketSession session, @NonNull org.springframework.web.socket.WebSocketMessage<?> message) throws Exception {
        String sessionId = session.getId();
        ClientSession clientSession = sessions.get(sessionId);
        if (clientSession == null) {
            log.warn("Received message from unknown session: {}", sessionId);
            return;
        }
        // 更新最后活跃时间
        clientSession.setLastActiveTime(LocalDateTime.now());
        try {
            // 解析消息
            String payload = message.getPayload().toString();
            WebSocketMessage incomingMessage = objectMapper.readValue(payload, WebSocketMessage.class);
            // 处理不同类型的消息（使用 msgId）
            Short msgId = incomingMessage.getMsgId();
            if (msgId == null) {
                log.warn("Message missing msgId from session: {}", sessionId);
                sendErrorMessage(session, "Message missing msgId");
                return;
            }
            // 根据 msgId 路由到不同的处理方法
            if (msgId == MessageIds.AUTH) {
                handleAuthMessage(session, clientSession, incomingMessage);
            } else if (msgId == MessageIds.HEARTBEAT) {
                handleHeartbeatMessage(session, clientSession, incomingMessage);
            } else if (msgId == MessageIds.LOGIN || msgId == MessageIds.GET_PLAYER_INFO) {
                // 业务消息：转发到Game Server
                handleBusinessMessage(session, clientSession, incomingMessage);
            } else {
                log.warn("Unknown message ID: {} ({}) from session: {}", msgId, MessageIds.getName(msgId), sessionId);
                sendErrorMessage(session, "Unknown message ID: " + msgId);
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
        log.info("Client WebSocket connection closed: sessionId={}, status={}", sessionId, closeStatus);
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
    private void handleAuthMessage(WebSocketSession session, ClientSession clientSession, WebSocketMessage message) {
        try {
            Map<String, Object> data = (Map<String, Object>) message.getData();
            String userId = data.get("userId").toString();
            Long loginTimestamp = Long.valueOf(data.get("loginTimestamp").toString());
            String token = data.get("token").toString();
            log.info("Processing auth request: userId={}, sessionId={}", userId, session.getId());
            // 检查等待连接链表
            boolean isAllowed = waitingConnectionService.checkWaitingConnection(userId);
            if (!isAllowed) {
                log.warn("User {} not in waiting list, rejecting connection", userId);
                sendMessage(session, new WebSocketMessage(MessageIds.AUTH_FAILED, "User not in waiting connection list", Map.of("timestamp", System.currentTimeMillis())));
                return;
            }
            // 验证三要素（与中心数据服务器通信）
            boolean isValidated = centralServerClient.validateThreeFactors(userId, loginTimestamp, token);
            if (!isValidated) {
                log.warn("Three factors validation failed for user {}", userId);
                sendMessage(session, new WebSocketMessage(MessageIds.AUTH_FAILED, "Three factors validation failed", Map.of("timestamp", System.currentTimeMillis())));
                return;
            }
            // 认证成功
            clientSession.setAuthenticated(true);
            clientSession.setUserId(userId);
            // 更新用户到会话的映射
            String oldSessionId = userToSessionMap.put(userId, session.getId());
            if (oldSessionId != null && !oldSessionId.equals(session.getId())) {
                // 如果用户已有其他连接，关闭旧连接
                ClientSession oldSession = sessions.get(oldSessionId);
                if (oldSession != null) {
                    try {
                        oldSession.getSession().close(CloseStatus.NORMAL.withReason("New connection established"));
                    } catch (Exception e) {
                        log.warn("Failed to close old session: {}", oldSessionId);
                    }
                }
            }
            // 从等待连接链表中移除
            waitingConnectionService.removeFromWaitingList(userId);
            // 通知中心服务器用户连接成功
            // TODO: 获取实际的网关IP和端口
            centralServerClient.notifyUserConnected(userId, "localhost", 8080);
            // 发送认证成功消息
            sendMessage(session, new WebSocketMessage(MessageIds.AUTH_SUCCESS, "Authentication successful", Map.of("userId", userId, "timestamp", System.currentTimeMillis())));
            log.info("User {} authenticated successfully via gateway session: {}", userId, session.getId());
        } catch (Exception e) {
            log.error("Error processing auth message: {}", e.getMessage(), e);
            sendErrorMessage(session, "Authentication error");
        }
    }

    /**
     * 处理心跳消息
     */
    private void handleHeartbeatMessage(WebSocketSession session, ClientSession clientSession, WebSocketMessage message) {
        // 发送心跳响应
        sendMessage(session, new WebSocketMessage(MessageIds.HEARTBEAT_RESPONSE, "pong", Map.of("timestamp", System.currentTimeMillis())));
    }

    /**
     * 处理业务消息（不需要认证）
     *
     * 新架构：
     * - userId 在消息顶层，Gateway 直接读取，不解析 data
     * - Gateway 只添加 gatewayId 和 sessionId，然后转发
     * - 性能优化：避免反序列化 data 字段
     * - token 已移除：WebSocket 长连接不需要每次验证
     */
    private void handleBusinessMessage(WebSocketSession session, ClientSession clientSession, WebSocketMessage message) {
        try {
            // 创建转发消息
            WebSocketMessage forwardMessage = new WebSocketMessage();
            forwardMessage.setMsgId(message.getMsgId());
            forwardMessage.setMessage(message.getMessage());
            // 路由信息：直接从消息头部读取（不解析 data）
            forwardMessage.setUserId(message.getUserId());
            // Gateway 附加信息
            @SuppressWarnings("unchecked")
            Map<String, Object> enrichedData = new java.util.HashMap<>();
            enrichedData.put("gatewayId", getGatewayId());
            enrichedData.put("sessionId", clientSession.getSessionId());
            // 如果客户端 session 已经有 userId，优先使用（已认证的用户）
            if (clientSession.getUserId() != null) {
                forwardMessage.setUserId(clientSession.getUserId());
            }
            // 保留原始业务数据（不修改）
            if (message.getData() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> originalData = message.getData() instanceof Map ? (Map<String, Object>) message.getData() : new java.util.HashMap<>();
                enrichedData.putAll(originalData);
            }
            forwardMessage.setData(enrichedData);
            // 序列化为JSON
            String json = objectMapper.writeValueAsString(forwardMessage);
            log.info("转发业务消息到Game Server: msgId={} ({}), userId={}, sessionId={}", message.getMsgId(), MessageIds.getName(message.getMsgId()), forwardMessage.getUserId(), clientSession.getSessionId());
            // 转发到Game Server
            boolean success = gameServerConnectionManager.forwardToGameServer(json);
            if (!success) {
                log.warn("转发业务消息到Game Server失败: msgId={}, sessionId={}", message.getMsgId(), clientSession.getSessionId());
                sendErrorMessage(session, "Game server unavailable");
            }
        } catch (Exception e) {
            log.error("处理业务消息失败: msgId={}, sessionId={}", message.getMsgId(), clientSession.getSessionId(), e);
            sendErrorMessage(session, "Failed to forward message");
        }
    }

    /**
     * 获取Gateway ID
     */
    @Value("${laya.gateway.id:gateway-1}")
    private String gatewayIdValue;

    private String getGatewayId() {
        return gatewayIdValue;
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
        sendMessage(session, new WebSocketMessage(MessageIds.ERROR, error, Map.of("timestamp", System.currentTimeMillis())));
    }

    /**
     * 启动心跳检测
     */
    private void startHeartbeatCheck(String sessionId) {
        heartbeatScheduler.scheduleAtFixedRate(() -> {
            ClientSession clientSession = sessions.get(sessionId);
            if (clientSession == null) {
                return; // 会话已清理
            }
            WebSocketSession session = clientSession.getSession();
            if (!session.isOpen()) {
                cleanupSession(sessionId);
                return;
            }
            // 检查是否超时
            LocalDateTime lastActive = clientSession.getLastActiveTime();
            if (lastActive.plusSeconds(heartbeatInterval / 1000 * 2).isBefore(LocalDateTime.now())) {
                log.warn("Client session {} timed out, closing connection", sessionId);
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
        ClientSession clientSession = sessions.remove(sessionId);
        if (clientSession != null) {
            if (clientSession.getUserId() != null) {
                // 通知中心服务器用户断开连接
                centralServerClient.notifyUserDisconnected(clientSession.getUserId());
                userToSessionMap.remove(clientSession.getUserId());
                log.info("Cleaned up client session for user {}: {}", clientSession.getUserId(), sessionId);
            }
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
        ClientSession clientSession = sessions.get(sessionId);
        if (clientSession == null || !clientSession.getSession().isOpen()) {
            userToSessionMap.remove(userId);
            return false;
        }
        sendMessage(clientSession.getSession(), message);
        return true;
    }

    /**
     * 广播消息给所有已认证用户
     */
    public void broadcastToAuthenticatedUsers(WebSocketMessage message) {
        sessions.values().stream().filter(ClientSession::isAuthenticated).filter(session -> session.getSession().isOpen()).forEach(session -> sendMessage(session.getSession(), message));
    }

    /**
     * 获取在线用户数
     */
    public int getOnlineUserCount() {
        return (int) sessions.values().stream().filter(ClientSession::isAuthenticated).count();
    }

    /**
     * 获取总连接数
     */
    public int getTotalConnectionCount() {
        return sessions.size();
    }

    /**
     * 获取等待重连数（阶段2实现，当前返回0）
     */
    public int getWaitingReconnectionCount() {
        return 0; // TODO: 阶段2实现断线保持机制后，统计WAITING_RECONNECT状态的session数
    }

    // ==================== GameServerMessageForwarder 接口实现 ====================
    /**
     * 处理从Game Server收到的消息
     *
     * Game Server 发送的是 BroadcastRequest 格式：
     * {
     *   "targetUsers": ["user1", "user2"],
     *   "message": { "type": "LOGIN_SUCCESS", "data": {...} },
     *   "broadcastType": "TO_USERS"
     * }
     *
     * Gateway 负责：
     * 1. 解析 BroadcastRequest
     * 2. 提取目标用户和消息内容
     * 3. 将消息内容转发给目标用户
     */
    @Override
    public void onGameServerMessage(String gameServerId, String message) {
        try {
            // 解析为通用 Map 结构，避免反序列化问题
            @SuppressWarnings("unchecked")
            Map<String, Object> broadcastRequest = objectMapper.readValue(message, Map.class);
            // 提取目标用户列表
            @SuppressWarnings("unchecked")
            java.util.List<String> targetUsers = (java.util.List<String>) broadcastRequest.get("targetUsers");
            // 提取消息内容
            Object messageContent = broadcastRequest.get("message");
            if (targetUsers == null || targetUsers.isEmpty()) {
                log.warn("BroadcastRequest 缺少 targetUsers 字段");
                return;
            }
            if (messageContent == null) {
                log.warn("BroadcastRequest 缺少 message 字段");
                return;
            }
            // 将消息内容转为 JSON 字符串
            String messageJson = objectMapper.writeValueAsString(messageContent);
            // 转发给目标用户
            int successCount = 0;
            for (String targetUser : targetUsers) {
                ClientSession clientSession = sessions.get(targetUser);
                // 如果找不到 sessionId，可能 targetUser 是 userId，尝试查找对应的 session
                if (clientSession == null) {
                    // 遍历所有 session，查找匹配的 userId 或 sessionId
                    for (ClientSession s : sessions.values()) {
                        if (targetUser.equals(s.getUserId()) || targetUser.equals(s.getSessionId())) {
                            clientSession = s;
                            break;
                        }
                    }
                }
                if (clientSession != null && clientSession.getSession().isOpen()) {
                    try {
                        clientSession.getSession().sendMessage(new TextMessage(messageJson));
                        successCount++;
                        log.debug("转发消息到客户端: targetUser={}, sessionId={}, messageType={}", targetUser, clientSession.getSessionId(), messageContent instanceof Map ? ((Map<?, ?>) messageContent).get("type") : "unknown");
                    } catch (IOException e) {
                        log.error("发送消息到客户端失败: targetUser={}", targetUser, e);
                    }
                } else {
                    log.warn("目标用户不在线或连接已关闭: targetUser={}", targetUser);
                }
            }
            log.info("广播消息完成: gameServerId={}, 目标用户数={}, 成功发送={}", gameServerId, targetUsers.size(), successCount);
        } catch (Exception e) {
            log.error("处理Game Server消息失败: gameServerId={}", gameServerId, e);
        }
    }

    /**
     * 处理来自Game Server的广播消息
     */
    @SuppressWarnings("unchecked")
    private void handleBroadcastFromGameServer(WebSocketMessage message) {
        try {
            Map<String, Object> data = (Map<String, Object>) message.getData();
            if (data == null) {
                log.warn("广播消息缺少data字段");
                return;
            }
            // 获取目标用户列表
            Object targetUsersObj = data.get("targetUsers");
            if (!(targetUsersObj instanceof java.util.List)) {
                log.warn("广播消息缺少targetUsers字段");
                return;
            }
            java.util.List<String> targetUsers = (java.util.List<String>) targetUsersObj;
            // 获取实际消息内容
            Object actualMessage = data.get("message");
            // 向每个目标用户发送消息
            int successCount = 0;
            for (String userId : targetUsers) {
                WebSocketMessage userMessage = new WebSocketMessage(MessageIds.NOTIFICATION,  // 使用 NOTIFICATION 作为游戏消息类型
                message.getMessage(), actualMessage);
                if (sendMessageToUser(userId, userMessage)) {
                    successCount++;
                }
            }
            log.debug("广播消息完成: 目标用户数={}, 成功发送={}", targetUsers.size(), successCount);
        } catch (Exception e) {
            log.error("处理广播消息失败", e);
        }
    }

    /**
     * 处理来自Game Server的单播消息
     */
    @SuppressWarnings("unchecked")
    private void handleUnicastFromGameServer(WebSocketMessage message) {
        try {
            Map<String, Object> data = (Map<String, Object>) message.getData();
            if (data == null) {
                log.warn("单播消息缺少data字段");
                return;
            }
            // 获取目标用户ID
            String targetUserId = (String) data.get("userId");
            if (targetUserId == null || targetUserId.isEmpty()) {
                log.warn("单播消息缺少userId字段");
                return;
            }
            // 获取实际消息内容
            Object actualMessage = data.get("message");
            // 发送给目标用户
            WebSocketMessage userMessage = new WebSocketMessage(MessageIds.NOTIFICATION,  // 使用 NOTIFICATION 作为游戏消息类型
            message.getMessage(), actualMessage);
            boolean success = sendMessageToUser(targetUserId, userMessage);
            if (!success) {
                log.warn("发送单播消息失败: userId={}", targetUserId);
            } else {
                log.debug("单播消息发送成功: userId={}", targetUserId);
            }
        } catch (Exception e) {
            log.error("处理单播消息失败", e);
        }
    }


    /**
     * WebSocket消息类
     *
     * 设计原则（统一分层协议）：
     * - 路由相关字段（msgId, userId）放在顶层 → Gateway 可以直接读取，无需解析 data
     * - 业务数据放在 data 字段中 → Game Server 处理
     * - 性能优化：
     *   1. Gateway 不需要反序列化 data，只读取顶层字段
     *   2. 使用 short 类型的 msgId（2字节），比 String type 节省空间
     *   3. WebSocket 是长连接，Gateway 已维护连接状态，不需要每次验证 token
     *
     * 统一格式：
     * {
     *   "msgId": 2001,              // short: 消息ID（HEARTBEAT）
     *   "userId": "guest_123",      // string: 用户ID（路由用）
     *   "data": { ... }             // object: 业务数据
     * }
     */
    public static class WebSocketMessage {
        // ========== 消息头部（路由层） ==========
        private Short msgId; // 消息ID（统一使用数字，性能更优）
        private String userId; // 用户ID（可选，用于路由）
        private String message; // 消息描述（可选，用于调试）
        // ========== 消息数据（业务层） ==========
        private Object data; // 业务数据

        public WebSocketMessage() {
        }

        public WebSocketMessage(Short msgId, String message, Object data) {
            this.msgId = msgId;
            this.message = message;
            this.data = data;
        }

        // Getters and Setters
        public Short getMsgId() {
            return msgId;
        }

        public void setMsgId(Short msgId) {
            this.msgId = msgId;
        }

        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
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
    public GatewayWebSocketHandler(final WaitingConnectionService waitingConnectionService, final CentralServerClient centralServerClient, final GameServerConnectionManager gameServerConnectionManager, final ObjectMapper objectMapper) {
        this.waitingConnectionService = waitingConnectionService;
        this.centralServerClient = centralServerClient;
        this.gameServerConnectionManager = gameServerConnectionManager;
        this.objectMapper = objectMapper;
    }
}
