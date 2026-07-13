package com.laya.game.game.central;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import jakarta.annotation.PreDestroy;
import java.util.HashMap;
import java.util.Map;

/**
 * 优雅关闭管理器
 *
 * 功能：
 * 1. 监听JVM关闭信号（SIGTERM, SIGINT）
 * 2. 发送注销请求到Central Server
 * 3. Central Server通知所有Gateway断开连接
 *
 * @author Laya Game Server Framework
 * @since 2025-11-10
 */
@Service
public class GracefulShutdownManager {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GracefulShutdownManager.class);
    private final RestTemplate restTemplate;
    /**
     * Game Server ID
     */
    @Value("${laya.game.server-id}")
    private String gameServerId;
    /**
     * Central Server Base URL
     */
    @Value("${laya.game.central.base-url}")
    private String centralBaseUrl;
    /**
     * 注销接口URL
     */
    private String unregisterUrl;

    /**
     * PreDestroy钩子
     * 在Spring容器销毁前执行，发送注销请求
     */
    @PreDestroy
    public void onShutdown() {
        log.info("========================================");
        log.info("检测到服务器关闭信号，开始优雅关闭流程...");
        log.info("========================================");
        try {
            unregisterUrl = centralBaseUrl + "/game-server/unregister";
            // 构建注销请求
            Map<String, Object> unregisterRequest = new HashMap<>();
            unregisterRequest.put("gameServerId", gameServerId);
            unregisterRequest.put("reason", "GRACEFUL_SHUTDOWN");
            // 发送注销请求
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(unregisterRequest, headers);
            log.info("发送注销请求到Central Server...");
            log.info("URL: {}", unregisterUrl);
            log.info("Game Server ID: {}", gameServerId);
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(unregisterUrl, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("[OK] 注销请求发送成功，Central Server已通知所有Gateway");
            } else {
                log.warn("[WARN] 注销请求失败，HTTP状态码: {}", response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("[ERROR] 发送注销请求失败: {}", e.getMessage());
        }
        // 等待一小段时间，确保消息发送完成
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        log.info("========================================");
        log.info("优雅关闭流程完成");
        log.info("========================================");
    }

    /**
     * 手动触发注销（用于测试）
     */
    public void unregisterNow() {
        onShutdown();
    }

    @java.lang.SuppressWarnings("all")
    public GracefulShutdownManager(final RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
}
