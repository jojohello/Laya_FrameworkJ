package com.jojohello_laya.login.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 用户实体类
 * 
 * @author laya-game
 */
@Entity
@Table(name = "users", uniqueConstraints = {@UniqueConstraint(columnNames = {"third_party_type", "third_party_user_id"})})
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    /**
     * 用户唯一标识
     */
    @Column(name = "user_id", unique = true, nullable = false)
    private String userId;
    /**
     * 第三方类型
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "third_party_type", nullable = false)
    private ThirdPartyType thirdPartyType;
    /**
     * 第三方用户ID
     */
    @Column(name = "third_party_user_id", nullable = false)
    private String thirdPartyUserId;
    /**
     * 用户昵称
     */
    @Column(name = "nickname")
    private String nickname;
    /**
     * 用户头像
     */
    @Column(name = "avatar")
    private String avatar;
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
     * 额外参数
     */
    @Column(name = "extra_params", columnDefinition = "TEXT")
    private String extraParams;
    /**
     * 最后登录时间
     */
    @Column(name = "last_login_time")
    private LocalDateTime lastLoginTime;
    /**
     * 创建时间
     */
    @Column(name = "created_time", nullable = false)
    private LocalDateTime createdTime;
    /**
     * 更新时间
     */
    @Column(name = "updated_time")
    private LocalDateTime updatedTime;
    /**
     * 是否启用
     */
    @Column(name = "enabled", nullable = false)
    private Boolean enabled;


    /**
     * 第三方类型枚举
     */
    public enum ThirdPartyType {
        GUEST("guest", "游客"), WECHAT("wechat", "微信"), QQ("qq", "QQ"), ALIPAY("alipay", "支付宝");
        private final String code;
        private final String description;

        ThirdPartyType(String code, String description) {
            this.code = code;
            this.description = description;
        }

        public String getCode() {
            return code;
        }

        public String getDescription() {
            return description;
        }
    }

    @PrePersist
    protected void onCreate() {
        createdTime = LocalDateTime.now();
        updatedTime = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedTime = LocalDateTime.now();
    }

    @java.lang.SuppressWarnings("all")
    private static Boolean $default$enabled() {
        return true;
    }


    @java.lang.SuppressWarnings("all")
    public static class UserBuilder {
        @java.lang.SuppressWarnings("all")
        private Long id;
        @java.lang.SuppressWarnings("all")
        private String userId;
        @java.lang.SuppressWarnings("all")
        private ThirdPartyType thirdPartyType;
        @java.lang.SuppressWarnings("all")
        private String thirdPartyUserId;
        @java.lang.SuppressWarnings("all")
        private String nickname;
        @java.lang.SuppressWarnings("all")
        private String avatar;
        @java.lang.SuppressWarnings("all")
        private String deviceInfo;
        @java.lang.SuppressWarnings("all")
        private String platform;
        @java.lang.SuppressWarnings("all")
        private String version;
        @java.lang.SuppressWarnings("all")
        private String extraParams;
        @java.lang.SuppressWarnings("all")
        private LocalDateTime lastLoginTime;
        @java.lang.SuppressWarnings("all")
        private LocalDateTime createdTime;
        @java.lang.SuppressWarnings("all")
        private LocalDateTime updatedTime;
        @java.lang.SuppressWarnings("all")
        private boolean enabled$set;
        @java.lang.SuppressWarnings("all")
        private Boolean enabled$value;

        @java.lang.SuppressWarnings("all")
        UserBuilder() {
        }

        /**
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public User.UserBuilder id(final Long id) {
            this.id = id;
            return this;
        }

        /**
         * 用户唯一标识
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public User.UserBuilder userId(final String userId) {
            this.userId = userId;
            return this;
        }

        /**
         * 第三方类型
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public User.UserBuilder thirdPartyType(final ThirdPartyType thirdPartyType) {
            this.thirdPartyType = thirdPartyType;
            return this;
        }

        /**
         * 第三方用户ID
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public User.UserBuilder thirdPartyUserId(final String thirdPartyUserId) {
            this.thirdPartyUserId = thirdPartyUserId;
            return this;
        }

        /**
         * 用户昵称
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public User.UserBuilder nickname(final String nickname) {
            this.nickname = nickname;
            return this;
        }

        /**
         * 用户头像
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public User.UserBuilder avatar(final String avatar) {
            this.avatar = avatar;
            return this;
        }

        /**
         * 设备信息
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public User.UserBuilder deviceInfo(final String deviceInfo) {
            this.deviceInfo = deviceInfo;
            return this;
        }

        /**
         * 平台信息
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public User.UserBuilder platform(final String platform) {
            this.platform = platform;
            return this;
        }

        /**
         * 版本号
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public User.UserBuilder version(final String version) {
            this.version = version;
            return this;
        }

        /**
         * 额外参数
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public User.UserBuilder extraParams(final String extraParams) {
            this.extraParams = extraParams;
            return this;
        }

        /**
         * 最后登录时间
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public User.UserBuilder lastLoginTime(final LocalDateTime lastLoginTime) {
            this.lastLoginTime = lastLoginTime;
            return this;
        }

        /**
         * 创建时间
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public User.UserBuilder createdTime(final LocalDateTime createdTime) {
            this.createdTime = createdTime;
            return this;
        }

        /**
         * 更新时间
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public User.UserBuilder updatedTime(final LocalDateTime updatedTime) {
            this.updatedTime = updatedTime;
            return this;
        }

        /**
         * 是否启用
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public User.UserBuilder enabled(final Boolean enabled) {
            this.enabled$value = enabled;
            enabled$set = true;
            return this;
        }

        @java.lang.SuppressWarnings("all")
        public User build() {
            Boolean enabled$value = this.enabled$value;
            if (!this.enabled$set) enabled$value = User.$default$enabled();
            return new User(this.id, this.userId, this.thirdPartyType, this.thirdPartyUserId, this.nickname, this.avatar, this.deviceInfo, this.platform, this.version, this.extraParams, this.lastLoginTime, this.createdTime, this.updatedTime, enabled$value);
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("all")
        public java.lang.String toString() {
            return "User.UserBuilder(id=" + this.id + ", userId=" + this.userId + ", thirdPartyType=" + this.thirdPartyType + ", thirdPartyUserId=" + this.thirdPartyUserId + ", nickname=" + this.nickname + ", avatar=" + this.avatar + ", deviceInfo=" + this.deviceInfo + ", platform=" + this.platform + ", version=" + this.version + ", extraParams=" + this.extraParams + ", lastLoginTime=" + this.lastLoginTime + ", createdTime=" + this.createdTime + ", updatedTime=" + this.updatedTime + ", enabled$value=" + this.enabled$value + ")";
        }
    }

    @java.lang.SuppressWarnings("all")
    public static User.UserBuilder builder() {
        return new User.UserBuilder();
    }

    @java.lang.SuppressWarnings("all")
    public Long getId() {
        return this.id;
    }

    /**
     * 用户唯一标识
     */
    @java.lang.SuppressWarnings("all")
    public String getUserId() {
        return this.userId;
    }

    /**
     * 第三方类型
     */
    @java.lang.SuppressWarnings("all")
    public ThirdPartyType getThirdPartyType() {
        return this.thirdPartyType;
    }

    /**
     * 第三方用户ID
     */
    @java.lang.SuppressWarnings("all")
    public String getThirdPartyUserId() {
        return this.thirdPartyUserId;
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
     * 额外参数
     */
    @java.lang.SuppressWarnings("all")
    public String getExtraParams() {
        return this.extraParams;
    }

    /**
     * 最后登录时间
     */
    @java.lang.SuppressWarnings("all")
    public LocalDateTime getLastLoginTime() {
        return this.lastLoginTime;
    }

    /**
     * 创建时间
     */
    @java.lang.SuppressWarnings("all")
    public LocalDateTime getCreatedTime() {
        return this.createdTime;
    }

    /**
     * 更新时间
     */
    @java.lang.SuppressWarnings("all")
    public LocalDateTime getUpdatedTime() {
        return this.updatedTime;
    }

    /**
     * 是否启用
     */
    @java.lang.SuppressWarnings("all")
    public Boolean getEnabled() {
        return this.enabled;
    }

    @java.lang.SuppressWarnings("all")
    public void setId(final Long id) {
        this.id = id;
    }

    /**
     * 用户唯一标识
     */
    @java.lang.SuppressWarnings("all")
    public void setUserId(final String userId) {
        this.userId = userId;
    }

    /**
     * 第三方类型
     */
    @java.lang.SuppressWarnings("all")
    public void setThirdPartyType(final ThirdPartyType thirdPartyType) {
        this.thirdPartyType = thirdPartyType;
    }

    /**
     * 第三方用户ID
     */
    @java.lang.SuppressWarnings("all")
    public void setThirdPartyUserId(final String thirdPartyUserId) {
        this.thirdPartyUserId = thirdPartyUserId;
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
     * 额外参数
     */
    @java.lang.SuppressWarnings("all")
    public void setExtraParams(final String extraParams) {
        this.extraParams = extraParams;
    }

    /**
     * 最后登录时间
     */
    @java.lang.SuppressWarnings("all")
    public void setLastLoginTime(final LocalDateTime lastLoginTime) {
        this.lastLoginTime = lastLoginTime;
    }

    /**
     * 创建时间
     */
    @java.lang.SuppressWarnings("all")
    public void setCreatedTime(final LocalDateTime createdTime) {
        this.createdTime = createdTime;
    }

    /**
     * 更新时间
     */
    @java.lang.SuppressWarnings("all")
    public void setUpdatedTime(final LocalDateTime updatedTime) {
        this.updatedTime = updatedTime;
    }

    /**
     * 是否启用
     */
    @java.lang.SuppressWarnings("all")
    public void setEnabled(final Boolean enabled) {
        this.enabled = enabled;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public boolean equals(final java.lang.Object o) {
        if (o == this) return true;
        if (!(o instanceof User)) return false;
        final User other = (User) o;
        if (!other.canEqual((java.lang.Object) this)) return false;
        final java.lang.Object this$id = this.getId();
        final java.lang.Object other$id = other.getId();
        if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
        final java.lang.Object this$enabled = this.getEnabled();
        final java.lang.Object other$enabled = other.getEnabled();
        if (this$enabled == null ? other$enabled != null : !this$enabled.equals(other$enabled)) return false;
        final java.lang.Object this$userId = this.getUserId();
        final java.lang.Object other$userId = other.getUserId();
        if (this$userId == null ? other$userId != null : !this$userId.equals(other$userId)) return false;
        final java.lang.Object this$thirdPartyType = this.getThirdPartyType();
        final java.lang.Object other$thirdPartyType = other.getThirdPartyType();
        if (this$thirdPartyType == null ? other$thirdPartyType != null : !this$thirdPartyType.equals(other$thirdPartyType)) return false;
        final java.lang.Object this$thirdPartyUserId = this.getThirdPartyUserId();
        final java.lang.Object other$thirdPartyUserId = other.getThirdPartyUserId();
        if (this$thirdPartyUserId == null ? other$thirdPartyUserId != null : !this$thirdPartyUserId.equals(other$thirdPartyUserId)) return false;
        final java.lang.Object this$nickname = this.getNickname();
        final java.lang.Object other$nickname = other.getNickname();
        if (this$nickname == null ? other$nickname != null : !this$nickname.equals(other$nickname)) return false;
        final java.lang.Object this$avatar = this.getAvatar();
        final java.lang.Object other$avatar = other.getAvatar();
        if (this$avatar == null ? other$avatar != null : !this$avatar.equals(other$avatar)) return false;
        final java.lang.Object this$deviceInfo = this.getDeviceInfo();
        final java.lang.Object other$deviceInfo = other.getDeviceInfo();
        if (this$deviceInfo == null ? other$deviceInfo != null : !this$deviceInfo.equals(other$deviceInfo)) return false;
        final java.lang.Object this$platform = this.getPlatform();
        final java.lang.Object other$platform = other.getPlatform();
        if (this$platform == null ? other$platform != null : !this$platform.equals(other$platform)) return false;
        final java.lang.Object this$version = this.getVersion();
        final java.lang.Object other$version = other.getVersion();
        if (this$version == null ? other$version != null : !this$version.equals(other$version)) return false;
        final java.lang.Object this$extraParams = this.getExtraParams();
        final java.lang.Object other$extraParams = other.getExtraParams();
        if (this$extraParams == null ? other$extraParams != null : !this$extraParams.equals(other$extraParams)) return false;
        final java.lang.Object this$lastLoginTime = this.getLastLoginTime();
        final java.lang.Object other$lastLoginTime = other.getLastLoginTime();
        if (this$lastLoginTime == null ? other$lastLoginTime != null : !this$lastLoginTime.equals(other$lastLoginTime)) return false;
        final java.lang.Object this$createdTime = this.getCreatedTime();
        final java.lang.Object other$createdTime = other.getCreatedTime();
        if (this$createdTime == null ? other$createdTime != null : !this$createdTime.equals(other$createdTime)) return false;
        final java.lang.Object this$updatedTime = this.getUpdatedTime();
        final java.lang.Object other$updatedTime = other.getUpdatedTime();
        if (this$updatedTime == null ? other$updatedTime != null : !this$updatedTime.equals(other$updatedTime)) return false;
        return true;
    }

    @java.lang.SuppressWarnings("all")
    protected boolean canEqual(final java.lang.Object other) {
        return other instanceof User;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public int hashCode() {
        final int PRIME = 59;
        int result = 1;
        final java.lang.Object $id = this.getId();
        result = result * PRIME + ($id == null ? 43 : $id.hashCode());
        final java.lang.Object $enabled = this.getEnabled();
        result = result * PRIME + ($enabled == null ? 43 : $enabled.hashCode());
        final java.lang.Object $userId = this.getUserId();
        result = result * PRIME + ($userId == null ? 43 : $userId.hashCode());
        final java.lang.Object $thirdPartyType = this.getThirdPartyType();
        result = result * PRIME + ($thirdPartyType == null ? 43 : $thirdPartyType.hashCode());
        final java.lang.Object $thirdPartyUserId = this.getThirdPartyUserId();
        result = result * PRIME + ($thirdPartyUserId == null ? 43 : $thirdPartyUserId.hashCode());
        final java.lang.Object $nickname = this.getNickname();
        result = result * PRIME + ($nickname == null ? 43 : $nickname.hashCode());
        final java.lang.Object $avatar = this.getAvatar();
        result = result * PRIME + ($avatar == null ? 43 : $avatar.hashCode());
        final java.lang.Object $deviceInfo = this.getDeviceInfo();
        result = result * PRIME + ($deviceInfo == null ? 43 : $deviceInfo.hashCode());
        final java.lang.Object $platform = this.getPlatform();
        result = result * PRIME + ($platform == null ? 43 : $platform.hashCode());
        final java.lang.Object $version = this.getVersion();
        result = result * PRIME + ($version == null ? 43 : $version.hashCode());
        final java.lang.Object $extraParams = this.getExtraParams();
        result = result * PRIME + ($extraParams == null ? 43 : $extraParams.hashCode());
        final java.lang.Object $lastLoginTime = this.getLastLoginTime();
        result = result * PRIME + ($lastLoginTime == null ? 43 : $lastLoginTime.hashCode());
        final java.lang.Object $createdTime = this.getCreatedTime();
        result = result * PRIME + ($createdTime == null ? 43 : $createdTime.hashCode());
        final java.lang.Object $updatedTime = this.getUpdatedTime();
        result = result * PRIME + ($updatedTime == null ? 43 : $updatedTime.hashCode());
        return result;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public java.lang.String toString() {
        return "User(id=" + this.getId() + ", userId=" + this.getUserId() + ", thirdPartyType=" + this.getThirdPartyType() + ", thirdPartyUserId=" + this.getThirdPartyUserId() + ", nickname=" + this.getNickname() + ", avatar=" + this.getAvatar() + ", deviceInfo=" + this.getDeviceInfo() + ", platform=" + this.getPlatform() + ", version=" + this.getVersion() + ", extraParams=" + this.getExtraParams() + ", lastLoginTime=" + this.getLastLoginTime() + ", createdTime=" + this.getCreatedTime() + ", updatedTime=" + this.getUpdatedTime() + ", enabled=" + this.getEnabled() + ")";
    }

    @java.lang.SuppressWarnings("all")
    public User() {
        this.enabled = User.$default$enabled();
    }

    @java.lang.SuppressWarnings("all")
    public User(final Long id, final String userId, final ThirdPartyType thirdPartyType, final String thirdPartyUserId, final String nickname, final String avatar, final String deviceInfo, final String platform, final String version, final String extraParams, final LocalDateTime lastLoginTime, final LocalDateTime createdTime, final LocalDateTime updatedTime, final Boolean enabled) {
        this.id = id;
        this.userId = userId;
        this.thirdPartyType = thirdPartyType;
        this.thirdPartyUserId = thirdPartyUserId;
        this.nickname = nickname;
        this.avatar = avatar;
        this.deviceInfo = deviceInfo;
        this.platform = platform;
        this.version = version;
        this.extraParams = extraParams;
        this.lastLoginTime = lastLoginTime;
        this.createdTime = createdTime;
        this.updatedTime = updatedTime;
        this.enabled = enabled;
    }
}
