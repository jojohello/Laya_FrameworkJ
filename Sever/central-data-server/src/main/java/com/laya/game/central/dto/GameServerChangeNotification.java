package com.laya.game.central.dto;

/**
 * Game Server 变化通知（发送给Gateway）
 *
 * @author Laya Framework
 * @since 2025-11-10
 */
public class GameServerChangeNotification {
    /**
     * 通知类型
     * - GAME_SERVER_ONLINE: Game Server 上线
     * - GAME_SERVER_OFFLINE: Game Server 下线
     */
    private String type;
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
     * 原因（仅下线时有值）
     * - GRACEFUL_SHUTDOWN: 优雅关闭
     * - HEARTBEAT_TIMEOUT: 心跳超时
     */
    private String reason;
    /**
     * 时间戳
     */
    private Long timestamp;

    /**
     * 创建上线通知
     */
    public static GameServerChangeNotification online(String gameServerId, String ip, Integer port) {
        return new GameServerChangeNotification("GAME_SERVER_ONLINE", gameServerId, ip, port, null, System.currentTimeMillis());
    }

    /**
     * 创建下线通知
     */
    public static GameServerChangeNotification offline(String gameServerId, String reason) {
        return new GameServerChangeNotification("GAME_SERVER_OFFLINE", gameServerId, null, null, reason, System.currentTimeMillis());
    }

    /**
     * 通知类型
     * - GAME_SERVER_ONLINE: Game Server 上线
     * - GAME_SERVER_OFFLINE: Game Server 下线
     */
    @java.lang.SuppressWarnings("all")
    public String getType() {
        return this.type;
    }

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
     * 原因（仅下线时有值）
     * - GRACEFUL_SHUTDOWN: 优雅关闭
     * - HEARTBEAT_TIMEOUT: 心跳超时
     */
    @java.lang.SuppressWarnings("all")
    public String getReason() {
        return this.reason;
    }

    /**
     * 时间戳
     */
    @java.lang.SuppressWarnings("all")
    public Long getTimestamp() {
        return this.timestamp;
    }

    /**
     * 通知类型
     * - GAME_SERVER_ONLINE: Game Server 上线
     * - GAME_SERVER_OFFLINE: Game Server 下线
     */
    @java.lang.SuppressWarnings("all")
    public void setType(final String type) {
        this.type = type;
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
     * 原因（仅下线时有值）
     * - GRACEFUL_SHUTDOWN: 优雅关闭
     * - HEARTBEAT_TIMEOUT: 心跳超时
     */
    @java.lang.SuppressWarnings("all")
    public void setReason(final String reason) {
        this.reason = reason;
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
        if (!(o instanceof GameServerChangeNotification)) return false;
        final GameServerChangeNotification other = (GameServerChangeNotification) o;
        if (!other.canEqual((java.lang.Object) this)) return false;
        final java.lang.Object this$port = this.getPort();
        final java.lang.Object other$port = other.getPort();
        if (this$port == null ? other$port != null : !this$port.equals(other$port)) return false;
        final java.lang.Object this$timestamp = this.getTimestamp();
        final java.lang.Object other$timestamp = other.getTimestamp();
        if (this$timestamp == null ? other$timestamp != null : !this$timestamp.equals(other$timestamp)) return false;
        final java.lang.Object this$type = this.getType();
        final java.lang.Object other$type = other.getType();
        if (this$type == null ? other$type != null : !this$type.equals(other$type)) return false;
        final java.lang.Object this$gameServerId = this.getGameServerId();
        final java.lang.Object other$gameServerId = other.getGameServerId();
        if (this$gameServerId == null ? other$gameServerId != null : !this$gameServerId.equals(other$gameServerId)) return false;
        final java.lang.Object this$ip = this.getIp();
        final java.lang.Object other$ip = other.getIp();
        if (this$ip == null ? other$ip != null : !this$ip.equals(other$ip)) return false;
        final java.lang.Object this$reason = this.getReason();
        final java.lang.Object other$reason = other.getReason();
        if (this$reason == null ? other$reason != null : !this$reason.equals(other$reason)) return false;
        return true;
    }

    @java.lang.SuppressWarnings("all")
    protected boolean canEqual(final java.lang.Object other) {
        return other instanceof GameServerChangeNotification;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public int hashCode() {
        final int PRIME = 59;
        int result = 1;
        final java.lang.Object $port = this.getPort();
        result = result * PRIME + ($port == null ? 43 : $port.hashCode());
        final java.lang.Object $timestamp = this.getTimestamp();
        result = result * PRIME + ($timestamp == null ? 43 : $timestamp.hashCode());
        final java.lang.Object $type = this.getType();
        result = result * PRIME + ($type == null ? 43 : $type.hashCode());
        final java.lang.Object $gameServerId = this.getGameServerId();
        result = result * PRIME + ($gameServerId == null ? 43 : $gameServerId.hashCode());
        final java.lang.Object $ip = this.getIp();
        result = result * PRIME + ($ip == null ? 43 : $ip.hashCode());
        final java.lang.Object $reason = this.getReason();
        result = result * PRIME + ($reason == null ? 43 : $reason.hashCode());
        return result;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public java.lang.String toString() {
        return "GameServerChangeNotification(type=" + this.getType() + ", gameServerId=" + this.getGameServerId() + ", ip=" + this.getIp() + ", port=" + this.getPort() + ", reason=" + this.getReason() + ", timestamp=" + this.getTimestamp() + ")";
    }

    @java.lang.SuppressWarnings("all")
    public GameServerChangeNotification() {
    }

    @java.lang.SuppressWarnings("all")
    public GameServerChangeNotification(final String type, final String gameServerId, final String ip, final Integer port, final String reason, final Long timestamp) {
        this.type = type;
        this.gameServerId = gameServerId;
        this.ip = ip;
        this.port = port;
        this.reason = reason;
        this.timestamp = timestamp;
    }
}
