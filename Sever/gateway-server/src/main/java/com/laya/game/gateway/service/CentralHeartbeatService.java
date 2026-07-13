package com.laya.game.gateway.service;

import com.laya.game.gateway.websocket.GatewayWebSocketHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

/**
 * Central Server 心跳服务
 *
 * 功能：
 * 1. 定时发送心跳到Central Server（5秒间隔）
 * 2. 首次心跳自动注册Gateway
 * 3. 上报Gateway负载信息（连接数、认证用户数、等待重连数）
 * 4. 首次心跳时从Central获取Game Server列表
 *
 * @author Laya Game Server Framework
 * @since 2025-11-10
 */
@Service
public class CentralHeartbeatService {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(CentralHeartbeatService.class);
    private final CentralServerClient centralServerClient;
    private final GatewayWebSocketHandler gatewayWebSocketHandler;
    private final WaitingConnectionService waitingConnectionService;
    /**
     * Gateway IP
     */
    @Value("${laya.gateway.server-ip}")
    private String gatewayIp;
    /**
     * Gateway Port
     */
    @Value("${laya.gateway.server-port}")
    private int gatewayPort;
    /**
     * Gateway ID
     */
    @Value("${laya.gateway.id}")
    private String gatewayId;
    /**
     * 是否首次心跳（用于注册检测和获取Game Server列表）
     */
    private boolean isFirstHeartbeat = true;

    /**
     * 初始化
     */
    @PostConstruct
    public void initialize() {
        log.info("========================================");
        log.info("初始化 Central Server 心跳服务...");
        log.info("Gateway ID: {}", gatewayId);
        log.info("Gateway 地址: {}:{}", gatewayIp, gatewayPort);
        log.info("========================================");
    }

    /**
     * 定时发送心跳
     * 每5秒执行一次
     */
    @Scheduled(fixedRateString = "${laya.heartbeat-interval:5000}")
    public void sendHeartbeat() {
        try {
            // 获取当前负载信息
            int activeConnections = gatewayWebSocketHandler.getTotalConnectionCount();
            int authenticatedUsers = gatewayWebSocketHandler.getOnlineUserCount();
            int waitingReconnections = waitingConnectionService.getWaitingConnectionCount();
            // 发送心跳
            boolean success = centralServerClient.sendHeartbeat(gatewayIp, gatewayPort, activeConnections, authenticatedUsers, waitingReconnections);
            if (success) {
                if (isFirstHeartbeat) {
                    log.info("[OK] Gateway首次心跳成功，已自动注册到Central Server");
                    log.info("正在从Central Server获取Game Server列表...");
                    // 首次心跳成功后，获取Game Server列表
                    // TODO: 处理Game Server列表，建立连接
                    // GameServerConnectionManager会自动处理
                    isFirstHeartbeat = false;
                } else {
                    log.debug("心跳成功发送到Central Server，负载: {}/{}/{}", activeConnections, authenticatedUsers, waitingReconnections);
                }
            } else {
                log.warn("[WARN] 心跳发送失败");
            }
        } catch (Exception e) {
            log.error("[ERROR] 发送心跳异常: {}", e.getMessage());
        }
        // 心跳失败不影响服务器运行，仅记录日志
    }

    /**
     * 手动发送心跳（用于测试或立即注册）
     */
    public void sendHeartbeatNow() {
        sendHeartbeat();
    }

    @java.lang.SuppressWarnings("all")
    public CentralHeartbeatService(final CentralServerClient centralServerClient, final GatewayWebSocketHandler gatewayWebSocketHandler, final WaitingConnectionService waitingConnectionService) {
        this.centralServerClient = centralServerClient;
        this.gatewayWebSocketHandler = gatewayWebSocketHandler;
        this.waitingConnectionService = waitingConnectionService;
    }
}
