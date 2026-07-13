package com.jojohello_laya.login.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jojohello_laya.login.config.CentralServerConfig;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.lang.NonNull;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 中心服务器WebSocket客户端
 *
 * @author laya-game
 */
@Service
public class CentralWebSocketClient {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(CentralWebSocketClient.class);
    private final CentralServerConfig config;
    private final ObjectMapper objectMapper;
    private WebSocketSession session;
    private final AtomicBoolean connected = new AtomicBoolean(false);
    private final AtomicBoolean connecting = new AtomicBoolean(false);
    private final AtomicInteger reconnectAttempts = new AtomicInteger(0);
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
    private final WebSocketClient webSocketClient = new StandardWebSocketClient();

    /**
     * 启动时自动连接
     */
    @PostConstruct
    public void initialize() {
        if (config.getWebsocket().isEnabled()) {
            log.info("初始化WebSocket客户端，准备连接到中心服务器: {}", config.getWebsocketUrl());
            connect();
        } else {
            log.info("WebSocket客户端已禁用");
        }
    }

    /**
     * 关闭时清理资源
     */
    @PreDestroy
    public void destroy() {
        log.info("正在关闭WebSocket客户端...");
        connected.set(false);
        connecting.set(false);
        if (session != null && session.isOpen()) {
            try {
                session.close(CloseStatus.GOING_AWAY);
            } catch (Exception e) {
                log.warn("关闭WebSocket会话时出错: {}", e.getMessage());
            }
        }
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    /**
     * 连接到中心服务器
     */
    public void connect() {
        if (connected.get() || connecting.get()) {
            log.debug("WebSocket已连接或正在连接中，跳过连接请求");
            return;
        }
        if (!config.getWebsocket().isEnabled()) {
            log.warn("WebSocket客户端已禁用，无法连接");
            return;
        }
        connecting.set(true);
        try {
            log.info("正在连接到中心服务器: {}", config.getWebsocketUrl());
            URI uri = URI.create(config.getWebsocketUrl());
            WebSocketHandler handler = new CentralWebSocketHandler();
            // 使用 execute 替代废弃的 doHandshake + addCallback
            // 启动心跳
            // 发送认证消息
            CompletableFuture.supplyAsync(() -> {
                try {
                    return webSocketClient.execute(handler, null, uri).get();
                } catch (Exception e) {
                    throw new CompletionException(e);
                }
            }, Executors.newSingleThreadExecutor()).thenAccept(result -> {
                log.info("WebSocket连接成功建立");
                this.session = result;
                connected.set(true);
                connecting.set(false);
                reconnectAttempts.set(0);
                startHeartbeat();
                sendAuthMessage();
            }).exceptionally(failure -> {
                log.error("WebSocket连接失败: {}", failure.getMessage());
                connected.set(false);
                connecting.set(false);
                // 启动重连
                scheduleReconnect();
                return null;
            });
        } catch (Exception e) {
            log.error("WebSocket连接异常: {}", e.getMessage(), e);
            connected.set(false);
            connecting.set(false);
            scheduleReconnect();
        }
    }

    /**
     * 发送认证消息
     */
    private void sendAuthMessage() {
        try {
            // 登录服务器作为系统服务，使用特殊的认证方式
            // 使用配置化的预共享密钥进行认证
            Map<String, Object> authData = Map.of("userId", 0L,  // 系统服务使用特殊用户ID 0
            "loginTimestamp", System.currentTimeMillis(), "token", config.getServiceAuthSecret() // 从配置读取认证密钥
            );
            WSMessage authMessage = new WSMessage("AUTH", "Login server authentication", authData);
            sendMessage(authMessage);
            log.info("已发送认证消息到中心服务器");
        } catch (Exception e) {
            log.error("发送认证消息失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 启动心跳检测
     */
    private void startHeartbeat() {
        scheduler.scheduleAtFixedRate(() -> {
            if (connected.get() && session != null && session.isOpen()) {
                try {
                    WSMessage heartbeat = new WSMessage("HEARTBEAT", "ping", Map.of("timestamp", System.currentTimeMillis()));
                    sendMessage(heartbeat);
                    log.debug("发送心跳包到中心服务器");
                } catch (Exception e) {
                    log.warn("发送心跳包失败: {}", e.getMessage());
                }
            }
        }, config.getWebsocket().getHeartbeatInterval(), config.getWebsocket().getHeartbeatInterval(), TimeUnit.MILLISECONDS);
    }

    /**
     * 安排重连
     */
    private void scheduleReconnect() {
        int attempts = reconnectAttempts.incrementAndGet();
        int maxAttempts = config.getWebsocket().getMaxReconnectAttempts();
        if (maxAttempts > 0 && attempts > maxAttempts) {
            log.error("已达到最大重连次数 {}, 停止重连", maxAttempts);
            return;
        }
        long delay = config.getWebsocket().getReconnectInterval();
        log.info("将在 {} 毫秒后进行第 {} 次重连", delay, attempts);
        scheduler.schedule(() -> {
            if (!connected.get()) {
                log.info("开始第 {} 次重连尝试", attempts);
                connect();
            }
        }, delay, TimeUnit.MILLISECONDS);
    }

    /**
     * 发送消息
     */
    public void sendMessage(WSMessage message) {
        if (!connected.get() || session == null || !session.isOpen()) {
            log.warn("WebSocket未连接，无法发送消息: {}", message.getType());
            return;
        }
        try {
            String json = objectMapper.writeValueAsString(message);
            session.sendMessage(new TextMessage(json));
            log.debug("发送WebSocket消息: {}", message.getType());
        } catch (Exception e) {
            log.error("发送WebSocket消息失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 检查连接状态
     */
    public boolean isConnected() {
        return connected.get() && session != null && session.isOpen();
    }

    /**
     * 获取连接状态信息
     */
    public Map<String, Object> getConnectionStatus() {
        return Map.of("connected", isConnected(), "connecting", connecting.get(), "reconnectAttempts", reconnectAttempts.get(), "serverUrl", config.getWebsocketUrl());
    }


    /**
     * WebSocket处理器
     */
    private class CentralWebSocketHandler implements WebSocketHandler {
        @Override
        public void afterConnectionEstablished(@NonNull WebSocketSession session) throws Exception {
            log.info("WebSocket连接已建立: {}", session.getId());
        }

        @Override
        public void handleMessage(@NonNull WebSocketSession session, @NonNull WebSocketMessage<?> message) throws Exception {
            try {
                String payload = message.getPayload().toString();
                WSMessage wsMessage = objectMapper.readValue(payload, WSMessage.class);
                log.debug("收到WebSocket消息: {}", wsMessage.getType());
                switch (wsMessage.getType()) {
                case "WELCOME":
                    log.info("收到中心服务器欢迎消息: {}", wsMessage.getMessage());
                    break;
                case "AUTH_SUCCESS":
                    log.info("认证成功: {}", wsMessage.getMessage());
                    break;
                case "AUTH_FAILED":
                    log.warn("认证失败: {}", wsMessage.getMessage());
                    break;
                case "HEARTBEAT_RESPONSE":
                    log.debug("收到心跳响应");
                    break;
                case "ERROR":
                    log.error("收到错误消息: {}", wsMessage.getMessage());
                    break;
                default:
                    log.debug("收到未知类型消息: {}", wsMessage.getType());
                }
            } catch (Exception e) {
                log.error("处理WebSocket消息失败: {}", e.getMessage(), e);
            }
        }

        @Override
        public void handleTransportError(@NonNull WebSocketSession session, @NonNull Throwable exception) throws Exception {
            log.error("WebSocket传输错误: {}", exception.getMessage(), exception);
            connected.set(false);
            scheduleReconnect();
        }

        @Override
        public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus closeStatus) throws Exception {
            log.warn("WebSocket连接已关闭: {} - {}", closeStatus.getCode(), closeStatus.getReason());
            connected.set(false);
            // 如果不是正常关闭，启动重连
            if (!CloseStatus.GOING_AWAY.equals(closeStatus) && !CloseStatus.NORMAL.equals(closeStatus)) {
                scheduleReconnect();
            }
        }

        @Override
        public boolean supportsPartialMessages() {
            return false;
        }
    }


    /**
     * WebSocket消息类
     */
    public static class WSMessage {
        private String type;
        private String message;
        private Object data;

        public WSMessage() {
        }

        public WSMessage(String type, String message, Object data) {
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
    public CentralWebSocketClient(final CentralServerConfig config, final ObjectMapper objectMapper) {
        this.config = config;
        this.objectMapper = objectMapper;
    }
}
