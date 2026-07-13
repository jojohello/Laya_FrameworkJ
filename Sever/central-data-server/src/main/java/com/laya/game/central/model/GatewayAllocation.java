package com.laya.game.central.model;

// import org.springframework.data.annotation.CreatedDate;
// import org.springframework.data.annotation.LastModifiedDate;
// import org.springframework.data.jpa.domain.support.AuditingEntityListener;

// import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * 网关分配实体类
 *
 * 管理用户到网关服务器的分配关系
 * 支持30秒超时回收机制
 *
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
// @Entity
// @Table(name = "gateway_allocations", indexes = {
//     @Index(name = "idx_user_id", columnList = "userId"),
//     @Index(name = "idx_gateway_ip", columnList = "gatewayIp"),
//     @Index(name = "idx_status", columnList = "status"),
//     @Index(name = "idx_allocated_at", columnList = "allocatedAt"),
//     @Index(name = "idx_expires_at", columnList = "expiresAt")
// })
// @EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true)
public class GatewayAllocation {

    // @Id
    // @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 用户ID
     */
    @NotNull(message = "用户ID不能为空")
    // @Column(name = "user_id", nullable = false)
    private String userId;

    /**
     * 分配的网关服务器IP
     */
    @NotBlank(message = "网关IP不能为空")
    // @Column(name = "gateway_ip", length = 45, nullable = false)
    private String gatewayIp;

    /**
     * 网关服务器端口
     */
    @NotNull(message = "网关端口不能为空")
    // @Column(name = "gateway_port", nullable = false)
    private Integer gatewayPort;

    /**
     * 分配状态
     */
    // @Enumerated(EnumType.STRING)
    // @Column(name = "status", length = 20, nullable = false)
    private AllocationStatus status = AllocationStatus.ALLOCATED;

    /**
     * 分配时间
     */
    @NotNull(message = "分配时间不能为空")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    // @Column(name = "allocated_at", nullable = false)
    private LocalDateTime allocatedAt;

    /**
     * 过期时间 (分配后30秒)
     */
    @NotNull(message = "过期时间不能为空")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    // @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * 连接确认时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    // @Column(name = "connected_at")
    private LocalDateTime connectedAt;

    /**
     * 客户端IP地址
     */
    // @Column(name = "client_ip", length = 45)
    private String clientIp;

    /**
     * 登录平台
     */
    // @Column(name = "platform", length = 20)
    private String platform;

    /**
     * 回收原因
     */
    // @Column(name = "recycle_reason", length = 200)
    private String recycleReason;

    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    // @CreatedDate
    // @Column(name = "created_date", nullable = false, updatable = false)
    private LocalDateTime createdDate;

    /**
     * 更新时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    // @LastModifiedDate
    // @Column(name = "last_modified_date", nullable = false)
    private LocalDateTime lastModifiedDate;

    /**
     * 分配状态枚举
     */
    public enum AllocationStatus {
        ALLOCATED("已分配"),
        CONNECTED("已连接"),
        EXPIRED("已过期"),
        RECYCLED("已回收"),
        FAILED("分配失败");

        private final String displayName;

        AllocationStatus(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    // 构造函数
    public GatewayAllocation() {}

    public GatewayAllocation(String userId, String gatewayIp, Integer gatewayPort,
                           String clientIp, String platform) {
        this.userId = userId;
        this.gatewayIp = gatewayIp;
        this.gatewayPort = gatewayPort;
        this.clientIp = clientIp;
        this.platform = platform;
        this.status = AllocationStatus.ALLOCATED;
        this.allocatedAt = LocalDateTime.now();
        this.expiresAt = this.allocatedAt.plusSeconds(30); // 30秒后过期
    }

    /**
     * 检查分配是否有效
     */
    public boolean isValid() {
        return (status == AllocationStatus.ALLOCATED || status == AllocationStatus.CONNECTED) &&
               expiresAt != null && 
               expiresAt.isAfter(LocalDateTime.now());
    }

    /**
     * 检查是否已过期
     */
    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }

    /**
     * 确认连接
     */
    public void confirmConnection() {
        this.status = AllocationStatus.CONNECTED;
        this.connectedAt = LocalDateTime.now();
    }

    /**
     * 标记为过期
     */
    public void markExpired() {
        this.status = AllocationStatus.EXPIRED;
    }

    /**
     * 回收分配
     */
    public void recycle(String reason) {
        this.status = AllocationStatus.RECYCLED;
        this.recycleReason = reason;
    }

    /**
     * 标记为失败
     */
    public void markFailed(String reason) {
        this.status = AllocationStatus.FAILED;
        this.recycleReason = reason;
    }

    /**
     * 获取网关地址
     */
    public String getGatewayAddress() {
        return gatewayIp + ":" + gatewayPort;
    }

    /**
     * 获取剩余有效时间（秒）
     */
    public long getRemainingSeconds() {
        if (expiresAt == null) {
            return 0;
        }
        LocalDateTime now = LocalDateTime.now();
        if (expiresAt.isBefore(now)) {
            return 0;
        }
        return java.time.Duration.between(now, expiresAt).getSeconds();
    }

    // Getter和Setter方法
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getGatewayIp() {
        return gatewayIp;
    }

    public void setGatewayIp(String gatewayIp) {
        this.gatewayIp = gatewayIp;
    }

    public Integer getGatewayPort() {
        return gatewayPort;
    }

    public void setGatewayPort(Integer gatewayPort) {
        this.gatewayPort = gatewayPort;
    }

    public AllocationStatus getStatus() {
        return status;
    }

    public void setStatus(AllocationStatus status) {
        this.status = status;
    }

    public LocalDateTime getAllocatedAt() {
        return allocatedAt;
    }

    public void setAllocatedAt(LocalDateTime allocatedAt) {
        this.allocatedAt = allocatedAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getConnectedAt() {
        return connectedAt;
    }

    public void setConnectedAt(LocalDateTime connectedAt) {
        this.connectedAt = connectedAt;
    }

    public String getClientIp() {
        return clientIp;
    }

    public void setClientIp(String clientIp) {
        this.clientIp = clientIp;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getRecycleReason() {
        return recycleReason;
    }

    public void setRecycleReason(String recycleReason) {
        this.recycleReason = recycleReason;
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
     * 获取创建时间（别名方法）
     */
    public LocalDateTime getCreatedTime() {
        return this.createdDate;
    }

    /**
     * 获取更新时间（别名方法）
     */
    public LocalDateTime getUpdatedTime() {
        return this.lastModifiedDate;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        GatewayAllocation that = (GatewayAllocation) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "GatewayAllocation{" +
                "id=" + id +
                ", userId=" + userId +
                ", gatewayIp='" + gatewayIp + '\'' +
                ", gatewayPort=" + gatewayPort +
                ", status=" + status +
                ", allocatedAt=" + allocatedAt +
                ", expiresAt=" + expiresAt +
                '}';
    }
}
