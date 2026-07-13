package com.laya.game.gateway.gameserver;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.laya.game.gateway.service.CentralServerClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Game Server 连接管理器
 *
 * 核心职责：
 * 1. 从Central Server查询Game Server列表
 * 2. 建立并维护到所有Game Server的WebSocket连接
 * 3. 负载均衡选择Game Server（轮询算法）
 * 4. 健康检查和自动重连
 * 5. 转发消息到Game Server
 *
 * @author Laya Game Server Framework
 * @since 2025-10-30
 */
@Component
public class GameServerConnectionManager implements GameServerWebSocketClient.GameServerMessageCallback {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GameServerConnectionManager.class);
    private final CentralServerClient centralServerClient;
    private final ObjectMapper objectMapper;
    @Value("${laya.gateway.id:gateway-1}")
    private String gatewayId;
    @Value("${laya.gateway.game-server.refresh-interval:10000}")
    private long refreshInterval;
    /**
     * Game Server连接池
     * Key: gameServerId, Value: WebSocketClient
     */
    private final Map<String, GameServerWebSocketClient> gameServerClients = new ConcurrentHashMap<>();
    /**
     * 黑名单：已明确下线的Game Server，阻止自动重连
     * 只有收到ONLINE通知或Central Server报告online=true时才移除
     */
    private final Set<String> offlineBlacklist = ConcurrentHashMap.newKeySet();
    /**
     * 负载均衡计数器（轮询算法）
     */
    private final AtomicInteger loadBalanceCounter = new AtomicInteger(0);
    /**
     * 业务处理线程池
     */
    private final ExecutorService businessExecutor;
    /**
     * 定时任务线程池
     */
    private final ScheduledExecutorService scheduledExecutor;
    /**
     * 消息转发回调（转发Game Server消息到客户端）
     */
    private GameServerMessageForwarder messageForwarder;

    public GameServerConnectionManager(CentralServerClient centralServerClient, ObjectMapper objectMapper) {
        this.centralServerClient = centralServerClient;
        this.objectMapper = objectMapper;
        // 创建业务线程池（核心20，最大100）
        this.businessExecutor = new ThreadPoolExecutor(20, 100, 60L, TimeUnit.SECONDS, new LinkedBlockingQueue<>(2000), new ThreadFactory() {
            private final AtomicInteger counter = new AtomicInteger(0);
            @Override
            public Thread newThread(Runnable r) {
                Thread t = new Thread(r, "gateway-business-" + counter.incrementAndGet());
                t.setDaemon(true);
                return t;
            }
        }, new ThreadPoolExecutor.CallerRunsPolicy());
        // 创建定时任务线程池
        this.scheduledExecutor = Executors.newScheduledThreadPool(5, new ThreadFactory() {
            private final AtomicInteger counter = new AtomicInteger(0);
            @Override
            public Thread newThread(Runnable r) {
                Thread t = new Thread(r, "gateway-scheduled-" + counter.incrementAndGet());
                t.setDaemon(true);
                return t;
            }
        });
    }

    /**
     * 设置消息转发器
     */
    public void setMessageForwarder(GameServerMessageForwarder forwarder) {
        this.messageForwarder = forwarder;
    }

    /**
     * 初始化：查询Game Server列表并建立连接
     */
    @PostConstruct
    public void initialize() {
        log.info("========================================");
        log.info("初始化 GameServerConnectionManager");
        log.info("Gateway ID: {}", gatewayId);
        log.info("刷新间隔: {}ms", refreshInterval);
        log.info("========================================");
        // 首次查询并连接
        refreshGameServerList();
        // 启动定时刷新任务（延迟10秒后开始）
        scheduledExecutor.scheduleWithFixedDelay(this::refreshGameServerList, 10000, refreshInterval, TimeUnit.MILLISECONDS);
        log.info("[OK] GameServerConnectionManager 初始化完成");
    }

    /**
     * 刷新Game Server列表
     * 从Central Server查询最新的Game Server列表并建立连接
     */
    private void refreshGameServerList() {
        try {
            log.debug("刷新Game Server列表...");
            // 从Central Server查询Game Server列表
            List<Map<String, Object>> gameServers = centralServerClient.getGameServerList();
            if (gameServers == null || gameServers.isEmpty()) {
                log.warn("未查询到可用的Game Server");
                return;
            }
            log.info("查询到 {} 个Game Server", gameServers.size());
            // 处理每个Game Server
            for (Map<String, Object> gsInfo : gameServers) {
                String gameServerId = (String) gsInfo.get("id");
                String wsUrl = (String) gsInfo.get("wsUrl");
                Boolean online = (Boolean) gsInfo.get("online");
                if (gameServerId == null || wsUrl == null) {
                    log.warn("Game Server信息不完整，跳过: {}", gsInfo);
                    continue;
                }
                // 如果Game Server已下线，断开连接并加入黑名单
                if (Boolean.FALSE.equals(online)) {
                    GameServerWebSocketClient existingClient = gameServerClients.get(gameServerId);
                    if (existingClient != null) {
                        log.info("Game Server {} 已下线，断开连接", gameServerId);
                        existingClient.disconnect();
                        gameServerClients.remove(gameServerId);
                    }
                    // 加入黑名单，阻止自动重连
                    offlineBlacklist.add(gameServerId);
                    continue;
                }
                // [OK] 如果Game Server在黑名单中，但Central Server报告online=true，移除黑名单
                if (offlineBlacklist.contains(gameServerId)) {
                    log.info("Game Server {} 已从黑名单中移除（Central Server报告online=true）", gameServerId);
                    offlineBlacklist.remove(gameServerId);
                }
                // 如果连接不存在或已断开，建立新连接
                GameServerWebSocketClient client = gameServerClients.get(gameServerId);
                if (client == null || !client.isConnected()) {
                    log.info("建立到Game Server的连接: id={}, url={}", gameServerId, wsUrl);
                    connectToGameServer(gameServerId, wsUrl);
                }
            }
        } catch (Exception e) {
            log.error("刷新Game Server列表失败", e);
        }
    }

    /**
     * 连接到指定的Game Server
     */
    private void connectToGameServer(String gameServerId, String wsUrl) {
        try {
            // [OK] 检查黑名单：如果在黑名单中，拒绝连接
            if (offlineBlacklist.contains(gameServerId)) {
                log.warn("Game Server {} 在离线黑名单中，拒绝建立连接", gameServerId);
                return;
            }
            // [OK] 防止多实例问题：先断开并移除旧连接
            GameServerWebSocketClient existingClient = gameServerClients.get(gameServerId);
            if (existingClient != null) {
                log.info("检测到旧的Game Server {} 连接实例，先断开", gameServerId);
                existingClient.disconnect();
                gameServerClients.remove(gameServerId);
            }
            // 创建WebSocket客户端
            GameServerWebSocketClient client = new GameServerWebSocketClient(gameServerId, wsUrl, gatewayId, businessExecutor, scheduledExecutor, this,  // 消息回调
            objectMapper);
            // 保存到连接池
            gameServerClients.put(gameServerId, client);
            // 异步建立连接
            businessExecutor.execute(client::connect);
        } catch (Exception e) {
            log.error("连接Game Server失败: id={}, url={}", gameServerId, wsUrl, e);
        }
    }

    /**
     * 转发消息到Game Server（负载均衡）
     * 使用轮询算法选择一个可用的Game Server
     *
     * @param message JSON消息
     * @return 是否成功发送
     */
    public boolean forwardToGameServer(String message) {
        List<GameServerWebSocketClient> availableClients = gameServerClients.values().stream().filter(GameServerWebSocketClient::isConnected).toList();
        if (availableClients.isEmpty()) {
            log.warn("没有可用的Game Server连接");
            return false;
        }
        // 轮询选择
        int index = Math.abs(loadBalanceCounter.getAndIncrement() % availableClients.size());
        GameServerWebSocketClient selectedClient = availableClients.get(index);
        boolean success = selectedClient.sendMessage(message);
        if (log.isDebugEnabled()) {
            log.debug("转发消息到Game Server: {} (负载均衡: {}/{})", selectedClient.getGameServerId(), index + 1, availableClients.size());
        }
        return success;
    }

    /**
     * 转发消息到指定的Game Server
     *
     * @param gameServerId Game Server ID
     * @param message JSON消息
     * @return 是否成功发送
     */
    public boolean forwardToGameServer(String gameServerId, String message) {
        GameServerWebSocketClient client = gameServerClients.get(gameServerId);
        if (client == null || !client.isConnected()) {
            log.warn("Game Server {} 不可用", gameServerId);
            return false;
        }
        return client.sendMessage(message);
    }

    /**
     * 广播消息到所有Game Server
     *
     * @param message JSON消息
     * @return 成功发送的数量
     */
    public int broadcastToAllGameServers(String message) {
        int successCount = 0;
        for (GameServerWebSocketClient client : gameServerClients.values()) {
            if (client.isConnected() && client.sendMessage(message)) {
                successCount++;
            }
        }
        return successCount;
    }

    /**
     * 获取可用的Game Server数量
     */
    public int getAvailableGameServerCount() {
        return (int) gameServerClients.values().stream().filter(GameServerWebSocketClient::isConnected).count();
    }

    /**
     * 获取总Game Server数量
     */
    public int getTotalGameServerCount() {
        return gameServerClients.size();
    }

    /**
     * 处理Game Server上线通知（来自Central Server回调）
     *
     * @param gameServerId Game Server ID
     * @param wsUrl WebSocket URL
     */
    public void handleGameServerOnline(String gameServerId, String wsUrl) {
        log.info("收到Game Server上线通知: {}, 立即建立连接", gameServerId);
        // [OK] 从黑名单中移除（如果存在）
        if (offlineBlacklist.remove(gameServerId)) {
            log.info("Game Server {} 已从离线黑名单中移除", gameServerId);
        }
        // 如果已有连接且正常，跳过
        GameServerWebSocketClient existingClient = gameServerClients.get(gameServerId);
        if (existingClient != null && existingClient.isConnected()) {
            log.debug("Game Server {} 已有活跃连接，跳过", gameServerId);
            return;
        }
        // 立即建立连接
        connectToGameServer(gameServerId, wsUrl);
    }

    /**
     * 处理Game Server下线通知（来自Central Server回调）
     * 立即停止重连并断开连接
     *
     * @param gameServerId Game Server ID
     */
    public void handleGameServerOffline(String gameServerId) {
        log.info("收到Game Server下线通知: {}, 立即停止重连并断开连接", gameServerId);
        // [OK] 加入黑名单，阻止后续自动重连
        offlineBlacklist.add(gameServerId);
        log.info("Game Server {} 已加入离线黑名单，阻止自动重连", gameServerId);
        // 断开连接（会自动停止重连任务）
        GameServerWebSocketClient client = gameServerClients.get(gameServerId);
        if (client != null) {
            client.disconnect();
            // 从连接池移除
            gameServerClients.remove(gameServerId);
            log.info("[OK] Game Server {} 已从连接池移除，停止所有重连尝试", gameServerId);
        } else {
            log.debug("Game Server {} 不在连接池中，仅加入黑名单", gameServerId);
        }
    }

    /**
     * 健康检查（定时任务）
     * 每30秒执行一次，检查连接状态
     */
    @Scheduled(fixedDelay = 30000)
    public void healthCheck() {
        log.debug("执行Game Server健康检查...");
        int total = gameServerClients.size();
        int connected = 0;
        int disconnected = 0;
        for (Map.Entry<String, GameServerWebSocketClient> entry : gameServerClients.entrySet()) {
            String gameServerId = entry.getKey();
            GameServerWebSocketClient client = entry.getValue();
            if (client.isConnected()) {
                connected++;
                log.debug("Game Server {} 状态: 已连接, 队列深度: {}", gameServerId, client.getSendQueueSize());
            } else {
                disconnected++;
                log.warn("Game Server {} 状态: 已断开", gameServerId);
            }
        }
        log.info("Game Server健康检查完成: 总计={}, 已连接={}, 已断开={}", total, connected, disconnected);
    }

    /**
     * 销毁：关闭所有连接
     */
    @PreDestroy
    public void shutdown() {
        log.info("关闭 GameServerConnectionManager...");
        // 关闭所有Game Server连接
        for (Map.Entry<String, GameServerWebSocketClient> entry : gameServerClients.entrySet()) {
            try {
                entry.getValue().disconnect();
            } catch (Exception e) {
                log.error("关闭Game Server连接失败: {}", entry.getKey(), e);
            }
        }
        gameServerClients.clear();
        // 关闭线程池
        businessExecutor.shutdown();
        scheduledExecutor.shutdown();
        try {
            if (!businessExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                businessExecutor.shutdownNow();
            }
            if (!scheduledExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduledExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            businessExecutor.shutdownNow();
            scheduledExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }
        log.info("[OK] GameServerConnectionManager 已关闭");
    }

    // ==================== GameServerMessageCallback 实现 ====================
    @Override
    public void onConnected(String gameServerId) {
        log.info("[OK] Game Server {} 连接建立", gameServerId);
    }

    @Override
    public void onMessage(String gameServerId, String message) {
        log.debug("← 收到Game Server {} 的消息: {}", gameServerId, message);
        // 转发给消息处理器
        if (messageForwarder != null) {
            messageForwarder.onGameServerMessage(gameServerId, message);
        } else {
            log.warn("MessageForwarder未设置，消息被丢弃");
        }
    }

    @Override
    public void onDisconnected(String gameServerId, CloseStatus status) {
        log.warn("[ERROR] Game Server {} 连接断开: {}", gameServerId, status);
    }

    @Override
    public void onError(String gameServerId, Throwable exception) {
        log.error("Game Server {} 发生错误", gameServerId, exception);
    }


    /**
     * 消息转发器接口
     * 用于将Game Server的消息转发给客户端
     */
    public interface GameServerMessageForwarder {
        /**
         * 处理从Game Server收到的消息
         *
         * @param gameServerId Game Server ID
         * @param message JSON消息
         */
        void onGameServerMessage(String gameServerId, String message);
    }
}
