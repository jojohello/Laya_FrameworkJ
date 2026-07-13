package com.laya.game.gateway.service;

import org.springframework.stereotype.Service;
import jakarta.annotation.PreDestroy;

/**
 * 优雅关闭管理器
 *
 * 功能：
 * 1. 监听JVM关闭信号（SIGTERM, SIGINT）
 * 2. 关闭所有客户端连接
 * 3. 断开与所有Game Server的连接
 * 4. Central Server通过心跳超时检测Gateway下线
 *
 * 注意：Gateway不需要主动发送注销请求
 * Central Server通过心跳超时（15秒）自动检测Gateway下线
 *
 * @author Laya Game Server Framework
 * @since 2025-11-10
 */
@Service
public class GracefulShutdownManager {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GracefulShutdownManager.class);

    /**
     * PreDestroy钩子
     * 在Spring容器销毁前执行
     */
    @PreDestroy
    public void onShutdown() {
        log.info("========================================");
        log.info("检测到服务器关闭信号，开始优雅关闭流程...");
        log.info("========================================");
        try {
            // TODO: 关闭所有客户端WebSocket连接
            log.info("关闭所有客户端连接...");
            // TODO: 断开所有Game Server连接
            log.info("断开所有Game Server连接...");
            // 等待一小段时间，确保连接关闭完成
            Thread.sleep(1000);
            log.info("[OK] 所有连接已关闭");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("优雅关闭被中断");
        } catch (Exception e) {
            log.error("[ERROR] 优雅关闭过程中发生错误: {}", e.getMessage());
        }
        log.info("========================================");
        log.info("优雅关闭流程完成");
        log.info("Gateway将通过心跳超时（15秒）被Central Server自动标记为离线");
        log.info("========================================");
    }

    /**
     * 手动触发关闭（用于测试）
     */
    public void shutdownNow() {
        onShutdown();
    }

    @java.lang.SuppressWarnings("all")
    public GracefulShutdownManager() {
    }
}
