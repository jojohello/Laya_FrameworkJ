package com.laya.game.central.controller;

import com.laya.game.central.model.User;
import com.laya.game.central.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Optional;

/**
 * 用户管理REST API控制器
 * 
 * 提供用户相关的HTTP接口
 * 
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@RestController
@RequestMapping("/api/v1/users")
@Validated
@Tag(name = "用户管理", description = "用户账号管理相关接口")
public class UserController {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(UserController.class);
    private final UserService userService;

    /**
     * 根据用户ID查询用户信息
     */
    @GetMapping("/{userId}")
    @Operation(summary = "查询用户信息", description = "根据用户ID查询用户详细信息")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@Parameter(description = "用户ID", required = true) @PathVariable Long userId) {
        Optional<User> userOpt = userService.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.error("用户不存在"));
        }
        UserDto userDto = convertToDto(userOpt.get());
        return ResponseEntity.ok(ApiResponse.success(userDto));
    }

    /**
     * 根据用户名查询用户信息
     */
    @GetMapping("/by-username/{username}")
    @Operation(summary = "根据用户名查询用户", description = "根据用户名查询用户信息")
    public ResponseEntity<ApiResponse<UserDto>> getUserByUsername(@Parameter(description = "用户名", required = true) @PathVariable String username) {
        Optional<User> userOpt = userService.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.error("用户不存在"));
        }
        UserDto userDto = convertToDto(userOpt.get());
        return ResponseEntity.ok(ApiResponse.success(userDto));
    }

    /**
     * 根据第三方登录信息查询用户
     */
    @GetMapping("/by-third-party")
    @Operation(summary = "根据第三方登录信息查询用户", description = "根据第三方平台类型和ID查询用户")
    public ResponseEntity<ApiResponse<UserDto>> getUserByThirdParty(@Parameter(description = "第三方平台类型", required = true) @RequestParam User.ThirdPartyType thirdPartyType, @Parameter(description = "第三方平台用户ID", required = true) @RequestParam String thirdPartyId) {
        Optional<User> userOpt = userService.findByThirdPartyInfo(thirdPartyType, thirdPartyId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.error("用户不存在"));
        }
        UserDto userDto = convertToDto(userOpt.get());
        return ResponseEntity.ok(ApiResponse.success(userDto));
    }

    /**
     * 创建新用户
     */
    @PostMapping
    @Operation(summary = "创建用户", description = "创建新的用户账号")
    public ResponseEntity<ApiResponse<UserDto>> createUser(@Valid @RequestBody CreateUserRequest request) {
        try {
            User user = userService.createUser(request.getUsername(), request.getPassword(), request.getEmail(), request.getNickname(), request.getThirdPartyType(), request.getThirdPartyId());
            UserDto userDto = convertToDto(user);
            return ResponseEntity.ok(ApiResponse.success(userDto));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to create user: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 更新用户信息
     */
    @PutMapping("/{userId}")
    @Operation(summary = "更新用户信息", description = "更新用户的昵称和头像")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(@Parameter(description = "用户ID", required = true) @PathVariable Long userId, @Valid @RequestBody UpdateUserRequest request) {
        try {
            User user = userService.updateUser(userId, request.getNickname(), request.getAvatarUrl());
            UserDto userDto = convertToDto(user);
            return ResponseEntity.ok(ApiResponse.success(userDto));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to update user {}: {}", userId, e.getMessage());
            return ResponseEntity.ok(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 更新用户密码
     */
    @PutMapping("/{userId}/password")
    @Operation(summary = "更新用户密码", description = "更新用户登录密码")
    public ResponseEntity<ApiResponse<Void>> updatePassword(@Parameter(description = "用户ID", required = true) @PathVariable Long userId, @Valid @RequestBody UpdatePasswordRequest request) {
        try {
            userService.updatePassword(userId, request.getOldPassword(), request.getNewPassword());
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to update password for user {}: {}", userId, e.getMessage());
            return ResponseEntity.ok(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 更新用户状态
     */
    @PutMapping("/{userId}/status")
    @Operation(summary = "更新用户状态", description = "更新用户账号状态（激活/禁用/删除）")
    public ResponseEntity<ApiResponse<Void>> updateUserStatus(@Parameter(description = "用户ID", required = true) @PathVariable Long userId, @Parameter(description = "新状态", required = true) @RequestParam User.UserStatus status) {
        try {
            userService.updateUserStatus(userId, status);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to update status for user {}: {}", userId, e.getMessage());
            return ResponseEntity.ok(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * 验证用户密码
     */
    @PostMapping("/{userId}/validate-password")
    @Operation(summary = "验证用户密码", description = "验证用户输入的密码是否正确")
    public ResponseEntity<ApiResponse<Boolean>> validatePassword(@Parameter(description = "用户ID", required = true) @PathVariable Long userId, @Valid @RequestBody ValidatePasswordRequest request) {
        boolean isValid = userService.validatePassword(userId, request.getPassword());
        return ResponseEntity.ok(ApiResponse.success(isValid));
    }

    /**
     * 获取活跃用户列表
     */
    @GetMapping("/active")
    @Operation(summary = "获取活跃用户列表", description = "获取所有状态为活跃的用户")
    public ResponseEntity<ApiResponse<List<UserDto>>> getActiveUsers() {
        List<User> users = userService.getActiveUsers();
        List<UserDto> userDtos = users.stream().map(this::convertToDto).toList();
        return ResponseEntity.ok(ApiResponse.success(userDtos));
    }

    /**
     * 获取最近登录的用户
     */
    @GetMapping("/recent-login")
    @Operation(summary = "获取最近登录用户", description = "获取指定天数内登录过的用户")
    public ResponseEntity<ApiResponse<List<UserDto>>> getRecentlyLoggedInUsers(@Parameter(description = "天数", required = true) @RequestParam(defaultValue = "7") int days) {
        List<User> users = userService.getRecentlyLoggedInUsers(days);
        List<UserDto> userDtos = users.stream().map(this::convertToDto).toList();
        return ResponseEntity.ok(ApiResponse.success(userDtos));
    }

    /**
     * 获取用户统计信息
     */
    @GetMapping("/statistics")
    @Operation(summary = "获取用户统计信息", description = "获取用户数量、活跃度等统计数据")
    public ResponseEntity<ApiResponse<UserService.UserStatistics>> getUserStatistics() {
        UserService.UserStatistics statistics = userService.getUserStatistics();
        return ResponseEntity.ok(ApiResponse.success(statistics));
    }

    /**
     * 清理游客账号
     */
    @PostMapping("/cleanup-guests")
    @Operation(summary = "清理游客账号", description = "清理指定天数未登录的游客账号")
    public ResponseEntity<ApiResponse<Integer>> cleanupGuestAccounts(@Parameter(description = "天数阈值", required = true) @RequestParam(defaultValue = "30") int daysThreshold) {
        int cleanedCount = userService.cleanupGuestAccounts(daysThreshold);
        return ResponseEntity.ok(ApiResponse.success(cleanedCount));
    }

    /**
     * 转换为DTO
     */
    private UserDto convertToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setNickname(user.getNickname());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setThirdPartyType(user.getThirdPartyType());
        dto.setThirdPartyId(user.getThirdPartyId());
        dto.setStatus(user.getStatus());
        dto.setLastLoginTime(user.getLastLoginTime());
        dto.setLastLoginIp(user.getLastLoginIp());
        dto.setCreatedTime(user.getCreatedTime());
        dto.setUpdatedTime(user.getUpdatedTime());
        return dto;
    }

    // DTO类定义
    public static class UserDto {
        private Long id;
        private String username;
        private String email;
        private String nickname;
        private String avatarUrl;
        private User.ThirdPartyType thirdPartyType;
        private String thirdPartyId;
        private User.UserStatus status;
        private java.time.LocalDateTime lastLoginTime;
        private String lastLoginIp;
        private java.time.LocalDateTime createdTime;
        private java.time.LocalDateTime updatedTime;

        // Getters and Setters
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

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
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

        public User.ThirdPartyType getThirdPartyType() {
            return thirdPartyType;
        }

        public void setThirdPartyType(User.ThirdPartyType thirdPartyType) {
            this.thirdPartyType = thirdPartyType;
        }

        public String getThirdPartyId() {
            return thirdPartyId;
        }

        public void setThirdPartyId(String thirdPartyId) {
            this.thirdPartyId = thirdPartyId;
        }

        public User.UserStatus getStatus() {
            return status;
        }

        public void setStatus(User.UserStatus status) {
            this.status = status;
        }

        public java.time.LocalDateTime getLastLoginTime() {
            return lastLoginTime;
        }

        public void setLastLoginTime(java.time.LocalDateTime lastLoginTime) {
            this.lastLoginTime = lastLoginTime;
        }

        public String getLastLoginIp() {
            return lastLoginIp;
        }

        public void setLastLoginIp(String lastLoginIp) {
            this.lastLoginIp = lastLoginIp;
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


    public static class CreateUserRequest {
        @Size(min = 3, max = 50, message = "用户名长度必须在3-50个字符之间")
        private String username;
        @Size(min = 6, max = 100, message = "密码长度必须在6-100个字符之间")
        private String password;
        @Email(message = "邮箱格式不正确")
        private String email;
        @Size(max = 50, message = "昵称长度不能超过50个字符")
        private String nickname;
        @NotNull(message = "第三方登录类型不能为空")
        private User.ThirdPartyType thirdPartyType;
        @NotBlank(message = "第三方用户ID不能为空")
        private String thirdPartyId;

        // Getters and Setters
        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getNickname() {
            return nickname;
        }

        public void setNickname(String nickname) {
            this.nickname = nickname;
        }

        public User.ThirdPartyType getThirdPartyType() {
            return thirdPartyType;
        }

        public void setThirdPartyType(User.ThirdPartyType thirdPartyType) {
            this.thirdPartyType = thirdPartyType;
        }

        public String getThirdPartyId() {
            return thirdPartyId;
        }

        public void setThirdPartyId(String thirdPartyId) {
            this.thirdPartyId = thirdPartyId;
        }
    }


    public static class UpdateUserRequest {
        @Size(max = 50, message = "昵称长度不能超过50个字符")
        private String nickname;
        @Size(max = 500, message = "头像URL长度不能超过500个字符")
        private String avatarUrl;

        // Getters and Setters
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
    }


    public static class UpdatePasswordRequest {
        @NotBlank(message = "旧密码不能为空")
        private String oldPassword;
        @NotBlank(message = "新密码不能为空")
        @Size(min = 6, max = 100, message = "新密码长度必须在6-100个字符之间")
        private String newPassword;

        // Getters and Setters
        public String getOldPassword() {
            return oldPassword;
        }

        public void setOldPassword(String oldPassword) {
            this.oldPassword = oldPassword;
        }

        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }


    public static class ValidatePasswordRequest {
        @NotBlank(message = "密码不能为空")
        private String password;

        // Getters and Setters
        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
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
    public UserController(final UserService userService) {
        this.userService = userService;
    }
}
