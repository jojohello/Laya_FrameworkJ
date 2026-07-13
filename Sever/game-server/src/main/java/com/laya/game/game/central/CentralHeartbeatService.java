package com.laya.game.game.central;

import com.laya.game.game.gateway.GatewayRouteManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

/**
 * Central Server 心跳服务
 *
 * 功能：
 * 1. 定时发送心跳到Central Server（5秒间隔）
 * 2. 首次心跳自动注册Game Server
 * 3. 上报服务器负载信息（连接数、在线玩家数）
 *
 * @author Laya Game Server Framework
 * @since 2025-11-10
 */
@Service
public class CentralHeartbeatService {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(CentralHeartbeatService.class);
    private final RestTemplate restTemplate;
    private final GatewayRouteManager gatewayRouteManager;
    /**
     * Game Server ID
     */
    @Value("${laya.game.server-id}")
    private String gameServerId;
    /**
     * Game Server IP
     */
    @Value("${laya.game.server-ip}")
    private String serverIp;
    /**
     * Game Server Port
     */
    @Value("${laya.game.server-port}")
    private int serverPort;
    /**
     * Central Server Base URL
     */
    @Value("${laya.game.central.base-url}")
    private String centralBaseUrl;
    /**
     * 心跳是否启用
     */
    @Value("${laya.game.central.heartbeat.enabled:true}")
    private boolean heartbeatEnabled;
    /**
     * 心跳接口URL
     */
    private String heartbeatUrl;
    /**
     * 是否首次心跳（用于注册检测）
     */
    private boolean isFirstHeartbeat = true;

    /**
     * 初始化
     */
    @PostConstruct
    public void initialize() {
        this.heartbeatUrl = centralBaseUrl + "/game-server/heartbeat";
        log.info("========================================");
        log.info("初始化 Central Server 心跳服务...");
        log.info("Game Server ID: {}", gameServerId);
        log.info("Game Server 地址: {}:{}", serverIp, serverPort);
        log.info("Central Server URL: {}", centralBaseUrl);
        log.info("心跳接口: {}", heartbeatUrl);
        log.info("心跳启用状态: {}", heartbeatEnabled);
        log.info("========================================");
    }

    /**
     * 定时发送心跳
     * 每5秒执行一次
     */
    @Scheduled(fixedRateString = "${laya.heartbeat-interval:5000}")
    public void sendHeartbeat() {
        if (!heartbeatEnabled) {
            return;
        }
        try {
            // 构建心跳请求
            Map<String, Object> heartbeatRequest = new HashMap<>();
            heartbeatRequest.put("gameServerId", gameServerId);
            heartbeatRequest.put("ip", serverIp);
            heartbeatRequest.put("port", serverPort);
            heartbeatRequest.put("activeConnections", getActiveConnections());
            heartbeatRequest.put("onlinePlayers", getOnlinePlayers());
            heartbeatRequest.put("timestamp", System.currentTimeMillis());
            // 发送心跳
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(heartbeatRequest, headers);
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(heartbeatUrl, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                if (isFirstHeartbeat) {
                    log.info("[OK] Game Server首次心跳成功，已自动注册到Central Server");
                    isFirstHeartbeat = false;
                } else {
                    log.debug("心跳成功发送到Central Server，负载: {}/{}", getActiveConnections(), getOnlinePlayers());
                }
            } else {
                log.warn("[WARN] 心跳失败，HTTP状态码: {}", response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("[ERROR] 发送心跳失败: {}", e.getMessage());
        }
        // 心跳失败不影响服务器运行，仅记录日志
    }

    /**
     * 手动发送心跳（用于测试或立即注册）
     */
    public void sendHeartbeatNow() {
        sendHeartbeat();
    }

    /**
     * 获取当前活跃连接数
     * TODO: 实现真实的连接数统计
     */
    private int getActiveConnections() {
        // 临时实现：返回Gateway连接数
        return gatewayRouteManager.getGatewayCount();
    }

    /**
     * 获取当前在线玩家数
     * TODO: 实现真实的在线玩家统计
     */
    private int getOnlinePlayers() {
        // 临时实现：返回路由表大小（近似值）
        // 后续从PlayerManager获取真实在线玩家数
        return gatewayRouteManager.getRouteCount();
    }

    @java.lang.SuppressWarnings("all")
    public CentralHeartbeatService(final RestTemplate restTemplate, final GatewayRouteManager gatewayRouteManager) {
        this.restTemplate = restTemplate;
        this.gatewayRouteManager = gatewayRouteManager;
    }
}
