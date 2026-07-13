package com.laya.game.central.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.laya.game.central.dto.GameServerHeartbeatRequest;
import com.laya.game.central.dto.GameServerHeartbeatResponse;
import com.laya.game.central.dto.GameServerUnregisterRequest;
import com.laya.game.central.model.GameServerInfo;
import com.laya.game.central.service.GameServerRegistry;

/**
 * Game Server控制器
 *
 * 提供Game Server注册、心跳、查询等API
 *
 * @author Laya Game Server Framework
 * @since 2025-10-30
 */
@RestController
@RequestMapping("/api/v1/game-server")
public class GameServerController {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GameServerController.class);
    private final GameServerRegistry gameServerRegistry;

    /**
     * 获取Game Server列表
     *
     * @return Game Server列表
     */
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> getGameServerList() {
        try {
            List<GameServerInfo> gameServers = gameServerRegistry.getOnlineGameServers();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "查询成功");
            response.put("data", gameServers);
            response.put("timestamp", System.currentTimeMillis());
            log.debug("查询Game Server列表成功，共{}个在线", gameServers.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("查询Game Server列表失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "查询失败: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 获取指定Game Server信息
     *
     * @param gameServerId Game Server ID
     * @return Game Server信息
     */
    @GetMapping("/{gameServerId}")
    public ResponseEntity<Map<String, Object>> getGameServer(@PathVariable String gameServerId) {
        try {
            GameServerInfo gameServer = gameServerRegistry.getGameServer(gameServerId);
            if (gameServer == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Game Server不存在");
                response.put("timestamp", System.currentTimeMillis());
                return ResponseEntity.notFound().build();
            }
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "查询成功");
            response.put("data", gameServer);
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("查询Game Server失败: {}", gameServerId, e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "查询失败: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Game Server心跳
     * 首次心跳自动注册，通知所有Gateway上线
     * 后续心跳更新负载信息
     *
     * @param request 心跳请求
     * @return 心跳响应
     */
    @PostMapping("/heartbeat")
    public ResponseEntity<GameServerHeartbeatResponse> heartbeat(@RequestBody GameServerHeartbeatRequest request) {
        try {
            GameServerHeartbeatResponse response = gameServerRegistry.handleHeartbeat(request);
            log.debug("Game Server {} 心跳成功，负载: {}/{}", request.getGameServerId(), request.getActiveConnections(), request.getOnlinePlayers());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Game Server心跳失败: {}", request.getGameServerId(), e);
            return ResponseEntity.internalServerError().body(GameServerHeartbeatResponse.failed("心跳失败: " + e.getMessage()));
        }
    }

    /**
     * 注销Game Server（优雅关闭）
     * 通知所有Gateway下线
     *
     * @param request 注销请求
     * @return 注销结果
     */
    @PostMapping("/unregister")
    public ResponseEntity<Map<String, Object>> unregisterGameServer(@RequestBody GameServerUnregisterRequest request) {
        try {
            gameServerRegistry.handleUnregister(request.getGameServerId(), request.getReason());
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "注销成功");
            response.put("timestamp", System.currentTimeMillis());
            log.info("Game Server注销成功: {}, 原因: {}", request.getGameServerId(), request.getReason());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Game Server注销失败: {}", request.getGameServerId(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "注销失败: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 获取统计信息
     *
     * @return 统计信息
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        try {
            int onlineCount = gameServerRegistry.getOnlineCount();
            int totalCount = gameServerRegistry.getAllGameServers().size();
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalCount", totalCount);
            stats.put("onlineCount", onlineCount);
            stats.put("offlineCount", totalCount - onlineCount);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "查询成功");
            response.put("data", stats);
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("查询统计信息失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "查询失败: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @java.lang.SuppressWarnings("all")
    public GameServerController(final GameServerRegistry gameServerRegistry) {
        this.gameServerRegistry = gameServerRegistry;
    }
}
