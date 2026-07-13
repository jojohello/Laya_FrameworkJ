package com.laya.game.gateway.model;

import org.springframework.web.socket.WebSocketSession;
import java.time.LocalDateTime;

/**
 * 客户端会话信息
 *
 * 存储连接到网关服务器的客户端会话状态和相关信息
 *
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
public class ClientSession {
    // 会话ID
    private String sessionId;
    // WebSocket会话
    private WebSocketSession session;
    // 客户端远程地址
    private String remoteAddress;
    // 连接建立时间
    private LocalDateTime connectTime;
    // 最后活跃时间
    private LocalDateTime lastActiveTime;
    // 是否已认证
    private boolean authenticated;
    // 用户ID（认证后设置）
    private String userId;
    // 用户名（可选）
    private String username;
    // 当前所在房间ID（可选）
    private Long currentRoomId;
    // 会话状态
    private SessionStatus status;
    // 客户端信息
    private ClientInfo clientInfo;

    /**
     * 构造函数
     */
    public ClientSession(String sessionId, WebSocketSession session, String remoteAddress, LocalDateTime connectTime, boolean authenticated, String userId) {
        this.sessionId = sessionId;
        this.session = session;
        this.remoteAddress = remoteAddress;
        this.connectTime = connectTime;
        this.lastActiveTime = connectTime;
        this.authenticated = authenticated;
        this.userId = userId;
        this.status = SessionStatus.CONNECTED;
    }


    /**
     * 会话状态枚举
     */
    public enum SessionStatus {
        CONNECTED,  // 已连接，未认证
        AUTHENTICATED,  // 已认证
        IN_GAME,  // 游戏中
        DISCONNECTED // 已断开
        ;
    }


    /**
     * 客户端信息
     */
    public static class ClientInfo {
        private String platform; // 平台：web, wechat, android, ios
        private String version; // 客户端版本
        private String deviceId; // 设备ID
        private String userAgent; // User Agent
        private String language; // 语言

        @java.lang.SuppressWarnings("all")
        public ClientInfo() {
        }

        @java.lang.SuppressWarnings("all")
        public String getPlatform() {
            return this.platform;
        }

        @java.lang.SuppressWarnings("all")
        public String getVersion() {
            return this.version;
        }

        @java.lang.SuppressWarnings("all")
        public String getDeviceId() {
            return this.deviceId;
        }

        @java.lang.SuppressWarnings("all")
        public String getUserAgent() {
            return this.userAgent;
        }

        @java.lang.SuppressWarnings("all")
        public String getLanguage() {
            return this.language;
        }

        @java.lang.SuppressWarnings("all")
        public void setPlatform(final String platform) {
            this.platform = platform;
        }

        @java.lang.SuppressWarnings("all")
        public void setVersion(final String version) {
            this.version = version;
        }

        @java.lang.SuppressWarnings("all")
        public void setDeviceId(final String deviceId) {
            this.deviceId = deviceId;
        }

        @java.lang.SuppressWarnings("all")
        public void setUserAgent(final String userAgent) {
            this.userAgent = userAgent;
        }

        @java.lang.SuppressWarnings("all")
        public void setLanguage(final String language) {
            this.language = language;
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("all")
        public boolean equals(final java.lang.Object o) {
            if (o == this) return true;
            if (!(o instanceof ClientSession.ClientInfo)) return false;
            final ClientSession.ClientInfo other = (ClientSession.ClientInfo) o;
            if (!other.canEqual((java.lang.Object) this)) return false;
            final java.lang.Object this$platform = this.getPlatform();
            final java.lang.Object other$platform = other.getPlatform();
            if (this$platform == null ? other$platform != null : !this$platform.equals(other$platform)) return false;
            final java.lang.Object this$version = this.getVersion();
            final java.lang.Object other$version = other.getVersion();
            if (this$version == null ? other$version != null : !this$version.equals(other$version)) return false;
            final java.lang.Object this$deviceId = this.getDeviceId();
            final java.lang.Object other$deviceId = other.getDeviceId();
            if (this$deviceId == null ? other$deviceId != null : !this$deviceId.equals(other$deviceId)) return false;
            final java.lang.Object this$userAgent = this.getUserAgent();
            final java.lang.Object other$userAgent = other.getUserAgent();
            if (this$userAgent == null ? other$userAgent != null : !this$userAgent.equals(other$userAgent)) return false;
            final java.lang.Object this$language = this.getLanguage();
            final java.lang.Object other$language = other.getLanguage();
            if (this$language == null ? other$language != null : !this$language.equals(other$language)) return false;
            return true;
        }

        @java.lang.SuppressWarnings("all")
        protected boolean canEqual(final java.lang.Object other) {
            return other instanceof ClientSession.ClientInfo;
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("all")
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final java.lang.Object $platform = this.getPlatform();
            result = result * PRIME + ($platform == null ? 43 : $platform.hashCode());
            final java.lang.Object $version = this.getVersion();
            result = result * PRIME + ($version == null ? 43 : $version.hashCode());
            final java.lang.Object $deviceId = this.getDeviceId();
            result = result * PRIME + ($deviceId == null ? 43 : $deviceId.hashCode());
            final java.lang.Object $userAgent = this.getUserAgent();
            result = result * PRIME + ($userAgent == null ? 43 : $userAgent.hashCode());
            final java.lang.Object $language = this.getLanguage();
            result = result * PRIME + ($language == null ? 43 : $language.hashCode());
            return result;
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("all")
        public java.lang.String toString() {
            return "ClientSession.ClientInfo(platform=" + this.getPlatform() + ", version=" + this.getVersion() + ", deviceId=" + this.getDeviceId() + ", userAgent=" + this.getUserAgent() + ", language=" + this.getLanguage() + ")";
        }
    }

    /**
     * 更新认证状态
     */
    public void setAuthenticated(boolean authenticated) {
        this.authenticated = authenticated;
        if (authenticated) {
            this.status = SessionStatus.AUTHENTICATED;
        }
    }

    /**
     * 设置游戏状态
     */
    public void setInGame(boolean inGame) {
        if (inGame && authenticated) {
            this.status = SessionStatus.IN_GAME;
        } else if (!inGame && authenticated) {
            this.status = SessionStatus.AUTHENTICATED;
        }
    }

    /**
     * 检查会话是否有效
     */
    public boolean isValid() {
        return session != null && session.isOpen() && status != SessionStatus.DISCONNECTED;
    }

    /**
     * 获取连接持续时间（秒）
     */
    public long getConnectionDurationSeconds() {
        return java.time.Duration.between(connectTime, LocalDateTime.now()).getSeconds();
    }

    /**
     * 获取空闲时间（秒）
     */
    public long getIdleTimeSeconds() {
        return java.time.Duration.between(lastActiveTime, LocalDateTime.now()).getSeconds();
    }

    @java.lang.SuppressWarnings("all")
    public String getSessionId() {
        return this.sessionId;
    }

    @java.lang.SuppressWarnings("all")
    public WebSocketSession getSession() {
        return this.session;
    }

    @java.lang.SuppressWarnings("all")
    public String getRemoteAddress() {
        return this.remoteAddress;
    }

    @java.lang.SuppressWarnings("all")
    public LocalDateTime getConnectTime() {
        return this.connectTime;
    }

    @java.lang.SuppressWarnings("all")
    public LocalDateTime getLastActiveTime() {
        return this.lastActiveTime;
    }

    @java.lang.SuppressWarnings("all")
    public boolean isAuthenticated() {
        return this.authenticated;
    }

    @java.lang.SuppressWarnings("all")
    public String getUserId() {
        return this.userId;
    }

    @java.lang.SuppressWarnings("all")
    public String getUsername() {
        return this.username;
    }

    @java.lang.SuppressWarnings("all")
    public Long getCurrentRoomId() {
        return this.currentRoomId;
    }

    @java.lang.SuppressWarnings("all")
    public SessionStatus getStatus() {
        return this.status;
    }

    @java.lang.SuppressWarnings("all")
    public ClientInfo getClientInfo() {
        return this.clientInfo;
    }

    @java.lang.SuppressWarnings("all")
    public void setSessionId(final String sessionId) {
        this.sessionId = sessionId;
    }

    @java.lang.SuppressWarnings("all")
    public void setSession(final WebSocketSession session) {
        this.session = session;
    }

    @java.lang.SuppressWarnings("all")
    public void setRemoteAddress(final String remoteAddress) {
        this.remoteAddress = remoteAddress;
    }

    @java.lang.SuppressWarnings("all")
    public void setConnectTime(final LocalDateTime connectTime) {
        this.connectTime = connectTime;
    }

    @java.lang.SuppressWarnings("all")
    public void setLastActiveTime(final LocalDateTime lastActiveTime) {
        this.lastActiveTime = lastActiveTime;
    }

    @java.lang.SuppressWarnings("all")
    public void setUserId(final String userId) {
        this.userId = userId;
    }

    @java.lang.SuppressWarnings("all")
    public void setUsername(final String username) {
        this.username = username;
    }

    @java.lang.SuppressWarnings("all")
    public void setCurrentRoomId(final Long currentRoomId) {
        this.currentRoomId = currentRoomId;
    }

    @java.lang.SuppressWarnings("all")
    public void setStatus(final SessionStatus status) {
        this.status = status;
    }

    @java.lang.SuppressWarnings("all")
    public void setClientInfo(final ClientInfo clientInfo) {
        this.clientInfo = clientInfo;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public boolean equals(final java.lang.Object o) {
        if (o == this) return true;
        if (!(o instanceof ClientSession)) return false;
        final ClientSession other = (ClientSession) o;
        if (!other.canEqual((java.lang.Object) this)) return false;
        if (this.isAuthenticated() != other.isAuthenticated()) return false;
        final java.lang.Object this$currentRoomId = this.getCurrentRoomId();
        final java.lang.Object other$currentRoomId = other.getCurrentRoomId();
        if (this$currentRoomId == null ? other$currentRoomId != null : !this$currentRoomId.equals(other$currentRoomId)) return false;
        final java.lang.Object this$sessionId = this.getSessionId();
        final java.lang.Object other$sessionId = other.getSessionId();
        if (this$sessionId == null ? other$sessionId != null : !this$sessionId.equals(other$sessionId)) return false;
        final java.lang.Object this$session = this.getSession();
        final java.lang.Object other$session = other.getSession();
        if (this$session == null ? other$session != null : !this$session.equals(other$session)) return false;
        final java.lang.Object this$remoteAddress = this.getRemoteAddress();
        final java.lang.Object other$remoteAddress = other.getRemoteAddress();
        if (this$remoteAddress == null ? other$remoteAddress != null : !this$remoteAddress.equals(other$remoteAddress)) return false;
        final java.lang.Object this$connectTime = this.getConnectTime();
        final java.lang.Object other$connectTime = other.getConnectTime();
        if (this$connectTime == null ? other$connectTime != null : !this$connectTime.equals(other$connectTime)) return false;
        final java.lang.Object this$lastActiveTime = this.getLastActiveTime();
        final java.lang.Object other$lastActiveTime = other.getLastActiveTime();
        if (this$lastActiveTime == null ? other$lastActiveTime != null : !this$lastActiveTime.equals(other$lastActiveTime)) return false;
        final java.lang.Object this$userId = this.getUserId();
        final java.lang.Object other$userId = other.getUserId();
        if (this$userId == null ? other$userId != null : !this$userId.equals(other$userId)) return false;
        final java.lang.Object this$username = this.getUsername();
        final java.lang.Object other$username = other.getUsername();
        if (this$username == null ? other$username != null : !this$username.equals(other$username)) return false;
        final java.lang.Object this$status = this.getStatus();
        final java.lang.Object other$status = other.getStatus();
        if (this$status == null ? other$status != null : !this$status.equals(other$status)) return false;
        final java.lang.Object this$clientInfo = this.getClientInfo();
        final java.lang.Object other$clientInfo = other.getClientInfo();
        if (this$clientInfo == null ? other$clientInfo != null : !this$clientInfo.equals(other$clientInfo)) return false;
        return true;
    }

    @java.lang.SuppressWarnings("all")
    protected boolean canEqual(final java.lang.Object other) {
        return other instanceof ClientSession;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public int hashCode() {
        final int PRIME = 59;
        int result = 1;
        result = result * PRIME + (this.isAuthenticated() ? 79 : 97);
        final java.lang.Object $currentRoomId = this.getCurrentRoomId();
        result = result * PRIME + ($currentRoomId == null ? 43 : $currentRoomId.hashCode());
        final java.lang.Object $sessionId = this.getSessionId();
        result = result * PRIME + ($sessionId == null ? 43 : $sessionId.hashCode());
        final java.lang.Object $session = this.getSession();
        result = result * PRIME + ($session == null ? 43 : $session.hashCode());
        final java.lang.Object $remoteAddress = this.getRemoteAddress();
        result = result * PRIME + ($remoteAddress == null ? 43 : $remoteAddress.hashCode());
        final java.lang.Object $connectTime = this.getConnectTime();
        result = result * PRIME + ($connectTime == null ? 43 : $connectTime.hashCode());
        final java.lang.Object $lastActiveTime = this.getLastActiveTime();
        result = result * PRIME + ($lastActiveTime == null ? 43 : $lastActiveTime.hashCode());
        final java.lang.Object $userId = this.getUserId();
        result = result * PRIME + ($userId == null ? 43 : $userId.hashCode());
        final java.lang.Object $username = this.getUsername();
        result = result * PRIME + ($username == null ? 43 : $username.hashCode());
        final java.lang.Object $status = this.getStatus();
        result = result * PRIME + ($status == null ? 43 : $status.hashCode());
        final java.lang.Object $clientInfo = this.getClientInfo();
        result = result * PRIME + ($clientInfo == null ? 43 : $clientInfo.hashCode());
        return result;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public java.lang.String toString() {
        return "ClientSession(sessionId=" + this.getSessionId() + ", session=" + this.getSession() + ", remoteAddress=" + this.getRemoteAddress() + ", connectTime=" + this.getConnectTime() + ", lastActiveTime=" + this.getLastActiveTime() + ", authenticated=" + this.isAuthenticated() + ", userId=" + this.getUserId() + ", username=" + this.getUsername() + ", currentRoomId=" + this.getCurrentRoomId() + ", status=" + this.getStatus() + ", clientInfo=" + this.getClientInfo() + ")";
    }
}
