package com.laya.game.gateway.controller;

import com.laya.game.gateway.gameserver.GameServerConnectionManager;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

/**
 * Game Server变化通知回调Controller
 *
 * 接收Central Server发来的Game Server上线/下线通知
 * 立即处理连接/断开，无需等待定时刷新（实时响应）
 *
 * @author Laya Game Server Framework
 * @since 2025-11-10
 */
@RestController
@RequestMapping("/api/v1/callback")
public class GameServerCallbackController {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GameServerCallbackController.class);
    private final GameServerConnectionManager gameServerConnectionManager;

    /**
     * 接收Game Server变化通知
     *
     * @param notification 通知内容
     * @return 响应结果
     */
    @PostMapping("/game-server-change")
    public ResponseEntity<Map<String, Object>> handleGameServerChange(@RequestBody Map<String, Object> notification) {
        try {
            String type = (String) notification.get("type");
            String gameServerId = (String) notification.get("gameServerId");
            Long timestamp = ((Number) notification.get("timestamp")).longValue();
            log.info("[NOTICE] 收到Central Server通知: type={}, gameServerId={}, timestamp={}", type, gameServerId, timestamp);
            if ("GAME_SERVER_ONLINE".equals(type)) {
                // Game Server上线 - 立即建立连接
                String ip = (String) notification.get("ip");
                Integer port = (Integer) notification.get("port");
                log.info("[ONLINE] Game Server上线: {}  地址: {}:{}", gameServerId, ip, port);
                // 构建WebSocket URL
                String wsUrl = "ws://" + ip + ":" + port + "/ws/gateway";
                // 立即建立连接（无需等待定时刷新）
                gameServerConnectionManager.handleGameServerOnline(gameServerId, wsUrl);
            } else if ("GAME_SERVER_OFFLINE".equals(type)) {
                // Game Server下线 - 立即停止重连并断开
                String reason = (String) notification.get("reason");
                log.info("[OFFLINE] Game Server下线: {} 原因: {}", gameServerId, reason);
                // 立即停止重连并断开连接（无需等待定时刷新）
                gameServerConnectionManager.handleGameServerOffline(gameServerId);
            }
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "通知已接收");
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("[ERROR] 处理Game Server变化通知失败: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "处理失败: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @java.lang.SuppressWarnings("all")
    public GameServerCallbackController(final GameServerConnectionManager gameServerConnectionManager) {
        this.gameServerConnectionManager = gameServerConnectionManager;
    }
}
