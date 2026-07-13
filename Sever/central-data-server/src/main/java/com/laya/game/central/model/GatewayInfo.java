package com.laya.game.central.model;

import java.time.LocalDateTime;

/**
 * Gateway服务器信息
 *
 * 用于Central Server管理Gateway的状态和负载信息
 * 通过心跳机制自动注册和更新
 *
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
public class GatewayInfo {
    /**
     * Gateway唯一标识（IP:Port）
     */
    private String gatewayKey;
    /**
     * Gateway IP地址
     */
    private String gatewayIp;
    /**
     * Gateway端口
     */
    private Integer gatewayPort;
    /**
     * 当前活跃连接数
     */
    private Integer activeConnections;
    /**
     * 当前已认证用户数
     */
    private Integer authenticatedUsers;
    /**
     * 等待重连数（阶段2）
     */
    private Integer waitingReconnections;
    /**
     * Gateway状态
     */
    private GatewayStatus status;
    /**
     * 注册时间
     */
    private LocalDateTime registeredAt;
    /**
     * 最后心跳时间
     */
    private LocalDateTime lastHeartbeatAt;
    /**
     * 最后更新时间
     */
    private LocalDateTime updatedAt;


    /**
     * Gateway状态枚举
     */
    public enum GatewayStatus {
        ONLINE,  // 在线
        OFFLINE // 离线
        ;
    }

    /**
     * 构造函数 - 首次心跳注册时使用
     */
    public GatewayInfo(String gatewayIp, Integer gatewayPort, Integer activeConnections, Integer authenticatedUsers, Integer waitingReconnections) {
        this.gatewayKey = gatewayIp + ":" + gatewayPort;
        this.gatewayIp = gatewayIp;
        this.gatewayPort = gatewayPort;
        this.activeConnections = activeConnections;
        this.authenticatedUsers = authenticatedUsers;
        this.waitingReconnections = waitingReconnections;
        this.status = GatewayStatus.ONLINE;
        this.registeredAt = LocalDateTime.now();
        this.lastHeartbeatAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 更新心跳信息
     */
    public void updateHeartbeat(Integer activeConnections, Integer authenticatedUsers, Integer waitingReconnections) {
        this.activeConnections = activeConnections;
        this.authenticatedUsers = authenticatedUsers;
        this.waitingReconnections = waitingReconnections;
        this.status = GatewayStatus.ONLINE;
        this.lastHeartbeatAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 检查是否超时（超过指定秒数未收到心跳）
     */
    public boolean isTimeout(long timeoutSeconds) {
        if (lastHeartbeatAt == null) {
            return true;
        }
        LocalDateTime timeoutPoint = LocalDateTime.now().minusSeconds(timeoutSeconds);
        return lastHeartbeatAt.isBefore(timeoutPoint);
    }

    /**
     * 标记为离线
     */
    public void markOffline() {
        this.status = GatewayStatus.OFFLINE;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 获取总负载
     */
    public int getTotalLoad() {
        return (activeConnections != null ? activeConnections : 0) + (waitingReconnections != null ? waitingReconnections : 0);
    }

    /**
     * 获取负载百分比（假设最大10000连接）
     */
    public double getLoadPercentage() {
        int maxConnections = 10000;
        return (double) getTotalLoad() / maxConnections * 100;
    }

    /**
     * Gateway唯一标识（IP:Port）
     */
    @java.lang.SuppressWarnings("all")
    public String getGatewayKey() {
        return this.gatewayKey;
    }

    /**
     * Gateway IP地址
     */
    @java.lang.SuppressWarnings("all")
    public String getGatewayIp() {
        return this.gatewayIp;
    }

    /**
     * Gateway端口
     */
    @java.lang.SuppressWarnings("all")
    public Integer getGatewayPort() {
        return this.gatewayPort;
    }

    /**
     * 当前活跃连接数
     */
    @java.lang.SuppressWarnings("all")
    public Integer getActiveConnections() {
        return this.activeConnections;
    }

    /**
     * 当前已认证用户数
     */
    @java.lang.SuppressWarnings("all")
    public Integer getAuthenticatedUsers() {
        return this.authenticatedUsers;
    }

    /**
     * 等待重连数（阶段2）
     */
    @java.lang.SuppressWarnings("all")
    public Integer getWaitingReconnections() {
        return this.waitingReconnections;
    }

    /**
     * Gateway状态
     */
    @java.lang.SuppressWarnings("all")
    public GatewayStatus getStatus() {
        return this.status;
    }

    /**
     * 注册时间
     */
    @java.lang.SuppressWarnings("all")
    public LocalDateTime getRegisteredAt() {
        return this.registeredAt;
    }

    /**
     * 最后心跳时间
     */
    @java.lang.SuppressWarnings("all")
    public LocalDateTime getLastHeartbeatAt() {
        return this.lastHeartbeatAt;
    }

    /**
     * 最后更新时间
     */
    @java.lang.SuppressWarnings("all")
    public LocalDateTime getUpdatedAt() {
        return this.updatedAt;
    }

    /**
     * Gateway唯一标识（IP:Port）
     */
    @java.lang.SuppressWarnings("all")
    public void setGatewayKey(final String gatewayKey) {
        this.gatewayKey = gatewayKey;
    }

    /**
     * Gateway IP地址
     */
    @java.lang.SuppressWarnings("all")
    public void setGatewayIp(final String gatewayIp) {
        this.gatewayIp = gatewayIp;
    }

    /**
     * Gateway端口
     */
    @java.lang.SuppressWarnings("all")
    public void setGatewayPort(final Integer gatewayPort) {
        this.gatewayPort = gatewayPort;
    }

    /**
     * 当前活跃连接数
     */
    @java.lang.SuppressWarnings("all")
    public void setActiveConnections(final Integer activeConnections) {
        this.activeConnections = activeConnections;
    }

    /**
     * 当前已认证用户数
     */
    @java.lang.SuppressWarnings("all")
    public void setAuthenticatedUsers(final Integer authenticatedUsers) {
        this.authenticatedUsers = authenticatedUsers;
    }

    /**
     * 等待重连数（阶段2）
     */
    @java.lang.SuppressWarnings("all")
    public void setWaitingReconnections(final Integer waitingReconnections) {
        this.waitingReconnections = waitingReconnections;
    }

    /**
     * Gateway状态
     */
    @java.lang.SuppressWarnings("all")
    public void setStatus(final GatewayStatus status) {
        this.status = status;
    }

    /**
     * 注册时间
     */
    @java.lang.SuppressWarnings("all")
    public void setRegisteredAt(final LocalDateTime registeredAt) {
        this.registeredAt = registeredAt;
    }

    /**
     * 最后心跳时间
     */
    @java.lang.SuppressWarnings("all")
    public void setLastHeartbeatAt(final LocalDateTime lastHeartbeatAt) {
        this.lastHeartbeatAt = lastHeartbeatAt;
    }

    /**
     * 最后更新时间
     */
    @java.lang.SuppressWarnings("all")
    public void setUpdatedAt(final LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public boolean equals(final java.lang.Object o) {
        if (o == this) return true;
        if (!(o instanceof GatewayInfo)) return false;
        final GatewayInfo other = (GatewayInfo) o;
        if (!other.canEqual((java.lang.Object) this)) return false;
        final java.lang.Object this$gatewayPort = this.getGatewayPort();
        final java.lang.Object other$gatewayPort = other.getGatewayPort();
        if (this$gatewayPort == null ? other$gatewayPort != null : !this$gatewayPort.equals(other$gatewayPort)) return false;
        final java.lang.Object this$activeConnections = this.getActiveConnections();
        final java.lang.Object other$activeConnections = other.getActiveConnections();
        if (this$activeConnections == null ? other$activeConnections != null : !this$activeConnections.equals(other$activeConnections)) return false;
        final java.lang.Object this$authenticatedUsers = this.getAuthenticatedUsers();
        final java.lang.Object other$authenticatedUsers = other.getAuthenticatedUsers();
        if (this$authenticatedUsers == null ? other$authenticatedUsers != null : !this$authenticatedUsers.equals(other$authenticatedUsers)) return false;
        final java.lang.Object this$waitingReconnections = this.getWaitingReconnections();
        final java.lang.Object other$waitingReconnections = other.getWaitingReconnections();
        if (this$waitingReconnections == null ? other$waitingReconnections != null : !this$waitingReconnections.equals(other$waitingReconnections)) return false;
        final java.lang.Object this$gatewayKey = this.getGatewayKey();
        final java.lang.Object other$gatewayKey = other.getGatewayKey();
        if (this$gatewayKey == null ? other$gatewayKey != null : !this$gatewayKey.equals(other$gatewayKey)) return false;
        final java.lang.Object this$gatewayIp = this.getGatewayIp();
        final java.lang.Object other$gatewayIp = other.getGatewayIp();
        if (this$gatewayIp == null ? other$gatewayIp != null : !this$gatewayIp.equals(other$gatewayIp)) return false;
        final java.lang.Object this$status = this.getStatus();
        final java.lang.Object other$status = other.getStatus();
        if (this$status == null ? other$status != null : !this$status.equals(other$status)) return false;
        final java.lang.Object this$registeredAt = this.getRegisteredAt();
        final java.lang.Object other$registeredAt = other.getRegisteredAt();
        if (this$registeredAt == null ? other$registeredAt != null : !this$registeredAt.equals(other$registeredAt)) return false;
        final java.lang.Object this$lastHeartbeatAt = this.getLastHeartbeatAt();
        final java.lang.Object other$lastHeartbeatAt = other.getLastHeartbeatAt();
        if (this$lastHeartbeatAt == null ? other$lastHeartbeatAt != null : !this$lastHeartbeatAt.equals(other$lastHeartbeatAt)) return false;
        final java.lang.Object this$updatedAt = this.getUpdatedAt();
        final java.lang.Object other$updatedAt = other.getUpdatedAt();
        if (this$updatedAt == null ? other$updatedAt != null : !this$updatedAt.equals(other$updatedAt)) return false;
        return true;
    }

    @java.lang.SuppressWarnings("all")
    protected boolean canEqual(final java.lang.Object other) {
        return other instanceof GatewayInfo;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public int hashCode() {
        final int PRIME = 59;
        int result = 1;
        final java.lang.Object $gatewayPort = this.getGatewayPort();
        result = result * PRIME + ($gatewayPort == null ? 43 : $gatewayPort.hashCode());
        final java.lang.Object $activeConnections = this.getActiveConnections();
        result = result * PRIME + ($activeConnections == null ? 43 : $activeConnections.hashCode());
        final java.lang.Object $authenticatedUsers = this.getAuthenticatedUsers();
        result = result * PRIME + ($authenticatedUsers == null ? 43 : $authenticatedUsers.hashCode());
        final java.lang.Object $waitingReconnections = this.getWaitingReconnections();
        result = result * PRIME + ($waitingReconnections == null ? 43 : $waitingReconnections.hashCode());
        final java.lang.Object $gatewayKey = this.getGatewayKey();
        result = result * PRIME + ($gatewayKey == null ? 43 : $gatewayKey.hashCode());
        final java.lang.Object $gatewayIp = this.getGatewayIp();
        result = result * PRIME + ($gatewayIp == null ? 43 : $gatewayIp.hashCode());
        final java.lang.Object $status = this.getStatus();
        result = result * PRIME + ($status == null ? 43 : $status.hashCode());
        final java.lang.Object $registeredAt = this.getRegisteredAt();
        result = result * PRIME + ($registeredAt == null ? 43 : $registeredAt.hashCode());
        final java.lang.Object $lastHeartbeatAt = this.getLastHeartbeatAt();
        result = result * PRIME + ($lastHeartbeatAt == null ? 43 : $lastHeartbeatAt.hashCode());
        final java.lang.Object $updatedAt = this.getUpdatedAt();
        result = result * PRIME + ($updatedAt == null ? 43 : $updatedAt.hashCode());
        return result;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public java.lang.String toString() {
        return "GatewayInfo(gatewayKey=" + this.getGatewayKey() + ", gatewayIp=" + this.getGatewayIp() + ", gatewayPort=" + this.getGatewayPort() + ", activeConnections=" + this.getActiveConnections() + ", authenticatedUsers=" + this.getAuthenticatedUsers() + ", waitingReconnections=" + this.getWaitingReconnections() + ", status=" + this.getStatus() + ", registeredAt=" + this.getRegisteredAt() + ", lastHeartbeatAt=" + this.getLastHeartbeatAt() + ", updatedAt=" + this.getUpdatedAt() + ")";
    }
}
