package com.laya.game.central.controller;

import com.laya.game.central.model.GatewayAllocation;
import com.laya.game.central.protocol.payload.gatewaylifecycle.GatewayLifecyclePayloads.GatewayLifecycleRequest;
import com.laya.game.central.protocol.payload.gatewaylifecycle.GatewayLifecyclePayloads.GatewayLifecycleResponse;
import com.laya.game.central.protocol.payload.gatewaylifecycle.GatewayLifecyclePayloads.GatewayRegistrationRequest;
import com.laya.game.central.service.GatewayService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Optional;

/**
 * 网关分配管理REST API控制器
 * 
 * 提供网关服务器分配和负载均衡相关的HTTP接口
 * 
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@RestController
@RequestMapping("/api/v1/gateway")
@Validated
@Tag(name = "网关分配管理", description = "网关服务器分配和负载均衡相关接口")
public class GatewayController {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GatewayController.class);
    private final GatewayService gatewayService;
    private final com.laya.game.central.service.GatewayHeartbeatService heartbeatService;

    /**
     * 为用户分配网关
     */
    @PostMapping("/allocate")
    @Operation(summary = "分配网关", description = "为用户分配最优的网关服务器")
    public ResponseEntity<ApiResponse<GatewayAllocationDto>> allocateGateway(@Valid @RequestBody AllocateGatewayRequest request) {
        try {
            Optional<GatewayAllocation> allocationOpt = gatewayService.allocateGateway(request.getUserId(), request.getPreferredGatewayIp(), request.getPreferredGatewayPort());
            if (allocationOpt.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.error("暂无可用的网关服务器"));
            }
            GatewayAllocation allocation = allocationOpt.get();
            GatewayAllocationDto dto = convertToDto(allocation);
            return ResponseEntity.ok(ApiResponse.success(dto));
        } catch (Exception e) {
            log.error("Failed to allocate gateway for user {}: {}", request.getUserId(), e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("网关分配失败: " + e.getMessage()));
        }
    }

    /**
     * 确认连接
     */
    @PutMapping("/confirm-connection")
    @Operation(summary = "确认连接", description = "确认用户已成功连接到分配的网关")
    public ResponseEntity<GatewayLifecycleResponse> confirmConnection(@RequestBody GatewayLifecycleRequest request) {
        try {
            if (!isValidLifecycleRequest(request)) {
                return ResponseEntity.ok(new GatewayLifecycleResponse(false, "invalid gateway lifecycle request"));
            }
            boolean confirmed = gatewayService.confirmConnection(request.userId(), request.gatewayIp(), request.gatewayPort());
            if (confirmed) {
                return ResponseEntity.ok(new GatewayLifecycleResponse(true, "connection confirmed"));
            } else {
                return ResponseEntity.ok(new GatewayLifecycleResponse(false, "allocation missing, expired, or mismatched"));
            }
        } catch (Exception e) {
            log.error("Failed to confirm connection for user {}: {}", request != null ? request.userId() : null, e.getMessage());
            return ResponseEntity.ok(new GatewayLifecycleResponse(false, "connection confirmation failed"));
        }
    }

    /**
     * 延长分配过期时间
     */
    @PutMapping("/extend")
    @Operation(summary = "延长分配", description = "延长网关分配的过期时间")
    public ResponseEntity<ApiResponse<Void>> extendAllocation(@Valid @RequestBody ExtendAllocationRequest request) {
        try {
            boolean extended = gatewayService.extendAllocation(request.getUserId(), request.getGatewayIp(), request.getGatewayPort(), request.getExtendMinutes());
            if (extended) {
                return ResponseEntity.ok(ApiResponse.success(null));
            } else {
                return ResponseEntity.ok(ApiResponse.error("延长分配失败，分配记录不存在或已失效"));
            }
        } catch (Exception e) {
            log.error("Failed to extend allocation for user {}: {}", request.getUserId(), e.getMessage());
            return ResponseEntity.ok(ApiResponse.error("延长分配失败"));
        }
    }

    /**
     * 释放分配
     */
    @DeleteMapping("/release")
    @Operation(summary = "释放分配", description = "释放用户的网关分配")
    public ResponseEntity<GatewayLifecycleResponse> releaseAllocation(@RequestBody GatewayLifecycleRequest request) {
        try {
            if (!isValidLifecycleRequest(request)) {
                return ResponseEntity.ok(new GatewayLifecycleResponse(false, "invalid gateway lifecycle request"));
            }
            gatewayService.releaseAllocation(request.userId(), request.gatewayIp(), request.gatewayPort());
            return ResponseEntity.ok(new GatewayLifecycleResponse(true, "allocation released"));
        } catch (Exception e) {
            log.error("Failed to release allocation for user {}: {}", request != null ? request.userId() : null, e.getMessage());
            return ResponseEntity.ok(new GatewayLifecycleResponse(false, "allocation release failed"));
        }
    }

    @DeleteMapping("/unregister")
    @Operation(summary = "注销 Gateway", description = "Gateway 优雅关闭时立即标记为离线")
    public ResponseEntity<GatewayLifecycleResponse> unregisterGateway(
            @RequestBody GatewayRegistrationRequest request) {
        if (!isValidRegistrationRequest(request)) {
            return ResponseEntity.ok(new GatewayLifecycleResponse(false, "invalid gateway registration request"));
        }
        heartbeatService.unregisterGateway(request.gatewayIp(), request.gatewayPort());
        return ResponseEntity.ok(new GatewayLifecycleResponse(true, "gateway unregistered"));
    }

    private static boolean isValidLifecycleRequest(GatewayLifecycleRequest request) {
        return request != null
                && request.userId() != null && !request.userId().isBlank() && request.userId().length() <= 100
                && request.gatewayIp() != null && !request.gatewayIp().isBlank() && request.gatewayIp().length() <= 255
                && request.gatewayPort() >= 1 && request.gatewayPort() <= 65535;
    }

    private static boolean isValidRegistrationRequest(GatewayRegistrationRequest request) {
        return request != null
                && request.gatewayIp() != null && !request.gatewayIp().isBlank()
                && request.gatewayIp().length() <= 255
                && request.gatewayPort() >= 1 && request.gatewayPort() <= 65535;
    }

    /**
     * 获取用户当前分配
     */
    @GetMapping("/user/{userId}")
    @Operation(summary = "获取用户分配", description = "获取指定用户当前的网关分配")
    public ResponseEntity<ApiResponse<GatewayAllocationDto>> getUserAllocation(@Parameter(description = "用户ID", required = true) @PathVariable String userId) {
        try {
            Optional<GatewayAllocation> allocationOpt = gatewayService.getUserCurrentAllocation(userId);
            if (allocationOpt.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.error("用户暂无网关分配"));
            }
            GatewayAllocationDto dto = convertToDto(allocationOpt.get());
            return ResponseEntity.ok(ApiResponse.success(dto));
        } catch (Exception e) {
            log.error("Failed to get gateway allocation for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("获取用户分配失败: " + e.getMessage()));
        }
    }

    /**
     * 获取网关负载信息
     */
    @GetMapping("/load")
    @Operation(summary = "获取网关负载", description = "获取所有网关服务器的负载信息")
    public ResponseEntity<ApiResponse<List<GatewayService.GatewayLoad>>> getGatewayLoads() {
        List<GatewayService.GatewayLoad> loads = gatewayService.getGatewayLoads();
        return ResponseEntity.ok(ApiResponse.success(loads));
    }

    /**
     * 获取指定网关负载
     */
    @GetMapping("/load/{gatewayIp}/{gatewayPort}")
    @Operation(summary = "获取指定网关负载", description = "获取指定网关服务器的负载信息")
    public ResponseEntity<ApiResponse<GatewayService.GatewayLoad>> getGatewayLoad(@Parameter(description = "网关IP", required = true) @PathVariable String gatewayIp, @Parameter(description = "网关端口", required = true) @PathVariable Integer gatewayPort) {
        Optional<GatewayService.GatewayLoad> loadOpt = gatewayService.getGatewayLoad(gatewayIp, gatewayPort);
        if (loadOpt.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.error("网关服务器不存在"));
        }
        return ResponseEntity.ok(ApiResponse.success(loadOpt.get()));
    }

    /**
     * 获取分配统计信息
     */
    @GetMapping("/statistics")
    @Operation(summary = "获取分配统计", description = "获取网关分配的统计信息")
    public ResponseEntity<ApiResponse<GatewayService.AllocationStatistics>> getAllocationStatistics() {
        GatewayService.AllocationStatistics statistics = gatewayService.getAllocationStatistics();
        return ResponseEntity.ok(ApiResponse.success(statistics));
    }

    /**
     * 获取即将过期的分配
     */
    @GetMapping("/expiring")
    @Operation(summary = "获取即将过期的分配", description = "获取即将过期的网关分配列表")
    public ResponseEntity<ApiResponse<List<GatewayAllocationDto>>> getExpiringAllocations(@Parameter(description = "提前分钟数", required = false) @RequestParam(defaultValue = "5") Integer minutesBefore) {
        List<GatewayAllocation> allocations = gatewayService.getExpiringAllocations(minutesBefore);
        List<GatewayAllocationDto> dtos = allocations.stream().map(this::convertToDto).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    /**
     * 批量释放过期分配
     */
    @DeleteMapping("/cleanup-expired")
    @Operation(summary = "清理过期分配", description = "批量清理已过期的网关分配")
    public ResponseEntity<ApiResponse<Integer>> cleanupExpiredAllocations() {
        try {
            int cleanedCount = gatewayService.cleanupExpiredAllocations();
            return ResponseEntity.ok(ApiResponse.success(cleanedCount));
        } catch (Exception e) {
            log.error("Failed to cleanup expired allocations: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.error("清理过期分配失败"));
        }
    }

    /**
     * 强制释放用户分配
     */
    @DeleteMapping("/force-release/{userId}")
    @Operation(summary = "强制释放用户分配", description = "强制释放指定用户的所有网关分配")
    public ResponseEntity<ApiResponse<Void>> forceReleaseUserAllocations(@Parameter(description = "用户ID", required = true) @PathVariable String userId) {
        try {
            gatewayService.forceReleaseUserAllocations(userId);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("Failed to force release allocations for user {}: {}", userId, e.getMessage());
            return ResponseEntity.ok(ApiResponse.error("强制释放分配失败"));
        }
    }

    /**
     * 获取网关分配历史
     */
    @GetMapping("/history/{userId}")
    @Operation(summary = "获取分配历史", description = "获取指定用户的网关分配历史")
    public ResponseEntity<ApiResponse<List<GatewayAllocationDto>>> getAllocationHistory(@Parameter(description = "用户ID", required = true) @PathVariable String userId, @Parameter(description = "限制数量", required = false) @RequestParam(defaultValue = "10") Integer limit) {
        List<GatewayAllocation> allocations = gatewayService.getUserAllocationHistory(userId, limit);
        List<GatewayAllocationDto> dtos = allocations.stream().map(this::convertToDto).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    /**
     * 转换为DTO
     */
    private GatewayAllocationDto convertToDto(GatewayAllocation allocation) {
        GatewayAllocationDto dto = new GatewayAllocationDto();
        dto.setUserId(allocation.getUserId());
        dto.setGatewayIp(allocation.getGatewayIp());
        dto.setGatewayPort(allocation.getGatewayPort());
        dto.setStatus(allocation.getStatus());
        dto.setAllocatedAt(allocation.getAllocatedAt());
        dto.setExpiresAt(allocation.getExpiresAt());
        dto.setConnectedAt(allocation.getConnectedAt());
        dto.setCreatedTime(allocation.getCreatedTime());
        dto.setUpdatedTime(allocation.getUpdatedTime());
        return dto;
    }

    // DTO类定义
    public static class GatewayAllocationDto {
        private String userId;
        private String gatewayIp;
        private Integer gatewayPort;
        private GatewayAllocation.AllocationStatus status;
        private java.time.LocalDateTime allocatedAt;
        private java.time.LocalDateTime expiresAt;
        private java.time.LocalDateTime connectedAt;
        private java.time.LocalDateTime createdTime;
        private java.time.LocalDateTime updatedTime;

        // Getters and Setters
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

        public GatewayAllocation.AllocationStatus getStatus() {
            return status;
        }

        public void setStatus(GatewayAllocation.AllocationStatus status) {
            this.status = status;
        }

        public java.time.LocalDateTime getAllocatedAt() {
            return allocatedAt;
        }

        public void setAllocatedAt(java.time.LocalDateTime allocatedAt) {
            this.allocatedAt = allocatedAt;
        }

        public java.time.LocalDateTime getExpiresAt() {
            return expiresAt;
        }

        public void setExpiresAt(java.time.LocalDateTime expiresAt) {
            this.expiresAt = expiresAt;
        }

        public java.time.LocalDateTime getConnectedAt() {
            return connectedAt;
        }

        public void setConnectedAt(java.time.LocalDateTime connectedAt) {
            this.connectedAt = connectedAt;
        }

        public java.time.LocalDateTime getCreatedTime() {
            return createdTime;
        }

        public void setCreatedTime(java.time.LocalDateTime createdTime) {
            this.createdTime = createdTime;
        }

        public java.time.LocalDateTime getUpdatedTime() {
            return updatedTime;
        }

        public void setUpdatedTime(java.time.LocalDateTime updatedTime) {
            this.updatedTime = updatedTime;
        }
    }


    public static class AllocateGatewayRequest {
        @NotNull(message = "用户ID不能为空")
        private String userId;
        private String preferredGatewayIp;
        private Integer preferredGatewayPort;

        // Getters and Setters
        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public String getPreferredGatewayIp() {
            return preferredGatewayIp;
        }

        public void setPreferredGatewayIp(String preferredGatewayIp) {
            this.preferredGatewayIp = preferredGatewayIp;
        }

        public Integer getPreferredGatewayPort() {
            return preferredGatewayPort;
        }

        public void setPreferredGatewayPort(Integer preferredGatewayPort) {
            this.preferredGatewayPort = preferredGatewayPort;
        }
    }


    public static class ExtendAllocationRequest {
        @NotNull(message = "用户ID不能为空")
        private String userId;
        @NotBlank(message = "网关IP不能为空")
        private String gatewayIp;
        @NotNull(message = "网关端口不能为空")
        private Integer gatewayPort;
        @NotNull(message = "延长分钟数不能为空")
        private Integer extendMinutes;

        // Getters and Setters
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

        public Integer getExtendMinutes() {
            return extendMinutes;
        }

        public void setExtendMinutes(Integer extendMinutes) {
            this.extendMinutes = extendMinutes;
        }
    }


    /**
     * Gateway心跳请求
     */
    public static class GatewayHeartbeatRequest {
        @NotBlank(message = "网关IP不能为空")
        private String gatewayIp;
        @NotNull(message = "网关端口不能为空")
        private Integer gatewayPort;
        @NotNull(message = "时间戳不能为空")
        private Long timestamp;
        @NotNull(message = "活跃连接数不能为空")
        private Integer activeConnections;
        @NotNull(message = "已认证用户数不能为空")
        private Integer authenticatedUsers;
        @NotNull(message = "等待重连数不能为空")
        private Integer waitingReconnections;

        // Getters and Setters
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

        public Long getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(Long timestamp) {
            this.timestamp = timestamp;
        }

        public Integer getActiveConnections() {
            return activeConnections;
        }

        public void setActiveConnections(Integer activeConnections) {
            this.activeConnections = activeConnections;
        }

        public Integer getAuthenticatedUsers() {
            return authenticatedUsers;
        }

        public void setAuthenticatedUsers(Integer authenticatedUsers) {
            this.authenticatedUsers = authenticatedUsers;
        }

        public Integer getWaitingReconnections() {
            return waitingReconnections;
        }

        public void setWaitingReconnections(Integer waitingReconnections) {
            this.waitingReconnections = waitingReconnections;
        }
    }

    /**
     * Gateway心跳接口
     */
    @PostMapping("/heartbeat")
    @Operation(summary = "Gateway心跳", description = "Gateway定期发送心跳，首次自动注册")
    public ResponseEntity<ApiResponse<Void>> handleHeartbeat(@Valid @RequestBody GatewayHeartbeatRequest request) {
        try {
            heartbeatService.handleHeartbeat(request.getGatewayIp(), request.getGatewayPort(), request.getActiveConnections(), request.getAuthenticatedUsers(), request.getWaitingReconnections());
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("Failed to handle heartbeat from {}:{}: {}", request.getGatewayIp(), request.getGatewayPort(), e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error("心跳处理失败: " + e.getMessage()));
        }
    }

    /**
     * 获取Gateway列表
     */
    @GetMapping("/list")
    @Operation(summary = "获取Gateway列表", description = "获取所有Gateway的状态信息")
    public ResponseEntity<ApiResponse<List<com.laya.game.central.model.GatewayInfo>>> getGatewayList() {
        List<com.laya.game.central.model.GatewayInfo> gateways = heartbeatService.getAllGateways();
        return ResponseEntity.ok(ApiResponse.success(gateways));
    }

    /**
     * 获取Gateway统计信息
     */
    @GetMapping("/gateway-statistics")
    @Operation(summary = "获取Gateway统计", description = "获取Gateway的统计信息")
    public ResponseEntity<ApiResponse<com.laya.game.central.service.GatewayHeartbeatService.GatewayStatistics>> getGatewayStatistics() {
        com.laya.game.central.service.GatewayHeartbeatService.GatewayStatistics stats = heartbeatService.getStatistics();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }


    /**
     * 通用API响应类
     */
    public static class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;

        public static <T> ApiResponse<T> success(T data) {
            ApiResponse<T> response = new ApiResponse<>();
            response.success = true;
            response.message = "操作成功";
            response.data = data;
            return response;
        }

        public static <T> ApiResponse<T> error(String message) {
            ApiResponse<T> response = new ApiResponse<>();
            response.success = false;
            response.message = message;
            return response;
        }

        // Getters and Setters
        public boolean isSuccess() {
            return success;
        }

        public void setSuccess(boolean success) {
            this.success = success;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public T getData() {
            return data;
        }

        public void setData(T data) {
            this.data = data;
        }
    }

    @java.lang.SuppressWarnings("all")
    public GatewayController(final GatewayService gatewayService, final com.laya.game.central.service.GatewayHeartbeatService heartbeatService) {
        this.gatewayService = gatewayService;
        this.heartbeatService = heartbeatService;
    }
}
