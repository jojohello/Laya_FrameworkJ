package com.laya.game.central.service;

import com.laya.game.central.model.GatewayInfo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Gateway心跳管理服务
 *
 * 负责：
 * 1. 接收Gateway心跳，首次自动注册
 * 2. 更新Gateway状态和负载信息
 * 3. 定时检查心跳超时，标记离线Gateway
 * 4. 提供Gateway列表查询
 *
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@Service
public class GatewayHeartbeatService {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GatewayHeartbeatService.class);
    /**
     * Gateway信息存储（内存）
     * Key: gatewayIp:gatewayPort
     * Value: GatewayInfo
     */
    private final ConcurrentHashMap<String, GatewayInfo> gatewayMap = new ConcurrentHashMap<>();
    @Value("${laya.central.gateway.heartbeat-timeout:90}")
    private long heartbeatTimeoutSeconds;

    /**
     * 处理Gateway心跳
     * 首次收到心跳 → 自动注册
     * 非首次 → 更新状态和负载
     */
    public void handleHeartbeat(String gatewayIp, Integer gatewayPort, Integer activeConnections, Integer authenticatedUsers, Integer waitingReconnections) {
        String key = gatewayIp + ":" + gatewayPort;
        GatewayInfo gateway = gatewayMap.get(key);
        if (gateway == null) {
            // 首次心跳 → 自动注册
            gateway = new GatewayInfo(gatewayIp, gatewayPort, activeConnections, authenticatedUsers, waitingReconnections);
            gatewayMap.put(key, gateway);
            log.info("Gateway自动注册成功: {}, 负载: {}/{}/{}", key, activeConnections, authenticatedUsers, waitingReconnections);
        } else {
            // 更新心跳和负载
            gateway.updateHeartbeat(activeConnections, authenticatedUsers, waitingReconnections);
        }
    }

    /**
     * 定时检查心跳超时
     * 每分钟执行一次
     */
    @Scheduled(fixedRate = 60000)
    public void checkHeartbeatTimeout() {
        List<String> timeoutGateways = new ArrayList<>();
        gatewayMap.forEach((key, gateway) -> {
            if (gateway.getStatus() == GatewayInfo.GatewayStatus.ONLINE && gateway.isTimeout(heartbeatTimeoutSeconds)) {
                gateway.markOffline();
                timeoutGateways.add(key);
            }
        });
        if (!timeoutGateways.isEmpty()) {
            log.warn("检测到 {} 个Gateway心跳超时，已标记为离线: {}", timeoutGateways.size(), timeoutGateways);
        }
    }

    /**
     * 获取所有Gateway信息
     */
    public List<GatewayInfo> getAllGateways() {
        return new ArrayList<>(gatewayMap.values());
    }

    /**
     * 获取所有在线Gateway
     */
    public List<GatewayInfo> getOnlineGateways() {
        return gatewayMap.values().stream().filter(g -> g.getStatus() == GatewayInfo.GatewayStatus.ONLINE).toList();
    }

    /**
     * 获取指定Gateway信息
     */
    public GatewayInfo getGateway(String gatewayIp, Integer gatewayPort) {
        String key = gatewayIp + ":" + gatewayPort;
        return gatewayMap.get(key);
    }

    /**
     * 获取Gateway统计信息
     */
    public GatewayStatistics getStatistics() {
        int totalGateways = gatewayMap.size();
        long onlineCount = gatewayMap.values().stream().filter(g -> g.getStatus() == GatewayInfo.GatewayStatus.ONLINE).count();
        int totalConnections = gatewayMap.values().stream().mapToInt(GatewayInfo::getTotalLoad).sum();
        return new GatewayStatistics(totalGateways, (int) onlineCount, totalConnections);
    }


    /**
     * Gateway统计信息
     */
    public static class GatewayStatistics {
        public final int totalGateways;
        public final int onlineGateways;
        public final int totalConnections;

        public GatewayStatistics(int totalGateways, int onlineGateways, int totalConnections) {
            this.totalGateways = totalGateways;
            this.onlineGateways = onlineGateways;
            this.totalConnections = totalConnections;
        }
    }
}
