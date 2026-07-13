package com.laya.game.central.model;

// import org.springframework.data.annotation.CreatedDate;
// import org.springframework.data.annotation.LastModifiedDate;
// import org.springframework.data.jpa.domain.support.AuditingEntityListener;

// import javax.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * 用户会话实体类
 * 
 * 存储三要素验证信息：账号 + 登录时间戳 + Token
 * 用于防止Token盗用和重放攻击
 * 
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
// @Entity
// @Table(name = "user_sessions", indexes = {
//     @Index(name = "idx_user_id", columnList = "userId"),
//     @Index(name = "idx_token_hash", columnList = "tokenHash", unique = true),
//     @Index(name = "idx_login_timestamp", columnList = "loginTimestamp"),
//     @Index(name = "idx_status", columnList = "status"),
//     @Index(name = "idx_expires_at", columnList = "expiresAt")
// })
// @EntityListeners(AuditingEntityListener.class)
public class UserSession implements Serializable {

    private static final long serialVersionUID = 1L;

    // @Id
    // @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 会话ID (UUID)
     */
    // @Column(name = "session_id", length = 36, unique = true)
    private String sessionId;

    /**
     * 用户ID
     */
    @NotNull(message = "用户ID不能为空")
    // @Column(name = "user_id", nullable = false)
    private String userId;

    /**
     * Token哈希值 (SHA-256)
     */
    @NotBlank(message = "Token哈希不能为空")
    // @Column(name = "token_hash", length = 64, nullable = false, unique = true)
    private String tokenHash;

    /**
     * 登录时间戳
     */
    @NotNull(message = "登录时间戳不能为空")
    // @Column(name = "login_timestamp", nullable = false)
    private LocalDateTime loginTimestamp;

    /**
     * 会话状态
     */
    // @Enumerated(EnumType.STRING)
    // @Column(name = "status", length = 20, nullable = false)
    private SessionStatus status = SessionStatus.ACTIVE;

    /**
     * 登录IP地址
     */
    // @Column(name = "login_ip", length = 45)
    private String loginIp;

    /**
     * 登录平台 (web, android, ios, wechat)
     */
    // @Column(name = "platform", length = 20)
    private String platform;

    /**
     * 客户端版本
     */
    // @Column(name = "client_version", length = 20)
    private String clientVersion;

    /**
     * 用户代理信息
     */
    // @Column(name = "user_agent", length = 500)
    private String userAgent;

    /**
     * 最后活跃时间
     */
    // @Column(name = "last_active_time")
    private LocalDateTime lastActiveTime;

    /**
     * 会话过期时间
     */
    @NotNull(message = "过期时间不能为空")
    // @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * 强制下线原因
     */
    // @Column(name = "force_logout_reason", length = 200)
    private String forceLogoutReason;

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
     * 会话状态枚举
     */
    public enum SessionStatus {
        ACTIVE("活跃"),
        EXPIRED("已过期"),
        FORCE_LOGOUT("强制下线"),
        LOGOUT("正常登出");

        private final String displayName;

        SessionStatus(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    // 构造函数
    public UserSession() {}

    public UserSession(String userId, String tokenHash, LocalDateTime loginTimestamp,
                      String loginIp, String platform, LocalDateTime expiresAt) {
        this.userId = userId;
        this.tokenHash = tokenHash;
        this.loginTimestamp = loginTimestamp;
        this.loginIp = loginIp;
        this.platform = platform;
        this.expiresAt = expiresAt;
        this.status = SessionStatus.ACTIVE;
        this.lastActiveTime = LocalDateTime.now();
    }

    /**
     * 检查会话是否有效
     */
    public boolean isValid() {
        return status == SessionStatus.ACTIVE && 
               expiresAt != null && 
               expiresAt.isAfter(LocalDateTime.now());
    }

    /**
     * 强制下线
     */
    public void forceLogout(String reason) {
        this.status = SessionStatus.FORCE_LOGOUT;
        this.forceLogoutReason = reason;
    }

    /**
     * 正常登出
     */
    public void logout() {
        this.status = SessionStatus.LOGOUT;
    }

    /**
     * 标记为过期
     */
    public void markExpired() {
        this.status = SessionStatus.EXPIRED;
    }

    /**
     * 更新最后活跃时间
     */
    public void updateLastActiveTime() {
        this.lastActiveTime = LocalDateTime.now();
    }

    // Getter和Setter方法
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    public LocalDateTime getLoginTimestamp() {
        return loginTimestamp;
    }

    public void setLoginTimestamp(LocalDateTime loginTimestamp) {
        this.loginTimestamp = loginTimestamp;
    }

    public SessionStatus getStatus() {
        return status;
    }

    public void setStatus(SessionStatus status) {
        this.status = status;
    }

    public String getLoginIp() {
        return loginIp;
    }

    public void setLoginIp(String loginIp) {
        this.loginIp = loginIp;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getClientVersion() {
        return clientVersion;
    }

    public void setClientVersion(String clientVersion) {
        this.clientVersion = clientVersion;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public LocalDateTime getLastActiveTime() {
        return lastActiveTime;
    }

    public void setLastActiveTime(LocalDateTime lastActiveTime) {
        this.lastActiveTime = lastActiveTime;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getForceLogoutReason() {
        return forceLogoutReason;
    }

    public void setForceLogoutReason(String forceLogoutReason) {
        this.forceLogoutReason = forceLogoutReason;
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

    /**
     * 获取连接时间 (别名方法)
     */
    public LocalDateTime getConnectedAt() {
        return this.lastActiveTime;
    }

    /**
     * 获取强制下线原因 (别名方法)
     */
    public String getForceOfflineReason() {
        return this.forceLogoutReason;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserSession that = (UserSession) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "UserSession{" +
                "id=" + id +
                ", userId=" + userId +
                ", loginTimestamp=" + loginTimestamp +
                ", status=" + status +
                ", platform='" + platform + '\'' +
                ", expiresAt=" + expiresAt +
                '}';
    }
}
