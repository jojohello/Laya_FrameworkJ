package com.laya.game.central.service;

import com.laya.game.central.model.GatewayAllocation;
import com.laya.game.central.repository.GatewayAllocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * 网关分配业务服务类
 * 
 * 提供网关服务器分配和负载均衡相关的业务逻辑
 * 支持30秒超时回收机制
 * 
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@Service
public class GatewayService {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GatewayService.class);
    private final GatewayAllocationRepository allocationRepository;
    private final RestTemplate restTemplate;
    @Value("${laya.central.gateway.allocation-timeout:30000}")
    private int allocationTimeoutMillis;
    @Value("${laya.central.gateway.max-allocations-per-gateway:1000}")
    private int maxConnectionsPerGateway;


    @ConfigurationProperties(prefix = "laya.central.gateway")
    @Component
    public static class GatewayConfig {
        private List<GatewayServerInfo> availableGateways;

        public List<GatewayServerInfo> getAvailableGateways() {
            return availableGateways;
        }

        public void setAvailableGateways(List<GatewayServerInfo> availableGateways) {
            this.availableGateways = availableGateways;
        }


        public static class GatewayServerInfo {
            private String ip;
            private int port;
            private int weight;

            // getters and setters
            public String getIp() {
                return ip;
            }

            public void setIp(String ip) {
                this.ip = ip;
            }

            public int getPort() {
                return port;
            }

            public void setPort(int port) {
                this.port = port;
            }

            public int getWeight() {
                return weight;
            }

            public void setWeight(int weight) {
                this.weight = weight;
            }
        }
    }

    @Autowired
    private GatewayConfig gatewayConfig;

    /**
     * 为用户分配网关服务器
     */
    @Transactional
    @CacheEvict(value = "gateway-allocations", key = "#userId")
    public GatewayAllocation allocateGateway(String userId) {
        Optional<GatewayAllocation> result = allocateGateway(userId, null, null);
        return result.orElse(null);
    }

    /**
     * 为用户分配网关服务器（支持首选网关）
     */
    @Transactional
    @CacheEvict(value = "gateway-allocations", key = "#userId")
    public Optional<GatewayAllocation> allocateGateway(String userId, String preferredGatewayIp, Integer preferredGatewayPort) {
        // 检查用户是否已有分配
        Optional<GatewayAllocation> existingAllocation = allocationRepository.findByUserIdAndStatus(userId, GatewayAllocation.AllocationStatus.ALLOCATED);
        if (existingAllocation.isPresent()) {
            GatewayAllocation allocation = existingAllocation.get();
            // 检查是否过期
            if (allocation.getExpiresAt().isAfter(LocalDateTime.now())) {
                log.debug("User {} already has valid gateway allocation: {}:{}", userId, allocation.getGatewayIp(), allocation.getGatewayPort());
                return notifyGatewayWaiting(allocation) ? Optional.of(allocation) : Optional.empty();
            } else {
                // 过期则回收
                recycleAllocation(allocation);
            }
        }
        // 选择最优网关服务器
        GatewayServer selectedGateway = selectOptimalGateway(preferredGatewayIp, preferredGatewayPort);
        if (selectedGateway == null) {
            return Optional.empty();
        }
        // 创建新分配
        GatewayAllocation allocation = new GatewayAllocation();
        allocation.setUserId(userId);
        allocation.setGatewayIp(selectedGateway.getIp());
        allocation.setGatewayPort(selectedGateway.getPort());
        allocation.setStatus(GatewayAllocation.AllocationStatus.ALLOCATED);
        allocation.setAllocatedAt(LocalDateTime.now());
        allocation.setExpiresAt(LocalDateTime.now().plusNanos(allocationTimeoutMillis * 1000000L));
        GatewayAllocation savedAllocation = allocationRepository.save(allocation);
        log.info("Allocated gateway for user {}: {}:{}, expires at {}", userId, selectedGateway.getIp(), selectedGateway.getPort(), savedAllocation.getExpiresAt());
        return notifyGatewayWaiting(savedAllocation) ? Optional.of(savedAllocation) : Optional.empty();
    }

    private boolean notifyGatewayWaiting(GatewayAllocation allocation) {
        try {
            String encodedUserId = URLEncoder.encode(allocation.getUserId(), StandardCharsets.UTF_8);
            String url = "http://" + allocation.getGatewayIp() + ":" + allocation.getGatewayPort()
                    + "/api/gateway/waiting-connection?userId=" + encodedUserId;
            restTemplate.postForEntity(url, null, Map.class);
            log.info("Notified gateway waiting list for user {} at {}:{}",
                    allocation.getUserId(), allocation.getGatewayIp(), allocation.getGatewayPort());
            return true;
        } catch (Exception e) {
            log.error("Failed to notify gateway waiting list for user {}: {}",
                    allocation.getUserId(), e.getMessage());
            return false;
        }
    }

    /**
     * 确认用户连接到网关
     */
    @Transactional
    @CacheEvict(value = "gateway-allocations", key = "#userId")
    public boolean confirmConnection(String userId) {
        return confirmConnection(userId, null, null);
    }

    /**
     * 确认用户连接到网关（指定网关信息）
     */
    @Transactional
    @CacheEvict(value = "gateway-allocations", key = "#userId")
    public boolean confirmConnection(String userId, String gatewayIp, Integer gatewayPort) {
        Optional<GatewayAllocation> allocationOpt = allocationRepository.findByUserId(userId);
        if (allocationOpt.isEmpty()) {
            log.warn("No gateway allocation found for user: {}", userId);
            return false;
        }
        GatewayAllocation allocation = allocationOpt.get();
        if (allocation.getStatus() == GatewayAllocation.AllocationStatus.CONNECTED) {
            return gatewayIp != null && gatewayPort != null
                    && gatewayIp.equals(allocation.getGatewayIp()) && gatewayPort.equals(allocation.getGatewayPort());
        }
        if (allocation.getStatus() != GatewayAllocation.AllocationStatus.ALLOCATED) {
            return false;
        }
        // 检查是否过期
        if (allocation.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("Gateway allocation expired for user: {}", userId);
            recycleAllocation(allocation);
            return false;
        }
        // 如果指定了网关信息，验证是否匹配
        if (gatewayIp != null && gatewayPort != null) {
            if (!gatewayIp.equals(allocation.getGatewayIp()) || !gatewayPort.equals(allocation.getGatewayPort())) {
                log.warn("Gateway mismatch for user {}: expected {}:{}, got {}:{}", userId, allocation.getGatewayIp(), allocation.getGatewayPort(), gatewayIp, gatewayPort);
                return false;
            }
        }
        // 确认连接
        allocationRepository.confirmConnection(userId, GatewayAllocation.AllocationStatus.ALLOCATED, GatewayAllocation.AllocationStatus.CONNECTED, LocalDateTime.now());
        log.info("Confirmed gateway connection for user {}: {}:{}", userId, allocation.getGatewayIp(), allocation.getGatewayPort());
        return true;
    }

    /**
     * 延长分配过期时间
     */
    @Transactional
    @CacheEvict(value = "gateway-allocations", key = "#userId")
    public boolean extendAllocation(String userId) {
        Optional<GatewayAllocation> allocationOpt = allocationRepository.findByUserIdAndStatus(userId, GatewayAllocation.AllocationStatus.ALLOCATED);
        if (allocationOpt.isEmpty()) {
            return false;
        }
        LocalDateTime newExpiryTime = LocalDateTime.now().plusNanos(allocationTimeoutMillis * 1000000L);
        allocationRepository.extendExpiry(userId, GatewayAllocation.AllocationStatus.ALLOCATED, newExpiryTime);
        log.debug("Extended gateway allocation for user {}, new expiry: {}", userId, newExpiryTime);
        return true;
    }

    /**
     * 延长指定网关分配的过期时间
     */
    @Transactional
    @CacheEvict(value = "gateway-allocations", key = "#userId")
    public boolean extendAllocation(String userId, String gatewayIp, Integer gatewayPort, Integer extendMinutes) {
        Optional<GatewayAllocation> allocationOpt = allocationRepository.findByUserIdAndStatus(userId, GatewayAllocation.AllocationStatus.ALLOCATED);
        if (allocationOpt.isPresent()) {
            GatewayAllocation allocation = allocationOpt.get();
            // 验证网关信息是否匹配
            if (allocation.getGatewayIp().equals(gatewayIp) && allocation.getGatewayPort().equals(gatewayPort)) {
                LocalDateTime newExpiryTime = LocalDateTime.now().plusMinutes(extendMinutes);
                allocationRepository.extendExpiry(userId, GatewayAllocation.AllocationStatus.ALLOCATED, newExpiryTime);
                log.info("Extended allocation for user: {}, gateway: {}:{}, new expiry: {}", userId, gatewayIp, gatewayPort, newExpiryTime);
                return true;
            } else {
                log.warn("Gateway mismatch for user: {}, expected: {}:{}, actual: {}:{}", userId, gatewayIp, gatewayPort, allocation.getGatewayIp(), allocation.getGatewayPort());
                return false;
            }
        }
        return false;
    }

    /**
     * 释放用户的网关分配
     */
    @Transactional
    @CacheEvict(value = "gateway-allocations", key = "#userId")
    public void releaseAllocation(String userId) {
        Optional<GatewayAllocation> allocationOpt = allocationRepository.findByUserId(userId);
        if (allocationOpt.isPresent()) {
            GatewayAllocation allocation = allocationOpt.get();
            if (allocation.getStatus() == GatewayAllocation.AllocationStatus.CONNECTED || allocation.getStatus() == GatewayAllocation.AllocationStatus.ALLOCATED) {
                allocationRepository.updateStatusByUserId(userId, GatewayAllocation.AllocationStatus.RECYCLED);
                log.info("Released gateway allocation for user {}: {}:{}", userId, allocation.getGatewayIp(), allocation.getGatewayPort());
            }
        }
    }

    /**
     * 释放指定网关的用户分配
     */
    @Transactional
    @CacheEvict(value = "gateway-allocations", key = "#userId")
    public void releaseAllocation(String userId, String gatewayIp, Integer gatewayPort) {
        Optional<GatewayAllocation> allocationOpt = allocationRepository.findByUserId(userId);
        if (allocationOpt.isPresent()) {
            GatewayAllocation allocation = allocationOpt.get();
            // 验证网关信息是否匹配
            if (allocation.getGatewayIp().equals(gatewayIp) && allocation.getGatewayPort().equals(gatewayPort)) {
                if (allocation.getStatus() == GatewayAllocation.AllocationStatus.CONNECTED || allocation.getStatus() == GatewayAllocation.AllocationStatus.ALLOCATED) {
                    allocationRepository.updateStatusByUserId(userId, GatewayAllocation.AllocationStatus.RECYCLED);
                    log.info("Released gateway allocation for user {}: {}:{}", userId, gatewayIp, gatewayPort);
                }
            } else {
                log.warn("Gateway mismatch for user: {}, expected: {}:{}, actual: {}:{}", userId, gatewayIp, gatewayPort, allocation.getGatewayIp(), allocation.getGatewayPort());
                throw new IllegalArgumentException("网关信息不匹配");
            }
        } else {
            // Release is idempotent: a repeated notification after cleanup remains successful.
            log.debug("No allocation found while releasing user {}; treating as already released", userId);
        }
    }

    /**
     * 获取用户的网关分配信息
     */
    @Cacheable(value = "gateway-allocations", key = "#userId")
    public Optional<GatewayAllocation> getUserAllocation(String userId) {
        return allocationRepository.findByUserId(userId);
    }

    /**
     * 获取用户当前的网关分配
     */
    @Cacheable(value = "gateway-allocations", key = "#userId")
    public Optional<GatewayAllocation> getUserCurrentAllocation(String userId) {
        return allocationRepository.findByUserIdAndStatus(userId, GatewayAllocation.AllocationStatus.CONNECTED).or(() -> allocationRepository.findByUserIdAndStatus(userId, GatewayAllocation.AllocationStatus.ALLOCATED));
    }

    /**
     * 获取用户分配历史
     */
    public List<GatewayAllocation> getUserAllocationHistory(String userId, Integer limit) {
        return allocationRepository.findByUserIdOrderByAllocatedAtDesc(userId).stream().limit(limit != null ? limit : 10).collect(Collectors.toList());
    }

    /**
     * 获取网关服务器负载信息
     */
    public List<GatewayLoadInfo> getGatewayLoadInfo() {
        List<Object[]> loadData = allocationRepository.findGatewayLoadBalancing(GatewayAllocation.AllocationStatus.CONNECTED);
        Map<String, GatewayLoadInfo> loadMap = new HashMap<>();
        // 初始化所有配置的网关服务器
        for (GatewayConfig.GatewayServerInfo server : gatewayConfig.getAvailableGateways()) {
            String serverKey = server.getIp() + ":" + server.getPort();
            loadMap.put(serverKey, new GatewayLoadInfo(server.getIp(), server.getPort(), 0));
        }
        // 更新实际负载
        for (Object[] data : loadData) {
            // Repository aggregates by the canonical "ip:port" key and returns a Long count.
            // Keep this boundary aligned with that tuple shape; the positional casts
            // to ip/port/load make allocation fail as soon as the first CONNECTED record exists.
            if (data == null || data.length < 2 || !(data[1] instanceof Number loadNum)) {
                log.warn("Ignoring malformed gateway load row");
                continue;
            }
            String serverKey = String.valueOf(data[0]);
            int loadVal = loadNum.intValue();
            if (loadMap.containsKey(serverKey)) {
                loadMap.get(serverKey).setCurrentLoad(loadVal);
            }
        }
        return new ArrayList<>(loadMap.values());
    }

    /**
     * 获取所有网关负载信息（别名方法）
     */
    public List<GatewayLoad> getGatewayLoads() {
        return getGatewayLoadInfo().stream().map(info -> new GatewayLoad(info.getIp(), info.getPort(), info.getCurrentLoad())).collect(Collectors.toList());
    }

    /**
     * 获取指定网关的负载信息
     */
    public Optional<GatewayLoad> getGatewayLoad(String gatewayIp, Integer gatewayPort) {
        return getGatewayLoadInfo().stream().filter(info -> gatewayIp.equals(info.getIp()) && gatewayPort.equals(info.getPort())).map(info -> new GatewayLoad(info.getIp(), info.getPort(), info.getCurrentLoad())).findFirst();
    }

    /**
     * 强制释放用户的所有分配
     */
    @Transactional
    @CacheEvict(value = "gateway-allocations", key = "#userId")
    public void forceReleaseUserAllocations(String userId) {
        List<GatewayAllocation> allocations = allocationRepository.findByUserIdOrderByAllocatedAtDesc(userId);
        for (GatewayAllocation allocation : allocations) {
            if (allocation.getStatus() == GatewayAllocation.AllocationStatus.ALLOCATED || allocation.getStatus() == GatewayAllocation.AllocationStatus.CONNECTED) {
                recycleAllocation(allocation);
            }
        }
        log.info("Force released all allocations for user: {}", userId);
    }

    /**
     * 获取分配统计信息
     */
    public AllocationStatistics getAllocationStatistics() {
        List<Object[]> statusCounts = allocationRepository.countByStatus();
        Map<GatewayAllocation.AllocationStatus, Long> statusMap = statusCounts.stream().collect(Collectors.toMap(data -> (GatewayAllocation.AllocationStatus) data[0], data -> (Long) data[1]));
        return new AllocationStatistics(statusMap);
    }

    // 每10秒执行一次
    /**
     * 定时回收过期分配
     */
    @Scheduled(fixedRate = 10000)
    @Transactional
    public void recycleExpiredAllocations() {
        LocalDateTime now = LocalDateTime.now();
        List<GatewayAllocation.AllocationStatus> expirableStatuses = Arrays.asList(GatewayAllocation.AllocationStatus.ALLOCATED);
        List<GatewayAllocation> expiredAllocations = allocationRepository.findExpiredAllocations(now, expirableStatuses);
        if (!expiredAllocations.isEmpty()) {
            allocationRepository.recycleExpiredAllocations(now, expirableStatuses, GatewayAllocation.AllocationStatus.EXPIRED);
            log.info("Recycled {} expired gateway allocations", expiredAllocations.size());
        }
        // 清理历史记录
        LocalDateTime cleanupCutoff = now.minusHours(24);
        List<GatewayAllocation.AllocationStatus> cleanupStatuses = Arrays.asList(GatewayAllocation.AllocationStatus.EXPIRED, GatewayAllocation.AllocationStatus.RECYCLED);
        allocationRepository.cleanupOldRecords(cleanupStatuses, cleanupCutoff);
    }

    /**
     * 选择最优网关服务器（支持首选网关）
     */
    private GatewayServer selectOptimalGateway(String preferredGatewayIp, Integer preferredGatewayPort) {
        List<GatewayLoadInfo> loadInfos = getGatewayLoadInfo();
        // 过滤掉负载过高的服务器
        List<GatewayLoadInfo> availableGateways = loadInfos.stream().filter(info -> info.getCurrentLoad() < maxConnectionsPerGateway).sorted(Comparator.comparingInt(GatewayLoadInfo::getCurrentLoad)).toList();
        if (availableGateways.isEmpty()) {
            log.error("No available gateway servers (all overloaded)");
            return null;
        }
        // 如果指定了首选网关，优先检查是否可用
        if (preferredGatewayIp != null && preferredGatewayPort != null) {
            Optional<GatewayLoadInfo> preferredGateway = availableGateways.stream().filter(info -> preferredGatewayIp.equals(info.getIp()) && preferredGatewayPort.equals(info.getPort())).findFirst();
            if (preferredGateway.isPresent()) {
                log.info("Using preferred gateway: {}:{}", preferredGatewayIp, preferredGatewayPort);
                return new GatewayServer(preferredGatewayIp, preferredGatewayPort);
            } else {
                log.warn("Preferred gateway {}:{} is not available, selecting optimal gateway", preferredGatewayIp, preferredGatewayPort);
            }
        }
        // 选择负载最低的服务器
        GatewayLoadInfo selected = availableGateways.get(0);
        return new GatewayServer(selected.getIp(), selected.getPort());
    }

    /**
     * 回收分配
     */
    private void recycleAllocation(GatewayAllocation allocation) {
        allocation.setStatus(GatewayAllocation.AllocationStatus.EXPIRED);
        allocationRepository.save(allocation);
        log.debug("Recycled expired allocation for user {}: {}:{}", allocation.getUserId(), allocation.getGatewayIp(), allocation.getGatewayPort());
    }


    /**
     * 网关服务器信息
     */
    public static class GatewayServer {
        private final String ip;
        private final int port;

        public GatewayServer(String ip, int port) {
            this.ip = ip;
            this.port = port;
        }

        public String getIp() {
            return ip;
        }

        public int getPort() {
            return port;
        }
    }


    /**
     * 网关负载信息
     */
    public static class GatewayLoadInfo {
        private final String ip;
        private final int port;
        private int currentLoad;

        public GatewayLoadInfo(String ip, int port, int currentLoad) {
            this.ip = ip;
            this.port = port;
            this.currentLoad = currentLoad;
        }

        public String getIp() {
            return ip;
        }

        public int getPort() {
            return port;
        }

        public int getCurrentLoad() {
            return currentLoad;
        }

        public void setCurrentLoad(int currentLoad) {
            this.currentLoad = currentLoad;
        }

        public double getLoadPercentage() {
            return (double) currentLoad / 1000 * 100; // 假设最大1000连接
        }
    }


    /**
     * 分配统计信息
     */
    public static class AllocationStatistics {
        private final Map<GatewayAllocation.AllocationStatus, Long> statusCounts;

        public AllocationStatistics(Map<GatewayAllocation.AllocationStatus, Long> statusCounts) {
            this.statusCounts = statusCounts;
        }

        public Map<GatewayAllocation.AllocationStatus, Long> getStatusCounts() {
            return statusCounts;
        }

        public long getTotalAllocations() {
            return statusCounts.values().stream().mapToLong(Long::longValue).sum();
        }

        public long getActiveAllocations() {
            return statusCounts.getOrDefault(GatewayAllocation.AllocationStatus.ALLOCATED, 0L) + statusCounts.getOrDefault(GatewayAllocation.AllocationStatus.CONNECTED, 0L);
        }
    }

    /**
     * 获取即将过期的分配
     */
    public List<GatewayAllocation> getExpiringAllocations(Integer warningMinutes) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime warningTime = now.plusMinutes(warningMinutes != null ? warningMinutes : 5);
        return allocationRepository.findAllocationsNearExpiry(now, warningTime, GatewayAllocation.AllocationStatus.ALLOCATED);
    }

    /**
     * 清理过期分配
     */
    @Transactional
    public int cleanupExpiredAllocations() {
        LocalDateTime now = LocalDateTime.now();
        List<GatewayAllocation.AllocationStatus> expirableStatuses = Arrays.asList(GatewayAllocation.AllocationStatus.ALLOCATED, GatewayAllocation.AllocationStatus.CONNECTED);
        // 获取过期分配数量
        List<GatewayAllocation> expiredAllocations = allocationRepository.findExpiredAllocations(now, expirableStatuses);
        int expiredCount = expiredAllocations.size();
        // 标记过期的分配
        allocationRepository.recycleExpiredAllocations(now, expirableStatuses, GatewayAllocation.AllocationStatus.EXPIRED);
        // 清理旧记录（7天前的过期和回收记录）
        LocalDateTime cutoffTime = now.minusDays(7);
        List<GatewayAllocation.AllocationStatus> cleanupStatuses = Arrays.asList(GatewayAllocation.AllocationStatus.EXPIRED, GatewayAllocation.AllocationStatus.RECYCLED, GatewayAllocation.AllocationStatus.FAILED);
        allocationRepository.cleanupOldRecords(cleanupStatuses, cutoffTime);
        log.info("清理过期分配完成，清理时间: {}，清理数量: {}", now, expiredCount);
        return expiredCount;
    }


    /**
     * 网关负载信息类
     */
    public static class GatewayLoad {
        private final String ip;
        private final int port;
        private final int currentLoad;

        public GatewayLoad(String ip, int port, int currentLoad) {
            this.ip = ip;
            this.port = port;
            this.currentLoad = currentLoad;
        }

        public String getIp() {
            return ip;
        }

        public int getPort() {
            return port;
        }

        public int getCurrentLoad() {
            return currentLoad;
        }

        public double getLoadPercentage() {
            return (double) currentLoad / 1000 * 100; // 假设最大连接数为1000
        }
    }

    @java.lang.SuppressWarnings("all")
    public GatewayService(final GatewayAllocationRepository allocationRepository, final RestTemplate restTemplate) {
        this.allocationRepository = allocationRepository;
        this.restTemplate = restTemplate;
    }
}