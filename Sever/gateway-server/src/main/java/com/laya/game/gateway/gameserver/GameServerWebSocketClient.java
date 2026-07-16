package com.laya.game.gateway.gameserver;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.lang.NonNull;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.time.LocalDateTime;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Game Server WebSocket 客户端
 * Gateway作为客户端连接到Game Server的WebSocket服务端
 *
 * 核心特性：
 * 1. 独立发送线程 - 避免阻塞业务逻辑
 * 2. 消息队列 - 削峰填谷
 * 3. 自动重连 - 指数退避算法
 * 4. 连接状态管理
 *
 * @author Laya Game Server Framework
 * @since 2025-10-30
 */
public class GameServerWebSocketClient {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GameServerWebSocketClient.class);
    /**
     * Game Server唯一标识
     */
    private final String gameServerId;
    /**
     * WebSocket URL (例如: ws://localhost:8084/ws/gateway?gatewayId=gateway-1)
     */
    private final String wsUrl;
    /**
     * Gateway ID（用于在Game Server端标识此Gateway）
     */
    private final String gatewayId;
    /**
     * WebSocket 会话
     */
    private volatile WebSocketSession session;
    /**
     * 连接状态
     */
    private final AtomicBoolean connected = new AtomicBoolean(false);
    /**
     * 重连尝试次数
     */
    private final AtomicInteger reconnectAttempts = new AtomicInteger(0);
    /**
     * 最大重连次数
     */
    private static final int MAX_RECONNECT_ATTEMPTS = 10;
    /**
     * 发送队列（核心设计）
     */
    private final BlockingQueue<String> sendQueue = new LinkedBlockingQueue<>(10000);
    /**
     * 独立发送线程
     */
    private Thread sendThread;
    /**
     * 重连任务Future（用于取消重连）
     */
    private volatile ScheduledFuture<?> reconnectFuture;
    /**
     * 业务处理线程池（注入）
     */
    private final ExecutorService businessExecutor;
    /**
     * 定时任务线程池（用于重连）
     */
    private final ScheduledExecutorService scheduledExecutor;
    /**
     * WebSocket 客户端
     */
    private final StandardWebSocketClient webSocketClient;
    /**
     * 最后活跃时间
     */
    private volatile LocalDateTime lastActiveTime;
    /**
     * 消息处理回调（转发给GatewayWebSocketHandler）
     */
    private final GameServerMessageCallback messageCallback;
    /**
     * JSON序列化工具
     */
    private final ObjectMapper objectMapper;

    /**
     * 构造函数
     *
     * @param gameServerId Game Server唯一标识
     * @param wsUrl WebSocket URL
     * @param gatewayId Gateway ID
     * @param businessExecutor 业务线程池
     * @param scheduledExecutor 定时任务线程池
     * @param messageCallback 消息处理回调
     * @param objectMapper JSON序列化工具
     */
    public GameServerWebSocketClient(String gameServerId, String wsUrl, String gatewayId, ExecutorService businessExecutor, ScheduledExecutorService scheduledExecutor, GameServerMessageCallback messageCallback, ObjectMapper objectMapper) {
        this.gameServerId = gameServerId;
        this.wsUrl = wsUrl;
        this.gatewayId = gatewayId;
        this.businessExecutor = businessExecutor;
        this.scheduledExecutor = scheduledExecutor;
        this.messageCallback = messageCallback;
        this.objectMapper = objectMapper;
        this.webSocketClient = new StandardWebSocketClient();
        this.lastActiveTime = LocalDateTime.now();
    }

    /**
     * 连接到 Game Server
     */
    public void connect() {
        if (connected.get()) {
            log.warn("GameServerClient {} 已经连接，无需重复连接", gameServerId);
            return;
        }
        try {
            // 构建带gatewayId参数的URL
            String urlWithParams = wsUrl + "?gatewayId=" + gatewayId;
            log.info("[LINK] 正在连接 Game Server: {} ({})", gameServerId, urlWithParams);
            // 创建 WebSocket Handler
            TextWebSocketHandler handler = new TextWebSocketHandler() {
                @Override
                public void afterConnectionEstablished(@NonNull WebSocketSession s) {
                    session = s;
                    connected.set(true);
                    reconnectAttempts.set(0);
                    lastActiveTime = LocalDateTime.now();
                    log.info("[OK] Game Server {} 连接成功", gameServerId);
                    // 启动独立发送线程
                    startSendThread();
                    // 通知连接成功
                    if (messageCallback != null) {
                        messageCallback.onConnected(gameServerId);
                    }
                }
                @Override
                protected void handleTextMessage(@NonNull WebSocketSession s, @NonNull TextMessage message) {
                    lastActiveTime = LocalDateTime.now();
                    // I/O线程接收消息后，立即提交到业务线程池处理
                    final String payload = message.getPayload();
                    businessExecutor.execute(() -> {
                        try {
                            // 解析消息并转发给Gateway
                            if (messageCallback != null) {
                                messageCallback.onMessage(gameServerId, payload);
                            }
                        } catch (Exception e) {
                            log.error("处理Game Server消息失败: gameServerId={}", gameServerId, e);
                        }
                    });
                }
                @Override
                public void afterConnectionClosed(@NonNull WebSocketSession s, @NonNull CloseStatus status) {
                    connected.set(false);
                    log.warn("[ERROR] Game Server {} 连接断开: {}", gameServerId, status);
                    // 通知连接断开
                    if (messageCallback != null) {
                        messageCallback.onDisconnected(gameServerId, status);
                    }
                    // 触发重连
                    scheduleReconnect();
                }
                @Override
                public void handleTransportError(@NonNull WebSocketSession s, @NonNull Throwable exception) {
                    log.error("Game Server {} 传输错误", gameServerId, exception);
                    if (messageCallback != null) {
                        messageCallback.onError(gameServerId, exception);
                    }
                }
            };
            // 执行连接
            webSocketClient.execute(handler, urlWithParams).get(10, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("连接 Game Server {} 失败", gameServerId, e);
            scheduleReconnect();
        }
    }

    /**
     * 启动独立发送线程
     * 关键设计：从队列取消息并发送，避免阻塞业务逻辑
     */
    private void startSendThread() {
        if (sendThread != null && sendThread.isAlive()) {
            log.warn("GameServerClient {} 发送线程已存在", gameServerId);
            return;
        }
        sendThread = new Thread(() -> {
            log.info("[START] Game Server {} 发送线程已启动", gameServerId);
            while (connected.get() && !Thread.interrupted()) {
                try {
                    // 阻塞等待发送队列（100ms超时）
                    String message = sendQueue.poll(100, TimeUnit.MILLISECONDS);
                    if (message != null && session != null && session.isOpen()) {
                        session.sendMessage(new TextMessage(message));
                        if (log.isDebugEnabled()) {
                            log.debug("→ 发送消息到 Game Server {}: {}", gameServerId, message);
                        }
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                } catch (Exception e) {
                    log.error("Game Server {} 发送消息失败", gameServerId, e);
                }
            }
            log.info("[STOP] Game Server {} 发送线程已停止", gameServerId);
        }, "gs-send-" + gameServerId);
        sendThread.setDaemon(true);
        sendThread.start();
    }

    /**
     * 发送消息（非阻塞）
     * 消息放入队列后立即返回
     *
     * @param message JSON消息
     * @return 是否成功放入队列
     */
    public boolean sendMessage(String message) {
        if (!connected.get()) {
            log.warn("Game Server {} 未连接，消息丢弃", gameServerId);
            return false;
        }
        boolean success = sendQueue.offer(message);
        if (!success) {
            log.error("Game Server {} 发送队列已满，消息丢弃", gameServerId);
        }
        return success;
    }

    /**
     * 发送消息对象（自动序列化为JSON）
     *
     * @param messageObject 消息对象
     * @return 是否成功发送
     */
    public boolean sendMessageObject(Object messageObject) {
        try {
            String json = objectMapper.writeValueAsString(messageObject);
            return sendMessage(json);
        } catch (Exception e) {
            log.error("序列化消息对象失败: gameServerId={}", gameServerId, e);
            return false;
        }
    }

    /**
     * 断线重连（指数退避算法）
     */
    private void scheduleReconnect() {
        if (scheduledExecutor.isShutdown() || scheduledExecutor.isTerminated()) {
            log.debug("Game Server {} 重连调度器已关闭，忽略重连请求", gameServerId);
            return;
        }
        int attempts = reconnectAttempts.incrementAndGet();
        if (attempts > MAX_RECONNECT_ATTEMPTS) {
            log.error("Game Server {} 重连次数超限 ({})，停止重连", gameServerId, MAX_RECONNECT_ATTEMPTS);
            return;
        }
        // 指数退避: 1s, 2s, 4s, 8s, 16s, 32s, 60s(最大)
        int delay = Math.min(1000 * (int) Math.pow(2, attempts - 1), 60000);
        log.info("将在 {}ms 后重连 Game Server {} (第{}次)", delay, gameServerId, attempts);
        // 保存重连任务Future，用于后续取消
        try {
            reconnectFuture = scheduledExecutor.schedule(() -> {
                log.info("[RETRY] 尝试重连 Game Server {} (第{}次)", gameServerId, attempts);
                connect();
            }, delay, TimeUnit.MILLISECONDS);
        } catch (RejectedExecutionException ignored) {
            // Shutdown can race with WebSocket afterConnectionClosed callbacks.
            log.debug("Game Server {} 关闭期间忽略重连任务", gameServerId);
        }
    }

    /**
     * 判断是否已连接
     *
     * @return true=已连接
     */
    public boolean isConnected() {
        return connected.get() && session != null && session.isOpen();
    }

    /**
     * 获取发送队列深度
     *
     * @return 队列中待发送的消息数量
     */
    public int getSendQueueSize() {
        return sendQueue.size();
    }

    /**
     * 断开连接
     */
    public void disconnect() {
        log.info("断开 Game Server {} 连接", gameServerId);
        connected.set(false);
        // 取消重连任务（关键：防止主动下线后继续重连）
        if (reconnectFuture != null && !reconnectFuture.isDone()) {
            boolean cancelled = reconnectFuture.cancel(false);
            log.info("取消 Game Server {} 的重连任务: {}", gameServerId, cancelled ? "成功" : "失败");
        }
        // 停止发送线程
        if (sendThread != null) {
            sendThread.interrupt();
        }
        // 关闭 WebSocket 会话
        if (session != null && session.isOpen()) {
            try {
                session.close();
            } catch (Exception e) {
                log.error("关闭 {} 会话失败", gameServerId, e);
            }
        }
    }


    /**
     * 消息回调接口
     */
    public interface GameServerMessageCallback {
        /**
         * 连接建立后调用
         */
        void onConnected(String gameServerId);

        /**
         * 收到消息时调用
         */
        void onMessage(String gameServerId, String message);

        /**
         * 连接断开后调用
         */
        void onDisconnected(String gameServerId, CloseStatus status);

        /**
         * 发生错误时调用
         */
        void onError(String gameServerId, Throwable exception);
    }

    /**
     * Game Server唯一标识
     */
    @java.lang.SuppressWarnings("all")
    public String getGameServerId() {
        return this.gameServerId;
    }

    /**
     * 最后活跃时间
     */
    @java.lang.SuppressWarnings("all")
    public LocalDateTime getLastActiveTime() {
        return this.lastActiveTime;
    }
}
