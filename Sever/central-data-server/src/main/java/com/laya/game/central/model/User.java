package com.laya.game.central.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
// import org.springframework.data.annotation.CreatedDate;
// import org.springframework.data.annotation.LastModifiedDate;
// import org.springframework.data.jpa.domain.support.AuditingEntityListener;

// import javax.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * 用户实体类
 * 
 * 存储用户基础信息，支持多种登录方式
 * 
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
// @Entity
// @Table(name = "users", indexes = {
//     @Index(name = "idx_username", columnList = "username", unique = true),
//     @Index(name = "idx_email", columnList = "email", unique = true),
//     @Index(name = "idx_third_party", columnList = "third_party_type,third_party_id", unique = true),
//     @Index(name = "idx_created_date", columnList = "created_date")
// })
// @EntityListeners(AuditingEntityListener.class)
public class User {

    // @Id
    // @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 用户名 (可选，用于账号密码登录)
     */
    // @Column(name = "username", length = 50, unique = true)
    @Size(min = 3, max = 50, message = "用户名长度必须在3-50个字符之间")
    private String username;

    /**
     * 密码哈希 (BCrypt加密)
     */
    @JsonIgnore
    // @Column(name = "password_hash", length = 100)
    private String passwordHash;

    /**
     * 邮箱 (可选)
     */
    @Email(message = "邮箱格式不正确")
    // @Column(name = "email", length = 100, unique = true)
    private String email;

    /**
     * 手机号 (可选)
     */
    // @Column(name = "phone", length = 20, unique = true)
    private String phone;

    /**
     * 昵称
     */
    @NotBlank(message = "昵称不能为空")
    // @Column(name = "nickname", length = 50, nullable = false)
    @NotBlank(message = "昵称不能为空")
    @Size(max = 50, message = "昵称长度不能超过50个字符")
    private String nickname;

    /**
     * 头像URL
     */
    // @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    /**
     * 第三方登录类型
     */
    // @Enumerated(EnumType.STRING)
    // @Column(name = "third_party_type", length = 20)
    private ThirdPartyType thirdPartyType;

    /**
     * 第三方登录ID
     */
    // @Column(name = "third_party_id", length = 100)
    private String thirdPartyId;

    /**
     * 用户状态
     */
    // @Enumerated(EnumType.STRING)
    // @Column(name = "status", length = 20, nullable = false)
    private UserStatus status = UserStatus.ACTIVE;

    /**
     * 最后登录时间
     */
    // @Column(name = "last_login_time")
    private LocalDateTime lastLoginTime;

    /**
     * 最后登录IP
     */
    // @Column(name = "last_login_ip", length = 45)
    private String lastLoginIp;

    /**
     * 创建时间
     */
    // @CreatedDate
    // @Column(name = "created_date", nullable = false, updatable = false)
    private LocalDateTime createdDate;

    /**
     * 更新时间
     */
    // @LastModifiedDate
    // @Column(name = "last_modified_date", nullable = false)
    private LocalDateTime lastModifiedDate;

    /**
     * 第三方登录类型枚举
     */
    public enum ThirdPartyType {
        WECHAT("微信"),
        QQ("QQ"),
        ALIPAY("支付宝"),
        GUEST("游客");

        private final String displayName;

        ThirdPartyType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    /**
     * 用户状态枚举
     */
    public enum UserStatus {
        ACTIVE("正常"),
        BANNED("封禁"),
        DELETED("已删除");

        private final String displayName;

        UserStatus(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    // 构造函数
    public User() {}

    public User(String nickname, ThirdPartyType thirdPartyType, String thirdPartyId) {
        this.nickname = nickname;
        this.thirdPartyType = thirdPartyType;
        this.thirdPartyId = thirdPartyId;
        this.status = UserStatus.ACTIVE;
    }

    // Getter和Setter方法
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public ThirdPartyType getThirdPartyType() {
        return thirdPartyType;
    }

    public void setThirdPartyType(ThirdPartyType thirdPartyType) {
        this.thirdPartyType = thirdPartyType;
    }

    public String getThirdPartyId() {
        return thirdPartyId;
    }

    public void setThirdPartyId(String thirdPartyId) {
        this.thirdPartyId = thirdPartyId;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public LocalDateTime getLastLoginTime() {
        return lastLoginTime;
    }

    public void setLastLoginTime(LocalDateTime lastLoginTime) {
        this.lastLoginTime = lastLoginTime;
    }

    public String getLastLoginIp() {
        return lastLoginIp;
    }

    public void setLastLoginIp(String lastLoginIp) {
        this.lastLoginIp = lastLoginIp;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }

    public LocalDateTime getLastModifiedDate() {
        return lastModifiedDate;
    }

    public void setLastModifiedDate(LocalDateTime lastModifiedDate) {
        this.lastModifiedDate = lastModifiedDate;
    }

    /**
     * 获取创建时间 (别名方法)
     */
    public LocalDateTime getCreatedTime() {
        return this.createdDate;
    }

    /**
     * 获取更新时间 (别名方法)
     */
    public LocalDateTime getUpdatedTime() {
        return this.lastModifiedDate;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", nickname='" + nickname + '\'' +
                ", thirdPartyType=" + thirdPartyType +
                ", status=" + status +
                ", createdDate=" + createdDate +
                '}';
    }
}
