package com.jojohello_laya.login.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 中心服务器配置
 * 
 * @author laya-game
 */
@Component
@ConfigurationProperties(prefix = "central.server")
public class CentralServerConfig {
    /**
     * HTTP服务器地址
     */
    private String url = "http://localhost:8083";
    /**
     * WebSocket服务器地址
     */
    private String websocketUrl = "ws://localhost:8083/ws";
    /**
     * HTTP请求超时时间（毫秒）
     */
    private long timeout = 5000;
    /**
     * HTTP连接超时时间（毫秒）
     */
    private long connectionTimeout = 10000;
    /**
     * HTTP请求重试次数
     */
    private int retryCount = 3;
    /**
     * 系统服务认证密钥（必须与Central Server保持一致）
     */
    private String serviceAuthSecret = "CHANGE_ME_IN_PRODUCTION";
    /**
     * WebSocket配置
     */
    private WebSocketConfig websocket = new WebSocketConfig();


    public static class WebSocketConfig {
        /**
         * 是否启用WebSocket连接
         */
        private boolean enabled = true;
        /**
         * 重连间隔（毫秒）
         */
        private long reconnectInterval = 5000;
        /**
         * 最大重连次数（-1表示无限制）
         */
        private int maxReconnectAttempts = -1;
        /**
         * 心跳间隔（毫秒）
         */
        private long heartbeatInterval = 30000;
        /**
         * 连接超时时间（毫秒）
         */
        private long connectionTimeout = 10000;

        @java.lang.SuppressWarnings("all")
        public WebSocketConfig() {
        }

        @java.lang.SuppressWarnings("all")
        public boolean isEnabled() {
            return this.enabled;
        }

        @java.lang.SuppressWarnings("all")
        public long getReconnectInterval() {
            return this.reconnectInterval;
        }

        @java.lang.SuppressWarnings("all")
        public int getMaxReconnectAttempts() {
            return this.maxReconnectAttempts;
        }

        @java.lang.SuppressWarnings("all")
        public long getHeartbeatInterval() {
            return this.heartbeatInterval;
        }

        @java.lang.SuppressWarnings("all")
        public long getConnectionTimeout() {
            return this.connectionTimeout;
        }

        @java.lang.SuppressWarnings("all")
        public void setEnabled(final boolean enabled) {
            this.enabled = enabled;
        }

        @java.lang.SuppressWarnings("all")
        public void setReconnectInterval(final long reconnectInterval) {
            this.reconnectInterval = reconnectInterval;
        }

        @java.lang.SuppressWarnings("all")
        public void setMaxReconnectAttempts(final int maxReconnectAttempts) {
            this.maxReconnectAttempts = maxReconnectAttempts;
        }

        @java.lang.SuppressWarnings("all")
        public void setHeartbeatInterval(final long heartbeatInterval) {
            this.heartbeatInterval = heartbeatInterval;
        }

        @java.lang.SuppressWarnings("all")
        public void setConnectionTimeout(final long connectionTimeout) {
            this.connectionTimeout = connectionTimeout;
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("all")
        public boolean equals(final java.lang.Object o) {
            if (o == this) return true;
            if (!(o instanceof CentralServerConfig.WebSocketConfig)) return false;
            final CentralServerConfig.WebSocketConfig other = (CentralServerConfig.WebSocketConfig) o;
            if (!other.canEqual((java.lang.Object) this)) return false;
            if (this.isEnabled() != other.isEnabled()) return false;
            if (this.getReconnectInterval() != other.getReconnectInterval()) return false;
            if (this.getMaxReconnectAttempts() != other.getMaxReconnectAttempts()) return false;
            if (this.getHeartbeatInterval() != other.getHeartbeatInterval()) return false;
            if (this.getConnectionTimeout() != other.getConnectionTimeout()) return false;
            return true;
        }

        @java.lang.SuppressWarnings("all")
        protected boolean canEqual(final java.lang.Object other) {
            return other instanceof CentralServerConfig.WebSocketConfig;
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("all")
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            result = result * PRIME + (this.isEnabled() ? 79 : 97);
            final long $reconnectInterval = this.getReconnectInterval();
            result = result * PRIME + (int) ($reconnectInterval >>> 32 ^ $reconnectInterval);
            result = result * PRIME + this.getMaxReconnectAttempts();
            final long $heartbeatInterval = this.getHeartbeatInterval();
            result = result * PRIME + (int) ($heartbeatInterval >>> 32 ^ $heartbeatInterval);
            final long $connectionTimeout = this.getConnectionTimeout();
            result = result * PRIME + (int) ($connectionTimeout >>> 32 ^ $connectionTimeout);
            return result;
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("all")
        public java.lang.String toString() {
            return "CentralServerConfig.WebSocketConfig(enabled=" + this.isEnabled() + ", reconnectInterval=" + this.getReconnectInterval() + ", maxReconnectAttempts=" + this.getMaxReconnectAttempts() + ", heartbeatInterval=" + this.getHeartbeatInterval() + ", connectionTimeout=" + this.getConnectionTimeout() + ")";
        }
    }

    @java.lang.SuppressWarnings("all")
    public CentralServerConfig() {
    }

    /**
     * HTTP服务器地址
     */
    @java.lang.SuppressWarnings("all")
    public String getUrl() {
        return this.url;
    }

    /**
     * WebSocket服务器地址
     */
    @java.lang.SuppressWarnings("all")
    public String getWebsocketUrl() {
        return this.websocketUrl;
    }

    /**
     * HTTP请求超时时间（毫秒）
     */
    @java.lang.SuppressWarnings("all")
    public long getTimeout() {
        return this.timeout;
    }

    /**
     * HTTP连接超时时间（毫秒）
     */
    @java.lang.SuppressWarnings("all")
    public long getConnectionTimeout() {
        return this.connectionTimeout;
    }

    /**
     * HTTP请求重试次数
     */
    @java.lang.SuppressWarnings("all")
    public int getRetryCount() {
        return this.retryCount;
    }

    /**
     * 系统服务认证密钥（必须与Central Server保持一致）
     */
    @java.lang.SuppressWarnings("all")
    public String getServiceAuthSecret() {
        return this.serviceAuthSecret;
    }

    /**
     * WebSocket配置
     */
    @java.lang.SuppressWarnings("all")
    public WebSocketConfig getWebsocket() {
        return this.websocket;
    }

    /**
     * HTTP服务器地址
     */
    @java.lang.SuppressWarnings("all")
    public void setUrl(final String url) {
        this.url = url;
    }

    /**
     * WebSocket服务器地址
     */
    @java.lang.SuppressWarnings("all")
    public void setWebsocketUrl(final String websocketUrl) {
        this.websocketUrl = websocketUrl;
    }

    /**
     * HTTP请求超时时间（毫秒）
     */
    @java.lang.SuppressWarnings("all")
    public void setTimeout(final long timeout) {
        this.timeout = timeout;
    }

    /**
     * HTTP连接超时时间（毫秒）
     */
    @java.lang.SuppressWarnings("all")
    public void setConnectionTimeout(final long connectionTimeout) {
        this.connectionTimeout = connectionTimeout;
    }

    /**
     * HTTP请求重试次数
     */
    @java.lang.SuppressWarnings("all")
    public void setRetryCount(final int retryCount) {
        this.retryCount = retryCount;
    }

    /**
     * 系统服务认证密钥（必须与Central Server保持一致）
     */
    @java.lang.SuppressWarnings("all")
    public void setServiceAuthSecret(final String serviceAuthSecret) {
        this.serviceAuthSecret = serviceAuthSecret;
    }

    /**
     * WebSocket配置
     */
    @java.lang.SuppressWarnings("all")
    public void setWebsocket(final WebSocketConfig websocket) {
        this.websocket = websocket;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public boolean equals(final java.lang.Object o) {
        if (o == this) return true;
        if (!(o instanceof CentralServerConfig)) return false;
        final CentralServerConfig other = (CentralServerConfig) o;
        if (!other.canEqual((java.lang.Object) this)) return false;
        if (this.getTimeout() != other.getTimeout()) return false;
        if (this.getConnectionTimeout() != other.getConnectionTimeout()) return false;
        if (this.getRetryCount() != other.getRetryCount()) return false;
        final java.lang.Object this$url = this.getUrl();
        final java.lang.Object other$url = other.getUrl();
        if (this$url == null ? other$url != null : !this$url.equals(other$url)) return false;
        final java.lang.Object this$websocketUrl = this.getWebsocketUrl();
        final java.lang.Object other$websocketUrl = other.getWebsocketUrl();
        if (this$websocketUrl == null ? other$websocketUrl != null : !this$websocketUrl.equals(other$websocketUrl)) return false;
        final java.lang.Object this$serviceAuthSecret = this.getServiceAuthSecret();
        final java.lang.Object other$serviceAuthSecret = other.getServiceAuthSecret();
        if (this$serviceAuthSecret == null ? other$serviceAuthSecret != null : !this$serviceAuthSecret.equals(other$serviceAuthSecret)) return false;
        final java.lang.Object this$websocket = this.getWebsocket();
        final java.lang.Object other$websocket = other.getWebsocket();
        if (this$websocket == null ? other$websocket != null : !this$websocket.equals(other$websocket)) return false;
        return true;
    }

    @java.lang.SuppressWarnings("all")
    protected boolean canEqual(final java.lang.Object other) {
        return other instanceof CentralServerConfig;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public int hashCode() {
        final int PRIME = 59;
        int result = 1;
        final long $timeout = this.getTimeout();
        result = result * PRIME + (int) ($timeout >>> 32 ^ $timeout);
        final long $connectionTimeout = this.getConnectionTimeout();
        result = result * PRIME + (int) ($connectionTimeout >>> 32 ^ $connectionTimeout);
        result = result * PRIME + this.getRetryCount();
        final java.lang.Object $url = this.getUrl();
        result = result * PRIME + ($url == null ? 43 : $url.hashCode());
        final java.lang.Object $websocketUrl = this.getWebsocketUrl();
        result = result * PRIME + ($websocketUrl == null ? 43 : $websocketUrl.hashCode());
        final java.lang.Object $serviceAuthSecret = this.getServiceAuthSecret();
        result = result * PRIME + ($serviceAuthSecret == null ? 43 : $serviceAuthSecret.hashCode());
        final java.lang.Object $websocket = this.getWebsocket();
        result = result * PRIME + ($websocket == null ? 43 : $websocket.hashCode());
        return result;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public java.lang.String toString() {
        return "CentralServerConfig(url=" + this.getUrl() + ", websocketUrl=" + this.getWebsocketUrl() + ", timeout=" + this.getTimeout() + ", connectionTimeout=" + this.getConnectionTimeout() + ", retryCount=" + this.getRetryCount() + ", serviceAuthSecret=" + this.getServiceAuthSecret() + ", websocket=" + this.getWebsocket() + ")";
    }
}
