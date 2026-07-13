package com.laya.game.gateway.controller;

import com.laya.game.gateway.protocol.MessageIds;
import com.laya.game.gateway.service.WaitingConnectionService;
import com.laya.game.gateway.websocket.GatewayWebSocketHandler;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/**
 * Gateway Controller
 *
 * 提供给中心数据服务器调用的REST API接口
 * 处理网关分配通知、等待连接管理等功能
 *
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@RestController
@RequestMapping("/api/gateway")
public class GatewayController {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GatewayController.class);
    private final WaitingConnectionService waitingConnectionService;
    private final GatewayWebSocketHandler gatewayWebSocketHandler;

    /**
     * 添加用户到等待连接链表
     * 由中心数据服务器调用
     */
    @PostMapping("/waiting-connection")
    public ResponseEntity<Map<String, Object>> addWaitingConnection(@RequestParam String userId) {
        try {
            waitingConnectionService.addToWaitingList(userId);
            log.info("Added user {} to waiting connection list via API", userId);
            return ResponseEntity.ok(Map.of("success", true, "message", "User added to waiting connection list", "userId", userId, "timestamp", System.currentTimeMillis()));
        } catch (Exception e) {
            log.error("Failed to add user {} to waiting connection list: {}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to add user to waiting connection list", "error", e.getMessage(), "timestamp", System.currentTimeMillis()));
        }
    }

    /**
     * 移除用户的等待连接
     */
    @DeleteMapping("/waiting-connection")
    public ResponseEntity<Map<String, Object>> removeWaitingConnection(@RequestParam String userId) {
        try {
            waitingConnectionService.removeFromWaitingList(userId);
            log.info("Removed user {} from waiting connection list via API", userId);
            return ResponseEntity.ok(Map.of("success", true, "message", "User removed from waiting connection list", "userId", userId, "timestamp", System.currentTimeMillis()));
        } catch (Exception e) {
            log.error("Failed to remove user {} from waiting connection list: {}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to remove user from waiting connection list", "error", e.getMessage(), "timestamp", System.currentTimeMillis()));
        }
    }

    /**
     * 检查用户是否在等待连接链表中
     */
    @GetMapping("/waiting-connection/{userId}")
    public ResponseEntity<Map<String, Object>> checkWaitingConnection(@PathVariable String userId) {
        try {
            boolean isWaiting = waitingConnectionService.checkWaitingConnection(userId);
            long waitingTime = waitingConnectionService.getWaitingTimeSeconds(userId);
            return ResponseEntity.ok(Map.of("success", true, "userId", userId, "isWaiting", isWaiting, "waitingTimeSeconds", waitingTime, "timestamp", System.currentTimeMillis()));
        } catch (Exception e) {
            log.error("Failed to check waiting connection for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to check waiting connection", "error", e.getMessage(), "timestamp", System.currentTimeMillis()));
        }
    }

    /**
     * 获取网关状态信息
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getGatewayStatus() {
        try {
            int onlineUsers = gatewayWebSocketHandler.getOnlineUserCount();
            int totalConnections = gatewayWebSocketHandler.getTotalConnectionCount();
            int waitingConnections = waitingConnectionService.getWaitingConnectionCount();
            return ResponseEntity.ok(Map.of("success", true, "status", "running", "onlineUsers", onlineUsers, "totalConnections", totalConnections, "waitingConnections", waitingConnections, "timestamp", System.currentTimeMillis()));
        } catch (Exception e) {
            log.error("Failed to get gateway status: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to get gateway status", "error", e.getMessage(), "timestamp", System.currentTimeMillis()));
        }
    }

    /**
     * 清理过期的等待连接
     */
    @PostMapping("/cleanup-expired")
    public ResponseEntity<Map<String, Object>> cleanupExpiredConnections() {
        try {
            waitingConnectionService.cleanupExpiredConnections();
            log.info("Cleaned up expired waiting connections via API");
            return ResponseEntity.ok(Map.of("success", true, "message", "Expired waiting connections cleaned up", "timestamp", System.currentTimeMillis()));
        } catch (Exception e) {
            log.error("Failed to cleanup expired connections: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to cleanup expired connections", "error", e.getMessage(), "timestamp", System.currentTimeMillis()));
        }
    }

    /**
     * 向指定用户发送消息
     *
     * API接口兼容性：
     * - 接受参数可以是 msgId (Short) 或 type (String，向后兼容)
     * - 优先使用 msgId，如果没有则尝试解析 type
     */
    @PostMapping("/message/{userId}")
    public ResponseEntity<Map<String, Object>> sendMessageToUser(@PathVariable String userId, @RequestBody Map<String, Object> messageData) {
        try {
            // 提取 msgId（优先）或 type（兼容旧API）
            Short msgId = null;
            if (messageData.containsKey("msgId")) {
                Object msgIdObj = messageData.get("msgId");
                if (msgIdObj instanceof Number) {
                    msgId = ((Number) msgIdObj).shortValue();
                }
            } else if (messageData.containsKey("type")) {
                // 向后兼容：尝试将type转换为msgId
                String type = (String) messageData.get("type");
                msgId = MessageIds.NOTIFICATION; // 默认使用 NOTIFICATION
                log.warn("API使用了已废弃的\'type\'字段: {}, 已转换为msgId={}", type, msgId);
            }
            if (msgId == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Missing msgId or type field", "timestamp", System.currentTimeMillis()));
            }
            String message = (String) messageData.get("message");
            Object data = messageData.get("data");
            GatewayWebSocketHandler.WebSocketMessage wsMessage = new GatewayWebSocketHandler.WebSocketMessage(msgId, message, data);
            boolean sent = gatewayWebSocketHandler.sendMessageToUser(userId, wsMessage);
            if (sent) {
                log.info("Message sent to user {} via API: msgId={} ({})", userId, msgId, MessageIds.getName(msgId));
                return ResponseEntity.ok(Map.of("success", true, "message", "Message sent successfully", "userId", userId, "msgId", msgId, "timestamp", System.currentTimeMillis()));
            } else {
                log.warn("Failed to send message to user {} - user not online", userId);
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "User not online or not connected", "userId", userId, "timestamp", System.currentTimeMillis()));
            }
        } catch (Exception e) {
            log.error("Failed to send message to user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to send message", "error", e.getMessage(), "timestamp", System.currentTimeMillis()));
        }
    }

    /**
     * 健康检查
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "gateway-server", "timestamp", System.currentTimeMillis()));
    }

    @java.lang.SuppressWarnings("all")
    public GatewayController(final WaitingConnectionService waitingConnectionService, final GatewayWebSocketHandler gatewayWebSocketHandler) {
        this.waitingConnectionService = waitingConnectionService;
        this.gatewayWebSocketHandler = gatewayWebSocketHandler;
    }
}
