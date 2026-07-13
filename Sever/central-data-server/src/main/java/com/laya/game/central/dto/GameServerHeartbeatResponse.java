package com.laya.game.central.dto;

/**
 * Game Server 心跳响应
 *
 * @author Laya Framework
 * @since 2025-11-10
 */
public class GameServerHeartbeatResponse {
    /**
     * 响应状态: success / failed
     */
    private String status;
    /**
     * 响应消息
     */
    private String message;
    /**
     * 服务器当前时间戳
     */
    private Long timestamp;

    /**
     * 构造成功响应
     */
    public static GameServerHeartbeatResponse success() {
        return new GameServerHeartbeatResponse("success", "Heartbeat received", System.currentTimeMillis());
    }

    /**
     * 构造失败响应
     */
    public static GameServerHeartbeatResponse failed(String message) {
        return new GameServerHeartbeatResponse("failed", message, System.currentTimeMillis());
    }

    /**
     * 响应状态: success / failed
     */
    @java.lang.SuppressWarnings("all")
    public String getStatus() {
        return this.status;
    }

    /**
     * 响应消息
     */
    @java.lang.SuppressWarnings("all")
    public String getMessage() {
        return this.message;
    }

    /**
     * 服务器当前时间戳
     */
    @java.lang.SuppressWarnings("all")
    public Long getTimestamp() {
        return this.timestamp;
    }

    /**
     * 响应状态: success / failed
     */
    @java.lang.SuppressWarnings("all")
    public void setStatus(final String status) {
        this.status = status;
    }

    /**
     * 响应消息
     */
    @java.lang.SuppressWarnings("all")
    public void setMessage(final String message) {
        this.message = message;
    }

    /**
     * 服务器当前时间戳
     */
    @java.lang.SuppressWarnings("all")
    public void setTimestamp(final Long timestamp) {
        this.timestamp = timestamp;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public boolean equals(final java.lang.Object o) {
        if (o == this) return true;
        if (!(o instanceof GameServerHeartbeatResponse)) return false;
        final GameServerHeartbeatResponse other = (GameServerHeartbeatResponse) o;
        if (!other.canEqual((java.lang.Object) this)) return false;
        final java.lang.Object this$timestamp = this.getTimestamp();
        final java.lang.Object other$timestamp = other.getTimestamp();
        if (this$timestamp == null ? other$timestamp != null : !this$timestamp.equals(other$timestamp)) return false;
        final java.lang.Object this$status = this.getStatus();
        final java.lang.Object other$status = other.getStatus();
        if (this$status == null ? other$status != null : !this$status.equals(other$status)) return false;
        final java.lang.Object this$message = this.getMessage();
        final java.lang.Object other$message = other.getMessage();
        if (this$message == null ? other$message != null : !this$message.equals(other$message)) return false;
        return true;
    }

    @java.lang.SuppressWarnings("all")
    protected boolean canEqual(final java.lang.Object other) {
        return other instanceof GameServerHeartbeatResponse;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public int hashCode() {
        final int PRIME = 59;
        int result = 1;
        final java.lang.Object $timestamp = this.getTimestamp();
        result = result * PRIME + ($timestamp == null ? 43 : $timestamp.hashCode());
        final java.lang.Object $status = this.getStatus();
        result = result * PRIME + ($status == null ? 43 : $status.hashCode());
        final java.lang.Object $message = this.getMessage();
        result = result * PRIME + ($message == null ? 43 : $message.hashCode());
        return result;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public java.lang.String toString() {
        return "GameServerHeartbeatResponse(status=" + this.getStatus() + ", message=" + this.getMessage() + ", timestamp=" + this.getTimestamp() + ")";
    }

    @java.lang.SuppressWarnings("all")
    public GameServerHeartbeatResponse() {
    }

    @java.lang.SuppressWarnings("all")
    public GameServerHeartbeatResponse(final String status, final String message, final Long timestamp) {
        this.status = status;
        this.message = message;
        this.timestamp = timestamp;
    }
}
