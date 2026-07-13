package com.laya.game.central.service;

import com.laya.game.central.dto.GameServerChangeNotification;
import com.laya.game.central.dto.GameServerHeartbeatRequest;
import com.laya.game.central.dto.GameServerHeartbeatResponse;
import com.laya.game.central.model.GameServerInfo;
import com.laya.game.central.model.GatewayInfo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Game Server注册表服务
 *
 * 管理所有Game Server的注册信息和状态
 *
 * 功能：
 * 1. 接收Game Server心跳，首次自动注册
 * 2. 更新Game Server状态和负载信息
 * 3. 定时检查心跳超时（5秒间隔，15秒超时）
 * 4. 处理优雅关闭注销请求
 * 5. 推送上线/下线通知给所有Gateway
 *
 * @author Laya Game Server Framework
 * @since 2025-10-30
 * @updated 2025-11-10 - 新增心跳机制和优雅关闭
 */
@Service
public class GameServerRegistry {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GameServerRegistry.class);
    /**
     * Game Server注册表
     * Key: gameServerId
     * Value: GameServerInfo
     */
    private final Map<String, GameServerInfo> gameServers = new ConcurrentHashMap<>();
    /**
     * RestTemplate用于HTTP通知Gateway
     */
    private final RestTemplate restTemplate;
    /**
     * Gateway心跳服务（用于获取在线Gateway列表）
     */
    private final GatewayHeartbeatService gatewayHeartbeatService;
    /**
     * 心跳超时时间（毫秒）
     * 默认15秒（3次心跳未收到）
     */
    @Value("${laya.heartbeat-timeout:15000}")
    private long heartbeatTimeoutMs;
    /**
     * 超时检查间隔（毫秒）
     * 默认5秒
     */
    @Value("${laya.check-interval:5000}")
    private long checkIntervalMs;

    /**
     * 初始化
     */
    @PostConstruct
    public void initialize() {
        log.info("========================================");
        log.info("初始化 Game Server 注册表...");
        log.info("心跳超时配置: {}ms", heartbeatTimeoutMs);
        log.info("超时检查间隔: {}ms", checkIntervalMs);
        log.info("========================================");
    }

    /**
     * 处理Game Server心跳
     * 首次收到心跳 → 自动注册 + 通知所有Gateway
     * 非首次 → 更新状态和负载
     *
     * @param request 心跳请求
     * @return 心跳响应
     */
    public GameServerHeartbeatResponse handleHeartbeat(GameServerHeartbeatRequest request) {
        String gameServerId = request.getGameServerId();
        GameServerInfo gameServer = gameServers.get(gameServerId);
        if (gameServer == null) {
            // 首次心跳 → 自动注册
            gameServer = new GameServerInfo();
            gameServer.setId(gameServerId);
            gameServer.setHost(request.getIp());
            gameServer.setPort(request.getPort());
            gameServer.setWsUrl("ws://" + request.getIp() + ":" + request.getPort() + "/ws/gateway");
            gameServer.setHttpUrl("http://" + request.getIp() + ":" + request.getPort());
            gameServer.setRegisterTime(LocalDateTime.now());
            // 初始化负载信息
            GameServerInfo.LoadInfo loadInfo = new GameServerInfo.LoadInfo();
            loadInfo.setActiveRooms(request.getActiveConnections());
            loadInfo.setOnlinePlayers(request.getOnlinePlayers());
            loadInfo.setCpuUsage(0.0);
            loadInfo.setMemoryUsage(0.0);
            gameServer.setLoad(loadInfo);
            gameServers.put(gameServerId, gameServer);
            log.info("Game Server首次注册: {}, 地址: {}:{}, 负载: {}/{}", gameServerId, request.getIp(), request.getPort(), request.getActiveConnections(), request.getOnlinePlayers());
            // 使用高内聚方法：自动标记为上线 + 通知所有Gateway
            markGameServerOnline(gameServer);
        } else {
            // 已注册的Game Server心跳更新
            boolean wasOffline = Boolean.FALSE.equals(gameServer.getOnline());
            // 更新心跳和负载
            gameServer.updateHeartbeat();
            GameServerInfo.LoadInfo loadInfo = gameServer.getLoad();
            if (loadInfo == null) {
                loadInfo = new GameServerInfo.LoadInfo();
                gameServer.setLoad(loadInfo);
            }
            loadInfo.setActiveRooms(request.getActiveConnections());
            loadInfo.setOnlinePlayers(request.getOnlinePlayers());
            // 如果之前是离线状态，现在恢复上线（重启场景）
            if (wasOffline) {
                log.info("Game Server {} 从离线恢复上线", gameServerId);
                markGameServerOnline(gameServer);
            } else {
                // 正常心跳更新，不需要通知
                gameServer.setOnline(true);
                log.debug("Game Server {} 心跳更新，负载: {}/{}", gameServerId, request.getActiveConnections(), request.getOnlinePlayers());
            }
        }
        return GameServerHeartbeatResponse.success();
    }

    /**
     * 处理Game Server注销（优雅关闭）
     *
     * @param gameServerId Game Server ID
     * @param reason 注销原因
     */
    public void handleUnregister(String gameServerId, String reason) {
        GameServerInfo gameServer = gameServers.get(gameServerId);
        if (gameServer != null) {
            log.info("Game Server请求注销: {}, 原因: {}", gameServerId, reason);
            // 使用高内聚方法：自动标记为离线 + 通知所有Gateway
            markGameServerOffline(gameServer, reason);
        } else {
            log.warn("Game Server {} 不存在，无法注销", gameServerId);
        }
    }

    /**
     * 定时检查心跳超时
     * 每5秒执行一次（通过配置文件设置）
     */
    @Scheduled(fixedRateString = "${laya.check-interval:5000}")
    public void checkHeartbeatTimeout() {
        List<String> timeoutServers = new ArrayList<>();
        gameServers.forEach((gameServerId, gameServer) -> {
            if (Boolean.TRUE.equals(gameServer.getOnline()) && gameServer.isTimeout(heartbeatTimeoutMs)) {
                timeoutServers.add(gameServerId);
                log.warn("[WARN] Game Server心跳超时: {}, 最后心跳: {}", gameServerId, gameServer.getLastHeartbeat());
                // 使用高内聚方法：自动标记为离线 + 通知所有Gateway
                markGameServerOffline(gameServer, "HEARTBEAT_TIMEOUT");
            }
        });
        if (!timeoutServers.isEmpty()) {
            log.warn("检测到 {} 个Game Server心跳超时: {}", timeoutServers.size(), timeoutServers);
        }
    }

    /**
     * 标记Game Server为在线状态（高内聚设计）
     * 自动触发通知所有Gateway
     *
     * @param gameServer Game Server信息
     */
    private void markGameServerOnline(GameServerInfo gameServer) {
        gameServer.setOnline(true);
        gameServer.updateHeartbeat();
        log.info("[OK] Game Server {} 已上线", gameServer.getId());
        // 自动通知所有Gateway（高内聚：状态变更+通知一体化）
        notifyAllGateways(GameServerChangeNotification.online(gameServer.getId(), gameServer.getHost(), gameServer.getPort()));
    }

    /**
     * 标记Game Server为离线状态（高内聚设计）
     * 自动触发通知所有Gateway
     *
     * @param gameServer Game Server信息
     * @param reason 下线原因
     */
    private void markGameServerOffline(GameServerInfo gameServer, String reason) {
        gameServer.setOnline(false);
        log.warn("[OFFLINE] Game Server {} 已离线，原因: {}", gameServer.getId(), reason);
        // 自动通知所有Gateway（高内聚：状态变更+通知一体化）
        notifyAllGateways(GameServerChangeNotification.offline(gameServer.getId(), reason));
    }

    /**
     * 通知所有在线Gateway：Game Server变化
     *
     * @param notification 变化通知
     */
    private void notifyAllGateways(GameServerChangeNotification notification) {
        List<GatewayInfo> onlineGateways = gatewayHeartbeatService.getOnlineGateways();
        if (onlineGateways.isEmpty()) {
            log.warn("[WARN] 没有在线的Gateway可以通知 - Game Server {} {}", notification.getGameServerId(), notification.getType());
            return;
        }
        log.debug("准备通知 {} 个在线Gateway - Game Server {} {}", onlineGateways.size(), notification.getGameServerId(), notification.getType());
        onlineGateways.forEach(gateway -> {
            String callbackUrl = "http://" + gateway.getGatewayIp() + ":" + gateway.getGatewayPort() + "/api/v1/callback/game-server-change";
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<GameServerChangeNotification> request = new HttpEntity<>(notification, headers);
                restTemplate.postForObject(callbackUrl, request, String.class);
                log.info("[SEND] 已通知Gateway {}:{} - Game Server {} {}", gateway.getGatewayIp(), gateway.getGatewayPort(), notification.getGameServerId(), notification.getType());
            } catch (Exception e) {
                log.error("[ERROR] 通知Gateway失败 {}:{} - {}", gateway.getGatewayIp(), gateway.getGatewayPort(), e.getMessage());
            }
        });
    }

    /**
     * 获取所有在线的Game Server列表
     *
     * @return Game Server列表
     */
    public List<GameServerInfo> getOnlineGameServers() {
        List<GameServerInfo> onlineServers = new ArrayList<>();
        for (GameServerInfo gameServer : gameServers.values()) {
            if (Boolean.TRUE.equals(gameServer.getOnline())) {
                onlineServers.add(gameServer);
            }
        }
        return onlineServers;
    }

    /**
     * 获取所有Game Server列表（包括离线的）
     *
     * @return Game Server列表
     */
    public List<GameServerInfo> getAllGameServers() {
        return new ArrayList<>(gameServers.values());
    }

    /**
     * 获取指定Game Server信息
     *
     * @param gameServerId Game Server ID
     * @return Game Server信息，如果不存在则返回null
     */
    public GameServerInfo getGameServer(String gameServerId) {
        return gameServers.get(gameServerId);
    }

    /**
     * 检查Game Server是否在线
     *
     * @param gameServerId Game Server ID
     * @return 是否在线
     */
    public boolean isOnline(String gameServerId) {
        GameServerInfo gameServer = gameServers.get(gameServerId);
        return gameServer != null && Boolean.TRUE.equals(gameServer.getOnline());
    }

    /**
     * 获取在线Game Server数量
     *
     * @return 在线数量
     */
    public int getOnlineCount() {
        return (int) gameServers.values().stream().filter(gs -> Boolean.TRUE.equals(gs.getOnline())).count();
    }

    @java.lang.SuppressWarnings("all")
    public GameServerRegistry(final RestTemplate restTemplate, final GatewayHeartbeatService gatewayHeartbeatService) {
        this.restTemplate = restTemplate;
        this.gatewayHeartbeatService = gatewayHeartbeatService;
    }
}
