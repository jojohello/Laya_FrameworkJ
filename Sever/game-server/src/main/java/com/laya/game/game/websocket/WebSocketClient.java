package com.laya.game.game.websocket;

import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.PingMessage;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.time.LocalDateTime;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 通用 WebSocket 客户端基类
 * 封装WebSocket连接管理、发送队列、重连机制等通用功能
 *
 * 核心特性：
 * 1. 独立发送线程 - 避免阻塞业务逻辑
 * 2. 消息队列 - 削峰填谷
 * 3. 自动重连 - 指数退避算法
 * 4. 心跳保持 - PING/PONG机制
 *
 * 设计模式：模板方法模式
 * - 基类负责通用的连接管理、发送、重连逻辑
 * - 子类实现onMessage()等钩子方法处理具体业务
 *
 * @author Laya Game Server
 * @since 2025-10-29
 */
public abstract class WebSocketClient {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(WebSocketClient.class);
    /**
     * 客户端ID（唯一标识）
     */
    protected final String clientId;
    /**
     * WebSocket URL
     */
    protected final String wsUrl;
    /**
     * WebSocket 会话
     */
    protected volatile WebSocketSession session;
    /**
     * 连接状态
     */
    protected final AtomicBoolean connected = new AtomicBoolean(false);
    /**
     * 重连尝试次数
     */
    protected final AtomicInteger reconnectAttempts = new AtomicInteger(0);
    /**
     * 最大重连次数
     */
    protected static final int MAX_RECONNECT_ATTEMPTS = 10;
    /**
     * 发送队列（核心设计）
     */
    protected final BlockingQueue<String> sendQueue = new LinkedBlockingQueue<>(10000);
    /**
     * 独立发送线程
     */
    protected Thread sendThread;
    /**
     * 业务处理线程池（注入）
     */
    protected final ExecutorService businessExecutor;
    /**
     * 定时任务线程池（用于重连）
     */
    protected final ScheduledExecutorService scheduledExecutor;
    /**
     * WebSocket 客户端
     */
    protected final StandardWebSocketClient webSocketClient;
    /**
     * 最后活跃时间
     */
    protected volatile LocalDateTime lastActiveTime;

    /**
     * 构造函数
     *
     * @param clientId 客户端ID
     * @param wsUrl WebSocket URL
     * @param businessExecutor 业务线程池
     * @param scheduledExecutor 定时任务线程池
     */
    protected WebSocketClient(String clientId, String wsUrl, ExecutorService businessExecutor, ScheduledExecutorService scheduledExecutor) {
        this.clientId = clientId;
        this.wsUrl = wsUrl;
        this.businessExecutor = businessExecutor;
        this.scheduledExecutor = scheduledExecutor;
        this.webSocketClient = new StandardWebSocketClient();
        this.lastActiveTime = LocalDateTime.now();
    }

    /**
     * 连接到 WebSocket 服务器
     */
    public void connect() {
        if (connected.get()) {
            log.warn("客户端 {} 已经连接，无需重复连接", clientId);
            return;
        }
        try {
            log.info("[LINK] 正在连接 WebSocket: {} ({})", clientId, wsUrl);
            // 创建 WebSocket Handler
            TextWebSocketHandler handler = new TextWebSocketHandler() {
                @Override
                public void afterConnectionEstablished(WebSocketSession s) {
                    session = s;
                    connected.set(true);
                    reconnectAttempts.set(0);
                    lastActiveTime = LocalDateTime.now();
                    log.info("[OK] WebSocket {} 连接成功", clientId);
                    // 启动独立发送线程
                    startSendThread();
                    // 调用子类钩子方法
                    onConnected();
                }
                @Override
                protected void handleTextMessage(WebSocketSession s, TextMessage message) {
                    lastActiveTime = LocalDateTime.now();
                    // I/O线程接收消息后，立即提交到业务线程池处理
                    final String payload = message.getPayload();
                    businessExecutor.execute(() -> {
                        try {
                            // 调用子类钩子方法
                            onMessage(payload);
                        } catch (Exception e) {
                            log.error("处理消息失败: clientId={}", clientId, e);
                        }
                    });
                }
                @Override
                public void afterConnectionClosed(WebSocketSession s, CloseStatus status) {
                    connected.set(false);
                    log.warn("[ERROR] WebSocket {} 连接断开: {}", clientId, status);
                    // 调用子类钩子方法
                    onDisconnected(status);
                    // 触发重连
                    scheduleReconnect();
                }
                @Override
                public void handleTransportError(WebSocketSession s, Throwable exception) {
                    log.error("WebSocket {} 传输错误", clientId, exception);
                    onError(exception);
                }
            };
            // 执行连接
            webSocketClient.execute(handler, wsUrl).get(10, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("连接 WebSocket {} 失败", clientId, e);
            scheduleReconnect();
        }
    }

    /**
     * 启动独立发送线程
     * 关键设计：从队列取消息并发送，避免阻塞业务逻辑
     */
    private void startSendThread() {
        if (sendThread != null && sendThread.isAlive()) {
            log.warn("客户端 {} 发送线程已存在", clientId);
            return;
        }
        sendThread = new Thread(() -> {
            log.info("[START] WebSocket {} 发送线程已启动", clientId);
            while (connected.get() && !Thread.interrupted()) {
                try {
                    // 阻塞等待发送队列（100ms超时）
                    String message = sendQueue.poll(100, TimeUnit.MILLISECONDS);
                    if (message != null && session != null && session.isOpen()) {
                        session.sendMessage(new TextMessage(message));
                        if (log.isDebugEnabled()) {
                            log.debug("→ 发送消息到 {}: {}", clientId, message);
                        }
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                } catch (Exception e) {
                    log.error("WebSocket {} 发送消息失败", clientId, e);
                }
            }
            log.info("[STOP] WebSocket {} 发送线程已停止", clientId);
        }, "ws-send-" + clientId);
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
    protected boolean sendMessage(String message) {
        if (!connected.get()) {
            log.warn("WebSocket {} 未连接，消息丢弃", clientId);
            return false;
        }
        boolean success = sendQueue.offer(message);
        if (!success) {
            log.error("WebSocket {} 发送队列已满，消息丢弃", clientId);
        }
        return success;
    }

    /**
     * 发送 PING 消息（心跳）
     */
    public void sendPing() {
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new PingMessage());
                log.debug("[PING] 发送 PING 到 {}", clientId);
            } catch (Exception e) {
                log.error("发送 PING 失败: {}", clientId, e);
            }
        }
    }

    /**
     * 断线重连（指数退避算法）
     */
    private void scheduleReconnect() {
        int attempts = reconnectAttempts.incrementAndGet();
        if (attempts > MAX_RECONNECT_ATTEMPTS) {
            log.error("WebSocket {} 重连次数超限 ({})，停止重连", clientId, MAX_RECONNECT_ATTEMPTS);
            return;
        }
        // 指数退避: 1s, 2s, 4s, 8s, 16s, 32s, 60s(最大)
        int delay = Math.min(1000 * (int) Math.pow(2, attempts - 1), 60000);
        log.info("将在 {}ms 后重连 {} (第{}次)", delay, clientId, attempts);
        scheduledExecutor.schedule(() -> {
            log.info("[RETRY] 尝试重连 {} (第{}次)", clientId, attempts);
            connect();
        }, delay, TimeUnit.MILLISECONDS);
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
        log.info("断开 WebSocket {} 连接", clientId);
        connected.set(false);
        // 停止发送线程
        if (sendThread != null) {
            sendThread.interrupt();
        }
        // 关闭 WebSocket 会话
        if (session != null && session.isOpen()) {
            try {
                session.close();
            } catch (Exception e) {
                log.error("关闭 {} 会话失败", clientId, e);
            }
        }
    }

    // ==================== 子类钩子方法 ====================
    /**
     * 收到消息时调用（运行在业务线程池中）
     * 子类必须实现此方法处理具体的消息逻辑
     *
     * @param message JSON消息内容
     */
    protected abstract void onMessage(String message);

    /**
     * 连接建立后调用
     * 子类可以重写此方法进行初始化操作
     */
    protected void onConnected() {
        // 默认空实现
    }

    /**
     * 连接断开后调用
     * 子类可以重写此方法进行清理操作
     *
     * @param status 关闭状态
     */
    protected void onDisconnected(CloseStatus status) {
        // 默认空实现
    }

    /**
     * 发生错误时调用
     * 子类可以重写此方法进行错误处理
     *
     * @param exception 异常
     */
    protected void onError(Throwable exception) {
        // 默认空实现
    }

    /**
     * 客户端ID（唯一标识）
     */
    @java.lang.SuppressWarnings("all")
    public String getClientId() {
        return this.clientId;
    }

    /**
     * 最后活跃时间
     */
    @java.lang.SuppressWarnings("all")
    public LocalDateTime getLastActiveTime() {
        return this.lastActiveTime;
    }
}
