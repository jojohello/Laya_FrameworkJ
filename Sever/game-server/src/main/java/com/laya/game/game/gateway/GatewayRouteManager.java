package com.laya.game.game.gateway;

import com.laya.game.game.protocol.BroadcastRequest;
import com.laya.game.game.protocol.GameMessage;
import com.laya.game.game.redis.RedisKeys;
import com.laya.game.game.redis.RedisService;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Gateway 路由管理器（服务端模式）
 *
 * <p>管理用户到Gateway的路由关系，支持消息路由和广播
 *
 * <p>核心功能：
 * <ul>
 *   <li>维护Gateway注册表（gatewayId → 在线状态）</li>
 *   <li>维护用户路由表（userId → gatewayId）</li>
 *   <li>双层存储：内存 + Redis（持久化）</li>
 *   <li>消息路由：发送消息给指定用户</li>
 *   <li>智能广播：自动按Gateway分组，减少网络传输</li>
 * </ul>
 *
 * @author Laya Game Server Framework
 * @version 3.0
 * @since 2025-10-30
 */
@Component
public class GatewayRouteManager {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GatewayRouteManager.class);
    /**
     * Gateway注册表（内存）
     * Key: gatewayId
     * Value: true（在线）
     */
    private final Map<String, Boolean> gatewayRegistry = new ConcurrentHashMap<>();
    /**
     * 用户路由表（内存）
     * Key: userId
     * Value: gatewayId
     */
    private final Map<String, String> userRoutes = new ConcurrentHashMap<>();
    /**
     * Redis服务（用于持久化路由表）
     */
    private final RedisService redisService;
    /**
     * Gateway WebSocket处理器（用于发送消息）
     */
    private GatewayWebSocketHandler gatewayHandler;

    /**
     * 构造函数
     *
     * @param redisService Redis服务
     */
    public GatewayRouteManager(RedisService redisService) {
        this.redisService = redisService;
    }

    /**
     * 初始化
     */
    @PostConstruct
    public void init() {
        log.info("[OK] GatewayRouteManager 初始化完成（服务端模式）");
    }

    /**
     * 设置Gateway处理器（避免循环依赖）
     *
     * @param gatewayHandler Gateway WebSocket处理器
     */
    public void setGatewayHandler(GatewayWebSocketHandler gatewayHandler) {
        this.gatewayHandler = gatewayHandler;
        log.debug("GatewayHandler已注入到RouteManager");
    }

    /**
     * 注册Gateway
     *
     * @param gatewayId Gateway ID
     */
    public void registerGateway(String gatewayId) {
        gatewayRegistry.put(gatewayId, true);
        log.info("Gateway已注册: gatewayId={}", gatewayId);
    }

    /**
     * 注销Gateway
     *
     * @param gatewayId Gateway ID
     */
    public void unregisterGateway(String gatewayId) {
        gatewayRegistry.remove(gatewayId);
        // 清理该Gateway的所有用户路由
        List<String> usersToRemove = userRoutes.entrySet().stream().filter(entry -> gatewayId.equals(entry.getValue())).map(Map.Entry::getKey).collect(Collectors.toList());
        for (String userId : usersToRemove) {
            userRoutes.remove(userId);
            // 同时清理Redis
            redisService.delete(RedisKeys.userGateway(userId));
        }
        log.info("Gateway已注销: gatewayId={}, 清理了{}个用户路由", gatewayId, usersToRemove.size());
    }

    /**
     * 更新用户路由
     *
     * <p>当收到来自Gateway的消息时，提取userId和gatewayId，更新路由表
     *
     * @param userId 用户ID
     * @param gatewayId Gateway ID
     */
    public void updateUserRoute(String userId, String gatewayId) {
        if (userId == null || userId.isEmpty()) {
            log.warn("用户ID为空，无法更新路由");
            return;
        }
        // 更新内存路由表
        String oldGatewayId = userRoutes.put(userId, gatewayId);
        // 持久化到Redis（24小时TTL）
        redisService.set(RedisKeys.userGateway(userId), gatewayId, 24, TimeUnit.HOURS);
        // 记录Gateway用户集合
        redisService.sAdd(RedisKeys.gatewayUsers(gatewayId), userId);
        if (oldGatewayId != null && !oldGatewayId.equals(gatewayId)) {
            // 从旧Gateway移除
            redisService.sRemove(RedisKeys.gatewayUsers(oldGatewayId), userId);
            log.debug("用户路由更新: userId={}, oldGateway={}, newGateway={}", userId, oldGatewayId, gatewayId);
        } else {
            log.debug("用户路由建立: userId={} → Gateway {}", userId, gatewayId);
        }
    }

    /**
     * 移除用户路由
     *
     * @param userId 用户ID
     */
    public void removeUserRoute(String userId) {
        String gatewayId = userRoutes.remove(userId);
        if (gatewayId != null) {
            redisService.delete(RedisKeys.userGateway(userId));
            redisService.sRemove(RedisKeys.gatewayUsers(gatewayId), userId);
            log.debug("用户路由已移除: userId={}", userId);
        }
    }

    /**
     * 获取用户所在Gateway
     *
     * @param userId 用户ID
     * @return gatewayId，如果不存在则返回null
     */
    public String getUserGateway(String userId) {
        // 先查内存
        String gatewayId = userRoutes.get(userId);
        // 如果内存没有，尝试从Redis恢复
        if (gatewayId == null) {
            gatewayId = redisService.get(RedisKeys.userGateway(userId), String.class);
            if (gatewayId != null) {
                userRoutes.put(userId, gatewayId);
                log.debug("从Redis恢复用户路由: userId={} → Gateway {}", userId, gatewayId);
            }
        }
        return gatewayId;
    }

    /**
     * 发送消息给指定用户
     *
     * @param userId 用户ID
     * @param message 游戏消息
     * @return 是否发送成功
     */
    public boolean sendToUser(String userId, GameMessage message) {
        if (gatewayHandler == null) {
            log.error("GatewayHandler未设置，无法发送消息");
            return false;
        }
        String gatewayId = getUserGateway(userId);
        if (gatewayId == null) {
            log.warn("用户路由不存在: userId={}", userId);
            return false;
        }
        if (!gatewayRegistry.containsKey(gatewayId)) {
            log.warn("Gateway不在线: gatewayId={}, userId={}", gatewayId, userId);
            return false;
        }
        // 构造广播请求
        BroadcastRequest request = new BroadcastRequest();
        request.setTargetUsers(Collections.singletonList(userId));
        request.setMessage(message);
        // 发送到Gateway
        return gatewayHandler.sendToGateway(gatewayId, request);
    }

    /**
     * 广播消息给多个用户
     *
     * <p>自动按Gateway分组，减少网络传输
     * <p>例如：100个用户分布在3个Gateway，只需发送3次消息
     *
     * @param userIds 用户ID列表
     * @param message 游戏消息
     * @return 成功发送的用户数
     */
    public int broadcastToUsers(List<String> userIds, GameMessage message) {
        if (gatewayHandler == null) {
            log.error("GatewayHandler未设置，无法广播消息");
            return 0;
        }
        if (userIds == null || userIds.isEmpty()) {
            return 0;
        }
        // 按Gateway分组
        Map<String, List<String>> gatewayGroups = new HashMap<>();
        for (String userId : userIds) {
            String gatewayId = getUserGateway(userId);
            if (gatewayId != null && gatewayRegistry.containsKey(gatewayId)) {
                gatewayGroups.computeIfAbsent(gatewayId, k -> new ArrayList<>()).add(userId);
            }
        }
        // 向每个Gateway发送一次
        int successCount = 0;
        for (Map.Entry<String, List<String>> entry : gatewayGroups.entrySet()) {
            String gatewayId = entry.getKey();
            List<String> users = entry.getValue();
            BroadcastRequest request = new BroadcastRequest();
            request.setTargetUsers(users);
            request.setMessage(message);
            if (gatewayHandler.sendToGateway(gatewayId, request)) {
                successCount += users.size();
            } else {
                log.warn("广播到Gateway失败: gatewayId={}, userCount={}", gatewayId, users.size());
            }
        }
        log.debug("广播消息完成: 目标用户数={}, 成功发送={}, Gateway分组数={}", userIds.size(), successCount, gatewayGroups.size());
        return successCount;
    }

    /**
     * 广播消息给房间所有玩家
     *
     * @param roomId 房间ID
     * @param message 游戏消息
     * @return 成功发送的用户数
     */
    public int broadcastToRoom(String roomId, GameMessage message) {
        // 从Redis获取房间玩家列表
        Set<Object> userObjects = redisService.sMembers(RedisKeys.roomPlayers(roomId));
        if (userObjects == null || userObjects.isEmpty()) {
            log.debug("房间无玩家: roomId={}", roomId);
            return 0;
        }
        List<String> userIds = userObjects.stream().map(Object::toString).collect(Collectors.toList());
        return broadcastToUsers(userIds, message);
    }

    /**
     * 获取在线Gateway数量
     *
     * @return Gateway数量
     */
    public int getGatewayCount() {
        return gatewayRegistry.size();
    }

    /**
     * 获取路由表大小
     *
     * @return 用户路由数量
     */
    public int getRouteCount() {
        return userRoutes.size();
    }

    /**
     * 获取所有在线Gateway ID列表
     *
     * @return Gateway ID列表
     */
    public List<String> getOnlineGateways() {
        return new ArrayList<>(gatewayRegistry.keySet());
    }

    /**
     * 检查Gateway是否在线
     *
     * @param gatewayId Gateway ID
     * @return 是否在线
     */
    public boolean isGatewayOnline(String gatewayId) {
        return gatewayRegistry.containsKey(gatewayId);
    }

    /**
     * 获取统计信息
     *
     * @return 统计信息Map
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("gatewayCount", getGatewayCount());
        stats.put("routeCount", getRouteCount());
        stats.put("onlineGateways", getOnlineGateways());
        return stats;
    }
}
