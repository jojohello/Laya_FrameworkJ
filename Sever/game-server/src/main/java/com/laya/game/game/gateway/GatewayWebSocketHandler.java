package com.laya.game.game.gateway;

import com.alibaba.fastjson.JSON;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.laya.game.game.handler.MessageContext;
import com.laya.game.game.handler.MessageRouter;
import com.laya.game.game.protocol.BroadcastRequest;
import com.laya.game.game.protocol.GameMessage;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;

/**
 * Gateway WebSocket 连接处理器（服务端）
 *
 * <p>Game Server作为WebSocket服务端，接受来自Gateway的连接
 *
 * <p>核心职责：
 * <ul>
 *   <li>接受Gateway的WebSocket连接</li>
 *   <li>维护Gateway会话 (gatewayId → Session)</li>
 *   <li>接收并处理来自Gateway转发的客户端消息</li>
 *   <li>提取gatewayId并更新用户路由表</li>
 *   <li>发送消息到指定Gateway</li>
 *   <li>支持广播消息（自动按Gateway分组）</li>
 * </ul>
 *
 * @author Laya Game Server Framework
 * @version 3.0
 * @since 2025-10-30
 */
@Component
public class GatewayWebSocketHandler extends TextWebSocketHandler {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GatewayWebSocketHandler.class);
    /**
     * Gateway会话存储
     * Key: gatewayId
     * Value: WebSocketSession
     */
    private final Map<String, WebSocketSession> gatewaySessions = new ConcurrentHashMap<>();
    /**
     * 路由管理器（注入）
     */
    private final GatewayRouteManager routeManager;
    /**
     * 业务处理线程池（注入）
     */
    private final ExecutorService businessExecutor;
    /**
     * 消息路由器（注入）
     */
    private final MessageRouter messageRouter;
    /**
     * 出站协议统一使用 Spring 的 Jackson 配置，避免预检和真实传输使用不同序列化器。
     */
    private final ObjectMapper objectMapper;

    /**
     * 构造函数
     *
     * @param routeManager 路由管理器
     * @param businessExecutor 业务线程池
     * @param messageRouter 消息路由器
     */
    public GatewayWebSocketHandler(GatewayRouteManager routeManager,
                                   @Qualifier("businessExecutor") ExecutorService businessExecutor,
                                   MessageRouter messageRouter,
                                   ObjectMapper objectMapper) {
        this.routeManager = routeManager;
        this.businessExecutor = businessExecutor;
        this.messageRouter = messageRouter;
        this.objectMapper = objectMapper;
    }

    /**
     * Gateway连接建立
     *
     * @param session WebSocket会话
     * @throws Exception 异常
     */
    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) throws Exception {
        String gatewayId = extractGatewayId(session);
        if (gatewayId == null || gatewayId.isEmpty()) {
            log.warn("Gateway连接缺少gatewayId，拒绝连接: {}", session.getId());
            session.close(CloseStatus.POLICY_VIOLATION.withReason("Missing gatewayId"));
            return;
        }
        gatewaySessions.put(gatewayId, session);
        routeManager.registerGateway(gatewayId);
        log.info("[OK] Gateway已连接: gatewayId={}, sessionId={}", gatewayId, session.getId());
    }

    /**
     * 处理来自Gateway的文本消息
     *
     * <p>消息流程：
     * <ol>
     *   <li>接收Gateway转发的客户端消息（运行在I/O线程）</li>
     *   <li>立即提交到业务线程池处理（避免阻塞I/O线程）</li>
     *   <li>解析消息，提取gatewayId和userId</li>
     *   <li>更新用户路由表</li>
     *   <li>分发到对应的业务Handler</li>
     * </ol>
     *
     * @param session WebSocket会话
     * @param message 文本消息
     * @throws Exception 异常
     */
    @Override
    protected void handleTextMessage(@NonNull WebSocketSession session, @NonNull TextMessage message) throws Exception {
        String gatewayId = extractGatewayId(session);
        if (gatewayId == null) {
            log.warn("收到消息但无法提取gatewayId: sessionId={}", session.getId());
            return;
        }
        // 提交到业务线程池处理（避免阻塞I/O线程）
        businessExecutor.execute(() -> {
            try {
                processMessage(gatewayId, message.getPayload());
            } catch (Exception e) {
                log.error("处理Gateway消息失败: gatewayId={}, error={}", gatewayId, e.getMessage(), e);
            }
        });
    }

    /**
     * 处理消息（在业务线程中执行）
     *
     * @param gatewayId Gateway ID
     * @param payload 消息载荷（JSON字符串）
     */
    private void processMessage(String gatewayId, String payload) {
        // 解析消息
        GameMessage message = JSON.parseObject(payload, GameMessage.class);
        if (message == null || message.getMsgId() == null) {
            log.warn("无效消息格式: gatewayId={}", gatewayId);
            return;
        }
        // 提取 userId（优先从消息头部获取，兼容从 data 中获取）
        String userId = message.getUserId();
        if (userId == null || userId.isEmpty()) {
            userId = extractUserId(message);
        }
        // 提取 sessionId（从 data 字段中）
        String sessionId = extractSessionId(message);
        if (userId != null && !userId.isEmpty()) {
            // 更新用户路由表: userId → gatewayId
            routeManager.updateUserRoute(userId, gatewayId);
        }
        // 创建消息上下文（包含 sessionId）
        MessageContext context = MessageContext.create(userId, sessionId, gatewayId, this);
        // 使用MessageRouter路由消息到对应的Handler
        messageRouter.route(message, context);
    }

    /**
     * Gateway连接关闭
     *
     * @param session WebSocket会话
     * @param status 关闭状态
     * @throws Exception 异常
     */
    @Override
    public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus status) throws Exception {
        String gatewayId = extractGatewayId(session);
        if (gatewayId != null) {
            gatewaySessions.remove(gatewayId);
            routeManager.unregisterGateway(gatewayId);
            log.info("[ERROR] Gateway已断开: gatewayId={}, status={}", gatewayId, status);
        }
    }

    /**
     * 传输错误处理
     *
     * @param session WebSocket会话
     * @param exception 异常
     * @throws Exception 异常
     */
    @Override
    public void handleTransportError(@NonNull WebSocketSession session, @NonNull Throwable exception) throws Exception {
        String gatewayId = extractGatewayId(session);
        // 忽略关闭时的 ClosedChannelException（Tomcat容器关闭时的正常现象）
        Throwable rootCause = exception;
        while (rootCause.getCause() != null) {
            rootCause = rootCause.getCause();
        }
        if (rootCause instanceof java.nio.channels.ClosedChannelException) {
            log.debug("WebSocket连接已关闭（容器关闭时的正常现象）: gatewayId={}", gatewayId);
            return;
        }
        log.error("Gateway传输错误: gatewayId={}, error={}", gatewayId, exception.getMessage(), exception);
    }

    /**
     * 从Session中提取gatewayId
     *
     * <p>优先从URI参数中获取，如：ws://host:port/ws/gateway?gatewayId=gateway-1
     *
     * @param session WebSocket会话
     * @return gatewayId，如果不存在则返回null
     */
    private String extractGatewayId(WebSocketSession session) {
        var uri = session.getUri();
        if (uri == null) {
            return null;
        }
        String query = uri.getQuery();
        if (query == null || query.isEmpty()) {
            return null;
        }
        // 解析查询参数: gatewayId=xxx
        String[] params = query.split("&");
        for (String param : params) {
            String[] kv = param.split("=");
            if (kv.length == 2 && "gatewayId".equals(kv[0])) {
                return kv[1];
            }
        }
        return null;
    }

    /**
     * 从消息中提取userId
     *
     * @param message 游戏消息
     * @return userId，如果不存在则返回null
     */
    @SuppressWarnings("unchecked")
    private String extractUserId(GameMessage message) {
        Object data = message.getData();
        if (data instanceof Map) {
            Map<String, Object> dataMap = (Map<String, Object>) data;
            Object userIdObj = dataMap.get("userId");
            return userIdObj != null ? userIdObj.toString() : null;
        }
        return null;
    }

    /**
     * 从消息中提取sessionId（Gateway添加的字段）
     *
     * @param message 游戏消息
     * @return sessionId，如果不存在则返回null
     */
    @SuppressWarnings("unchecked")
    private String extractSessionId(GameMessage message) {
        Object data = message.getData();
        if (data instanceof Map) {
            Map<String, Object> dataMap = (Map<String, Object>) data;
            Object sessionIdObj = dataMap.get("sessionId");
            return sessionIdObj != null ? sessionIdObj.toString() : null;
        }
        return null;
    }

    /**
     * 发送消息到指定Gateway
     *
     * @param gatewayId Gateway ID
     * @param request 广播请求
     * @return 是否发送成功
     */
    public boolean sendToGateway(String gatewayId, BroadcastRequest request) {
        WebSocketSession session = gatewaySessions.get(gatewayId);
        if (session == null || !session.isOpen()) {
            log.warn("Gateway不可用: gatewayId={}", gatewayId);
            return false;
        }
        try {
            String json = serializeOutbound(request);
            session.sendMessage(new TextMessage(json));
            return true;
        } catch (IOException e) {
            log.error("发送消息到Gateway失败: gatewayId={}, error={}", gatewayId, e.getMessage(), e);
            return false;
        }
    }

    String serializeOutbound(BroadcastRequest request) throws IOException {
        return objectMapper.writeValueAsString(request);
    }

    /**
     * 获取在线Gateway数量
     *
     * @return Gateway数量
     */
    public int getGatewayCount() {
        return gatewaySessions.size();
    }

    /**
     * 获取所有Gateway会话（只读）
     *
     * @return Gateway会话Map
     */
    public Map<String, WebSocketSession> getGatewaySessions() {
        return new ConcurrentHashMap<>(gatewaySessions);
    }
}
