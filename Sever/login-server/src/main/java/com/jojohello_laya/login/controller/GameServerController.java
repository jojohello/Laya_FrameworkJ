package com.jojohello_laya.login.controller;

import com.jojohello_laya.login.service.CentralDataService;
import com.jojohello_laya.login.service.CentralWebSocketClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/**
 * 游戏服务器信息控制器
 * 
 * @author laya-game
 */
@RestController
@RequestMapping("/api/gameserver")
public class GameServerController {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GameServerController.class);
    private final CentralDataService centralDataService;
    private final CentralWebSocketClient webSocketClient;

    /**
     * 获取游戏服务器列表
     * 只有在连接到中心服务器时才返回游戏服信息
     */
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> getGameServerList() {
        log.info("收到获取游戏服务器列表请求");
        try {
            // 检查WebSocket连接状态
            if (!webSocketClient.isConnected()) {
                log.warn("登录服务器未连接到中心服务器，拒绝返回游戏服信息");
                return ResponseEntity.ok(Map.of("success", false, "message", "登录服务器未连接到中心服务器，请稍后重试", "servers", Map.of(), "connectionStatus", "disconnected"));
            }
            // 获取游戏服信息
            Map<String, Object> gameServerInfo = centralDataService.getGameServerInfo();
            log.info("成功获取游戏服务器列表");
            return ResponseEntity.ok(gameServerInfo);
        } catch (Exception e) {
            log.error("获取游戏服务器列表异常: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("success", false, "message", "获取游戏服务器列表失败: " + e.getMessage(), "servers", Map.of()));
        }
    }

    /**
     * 获取连接状态
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getConnectionStatus() {
        log.debug("收到获取连接状态请求");
        try {
            Map<String, Object> status = centralDataService.checkConnectionStatus();
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("获取连接状态异常: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("success", false, "message", "获取连接状态失败: " + e.getMessage(), "websocket", Map.of("connected", false), "http", Map.of("connected", false)));
        }
    }

    /**
     * 手动重连到中心服务器
     */
    @PostMapping("/reconnect")
    public ResponseEntity<Map<String, Object>> reconnect() {
        log.info("收到手动重连请求");
        try {
            // 触发重连
            webSocketClient.connect();
            return ResponseEntity.ok(Map.of("success", true, "message", "重连请求已发送"));
        } catch (Exception e) {
            log.error("手动重连异常: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("success", false, "message", "重连失败: " + e.getMessage()));
        }
    }

    /**
     * 获取网关分配信息
     */
    @GetMapping("/gateway/{userId}")
    public ResponseEntity<Map<String, Object>> getGatewayAssignment(@PathVariable String userId) {
        log.info("收到获取网关分配请求: userId={}", userId);
        try {
            // 检查WebSocket连接状态
            if (!webSocketClient.isConnected()) {
                log.warn("登录服务器未连接到中心服务器，无法获取网关分配");
                return ResponseEntity.ok(Map.of("success", false, "message", "登录服务器未连接到中心服务器"));
            }
            Map<String, Object> gatewayInfo = centralDataService.getGatewayAssignment(userId);
            log.info("成功获取网关分配信息: userId={}", userId);
            return ResponseEntity.ok(gatewayInfo);
        } catch (Exception e) {
            log.error("获取网关分配异常: userId={}, error={}", userId, e.getMessage(), e);
            return ResponseEntity.ok(Map.of("success", false, "message", "获取网关分配失败: " + e.getMessage()));
        }
    }

    @java.lang.SuppressWarnings("all")
    public GameServerController(final CentralDataService centralDataService, final CentralWebSocketClient webSocketClient) {
        this.centralDataService = centralDataService;
        this.webSocketClient = webSocketClient;
    }
}
