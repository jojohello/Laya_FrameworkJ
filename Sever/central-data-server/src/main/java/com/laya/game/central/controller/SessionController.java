package com.laya.game.central.controller;

import com.laya.game.central.model.UserSession;
import com.laya.game.central.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Optional;

/**
 * 会话管理REST API控制器
 * 
 * 提供用户会话和三要素验证相关的HTTP接口
 * 
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@RestController
@RequestMapping("/api/v1/sessions")
@Validated
@Tag(name = "会话管理", description = "用户会话和三要素验证相关接口")
public class SessionController {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SessionController.class);
    private final SessionService sessionService;

    /**
     * 创建新会话
     */
    @PostMapping
    @Operation(summary = "创建会话", description = "为用户创建新的登录会话")
    public ResponseEntity<ApiResponse<SessionDto>> createSession(@Valid @RequestBody CreateSessionRequest request, HttpServletRequest httpRequest) {
        try {
            String clientIp = getClientIp(httpRequest);
            UserSession session = sessionService.createSession(request.getUserId(), clientIp, request.getPlatform(), request.getClientVersion(), request.getUserAgent());
            SessionDto sessionDto = convertToDto(session);
            return ResponseEntity.ok(ApiResponse.success(sessionDto));
        } catch (Exception e) {
            log.error("Failed to create session for user {}: {}", request.getUserId(), e.getMessage());
            return ResponseEntity.ok(ApiResponse.error("创建会话失败: " + e.getMessage()));
        }
    }

    /**
     * 三要素验证
     */
    @PostMapping("/validate")
    @Operation(summary = "三要素验证", description = "验证用户ID、登录时间戳和Token的三要素组合")
    public ResponseEntity<ApiResponse<SessionDto>> validateThreeFactors(@Valid @RequestBody ThreeFactorValidationRequest request) {
        Optional<UserSession> sessionOpt = sessionService.validateThreeFactors(request.getUserId(), request.getLoginTimestamp(), request.getToken());
        if (sessionOpt.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.error("三要素验证失败"));
        }
        SessionDto sessionDto = convertToDto(sessionOpt.get());
        return ResponseEntity.ok(ApiResponse.success(sessionDto));
    }

    /**
     * 根据Token查找会话
     */
    @PostMapping("/by-token")
    @Operation(summary = "根据Token查找会话", description = "通过JWT Token查找对应的用户会话")
    public ResponseEntity<ApiResponse<SessionDto>> findByToken(@Valid @RequestBody TokenRequest request) {
        Optional<UserSession> sessionOpt = sessionService.findByToken(request.getToken());
        if (sessionOpt.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.error("会话不存在或已过期"));
        }
        SessionDto sessionDto = convertToDto(sessionOpt.get());
        return ResponseEntity.ok(ApiResponse.success(sessionDto));
    }

    /**
     * 获取用户的活跃会话
     */
    @GetMapping("/user/{userId}")
    @Operation(summary = "获取用户活跃会话", description = "获取指定用户的所有活跃会话")
    public ResponseEntity<ApiResponse<List<SessionDto>>> getUserActiveSessions(@Parameter(description = "用户ID", required = true) @PathVariable String userId) {
        List<UserSession> sessions = sessionService.getUserActiveSessions(userId);
        List<SessionDto> sessionDtos = sessions.stream().map(this::convertToDto).toList();
        return ResponseEntity.ok(ApiResponse.success(sessionDtos));
    }

    /**
     * 更新会话活跃时间
     */
    @PutMapping("/{sessionId}/heartbeat")
    @Operation(summary = "会话心跳", description = "更新会话的最后活跃时间")
    public ResponseEntity<ApiResponse<Void>> updateHeartbeat(@Parameter(description = "会话ID", required = true) @PathVariable String sessionId) {
        try {
            sessionService.updateLastActiveTime(sessionId);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("Failed to update heartbeat for session {}: {}", sessionId, e.getMessage());
            return ResponseEntity.ok(ApiResponse.error("更新心跳失败"));
        }
    }

    /**
     * 续期会话
     */
    @PutMapping("/{sessionId}/renew")
    @Operation(summary = "续期会话", description = "延长会话的过期时间")
    public ResponseEntity<ApiResponse<Boolean>> renewSession(@Parameter(description = "会话ID", required = true) @PathVariable String sessionId) {
        boolean renewed = sessionService.renewSession(sessionId);
        if (renewed) {
            return ResponseEntity.ok(ApiResponse.success(true));
        } else {
            return ResponseEntity.ok(ApiResponse.error("续期失败，会话不存在或已失效"));
        }
    }

    /**
     * 使会话过期
     */
    @PutMapping("/{sessionId}/expire")
    @Operation(summary = "使会话过期", description = "手动使指定会话过期")
    public ResponseEntity<ApiResponse<Void>> expireSession(@Parameter(description = "会话ID", required = true) @PathVariable String sessionId) {
        try {
            sessionService.expireSession(sessionId);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("Failed to expire session {}: {}", sessionId, e.getMessage());
            return ResponseEntity.ok(ApiResponse.error("会话过期操作失败"));
        }
    }

    /**
     * 强制下线用户
     */
    @PostMapping("/force-offline")
    @Operation(summary = "强制下线用户", description = "强制下线指定用户的所有会话")
    public ResponseEntity<ApiResponse<Void>> forceOfflineUser(@Valid @RequestBody ForceOfflineRequest request) {
        try {
            sessionService.forceOfflineUser(request.getUserId(), request.getReason());
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("Failed to force offline user {}: {}", request.getUserId(), e.getMessage());
            return ResponseEntity.ok(ApiResponse.error("强制下线失败"));
        }
    }

    /**
     * 获取会话统计信息
     */
    @GetMapping("/statistics")
    @Operation(summary = "获取会话统计信息", description = "获取会话数量、状态分布等统计数据")
    public ResponseEntity<ApiResponse<SessionService.SessionStatistics>> getSessionStatistics() {
        SessionService.SessionStatistics statistics = sessionService.getSessionStatistics();
        return ResponseEntity.ok(ApiResponse.success(statistics));
    }

    /**
     * 批量验证会话
     */
    @PostMapping("/batch-validate")
    @Operation(summary = "批量验证会话", description = "批量验证多个会话的有效性")
    public ResponseEntity<ApiResponse<List<SessionValidationResult>>> batchValidateSessions(@Valid @RequestBody BatchValidationRequest request) {
        List<SessionValidationResult> results = request.getValidations().stream().map(validation -> {
            Optional<UserSession> sessionOpt = sessionService.validateThreeFactors(validation.getUserId(), validation.getLoginTimestamp(), validation.getToken());
            return new SessionValidationResult(validation.getUserId(), validation.getToken(), sessionOpt.isPresent(), sessionOpt.map(UserSession::getSessionId).orElse(null));
        }).toList();
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    /**
     * 获取客户端IP地址
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    /**
     * 转换为DTO
     */
    private SessionDto convertToDto(UserSession session) {
        SessionDto dto = new SessionDto();
        dto.setSessionId(session.getSessionId());
        dto.setUserId(session.getUserId());
        // 将LocalDateTime转换为时间戳
        dto.setLoginTimestamp(session.getLoginTimestamp().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli());
        dto.setStatus(session.getStatus());
        dto.setLoginIp(session.getLoginIp());
        dto.setPlatform(session.getPlatform());
        dto.setClientVersion(session.getClientVersion());
        dto.setUserAgent(session.getUserAgent());
        dto.setLastActiveTime(session.getLastActiveTime());
        dto.setExpiresAt(session.getExpiresAt());
        dto.setConnectedAt(session.getConnectedAt());
        dto.setForceOfflineReason(session.getForceOfflineReason());
        dto.setCreatedTime(session.getCreatedTime());
        dto.setUpdatedTime(session.getUpdatedTime());
        return dto;
    }

    // DTO类定义
    public static class SessionDto {
        private String sessionId;
        private String userId;
        private Long loginTimestamp;
        private UserSession.SessionStatus status;
        private String loginIp;
        private String platform;
        private String clientVersion;
        private String userAgent;
        private java.time.LocalDateTime lastActiveTime;
        private java.time.LocalDateTime expiresAt;
        private java.time.LocalDateTime connectedAt;
        private String forceOfflineReason;
        private java.time.LocalDateTime createdTime;
        private java.time.LocalDateTime updatedTime;

        // Getters and Setters
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

        public Long getLoginTimestamp() {
            return loginTimestamp;
        }

        public void setLoginTimestamp(Long loginTimestamp) {
            this.loginTimestamp = loginTimestamp;
        }

        public UserSession.SessionStatus getStatus() {
            return status;
        }

        public void setStatus(UserSession.SessionStatus status) {
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

        public java.time.LocalDateTime getLastActiveTime() {
            return lastActiveTime;
        }

        public void setLastActiveTime(java.time.LocalDateTime lastActiveTime) {
            this.lastActiveTime = lastActiveTime;
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

        public String getForceOfflineReason() {
            return forceOfflineReason;
        }

        public void setForceOfflineReason(String forceOfflineReason) {
            this.forceOfflineReason = forceOfflineReason;
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


    public static class CreateSessionRequest {
        @NotNull(message = "用户ID不能为空")
        private String userId;
        @NotBlank(message = "平台信息不能为空")
        private String platform;
        private String clientVersion;
        private String userAgent;

        // Getters and Setters
        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
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
    }


    public static class ThreeFactorValidationRequest {
        @NotNull(message = "用户ID不能为空")
        private String userId;
        @NotNull(message = "登录时间戳不能为空")
        private Long loginTimestamp;
        @NotBlank(message = "Token不能为空")
        private String token;

        // Getters and Setters
        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public Long getLoginTimestamp() {
            return loginTimestamp;
        }

        public void setLoginTimestamp(Long loginTimestamp) {
            this.loginTimestamp = loginTimestamp;
        }

        public String getToken() {
            return token;
        }

        public void setToken(String token) {
            this.token = token;
        }
    }


    public static class TokenRequest {
        @NotBlank(message = "Token不能为空")
        private String token;

        // Getters and Setters
        public String getToken() {
            return token;
        }

        public void setToken(String token) {
            this.token = token;
        }
    }


    public static class ForceOfflineRequest {
        @NotNull(message = "用户ID不能为空")
        private String userId;
        @NotBlank(message = "下线原因不能为空")
        private String reason;

        // Getters and Setters
        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }


    public static class BatchValidationRequest {
        @NotNull(message = "验证列表不能为空")
        private List<ThreeFactorValidationRequest> validations;

        // Getters and Setters
        public List<ThreeFactorValidationRequest> getValidations() {
            return validations;
        }

        public void setValidations(List<ThreeFactorValidationRequest> validations) {
            this.validations = validations;
        }
    }


    public static class SessionValidationResult {
        private String userId;
        private String token;
        private boolean valid;
        private String sessionId;

        public SessionValidationResult(String userId, String token, boolean valid, String sessionId) {
            this.userId = userId;
            this.token = token;
            this.valid = valid;
            this.sessionId = sessionId;
        }

        // Getters and Setters
        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public String getToken() {
            return token;
        }

        public void setToken(String token) {
            this.token = token;
        }

        public boolean isValid() {
            return valid;
        }

        public void setValid(boolean valid) {
            this.valid = valid;
        }

        public String getSessionId() {
            return sessionId;
        }

        public void setSessionId(String sessionId) {
            this.sessionId = sessionId;
        }
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
    public SessionController(final SessionService sessionService) {
        this.sessionService = sessionService;
    }
}
