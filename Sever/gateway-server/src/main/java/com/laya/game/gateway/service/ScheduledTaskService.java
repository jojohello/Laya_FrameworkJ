package com.laya.game.gateway.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * 定时任务服务
 *
 * 执行定期维护任务，如清理过期连接等
 *
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@Service
public class ScheduledTaskService {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ScheduledTaskService.class);
    private final WaitingConnectionService waitingConnectionService;
    private final CentralServerClient centralServerClient;
    private final com.laya.game.gateway.websocket.GatewayWebSocketHandler webSocketHandler;
    @Value("${laya.gateway.waiting-connection.cleanup-interval:10}")
    private int cleanupIntervalSeconds;
    @Value("${laya.gateway.server-ip}")
    private String gatewayIp;
    @Value("${laya.gateway.server-port}")
    private Integer gatewayPort;
    @Value("${laya.gateway.heartbeat.to-central-interval:30000}")
    private long heartbeatInterval;

    /**
     * 定期清理过期的等待连接
     * 每个清理间隔执行一次（默认10秒）
     */
    @Scheduled(fixedDelayString = "${laya.gateway.waiting-connection.cleanup-interval:10}000")
    public void cleanupExpiredWaitingConnections() {
        try {
            int beforeCount = waitingConnectionService.getWaitingConnectionCount();
            waitingConnectionService.cleanupExpiredConnections();
            int afterCount = waitingConnectionService.getWaitingConnectionCount();
            int cleanedCount = beforeCount - afterCount;
            if (cleanedCount > 0) {
                log.info("Scheduled cleanup: removed {} expired waiting connections, remaining: {}", cleanedCount, afterCount);
            }
        } catch (Exception e) {
            log.error("Error during scheduled cleanup of waiting connections: {}", e.getMessage(), e);
        }
    }

    // 5分钟
    /**
     * 定期打印网关状态
     * 每5分钟执行一次
     */
    @Scheduled(fixedRate = 300000)
    public void logGatewayStats() {
        try {
            int waitingCount = waitingConnectionService.getWaitingConnectionCount();
            log.info("Gateway Stats - Waiting connections: {}", waitingCount);
        } catch (Exception e) {
            log.error("Error during scheduled stats logging: {}", e.getMessage(), e);
        }
    }

    /**
     * 定期向Central Server发送心跳
     * 根据配置的间隔执行（默认30秒）
     */
    @Scheduled(fixedDelayString = "${laya.gateway.heartbeat.to-central-interval:30000}")
    public void sendHeartbeatToCentral() {
        try {
            // 获取当前负载信息
            int activeConnections = webSocketHandler.getTotalConnectionCount();
            int authenticatedUsers = webSocketHandler.getOnlineUserCount();
            int waitingReconnections = webSocketHandler.getWaitingReconnectionCount();
            // 发送心跳
            boolean success = centralServerClient.sendHeartbeat(gatewayIp, gatewayPort, activeConnections, authenticatedUsers, waitingReconnections);
            if (!success) {
                log.warn("Failed to send heartbeat to Central Server");
            }
        } catch (Exception e) {
            log.error("Error during heartbeat sending: {}", e.getMessage(), e);
        }
    }

    @java.lang.SuppressWarnings("all")
    public ScheduledTaskService(final WaitingConnectionService waitingConnectionService, final CentralServerClient centralServerClient, final com.laya.game.gateway.websocket.GatewayWebSocketHandler webSocketHandler) {
        this.waitingConnectionService = waitingConnectionService;
        this.centralServerClient = centralServerClient;
        this.webSocketHandler = webSocketHandler;
    }
}
