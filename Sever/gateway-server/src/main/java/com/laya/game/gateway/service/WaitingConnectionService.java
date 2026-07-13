package com.laya.game.gateway.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 等待连接服务
 *
 * 管理等待连接的用户链表，实现30秒超时机制
 * 与中心数据服务器协调网关分配验证
 *
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@Service
public class WaitingConnectionService {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(WaitingConnectionService.class);
    @Value("${laya.gateway.waiting-connection.timeout:30}")
    private int waitingTimeoutSeconds;
    // 等待连接的用户列表 - userId -> 添加时间
    private final Map<String, LocalDateTime> waitingConnections = new ConcurrentHashMap<>();

    /**
     * 添加用户到等待连接链表
     * 这个方法会被中心数据服务器调用
     */
    public void addToWaitingList(String userId) {
        LocalDateTime now = LocalDateTime.now();
        waitingConnections.put(userId, now);
        log.info("Added user {} to waiting connection list at {}", userId, now);
    }

    /**
     * 检查用户是否在等待连接链表中
     */
    public boolean checkWaitingConnection(String userId) {
        LocalDateTime addTime = waitingConnections.get(userId);
        if (addTime == null) {
            log.warn("User {} not found in waiting connection list", userId);
            return false;
        }
        // 检查是否超时
        LocalDateTime now = LocalDateTime.now();
        if (addTime.plusSeconds(waitingTimeoutSeconds).isBefore(now)) {
            log.warn("User {} waiting connection expired, added at {}, now {}", userId, addTime, now);
            waitingConnections.remove(userId);
            return false;
        }
        return true;
    }

    /**
     * 从等待连接链表中移除用户
     */
    public void removeFromWaitingList(String userId) {
        LocalDateTime removedTime = waitingConnections.remove(userId);
        if (removedTime != null) {
            log.info("Removed user {} from waiting connection list, was added at {}", userId, removedTime);
        }
    }

    /**
     * 清理过期的等待连接
     */
    public void cleanupExpiredConnections() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusSeconds(waitingTimeoutSeconds);
        waitingConnections.entrySet().removeIf(entry -> {
            boolean expired = entry.getValue().isBefore(cutoffTime);
            if (expired) {
                log.info("Cleaning up expired waiting connection for user {}, added at {}", entry.getKey(), entry.getValue());
            }
            return expired;
        });
    }

    /**
     * 获取等待连接的用户数量
     */
    public int getWaitingConnectionCount() {
        return waitingConnections.size();
    }

    /**
     * 获取指定用户的等待时间（秒）
     */
    public long getWaitingTimeSeconds(String userId) {
        LocalDateTime addTime = waitingConnections.get(userId);
        if (addTime == null) {
            return -1;
        }
        return java.time.Duration.between(addTime, LocalDateTime.now()).getSeconds();
    }
}
