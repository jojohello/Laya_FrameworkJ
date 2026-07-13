package com.laya.game.central.model;

import java.time.LocalDateTime;

/**
 * Game Server信息模型
 *
 * 存储Game Server的基本信息和状态
 *
 * @author Laya Game Server Framework
 * @since 2025-10-30
 */
public class GameServerInfo {
    /**
     * Game Server唯一标识
     */
    private String id;
    /**
     * WebSocket URL
     * 例如: ws://localhost:8084/ws/gateway
     */
    private String wsUrl;
    /**
     * HTTP地址
     * 例如: http://localhost:8084
     */
    private String httpUrl;
    /**
     * 主机地址
     */
    private String host;
    /**
     * 端口
     */
    private Integer port;
    /**
     * 是否在线
     */
    private Boolean online;
    /**
     * 负载信息
     */
    private LoadInfo load;
    /**
     * 最后心跳时间
     */
    private LocalDateTime lastHeartbeat;
    /**
     * 最后心跳时间戳（毫秒，用于超时检测）
     */
    private Long lastHeartbeatTimestamp;
    /**
     * 注册时间
     */
    private LocalDateTime registerTime;

    /**
     * 更新心跳时间
     */
    public void updateHeartbeat() {
        this.lastHeartbeat = LocalDateTime.now();
        this.lastHeartbeatTimestamp = System.currentTimeMillis();
    }

    /**
     * 检查是否超时
     *
     * @param timeoutMs 超时时间（毫秒）
     * @return true=超时
     */
    public boolean isTimeout(long timeoutMs) {
        if (this.lastHeartbeatTimestamp == null) {
            return false;
        }
        long now = System.currentTimeMillis();
        return (now - this.lastHeartbeatTimestamp) > timeoutMs;
    }


    /**
     * 负载信息
     */
    public static class LoadInfo {
        /**
         * 活跃房间数
         */
        private Integer activeRooms;
        /**
         * 在线玩家数
         */
        private Integer onlinePlayers;
        /**
         * CPU使用率 (0-100)
         */
        private Double cpuUsage;
        /**
         * 内存使用率 (0-100)
         */
        private Double memoryUsage;

        @java.lang.SuppressWarnings("all")
        public Integer getActiveRooms() {
            return this.activeRooms;
        }

        @java.lang.SuppressWarnings("all")
        public Integer getOnlinePlayers() {
            return this.onlinePlayers;
        }

        @java.lang.SuppressWarnings("all")
        public Double getCpuUsage() {
            return this.cpuUsage;
        }

        @java.lang.SuppressWarnings("all")
        public Double getMemoryUsage() {
            return this.memoryUsage;
        }

        @java.lang.SuppressWarnings("all")
        public void setActiveRooms(final Integer activeRooms) {
            this.activeRooms = activeRooms;
        }

        @java.lang.SuppressWarnings("all")
        public void setOnlinePlayers(final Integer onlinePlayers) {
            this.onlinePlayers = onlinePlayers;
        }

        @java.lang.SuppressWarnings("all")
        public void setCpuUsage(final Double cpuUsage) {
            this.cpuUsage = cpuUsage;
        }

        @java.lang.SuppressWarnings("all")
        public void setMemoryUsage(final Double memoryUsage) {
            this.memoryUsage = memoryUsage;
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("all")
        public boolean equals(final java.lang.Object o) {
            if (o == this) return true;
            if (!(o instanceof GameServerInfo.LoadInfo)) return false;
            final GameServerInfo.LoadInfo other = (GameServerInfo.LoadInfo) o;
            if (!other.canEqual((java.lang.Object) this)) return false;
            final java.lang.Object this$activeRooms = this.getActiveRooms();
            final java.lang.Object other$activeRooms = other.getActiveRooms();
            if (this$activeRooms == null ? other$activeRooms != null : !this$activeRooms.equals(other$activeRooms)) return false;
            final java.lang.Object this$onlinePlayers = this.getOnlinePlayers();
            final java.lang.Object other$onlinePlayers = other.getOnlinePlayers();
            if (this$onlinePlayers == null ? other$onlinePlayers != null : !this$onlinePlayers.equals(other$onlinePlayers)) return false;
            final java.lang.Object this$cpuUsage = this.getCpuUsage();
            final java.lang.Object other$cpuUsage = other.getCpuUsage();
            if (this$cpuUsage == null ? other$cpuUsage != null : !this$cpuUsage.equals(other$cpuUsage)) return false;
            final java.lang.Object this$memoryUsage = this.getMemoryUsage();
            final java.lang.Object other$memoryUsage = other.getMemoryUsage();
            if (this$memoryUsage == null ? other$memoryUsage != null : !this$memoryUsage.equals(other$memoryUsage)) return false;
            return true;
        }

        @java.lang.SuppressWarnings("all")
        protected boolean canEqual(final java.lang.Object other) {
            return other instanceof GameServerInfo.LoadInfo;
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("all")
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final java.lang.Object $activeRooms = this.getActiveRooms();
            result = result * PRIME + ($activeRooms == null ? 43 : $activeRooms.hashCode());
            final java.lang.Object $onlinePlayers = this.getOnlinePlayers();
            result = result * PRIME + ($onlinePlayers == null ? 43 : $onlinePlayers.hashCode());
            final java.lang.Object $cpuUsage = this.getCpuUsage();
            result = result * PRIME + ($cpuUsage == null ? 43 : $cpuUsage.hashCode());
            final java.lang.Object $memoryUsage = this.getMemoryUsage();
            result = result * PRIME + ($memoryUsage == null ? 43 : $memoryUsage.hashCode());
            return result;
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("all")
        public java.lang.String toString() {
            return "GameServerInfo.LoadInfo(activeRooms=" + this.getActiveRooms() + ", onlinePlayers=" + this.getOnlinePlayers() + ", cpuUsage=" + this.getCpuUsage() + ", memoryUsage=" + this.getMemoryUsage() + ")";
        }

        @java.lang.SuppressWarnings("all")
        public LoadInfo() {
        }

        @java.lang.SuppressWarnings("all")
        public LoadInfo(final Integer activeRooms, final Integer onlinePlayers, final Double cpuUsage, final Double memoryUsage) {
            this.activeRooms = activeRooms;
            this.onlinePlayers = onlinePlayers;
            this.cpuUsage = cpuUsage;
            this.memoryUsage = memoryUsage;
        }
    }

    /**
     * Game Server唯一标识
     */
    @java.lang.SuppressWarnings("all")
    public String getId() {
        return this.id;
    }

    /**
     * WebSocket URL
     * 例如: ws://localhost:8084/ws/gateway
     */
    @java.lang.SuppressWarnings("all")
    public String getWsUrl() {
        return this.wsUrl;
    }

    /**
     * HTTP地址
     * 例如: http://localhost:8084
     */
    @java.lang.SuppressWarnings("all")
    public String getHttpUrl() {
        return this.httpUrl;
    }

    /**
     * 主机地址
     */
    @java.lang.SuppressWarnings("all")
    public String getHost() {
        return this.host;
    }

    /**
     * 端口
     */
    @java.lang.SuppressWarnings("all")
    public Integer getPort() {
        return this.port;
    }

    /**
     * 是否在线
     */
    @java.lang.SuppressWarnings("all")
    public Boolean getOnline() {
        return this.online;
    }

    /**
     * 负载信息
     */
    @java.lang.SuppressWarnings("all")
    public LoadInfo getLoad() {
        return this.load;
    }

    /**
     * 最后心跳时间
     */
    @java.lang.SuppressWarnings("all")
    public LocalDateTime getLastHeartbeat() {
        return this.lastHeartbeat;
    }

    /**
     * 最后心跳时间戳（毫秒，用于超时检测）
     */
    @java.lang.SuppressWarnings("all")
    public Long getLastHeartbeatTimestamp() {
        return this.lastHeartbeatTimestamp;
    }

    /**
     * 注册时间
     */
    @java.lang.SuppressWarnings("all")
    public LocalDateTime getRegisterTime() {
        return this.registerTime;
    }

    /**
     * Game Server唯一标识
     */
    @java.lang.SuppressWarnings("all")
    public void setId(final String id) {
        this.id = id;
    }

    /**
     * WebSocket URL
     * 例如: ws://localhost:8084/ws/gateway
     */
    @java.lang.SuppressWarnings("all")
    public void setWsUrl(final String wsUrl) {
        this.wsUrl = wsUrl;
    }

    /**
     * HTTP地址
     * 例如: http://localhost:8084
     */
    @java.lang.SuppressWarnings("all")
    public void setHttpUrl(final String httpUrl) {
        this.httpUrl = httpUrl;
    }

    /**
     * 主机地址
     */
    @java.lang.SuppressWarnings("all")
    public void setHost(final String host) {
        this.host = host;
    }

    /**
     * 端口
     */
    @java.lang.SuppressWarnings("all")
    public void setPort(final Integer port) {
        this.port = port;
    }

    /**
     * 是否在线
     */
    @java.lang.SuppressWarnings("all")
    public void setOnline(final Boolean online) {
        this.online = online;
    }

    /**
     * 负载信息
     */
    @java.lang.SuppressWarnings("all")
    public void setLoad(final LoadInfo load) {
        this.load = load;
    }

    /**
     * 最后心跳时间
     */
    @java.lang.SuppressWarnings("all")
    public void setLastHeartbeat(final LocalDateTime lastHeartbeat) {
        this.lastHeartbeat = lastHeartbeat;
    }

    /**
     * 最后心跳时间戳（毫秒，用于超时检测）
     */
    @java.lang.SuppressWarnings("all")
    public void setLastHeartbeatTimestamp(final Long lastHeartbeatTimestamp) {
        this.lastHeartbeatTimestamp = lastHeartbeatTimestamp;
    }

    /**
     * 注册时间
     */
    @java.lang.SuppressWarnings("all")
    public void setRegisterTime(final LocalDateTime registerTime) {
        this.registerTime = registerTime;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public boolean equals(final java.lang.Object o) {
        if (o == this) return true;
        if (!(o instanceof GameServerInfo)) return false;
        final GameServerInfo other = (GameServerInfo) o;
        if (!other.canEqual((java.lang.Object) this)) return false;
        final java.lang.Object this$port = this.getPort();
        final java.lang.Object other$port = other.getPort();
        if (this$port == null ? other$port != null : !this$port.equals(other$port)) return false;
        final java.lang.Object this$online = this.getOnline();
        final java.lang.Object other$online = other.getOnline();
        if (this$online == null ? other$online != null : !this$online.equals(other$online)) return false;
        final java.lang.Object this$lastHeartbeatTimestamp = this.getLastHeartbeatTimestamp();
        final java.lang.Object other$lastHeartbeatTimestamp = other.getLastHeartbeatTimestamp();
        if (this$lastHeartbeatTimestamp == null ? other$lastHeartbeatTimestamp != null : !this$lastHeartbeatTimestamp.equals(other$lastHeartbeatTimestamp)) return false;
        final java.lang.Object this$id = this.getId();
        final java.lang.Object other$id = other.getId();
        if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
        final java.lang.Object this$wsUrl = this.getWsUrl();
        final java.lang.Object other$wsUrl = other.getWsUrl();
        if (this$wsUrl == null ? other$wsUrl != null : !this$wsUrl.equals(other$wsUrl)) return false;
        final java.lang.Object this$httpUrl = this.getHttpUrl();
        final java.lang.Object other$httpUrl = other.getHttpUrl();
        if (this$httpUrl == null ? other$httpUrl != null : !this$httpUrl.equals(other$httpUrl)) return false;
        final java.lang.Object this$host = this.getHost();
        final java.lang.Object other$host = other.getHost();
        if (this$host == null ? other$host != null : !this$host.equals(other$host)) return false;
        final java.lang.Object this$load = this.getLoad();
        final java.lang.Object other$load = other.getLoad();
        if (this$load == null ? other$load != null : !this$load.equals(other$load)) return false;
        final java.lang.Object this$lastHeartbeat = this.getLastHeartbeat();
        final java.lang.Object other$lastHeartbeat = other.getLastHeartbeat();
        if (this$lastHeartbeat == null ? other$lastHeartbeat != null : !this$lastHeartbeat.equals(other$lastHeartbeat)) return false;
        final java.lang.Object this$registerTime = this.getRegisterTime();
        final java.lang.Object other$registerTime = other.getRegisterTime();
        if (this$registerTime == null ? other$registerTime != null : !this$registerTime.equals(other$registerTime)) return false;
        return true;
    }

    @java.lang.SuppressWarnings("all")
    protected boolean canEqual(final java.lang.Object other) {
        return other instanceof GameServerInfo;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public int hashCode() {
        final int PRIME = 59;
        int result = 1;
        final java.lang.Object $port = this.getPort();
        result = result * PRIME + ($port == null ? 43 : $port.hashCode());
        final java.lang.Object $online = this.getOnline();
        result = result * PRIME + ($online == null ? 43 : $online.hashCode());
        final java.lang.Object $lastHeartbeatTimestamp = this.getLastHeartbeatTimestamp();
        result = result * PRIME + ($lastHeartbeatTimestamp == null ? 43 : $lastHeartbeatTimestamp.hashCode());
        final java.lang.Object $id = this.getId();
        result = result * PRIME + ($id == null ? 43 : $id.hashCode());
        final java.lang.Object $wsUrl = this.getWsUrl();
        result = result * PRIME + ($wsUrl == null ? 43 : $wsUrl.hashCode());
        final java.lang.Object $httpUrl = this.getHttpUrl();
        result = result * PRIME + ($httpUrl == null ? 43 : $httpUrl.hashCode());
        final java.lang.Object $host = this.getHost();
        result = result * PRIME + ($host == null ? 43 : $host.hashCode());
        final java.lang.Object $load = this.getLoad();
        result = result * PRIME + ($load == null ? 43 : $load.hashCode());
        final java.lang.Object $lastHeartbeat = this.getLastHeartbeat();
        result = result * PRIME + ($lastHeartbeat == null ? 43 : $lastHeartbeat.hashCode());
        final java.lang.Object $registerTime = this.getRegisterTime();
        result = result * PRIME + ($registerTime == null ? 43 : $registerTime.hashCode());
        return result;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public java.lang.String toString() {
        return "GameServerInfo(id=" + this.getId() + ", wsUrl=" + this.getWsUrl() + ", httpUrl=" + this.getHttpUrl() + ", host=" + this.getHost() + ", port=" + this.getPort() + ", online=" + this.getOnline() + ", load=" + this.getLoad() + ", lastHeartbeat=" + this.getLastHeartbeat() + ", lastHeartbeatTimestamp=" + this.getLastHeartbeatTimestamp() + ", registerTime=" + this.getRegisterTime() + ")";
    }

    @java.lang.SuppressWarnings("all")
    public GameServerInfo() {
    }

    @java.lang.SuppressWarnings("all")
    public GameServerInfo(final String id, final String wsUrl, final String httpUrl, final String host, final Integer port, final Boolean online, final LoadInfo load, final LocalDateTime lastHeartbeat, final Long lastHeartbeatTimestamp, final LocalDateTime registerTime) {
        this.id = id;
        this.wsUrl = wsUrl;
        this.httpUrl = httpUrl;
        this.host = host;
        this.port = port;
        this.online = online;
        this.load = load;
        this.lastHeartbeat = lastHeartbeat;
        this.lastHeartbeatTimestamp = lastHeartbeatTimestamp;
        this.registerTime = registerTime;
    }
}
