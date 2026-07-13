package com.laya.game.central.dto;

/**
 * Game Server 心跳请求
 *
 * @author Laya Framework
 * @since 2025-11-10
 */
public class GameServerHeartbeatRequest {
    /**
     * Game Server ID
     */
    private String gameServerId;
    /**
     * IP地址
     */
    private String ip;
    /**
     * 端口
     */
    private Integer port;
    /**
     * 当前活跃连接数
     */
    private Integer activeConnections;
    /**
     * 当前在线玩家数
     */
    private Integer onlinePlayers;
    /**
     * 时间戳
     */
    private Long timestamp;

    /**
     * Game Server ID
     */
    @java.lang.SuppressWarnings("all")
    public String getGameServerId() {
        return this.gameServerId;
    }

    /**
     * IP地址
     */
    @java.lang.SuppressWarnings("all")
    public String getIp() {
        return this.ip;
    }

    /**
     * 端口
     */
    @java.lang.SuppressWarnings("all")
    public Integer getPort() {
        return this.port;
    }

    /**
     * 当前活跃连接数
     */
    @java.lang.SuppressWarnings("all")
    public Integer getActiveConnections() {
        return this.activeConnections;
    }

    /**
     * 当前在线玩家数
     */
    @java.lang.SuppressWarnings("all")
    public Integer getOnlinePlayers() {
        return this.onlinePlayers;
    }

    /**
     * 时间戳
     */
    @java.lang.SuppressWarnings("all")
    public Long getTimestamp() {
        return this.timestamp;
    }

    /**
     * Game Server ID
     */
    @java.lang.SuppressWarnings("all")
    public void setGameServerId(final String gameServerId) {
        this.gameServerId = gameServerId;
    }

    /**
     * IP地址
     */
    @java.lang.SuppressWarnings("all")
    public void setIp(final String ip) {
        this.ip = ip;
    }

    /**
     * 端口
     */
    @java.lang.SuppressWarnings("all")
    public void setPort(final Integer port) {
        this.port = port;
    }

    /**
     * 当前活跃连接数
     */
    @java.lang.SuppressWarnings("all")
    public void setActiveConnections(final Integer activeConnections) {
        this.activeConnections = activeConnections;
    }

    /**
     * 当前在线玩家数
     */
    @java.lang.SuppressWarnings("all")
    public void setOnlinePlayers(final Integer onlinePlayers) {
        this.onlinePlayers = onlinePlayers;
    }

    /**
     * 时间戳
     */
    @java.lang.SuppressWarnings("all")
    public void setTimestamp(final Long timestamp) {
        this.timestamp = timestamp;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public boolean equals(final java.lang.Object o) {
        if (o == this) return true;
        if (!(o instanceof GameServerHeartbeatRequest)) return false;
        final GameServerHeartbeatRequest other = (GameServerHeartbeatRequest) o;
        if (!other.canEqual((java.lang.Object) this)) return false;
        final java.lang.Object this$port = this.getPort();
        final java.lang.Object other$port = other.getPort();
        if (this$port == null ? other$port != null : !this$port.equals(other$port)) return false;
        final java.lang.Object this$activeConnections = this.getActiveConnections();
        final java.lang.Object other$activeConnections = other.getActiveConnections();
        if (this$activeConnections == null ? other$activeConnections != null : !this$activeConnections.equals(other$activeConnections)) return false;
        final java.lang.Object this$onlinePlayers = this.getOnlinePlayers();
        final java.lang.Object other$onlinePlayers = other.getOnlinePlayers();
        if (this$onlinePlayers == null ? other$onlinePlayers != null : !this$onlinePlayers.equals(other$onlinePlayers)) return false;
        final java.lang.Object this$timestamp = this.getTimestamp();
        final java.lang.Object other$timestamp = other.getTimestamp();
        if (this$timestamp == null ? other$timestamp != null : !this$timestamp.equals(other$timestamp)) return false;
        final java.lang.Object this$gameServerId = this.getGameServerId();
        final java.lang.Object other$gameServerId = other.getGameServerId();
        if (this$gameServerId == null ? other$gameServerId != null : !this$gameServerId.equals(other$gameServerId)) return false;
        final java.lang.Object this$ip = this.getIp();
        final java.lang.Object other$ip = other.getIp();
        if (this$ip == null ? other$ip != null : !this$ip.equals(other$ip)) return false;
        return true;
    }

    @java.lang.SuppressWarnings("all")
    protected boolean canEqual(final java.lang.Object other) {
        return other instanceof GameServerHeartbeatRequest;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public int hashCode() {
        final int PRIME = 59;
        int result = 1;
        final java.lang.Object $port = this.getPort();
        result = result * PRIME + ($port == null ? 43 : $port.hashCode());
        final java.lang.Object $activeConnections = this.getActiveConnections();
        result = result * PRIME + ($activeConnections == null ? 43 : $activeConnections.hashCode());
        final java.lang.Object $onlinePlayers = this.getOnlinePlayers();
        result = result * PRIME + ($onlinePlayers == null ? 43 : $onlinePlayers.hashCode());
        final java.lang.Object $timestamp = this.getTimestamp();
        result = result * PRIME + ($timestamp == null ? 43 : $timestamp.hashCode());
        final java.lang.Object $gameServerId = this.getGameServerId();
        result = result * PRIME + ($gameServerId == null ? 43 : $gameServerId.hashCode());
        final java.lang.Object $ip = this.getIp();
        result = result * PRIME + ($ip == null ? 43 : $ip.hashCode());
        return result;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public java.lang.String toString() {
        return "GameServerHeartbeatRequest(gameServerId=" + this.getGameServerId() + ", ip=" + this.getIp() + ", port=" + this.getPort() + ", activeConnections=" + this.getActiveConnections() + ", onlinePlayers=" + this.getOnlinePlayers() + ", timestamp=" + this.getTimestamp() + ")";
    }

    @java.lang.SuppressWarnings("all")
    public GameServerHeartbeatRequest() {
    }

    @java.lang.SuppressWarnings("all")
    public GameServerHeartbeatRequest(final String gameServerId, final String ip, final Integer port, final Integer activeConnections, final Integer onlinePlayers, final Long timestamp) {
        this.gameServerId = gameServerId;
        this.ip = ip;
        this.port = port;
        this.activeConnections = activeConnections;
        this.onlinePlayers = onlinePlayers;
        this.timestamp = timestamp;
    }
}
