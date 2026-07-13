package com.jojohello_laya.login.model;

import java.util.List;

/**
 * 登录响应模型
 *
 * @author laya-game
 */
public class LoginResponse {
    /**
     * 是否成功
     */
    private boolean success;
    /**
     * 错误码
     */
    private String errorCode;
    /**
     * 错误信息
     */
    private String errorMessage;
    /**
     * JWT Token
     */
    private String token;
    /**
     * 用户ID
     */
    private String userId;
    /**
     * 登录时间戳
     */
    private Long loginTimestamp;
    /**
     * 用户昵称
     */
    private String nickname;
    /**
     * 用户头像
     */
    private String avatar;
    /**
     * 网关IP地址（已废弃，使用 gatewayWsUrl）
     */
    @Deprecated
    private String gatewayIp;
    /**
     * 网关端口（已废弃，使用 gatewayWsUrl）
     */
    @Deprecated
    private Integer gatewayPort;
    /**
     * 网关WebSocket URL（已废弃，改为返回服务器列表）
     */
    @Deprecated
    private String gatewayWsUrl;
    /**
     * 游戏服务器列表
     *
     * 新架构：登录成功后返回服务器列表，客户端选择后再连接
     */
    private List<GameServerInfo> gameServerList;


    /**
     * 游戏服务器信息（内部类）
     */
    public static class GameServerInfo {
        /**
         * 服务器ID
         */
        private String id;
        /**
         * 服务器名称
         */
        private String name;
        /**
         * 服务器状态（online, maintenance, full）
         */
        private String status;
        /**
         * 当前在线人数
         */
        private Integer onlineCount;
        /**
         * 最大容量
         */
        private Integer maxCapacity;
        /**
         * 推荐度（0-100）
         */
        private Integer recommendScore;
        /**
         * Gateway WebSocket URL
         */
        private String wsUrl;
        /**
         * 服务器标签（如："新服"、"火爆"）
         */
        private List<String> tags;


        @java.lang.SuppressWarnings("all")
        public static class GameServerInfoBuilder {
            @java.lang.SuppressWarnings("all")
            private String id;
            @java.lang.SuppressWarnings("all")
            private String name;
            @java.lang.SuppressWarnings("all")
            private String status;
            @java.lang.SuppressWarnings("all")
            private Integer onlineCount;
            @java.lang.SuppressWarnings("all")
            private Integer maxCapacity;
            @java.lang.SuppressWarnings("all")
            private Integer recommendScore;
            @java.lang.SuppressWarnings("all")
            private String wsUrl;
            @java.lang.SuppressWarnings("all")
            private List<String> tags;

            @java.lang.SuppressWarnings("all")
            GameServerInfoBuilder() {
            }

            /**
             * 服务器ID
             * @return {@code this}.
             */
            @java.lang.SuppressWarnings("all")
            public LoginResponse.GameServerInfo.GameServerInfoBuilder id(final String id) {
                this.id = id;
                return this;
            }

            /**
             * 服务器名称
             * @return {@code this}.
             */
            @java.lang.SuppressWarnings("all")
            public LoginResponse.GameServerInfo.GameServerInfoBuilder name(final String name) {
                this.name = name;
                return this;
            }

            /**
             * 服务器状态（online, maintenance, full）
             * @return {@code this}.
             */
            @java.lang.SuppressWarnings("all")
            public LoginResponse.GameServerInfo.GameServerInfoBuilder status(final String status) {
                this.status = status;
                return this;
            }

            /**
             * 当前在线人数
             * @return {@code this}.
             */
            @java.lang.SuppressWarnings("all")
            public LoginResponse.GameServerInfo.GameServerInfoBuilder onlineCount(final Integer onlineCount) {
                this.onlineCount = onlineCount;
                return this;
            }

            /**
             * 最大容量
             * @return {@code this}.
             */
            @java.lang.SuppressWarnings("all")
            public LoginResponse.GameServerInfo.GameServerInfoBuilder maxCapacity(final Integer maxCapacity) {
                this.maxCapacity = maxCapacity;
                return this;
            }

            /**
             * 推荐度（0-100）
             * @return {@code this}.
             */
            @java.lang.SuppressWarnings("all")
            public LoginResponse.GameServerInfo.GameServerInfoBuilder recommendScore(final Integer recommendScore) {
                this.recommendScore = recommendScore;
                return this;
            }

            /**
             * Gateway WebSocket URL
             * @return {@code this}.
             */
            @java.lang.SuppressWarnings("all")
            public LoginResponse.GameServerInfo.GameServerInfoBuilder wsUrl(final String wsUrl) {
                this.wsUrl = wsUrl;
                return this;
            }

            /**
             * 服务器标签（如："新服"、"火爆"）
             * @return {@code this}.
             */
            @java.lang.SuppressWarnings("all")
            public LoginResponse.GameServerInfo.GameServerInfoBuilder tags(final List<String> tags) {
                this.tags = tags;
                return this;
            }

            @java.lang.SuppressWarnings("all")
            public LoginResponse.GameServerInfo build() {
                return new LoginResponse.GameServerInfo(this.id, this.name, this.status, this.onlineCount, this.maxCapacity, this.recommendScore, this.wsUrl, this.tags);
            }

            @java.lang.Override
            @java.lang.SuppressWarnings("all")
            public java.lang.String toString() {
                return "LoginResponse.GameServerInfo.GameServerInfoBuilder(id=" + this.id + ", name=" + this.name + ", status=" + this.status + ", onlineCount=" + this.onlineCount + ", maxCapacity=" + this.maxCapacity + ", recommendScore=" + this.recommendScore + ", wsUrl=" + this.wsUrl + ", tags=" + this.tags + ")";
            }
        }

        @java.lang.SuppressWarnings("all")
        public static LoginResponse.GameServerInfo.GameServerInfoBuilder builder() {
            return new LoginResponse.GameServerInfo.GameServerInfoBuilder();
        }

        /**
         * 服务器ID
         */
        @java.lang.SuppressWarnings("all")
        public String getId() {
            return this.id;
        }

        /**
         * 服务器名称
         */
        @java.lang.SuppressWarnings("all")
        public String getName() {
            return this.name;
        }

        /**
         * 服务器状态（online, maintenance, full）
         */
        @java.lang.SuppressWarnings("all")
        public String getStatus() {
            return this.status;
        }

        /**
         * 当前在线人数
         */
        @java.lang.SuppressWarnings("all")
        public Integer getOnlineCount() {
            return this.onlineCount;
        }

        /**
         * 最大容量
         */
        @java.lang.SuppressWarnings("all")
        public Integer getMaxCapacity() {
            return this.maxCapacity;
        }

        /**
         * 推荐度（0-100）
         */
        @java.lang.SuppressWarnings("all")
        public Integer getRecommendScore() {
            return this.recommendScore;
        }

        /**
         * Gateway WebSocket URL
         */
        @java.lang.SuppressWarnings("all")
        public String getWsUrl() {
            return this.wsUrl;
        }

        /**
         * 服务器标签（如："新服"、"火爆"）
         */
        @java.lang.SuppressWarnings("all")
        public List<String> getTags() {
            return this.tags;
        }

        /**
         * 服务器ID
         */
        @java.lang.SuppressWarnings("all")
        public void setId(final String id) {
            this.id = id;
        }

        /**
         * 服务器名称
         */
        @java.lang.SuppressWarnings("all")
        public void setName(final String name) {
            this.name = name;
        }

        /**
         * 服务器状态（online, maintenance, full）
         */
        @java.lang.SuppressWarnings("all")
        public void setStatus(final String status) {
            this.status = status;
        }

        /**
         * 当前在线人数
         */
        @java.lang.SuppressWarnings("all")
        public void setOnlineCount(final Integer onlineCount) {
            this.onlineCount = onlineCount;
        }

        /**
         * 最大容量
         */
        @java.lang.SuppressWarnings("all")
        public void setMaxCapacity(final Integer maxCapacity) {
            this.maxCapacity = maxCapacity;
        }

        /**
         * 推荐度（0-100）
         */
        @java.lang.SuppressWarnings("all")
        public void setRecommendScore(final Integer recommendScore) {
            this.recommendScore = recommendScore;
        }

        /**
         * Gateway WebSocket URL
         */
        @java.lang.SuppressWarnings("all")
        public void setWsUrl(final String wsUrl) {
            this.wsUrl = wsUrl;
        }

        /**
         * 服务器标签（如："新服"、"火爆"）
         */
        @java.lang.SuppressWarnings("all")
        public void setTags(final List<String> tags) {
            this.tags = tags;
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("all")
        public boolean equals(final java.lang.Object o) {
            if (o == this) return true;
            if (!(o instanceof LoginResponse.GameServerInfo)) return false;
            final LoginResponse.GameServerInfo other = (LoginResponse.GameServerInfo) o;
            if (!other.canEqual((java.lang.Object) this)) return false;
            final java.lang.Object this$onlineCount = this.getOnlineCount();
            final java.lang.Object other$onlineCount = other.getOnlineCount();
            if (this$onlineCount == null ? other$onlineCount != null : !this$onlineCount.equals(other$onlineCount)) return false;
            final java.lang.Object this$maxCapacity = this.getMaxCapacity();
            final java.lang.Object other$maxCapacity = other.getMaxCapacity();
            if (this$maxCapacity == null ? other$maxCapacity != null : !this$maxCapacity.equals(other$maxCapacity)) return false;
            final java.lang.Object this$recommendScore = this.getRecommendScore();
            final java.lang.Object other$recommendScore = other.getRecommendScore();
            if (this$recommendScore == null ? other$recommendScore != null : !this$recommendScore.equals(other$recommendScore)) return false;
            final java.lang.Object this$id = this.getId();
            final java.lang.Object other$id = other.getId();
            if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
            final java.lang.Object this$name = this.getName();
            final java.lang.Object other$name = other.getName();
            if (this$name == null ? other$name != null : !this$name.equals(other$name)) return false;
            final java.lang.Object this$status = this.getStatus();
            final java.lang.Object other$status = other.getStatus();
            if (this$status == null ? other$status != null : !this$status.equals(other$status)) return false;
            final java.lang.Object this$wsUrl = this.getWsUrl();
            final java.lang.Object other$wsUrl = other.getWsUrl();
            if (this$wsUrl == null ? other$wsUrl != null : !this$wsUrl.equals(other$wsUrl)) return false;
            final java.lang.Object this$tags = this.getTags();
            final java.lang.Object other$tags = other.getTags();
            if (this$tags == null ? other$tags != null : !this$tags.equals(other$tags)) return false;
            return true;
        }

        @java.lang.SuppressWarnings("all")
        protected boolean canEqual(final java.lang.Object other) {
            return other instanceof LoginResponse.GameServerInfo;
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("all")
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final java.lang.Object $onlineCount = this.getOnlineCount();
            result = result * PRIME + ($onlineCount == null ? 43 : $onlineCount.hashCode());
            final java.lang.Object $maxCapacity = this.getMaxCapacity();
            result = result * PRIME + ($maxCapacity == null ? 43 : $maxCapacity.hashCode());
            final java.lang.Object $recommendScore = this.getRecommendScore();
            result = result * PRIME + ($recommendScore == null ? 43 : $recommendScore.hashCode());
            final java.lang.Object $id = this.getId();
            result = result * PRIME + ($id == null ? 43 : $id.hashCode());
            final java.lang.Object $name = this.getName();
            result = result * PRIME + ($name == null ? 43 : $name.hashCode());
            final java.lang.Object $status = this.getStatus();
            result = result * PRIME + ($status == null ? 43 : $status.hashCode());
            final java.lang.Object $wsUrl = this.getWsUrl();
            result = result * PRIME + ($wsUrl == null ? 43 : $wsUrl.hashCode());
            final java.lang.Object $tags = this.getTags();
            result = result * PRIME + ($tags == null ? 43 : $tags.hashCode());
            return result;
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("all")
        public java.lang.String toString() {
            return "LoginResponse.GameServerInfo(id=" + this.getId() + ", name=" + this.getName() + ", status=" + this.getStatus() + ", onlineCount=" + this.getOnlineCount() + ", maxCapacity=" + this.getMaxCapacity() + ", recommendScore=" + this.getRecommendScore() + ", wsUrl=" + this.getWsUrl() + ", tags=" + this.getTags() + ")";
        }

        @java.lang.SuppressWarnings("all")
        public GameServerInfo() {
        }

        @java.lang.SuppressWarnings("all")
        public GameServerInfo(final String id, final String name, final String status, final Integer onlineCount, final Integer maxCapacity, final Integer recommendScore, final String wsUrl, final List<String> tags) {
            this.id = id;
            this.name = name;
            this.status = status;
            this.onlineCount = onlineCount;
            this.maxCapacity = maxCapacity;
            this.recommendScore = recommendScore;
            this.wsUrl = wsUrl;
            this.tags = tags;
        }
    }

    /**
     * 创建成功响应
     */
    public static LoginResponse success(String token, String userId, Long loginTimestamp) {
        return LoginResponse.builder().success(true).token(token).userId(userId).loginTimestamp(loginTimestamp).build();
    }

    /**
     * 创建包含网关信息的成功响应
     */
    public static LoginResponse success(String token, String userId, Long loginTimestamp, String gatewayIp, Integer gatewayPort) {
        return  // 使用原生WebSocket端点，不是SockJS
        LoginResponse.builder().success(true).token(token).userId(userId).loginTimestamp(loginTimestamp).gatewayIp(gatewayIp).gatewayPort(gatewayPort).gatewayWsUrl("ws://" + gatewayIp + ":" + gatewayPort + "/ws/native").build();
    }

    /**
     * 创建失败响应
     */
    public static LoginResponse failure(String errorCode, String errorMessage) {
        return LoginResponse.builder().success(false).errorCode(errorCode).errorMessage(errorMessage).build();
    }


    @java.lang.SuppressWarnings("all")
    public static class LoginResponseBuilder {
        @java.lang.SuppressWarnings("all")
        private boolean success;
        @java.lang.SuppressWarnings("all")
        private String errorCode;
        @java.lang.SuppressWarnings("all")
        private String errorMessage;
        @java.lang.SuppressWarnings("all")
        private String token;
        @java.lang.SuppressWarnings("all")
        private String userId;
        @java.lang.SuppressWarnings("all")
        private Long loginTimestamp;
        @java.lang.SuppressWarnings("all")
        private String nickname;
        @java.lang.SuppressWarnings("all")
        private String avatar;
        @java.lang.SuppressWarnings("all")
        private String gatewayIp;
        @java.lang.SuppressWarnings("all")
        private Integer gatewayPort;
        @java.lang.SuppressWarnings("all")
        private String gatewayWsUrl;
        @java.lang.SuppressWarnings("all")
        private List<GameServerInfo> gameServerList;

        @java.lang.SuppressWarnings("all")
        LoginResponseBuilder() {
        }

        /**
         * 是否成功
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginResponse.LoginResponseBuilder success(final boolean success) {
            this.success = success;
            return this;
        }

        /**
         * 错误码
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginResponse.LoginResponseBuilder errorCode(final String errorCode) {
            this.errorCode = errorCode;
            return this;
        }

        /**
         * 错误信息
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginResponse.LoginResponseBuilder errorMessage(final String errorMessage) {
            this.errorMessage = errorMessage;
            return this;
        }

        /**
         * JWT Token
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginResponse.LoginResponseBuilder token(final String token) {
            this.token = token;
            return this;
        }

        /**
         * 用户ID
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginResponse.LoginResponseBuilder userId(final String userId) {
            this.userId = userId;
            return this;
        }

        /**
         * 登录时间戳
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginResponse.LoginResponseBuilder loginTimestamp(final Long loginTimestamp) {
            this.loginTimestamp = loginTimestamp;
            return this;
        }

        /**
         * 用户昵称
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginResponse.LoginResponseBuilder nickname(final String nickname) {
            this.nickname = nickname;
            return this;
        }

        /**
         * 用户头像
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginResponse.LoginResponseBuilder avatar(final String avatar) {
            this.avatar = avatar;
            return this;
        }

        /**
         * 网关IP地址（已废弃，使用 gatewayWsUrl）
         * @return {@code this}.
         */
        @java.lang.Deprecated
        @java.lang.SuppressWarnings("all")
        public LoginResponse.LoginResponseBuilder gatewayIp(final String gatewayIp) {
            this.gatewayIp = gatewayIp;
            return this;
        }

        /**
         * 网关端口（已废弃，使用 gatewayWsUrl）
         * @return {@code this}.
         */
        @java.lang.Deprecated
        @java.lang.SuppressWarnings("all")
        public LoginResponse.LoginResponseBuilder gatewayPort(final Integer gatewayPort) {
            this.gatewayPort = gatewayPort;
            return this;
        }

        /**
         * 网关WebSocket URL（已废弃，改为返回服务器列表）
         * @return {@code this}.
         */
        @java.lang.Deprecated
        @java.lang.SuppressWarnings("all")
        public LoginResponse.LoginResponseBuilder gatewayWsUrl(final String gatewayWsUrl) {
            this.gatewayWsUrl = gatewayWsUrl;
            return this;
        }

        /**
         * 游戏服务器列表
         *
         * 新架构：登录成功后返回服务器列表，客户端选择后再连接
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginResponse.LoginResponseBuilder gameServerList(final List<GameServerInfo> gameServerList) {
            this.gameServerList = gameServerList;
            return this;
        }

        @java.lang.SuppressWarnings("all")
        public LoginResponse build() {
            return new LoginResponse(this.success, this.errorCode, this.errorMessage, this.token, this.userId, this.loginTimestamp, this.nickname, this.avatar, this.gatewayIp, this.gatewayPort, this.gatewayWsUrl, this.gameServerList);
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("all")
        public java.lang.String toString() {
            return "LoginResponse.LoginResponseBuilder(success=" + this.success + ", errorCode=" + this.errorCode + ", errorMessage=" + this.errorMessage + ", token=" + this.token + ", userId=" + this.userId + ", loginTimestamp=" + this.loginTimestamp + ", nickname=" + this.nickname + ", avatar=" + this.avatar + ", gatewayIp=" + this.gatewayIp + ", gatewayPort=" + this.gatewayPort + ", gatewayWsUrl=" + this.gatewayWsUrl + ", gameServerList=" + this.gameServerList + ")";
        }
    }

    @java.lang.SuppressWarnings("all")
    public static LoginResponse.LoginResponseBuilder builder() {
        return new LoginResponse.LoginResponseBuilder();
    }

    /**
     * 是否成功
     */
    @java.lang.SuppressWarnings("all")
    public boolean isSuccess() {
        return this.success;
    }

    /**
     * 错误码
     */
    @java.lang.SuppressWarnings("all")
    public String getErrorCode() {
        return this.errorCode;
    }

    /**
     * 错误信息
     */
    @java.lang.SuppressWarnings("all")
    public String getErrorMessage() {
        return this.errorMessage;
    }

    /**
     * JWT Token
     */
    @java.lang.SuppressWarnings("all")
    public String getToken() {
        return this.token;
    }

    /**
     * 用户ID
     */
    @java.lang.SuppressWarnings("all")
    public String getUserId() {
        return this.userId;
    }

    /**
     * 登录时间戳
     */
    @java.lang.SuppressWarnings("all")
    public Long getLoginTimestamp() {
        return this.loginTimestamp;
    }

    /**
     * 用户昵称
     */
    @java.lang.SuppressWarnings("all")
    public String getNickname() {
        return this.nickname;
    }

    /**
     * 用户头像
     */
    @java.lang.SuppressWarnings("all")
    public String getAvatar() {
        return this.avatar;
    }

    /**
     * 网关IP地址（已废弃，使用 gatewayWsUrl）
     */
    @java.lang.Deprecated
    @java.lang.SuppressWarnings("all")
    public String getGatewayIp() {
        return this.gatewayIp;
    }

    /**
     * 网关端口（已废弃，使用 gatewayWsUrl）
     */
    @java.lang.Deprecated
    @java.lang.SuppressWarnings("all")
    public Integer getGatewayPort() {
        return this.gatewayPort;
    }

    /**
     * 网关WebSocket URL（已废弃，改为返回服务器列表）
     */
    @java.lang.Deprecated
    @java.lang.SuppressWarnings("all")
    public String getGatewayWsUrl() {
        return this.gatewayWsUrl;
    }

    /**
     * 游戏服务器列表
     *
     * 新架构：登录成功后返回服务器列表，客户端选择后再连接
     */
    @java.lang.SuppressWarnings("all")
    public List<GameServerInfo> getGameServerList() {
        return this.gameServerList;
    }

    /**
     * 是否成功
     */
    @java.lang.SuppressWarnings("all")
    public void setSuccess(final boolean success) {
        this.success = success;
    }

    /**
     * 错误码
     */
    @java.lang.SuppressWarnings("all")
    public void setErrorCode(final String errorCode) {
        this.errorCode = errorCode;
    }

    /**
     * 错误信息
     */
    @java.lang.SuppressWarnings("all")
    public void setErrorMessage(final String errorMessage) {
        this.errorMessage = errorMessage;
    }

    /**
     * JWT Token
     */
    @java.lang.SuppressWarnings("all")
    public void setToken(final String token) {
        this.token = token;
    }

    /**
     * 用户ID
     */
    @java.lang.SuppressWarnings("all")
    public void setUserId(final String userId) {
        this.userId = userId;
    }

    /**
     * 登录时间戳
     */
    @java.lang.SuppressWarnings("all")
    public void setLoginTimestamp(final Long loginTimestamp) {
        this.loginTimestamp = loginTimestamp;
    }

    /**
     * 用户昵称
     */
    @java.lang.SuppressWarnings("all")
    public void setNickname(final String nickname) {
        this.nickname = nickname;
    }

    /**
     * 用户头像
     */
    @java.lang.SuppressWarnings("all")
    public void setAvatar(final String avatar) {
        this.avatar = avatar;
    }

    /**
     * 网关IP地址（已废弃，使用 gatewayWsUrl）
     */
    @java.lang.Deprecated
    @java.lang.SuppressWarnings("all")
    public void setGatewayIp(final String gatewayIp) {
        this.gatewayIp = gatewayIp;
    }

    /**
     * 网关端口（已废弃，使用 gatewayWsUrl）
     */
    @java.lang.Deprecated
    @java.lang.SuppressWarnings("all")
    public void setGatewayPort(final Integer gatewayPort) {
        this.gatewayPort = gatewayPort;
    }

    /**
     * 网关WebSocket URL（已废弃，改为返回服务器列表）
     */
    @java.lang.Deprecated
    @java.lang.SuppressWarnings("all")
    public void setGatewayWsUrl(final String gatewayWsUrl) {
        this.gatewayWsUrl = gatewayWsUrl;
    }

    /**
     * 游戏服务器列表
     *
     * 新架构：登录成功后返回服务器列表，客户端选择后再连接
     */
    @java.lang.SuppressWarnings("all")
    public void setGameServerList(final List<GameServerInfo> gameServerList) {
        this.gameServerList = gameServerList;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public boolean equals(final java.lang.Object o) {
        if (o == this) return true;
        if (!(o instanceof LoginResponse)) return false;
        final LoginResponse other = (LoginResponse) o;
        if (!other.canEqual((java.lang.Object) this)) return false;
        if (this.isSuccess() != other.isSuccess()) return false;
        final java.lang.Object this$loginTimestamp = this.getLoginTimestamp();
        final java.lang.Object other$loginTimestamp = other.getLoginTimestamp();
        if (this$loginTimestamp == null ? other$loginTimestamp != null : !this$loginTimestamp.equals(other$loginTimestamp)) return false;
        final java.lang.Object this$gatewayPort = this.getGatewayPort();
        final java.lang.Object other$gatewayPort = other.getGatewayPort();
        if (this$gatewayPort == null ? other$gatewayPort != null : !this$gatewayPort.equals(other$gatewayPort)) return false;
        final java.lang.Object this$errorCode = this.getErrorCode();
        final java.lang.Object other$errorCode = other.getErrorCode();
        if (this$errorCode == null ? other$errorCode != null : !this$errorCode.equals(other$errorCode)) return false;
        final java.lang.Object this$errorMessage = this.getErrorMessage();
        final java.lang.Object other$errorMessage = other.getErrorMessage();
        if (this$errorMessage == null ? other$errorMessage != null : !this$errorMessage.equals(other$errorMessage)) return false;
        final java.lang.Object this$token = this.getToken();
        final java.lang.Object other$token = other.getToken();
        if (this$token == null ? other$token != null : !this$token.equals(other$token)) return false;
        final java.lang.Object this$userId = this.getUserId();
        final java.lang.Object other$userId = other.getUserId();
        if (this$userId == null ? other$userId != null : !this$userId.equals(other$userId)) return false;
        final java.lang.Object this$nickname = this.getNickname();
        final java.lang.Object other$nickname = other.getNickname();
        if (this$nickname == null ? other$nickname != null : !this$nickname.equals(other$nickname)) return false;
        final java.lang.Object this$avatar = this.getAvatar();
        final java.lang.Object other$avatar = other.getAvatar();
        if (this$avatar == null ? other$avatar != null : !this$avatar.equals(other$avatar)) return false;
        final java.lang.Object this$gatewayIp = this.getGatewayIp();
        final java.lang.Object other$gatewayIp = other.getGatewayIp();
        if (this$gatewayIp == null ? other$gatewayIp != null : !this$gatewayIp.equals(other$gatewayIp)) return false;
        final java.lang.Object this$gatewayWsUrl = this.getGatewayWsUrl();
        final java.lang.Object other$gatewayWsUrl = other.getGatewayWsUrl();
        if (this$gatewayWsUrl == null ? other$gatewayWsUrl != null : !this$gatewayWsUrl.equals(other$gatewayWsUrl)) return false;
        final java.lang.Object this$gameServerList = this.getGameServerList();
        final java.lang.Object other$gameServerList = other.getGameServerList();
        if (this$gameServerList == null ? other$gameServerList != null : !this$gameServerList.equals(other$gameServerList)) return false;
        return true;
    }

    @java.lang.SuppressWarnings("all")
    protected boolean canEqual(final java.lang.Object other) {
        return other instanceof LoginResponse;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public int hashCode() {
        final int PRIME = 59;
        int result = 1;
        result = result * PRIME + (this.isSuccess() ? 79 : 97);
        final java.lang.Object $loginTimestamp = this.getLoginTimestamp();
        result = result * PRIME + ($loginTimestamp == null ? 43 : $loginTimestamp.hashCode());
        final java.lang.Object $gatewayPort = this.getGatewayPort();
        result = result * PRIME + ($gatewayPort == null ? 43 : $gatewayPort.hashCode());
        final java.lang.Object $errorCode = this.getErrorCode();
        result = result * PRIME + ($errorCode == null ? 43 : $errorCode.hashCode());
        final java.lang.Object $errorMessage = this.getErrorMessage();
        result = result * PRIME + ($errorMessage == null ? 43 : $errorMessage.hashCode());
        final java.lang.Object $token = this.getToken();
        result = result * PRIME + ($token == null ? 43 : $token.hashCode());
        final java.lang.Object $userId = this.getUserId();
        result = result * PRIME + ($userId == null ? 43 : $userId.hashCode());
        final java.lang.Object $nickname = this.getNickname();
        result = result * PRIME + ($nickname == null ? 43 : $nickname.hashCode());
        final java.lang.Object $avatar = this.getAvatar();
        result = result * PRIME + ($avatar == null ? 43 : $avatar.hashCode());
        final java.lang.Object $gatewayIp = this.getGatewayIp();
        result = result * PRIME + ($gatewayIp == null ? 43 : $gatewayIp.hashCode());
        final java.lang.Object $gatewayWsUrl = this.getGatewayWsUrl();
        result = result * PRIME + ($gatewayWsUrl == null ? 43 : $gatewayWsUrl.hashCode());
        final java.lang.Object $gameServerList = this.getGameServerList();
        result = result * PRIME + ($gameServerList == null ? 43 : $gameServerList.hashCode());
        return result;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public java.lang.String toString() {
        return "LoginResponse(success=" + this.isSuccess() + ", errorCode=" + this.getErrorCode() + ", errorMessage=" + this.getErrorMessage() + ", token=" + this.getToken() + ", userId=" + this.getUserId() + ", loginTimestamp=" + this.getLoginTimestamp() + ", nickname=" + this.getNickname() + ", avatar=" + this.getAvatar() + ", gatewayIp=" + this.getGatewayIp() + ", gatewayPort=" + this.getGatewayPort() + ", gatewayWsUrl=" + this.getGatewayWsUrl() + ", gameServerList=" + this.getGameServerList() + ")";
    }

    @java.lang.SuppressWarnings("all")
    public LoginResponse() {
    }

    @java.lang.SuppressWarnings("all")
    public LoginResponse(final boolean success, final String errorCode, final String errorMessage, final String token, final String userId, final Long loginTimestamp, final String nickname, final String avatar, final String gatewayIp, final Integer gatewayPort, final String gatewayWsUrl, final List<GameServerInfo> gameServerList) {
        this.success = success;
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.token = token;
        this.userId = userId;
        this.loginTimestamp = loginTimestamp;
        this.nickname = nickname;
        this.avatar = avatar;
        this.gatewayIp = gatewayIp;
        this.gatewayPort = gatewayPort;
        this.gatewayWsUrl = gatewayWsUrl;
        this.gameServerList = gameServerList;
    }
}
