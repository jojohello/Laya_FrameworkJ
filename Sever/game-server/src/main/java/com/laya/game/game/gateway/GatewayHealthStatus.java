package com.laya.game.game.gateway;

/**
 * Gateway 健康状态枚举
 *
 * @author Laya Game Server
 * @since 2025-10-29
 */
public enum GatewayHealthStatus {

    /**
     * 健康
     * Gateway 连接正常，响应正常
     */
    HEALTHY,

    /**
     * 降级
     * Gateway 偶尔失败，但还可用
     */
    DEGRADED,

    /**
     * 不健康
     * Gateway 持续失败，不建议使用
     */
    UNHEALTHY,

    /**
     * 已移除
     * Gateway 长期不可用，已从连接池移除
     */
    REMOVED
}
