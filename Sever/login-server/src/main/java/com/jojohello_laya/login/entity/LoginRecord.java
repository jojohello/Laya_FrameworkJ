package com.jojohello_laya.login.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 登录记录实体类
 * 
 * @author laya-game
 */
@Entity
@Table(name = "login_records")
public class LoginRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    /**
     * 用户ID
     */
    @Column(name = "user_id", nullable = false)
    private String userId;
    /**
     * JWT Token
     */
    @Column(name = "token", nullable = false, length = 1000)
    private String token;
    /**
     * 登录时间戳
     */
    @Column(name = "login_timestamp", nullable = false)
    private Long loginTimestamp;
    /**
     * 登录时间
     */
    @Column(name = "login_time", nullable = false)
    private LocalDateTime loginTime;
    /**
     * 第三方类型
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "third_party_type", nullable = false)
    private User.ThirdPartyType thirdPartyType;
    /**
     * 设备ID
     */
    @Column(name = "device_id")
    private String deviceId;
    /**
     * 客户端IP
     */
    @Column(name = "client_ip")
    private String clientIp;
    /**
     * 设备信息
     */
    @Column(name = "device_info", columnDefinition = "TEXT")
    private String deviceInfo;
    /**
     * 平台信息
     */
    @Column(name = "platform")
    private String platform;
    /**
     * 版本号
     */
    @Column(name = "version")
    private String version;
    /**
     * 是否活跃
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive;
    /**
     * 过期时间
     */
    @Column(name = "expire_time")
    private LocalDateTime expireTime;
    /**
     * 创建时间
     */
    @Column(name = "created_time", nullable = false)
    private LocalDateTime createdTime;

    @PrePersist
    protected void onCreate() {
        createdTime = LocalDateTime.now();
        loginTime = LocalDateTime.now();
    }

    @java.lang.SuppressWarnings("all")
    private static Boolean $default$isActive() {
        return true;
    }


    @java.lang.SuppressWarnings("all")
    public static class LoginRecordBuilder {
        @java.lang.SuppressWarnings("all")
        private Long id;
        @java.lang.SuppressWarnings("all")
        private String userId;
        @java.lang.SuppressWarnings("all")
        private String token;
        @java.lang.SuppressWarnings("all")
        private Long loginTimestamp;
        @java.lang.SuppressWarnings("all")
        private LocalDateTime loginTime;
        @java.lang.SuppressWarnings("all")
        private User.ThirdPartyType thirdPartyType;
        @java.lang.SuppressWarnings("all")
        private String deviceId;
        @java.lang.SuppressWarnings("all")
        private String clientIp;
        @java.lang.SuppressWarnings("all")
        private String deviceInfo;
        @java.lang.SuppressWarnings("all")
        private String platform;
        @java.lang.SuppressWarnings("all")
        private String version;
        @java.lang.SuppressWarnings("all")
        private boolean isActive$set;
        @java.lang.SuppressWarnings("all")
        private Boolean isActive$value;
        @java.lang.SuppressWarnings("all")
        private LocalDateTime expireTime;
        @java.lang.SuppressWarnings("all")
        private LocalDateTime createdTime;

        @java.lang.SuppressWarnings("all")
        LoginRecordBuilder() {
        }

        /**
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginRecord.LoginRecordBuilder id(final Long id) {
            this.id = id;
            return this;
        }

        /**
         * 用户ID
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginRecord.LoginRecordBuilder userId(final String userId) {
            this.userId = userId;
            return this;
        }

        /**
         * JWT Token
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginRecord.LoginRecordBuilder token(final String token) {
            this.token = token;
            return this;
        }

        /**
         * 登录时间戳
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginRecord.LoginRecordBuilder loginTimestamp(final Long loginTimestamp) {
            this.loginTimestamp = loginTimestamp;
            return this;
        }

        /**
         * 登录时间
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginRecord.LoginRecordBuilder loginTime(final LocalDateTime loginTime) {
            this.loginTime = loginTime;
            return this;
        }

        /**
         * 第三方类型
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginRecord.LoginRecordBuilder thirdPartyType(final User.ThirdPartyType thirdPartyType) {
            this.thirdPartyType = thirdPartyType;
            return this;
        }

        /**
         * 设备ID
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginRecord.LoginRecordBuilder deviceId(final String deviceId) {
            this.deviceId = deviceId;
            return this;
        }

        /**
         * 客户端IP
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginRecord.LoginRecordBuilder clientIp(final String clientIp) {
            this.clientIp = clientIp;
            return this;
        }

        /**
         * 设备信息
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginRecord.LoginRecordBuilder deviceInfo(final String deviceInfo) {
            this.deviceInfo = deviceInfo;
            return this;
        }

        /**
         * 平台信息
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginRecord.LoginRecordBuilder platform(final String platform) {
            this.platform = platform;
            return this;
        }

        /**
         * 版本号
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginRecord.LoginRecordBuilder version(final String version) {
            this.version = version;
            return this;
        }

        /**
         * 是否活跃
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginRecord.LoginRecordBuilder isActive(final Boolean isActive) {
            this.isActive$value = isActive;
            isActive$set = true;
            return this;
        }

        /**
         * 过期时间
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginRecord.LoginRecordBuilder expireTime(final LocalDateTime expireTime) {
            this.expireTime = expireTime;
            return this;
        }

        /**
         * 创建时间
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public LoginRecord.LoginRecordBuilder createdTime(final LocalDateTime createdTime) {
            this.createdTime = createdTime;
            return this;
        }

        @java.lang.SuppressWarnings("all")
        public LoginRecord build() {
            Boolean isActive$value = this.isActive$value;
            if (!this.isActive$set) isActive$value = LoginRecord.$default$isActive();
            return new LoginRecord(this.id, this.userId, this.token, this.loginTimestamp, this.loginTime, this.thirdPartyType, this.deviceId, this.clientIp, this.deviceInfo, this.platform, this.version, isActive$value, this.expireTime, this.createdTime);
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("all")
        public java.lang.String toString() {
            return "LoginRecord.LoginRecordBuilder(id=" + this.id + ", userId=" + this.userId + ", token=[REDACTED], loginTimestamp=" + this.loginTimestamp + ", loginTime=" + this.loginTime + ", thirdPartyType=" + this.thirdPartyType + ", deviceId=[REDACTED], clientIp=[REDACTED], deviceInfo=[REDACTED], platform=" + this.platform + ", version=" + this.version + ", isActive$value=" + this.isActive$value + ", expireTime=" + this.expireTime + ", createdTime=" + this.createdTime + ")";
        }
    }

    @java.lang.SuppressWarnings("all")
    public static LoginRecord.LoginRecordBuilder builder() {
        return new LoginRecord.LoginRecordBuilder();
    }

    @java.lang.SuppressWarnings("all")
    public Long getId() {
        return this.id;
    }

    /**
     * 用户ID
     */
    @java.lang.SuppressWarnings("all")
    public String getUserId() {
        return this.userId;
    }

    /**
     * JWT Token
     */
    @java.lang.SuppressWarnings("all")
    public String getToken() {
        return this.token;
    }

    /**
     * 登录时间戳
     */
    @java.lang.SuppressWarnings("all")
    public Long getLoginTimestamp() {
        return this.loginTimestamp;
    }

    /**
     * 登录时间
     */
    @java.lang.SuppressWarnings("all")
    public LocalDateTime getLoginTime() {
        return this.loginTime;
    }

    /**
     * 第三方类型
     */
    @java.lang.SuppressWarnings("all")
    public User.ThirdPartyType getThirdPartyType() {
        return this.thirdPartyType;
    }

    /**
     * 设备ID
     */
    @java.lang.SuppressWarnings("all")
    public String getDeviceId() {
        return this.deviceId;
    }

    /**
     * 客户端IP
     */
    @java.lang.SuppressWarnings("all")
    public String getClientIp() {
        return this.clientIp;
    }

    /**
     * 设备信息
     */
    @java.lang.SuppressWarnings("all")
    public String getDeviceInfo() {
        return this.deviceInfo;
    }

    /**
     * 平台信息
     */
    @java.lang.SuppressWarnings("all")
    public String getPlatform() {
        return this.platform;
    }

    /**
     * 版本号
     */
    @java.lang.SuppressWarnings("all")
    public String getVersion() {
        return this.version;
    }

    /**
     * 是否活跃
     */
    @java.lang.SuppressWarnings("all")
    public Boolean getIsActive() {
        return this.isActive;
    }

    /**
     * 过期时间
     */
    @java.lang.SuppressWarnings("all")
    public LocalDateTime getExpireTime() {
        return this.expireTime;
    }

    /**
     * 创建时间
     */
    @java.lang.SuppressWarnings("all")
    public LocalDateTime getCreatedTime() {
        return this.createdTime;
    }

    @java.lang.SuppressWarnings("all")
    public void setId(final Long id) {
        this.id = id;
    }

    /**
     * 用户ID
     */
    @java.lang.SuppressWarnings("all")
    public void setUserId(final String userId) {
        this.userId = userId;
    }

    /**
     * JWT Token
     */
    @java.lang.SuppressWarnings("all")
    public void setToken(final String token) {
        this.token = token;
    }

    /**
     * 登录时间戳
     */
    @java.lang.SuppressWarnings("all")
    public void setLoginTimestamp(final Long loginTimestamp) {
        this.loginTimestamp = loginTimestamp;
    }

    /**
     * 登录时间
     */
    @java.lang.SuppressWarnings("all")
    public void setLoginTime(final LocalDateTime loginTime) {
        this.loginTime = loginTime;
    }

    /**
     * 第三方类型
     */
    @java.lang.SuppressWarnings("all")
    public void setThirdPartyType(final User.ThirdPartyType thirdPartyType) {
        this.thirdPartyType = thirdPartyType;
    }

    /**
     * 设备ID
     */
    @java.lang.SuppressWarnings("all")
    public void setDeviceId(final String deviceId) {
        this.deviceId = deviceId;
    }

    /**
     * 客户端IP
     */
    @java.lang.SuppressWarnings("all")
    public void setClientIp(final String clientIp) {
        this.clientIp = clientIp;
    }

    /**
     * 设备信息
     */
    @java.lang.SuppressWarnings("all")
    public void setDeviceInfo(final String deviceInfo) {
        this.deviceInfo = deviceInfo;
    }

    /**
     * 平台信息
     */
    @java.lang.SuppressWarnings("all")
    public void setPlatform(final String platform) {
        this.platform = platform;
    }

    /**
     * 版本号
     */
    @java.lang.SuppressWarnings("all")
    public void setVersion(final String version) {
        this.version = version;
    }

    /**
     * 是否活跃
     */
    @java.lang.SuppressWarnings("all")
    public void setIsActive(final Boolean isActive) {
        this.isActive = isActive;
    }

    /**
     * 过期时间
     */
    @java.lang.SuppressWarnings("all")
    public void setExpireTime(final LocalDateTime expireTime) {
        this.expireTime = expireTime;
    }

    /**
     * 创建时间
     */
    @java.lang.SuppressWarnings("all")
    public void setCreatedTime(final LocalDateTime createdTime) {
        this.createdTime = createdTime;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public boolean equals(final java.lang.Object o) {
        if (o == this) return true;
        if (!(o instanceof LoginRecord)) return false;
        final LoginRecord other = (LoginRecord) o;
        if (!other.canEqual((java.lang.Object) this)) return false;
        final java.lang.Object this$id = this.getId();
        final java.lang.Object other$id = other.getId();
        if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
        final java.lang.Object this$loginTimestamp = this.getLoginTimestamp();
        final java.lang.Object other$loginTimestamp = other.getLoginTimestamp();
        if (this$loginTimestamp == null ? other$loginTimestamp != null : !this$loginTimestamp.equals(other$loginTimestamp)) return false;
        final java.lang.Object this$isActive = this.getIsActive();
        final java.lang.Object other$isActive = other.getIsActive();
        if (this$isActive == null ? other$isActive != null : !this$isActive.equals(other$isActive)) return false;
        final java.lang.Object this$userId = this.getUserId();
        final java.lang.Object other$userId = other.getUserId();
        if (this$userId == null ? other$userId != null : !this$userId.equals(other$userId)) return false;
        final java.lang.Object this$token = this.getToken();
        final java.lang.Object other$token = other.getToken();
        if (this$token == null ? other$token != null : !this$token.equals(other$token)) return false;
        final java.lang.Object this$loginTime = this.getLoginTime();
        final java.lang.Object other$loginTime = other.getLoginTime();
        if (this$loginTime == null ? other$loginTime != null : !this$loginTime.equals(other$loginTime)) return false;
        final java.lang.Object this$thirdPartyType = this.getThirdPartyType();
        final java.lang.Object other$thirdPartyType = other.getThirdPartyType();
        if (this$thirdPartyType == null ? other$thirdPartyType != null : !this$thirdPartyType.equals(other$thirdPartyType)) return false;
        final java.lang.Object this$deviceId = this.getDeviceId();
        final java.lang.Object other$deviceId = other.getDeviceId();
        if (this$deviceId == null ? other$deviceId != null : !this$deviceId.equals(other$deviceId)) return false;
        final java.lang.Object this$clientIp = this.getClientIp();
        final java.lang.Object other$clientIp = other.getClientIp();
        if (this$clientIp == null ? other$clientIp != null : !this$clientIp.equals(other$clientIp)) return false;
        final java.lang.Object this$deviceInfo = this.getDeviceInfo();
        final java.lang.Object other$deviceInfo = other.getDeviceInfo();
        if (this$deviceInfo == null ? other$deviceInfo != null : !this$deviceInfo.equals(other$deviceInfo)) return false;
        final java.lang.Object this$platform = this.getPlatform();
        final java.lang.Object other$platform = other.getPlatform();
        if (this$platform == null ? other$platform != null : !this$platform.equals(other$platform)) return false;
        final java.lang.Object this$version = this.getVersion();
        final java.lang.Object other$version = other.getVersion();
        if (this$version == null ? other$version != null : !this$version.equals(other$version)) return false;
        final java.lang.Object this$expireTime = this.getExpireTime();
        final java.lang.Object other$expireTime = other.getExpireTime();
        if (this$expireTime == null ? other$expireTime != null : !this$expireTime.equals(other$expireTime)) return false;
        final java.lang.Object this$createdTime = this.getCreatedTime();
        final java.lang.Object other$createdTime = other.getCreatedTime();
        if (this$createdTime == null ? other$createdTime != null : !this$createdTime.equals(other$createdTime)) return false;
        return true;
    }

    @java.lang.SuppressWarnings("all")
    protected boolean canEqual(final java.lang.Object other) {
        return other instanceof LoginRecord;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public int hashCode() {
        final int PRIME = 59;
        int result = 1;
        final java.lang.Object $id = this.getId();
        result = result * PRIME + ($id == null ? 43 : $id.hashCode());
        final java.lang.Object $loginTimestamp = this.getLoginTimestamp();
        result = result * PRIME + ($loginTimestamp == null ? 43 : $loginTimestamp.hashCode());
        final java.lang.Object $isActive = this.getIsActive();
        result = result * PRIME + ($isActive == null ? 43 : $isActive.hashCode());
        final java.lang.Object $userId = this.getUserId();
        result = result * PRIME + ($userId == null ? 43 : $userId.hashCode());
        final java.lang.Object $token = this.getToken();
        result = result * PRIME + ($token == null ? 43 : $token.hashCode());
        final java.lang.Object $loginTime = this.getLoginTime();
        result = result * PRIME + ($loginTime == null ? 43 : $loginTime.hashCode());
        final java.lang.Object $thirdPartyType = this.getThirdPartyType();
        result = result * PRIME + ($thirdPartyType == null ? 43 : $thirdPartyType.hashCode());
        final java.lang.Object $deviceId = this.getDeviceId();
        result = result * PRIME + ($deviceId == null ? 43 : $deviceId.hashCode());
        final java.lang.Object $clientIp = this.getClientIp();
        result = result * PRIME + ($clientIp == null ? 43 : $clientIp.hashCode());
        final java.lang.Object $deviceInfo = this.getDeviceInfo();
        result = result * PRIME + ($deviceInfo == null ? 43 : $deviceInfo.hashCode());
        final java.lang.Object $platform = this.getPlatform();
        result = result * PRIME + ($platform == null ? 43 : $platform.hashCode());
        final java.lang.Object $version = this.getVersion();
        result = result * PRIME + ($version == null ? 43 : $version.hashCode());
        final java.lang.Object $expireTime = this.getExpireTime();
        result = result * PRIME + ($expireTime == null ? 43 : $expireTime.hashCode());
        final java.lang.Object $createdTime = this.getCreatedTime();
        result = result * PRIME + ($createdTime == null ? 43 : $createdTime.hashCode());
        return result;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public java.lang.String toString() {
        return "LoginRecord(id=" + this.getId() + ", userId=" + this.getUserId() + ", token=[REDACTED], loginTimestamp=" + this.getLoginTimestamp() + ", loginTime=" + this.getLoginTime() + ", thirdPartyType=" + this.getThirdPartyType() + ", deviceId=[REDACTED], clientIp=[REDACTED], deviceInfo=[REDACTED], platform=" + this.getPlatform() + ", version=" + this.getVersion() + ", isActive=" + this.getIsActive() + ", expireTime=" + this.getExpireTime() + ", createdTime=" + this.getCreatedTime() + ")";
    }

    @java.lang.SuppressWarnings("all")
    public LoginRecord() {
        this.isActive = LoginRecord.$default$isActive();
    }

    @java.lang.SuppressWarnings("all")
    public LoginRecord(final Long id, final String userId, final String token, final Long loginTimestamp, final LocalDateTime loginTime, final User.ThirdPartyType thirdPartyType, final String deviceId, final String clientIp, final String deviceInfo, final String platform, final String version, final Boolean isActive, final LocalDateTime expireTime, final LocalDateTime createdTime) {
        this.id = id;
        this.userId = userId;
        this.token = token;
        this.loginTimestamp = loginTimestamp;
        this.loginTime = loginTime;
        this.thirdPartyType = thirdPartyType;
        this.deviceId = deviceId;
        this.clientIp = clientIp;
        this.deviceInfo = deviceInfo;
        this.platform = platform;
        this.version = version;
        this.isActive = isActive;
        this.expireTime = expireTime;
        this.createdTime = createdTime;
    }
}
