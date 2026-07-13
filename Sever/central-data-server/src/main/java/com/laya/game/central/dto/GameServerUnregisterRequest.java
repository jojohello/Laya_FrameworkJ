package com.laya.game.central.dto;

/**
 * Game Server 注销请求（优雅关闭）
 *
 * @author Laya Framework
 * @since 2025-11-10
 */
public class GameServerUnregisterRequest {
    /**
     * Game Server ID
     */
    private String gameServerId;
    /**
     * 注销原因
     * - GRACEFUL_SHUTDOWN: 正常关闭
     * - MANUAL_REMOVAL: 手动移除
     */
    private String reason;

    /**
     * Game Server ID
     */
    @java.lang.SuppressWarnings("all")
    public String getGameServerId() {
        return this.gameServerId;
    }

    /**
     * 注销原因
     * - GRACEFUL_SHUTDOWN: 正常关闭
     * - MANUAL_REMOVAL: 手动移除
     */
    @java.lang.SuppressWarnings("all")
    public String getReason() {
        return this.reason;
    }

    /**
     * Game Server ID
     */
    @java.lang.SuppressWarnings("all")
    public void setGameServerId(final String gameServerId) {
        this.gameServerId = gameServerId;
    }

    /**
     * 注销原因
     * - GRACEFUL_SHUTDOWN: 正常关闭
     * - MANUAL_REMOVAL: 手动移除
     */
    @java.lang.SuppressWarnings("all")
    public void setReason(final String reason) {
        this.reason = reason;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public boolean equals(final java.lang.Object o) {
        if (o == this) return true;
        if (!(o instanceof GameServerUnregisterRequest)) return false;
        final GameServerUnregisterRequest other = (GameServerUnregisterRequest) o;
        if (!other.canEqual((java.lang.Object) this)) return false;
        final java.lang.Object this$gameServerId = this.getGameServerId();
        final java.lang.Object other$gameServerId = other.getGameServerId();
        if (this$gameServerId == null ? other$gameServerId != null : !this$gameServerId.equals(other$gameServerId)) return false;
        final java.lang.Object this$reason = this.getReason();
        final java.lang.Object other$reason = other.getReason();
        if (this$reason == null ? other$reason != null : !this$reason.equals(other$reason)) return false;
        return true;
    }

    @java.lang.SuppressWarnings("all")
    protected boolean canEqual(final java.lang.Object other) {
        return other instanceof GameServerUnregisterRequest;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public int hashCode() {
        final int PRIME = 59;
        int result = 1;
        final java.lang.Object $gameServerId = this.getGameServerId();
        result = result * PRIME + ($gameServerId == null ? 43 : $gameServerId.hashCode());
        final java.lang.Object $reason = this.getReason();
        result = result * PRIME + ($reason == null ? 43 : $reason.hashCode());
        return result;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public java.lang.String toString() {
        return "GameServerUnregisterRequest(gameServerId=" + this.getGameServerId() + ", reason=" + this.getReason() + ")";
    }

    @java.lang.SuppressWarnings("all")
    public GameServerUnregisterRequest() {
    }

    @java.lang.SuppressWarnings("all")
    public GameServerUnregisterRequest(final String gameServerId, final String reason) {
        this.gameServerId = gameServerId;
        this.reason = reason;
    }
}
