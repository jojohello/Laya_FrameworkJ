package com.laya.game.central.service;

import com.laya.game.central.model.User;
import com.laya.game.central.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 用户业务服务类
 * 
 * 提供用户管理相关的业务逻辑
 * 
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@Service
public class UserService {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(UserService.class);
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    /**
     * 根据用户ID查找用户
     */
    @Cacheable(value = "users", key = "#userId")
    public Optional<User> findById(Long userId) {
        return userRepository.findById(userId);
    }

    /**
     * 根据用户名查找用户
     */
    @Cacheable(value = "users", key = "\'username:\' + #username")
    public Optional<User> findByUsername(String username) {
        if (!StringUtils.hasText(username)) {
            return Optional.empty();
        }
        return userRepository.findByUsername(username);
    }

    /**
     * 根据邮箱查找用户
     */
    @Cacheable(value = "users", key = "\'email:\' + #email")
    public Optional<User> findByEmail(String email) {
        if (!StringUtils.hasText(email)) {
            return Optional.empty();
        }
        return userRepository.findByEmail(email);
    }

    /**
     * 根据第三方登录信息查找用户
     */
    @Cacheable(value = "users", key = "\'thirdparty:\' + #thirdPartyType + \':\' + #thirdPartyId")
    public Optional<User> findByThirdPartyInfo(User.ThirdPartyType thirdPartyType, String thirdPartyId) {
        if (thirdPartyType == null || !StringUtils.hasText(thirdPartyId)) {
            return Optional.empty();
        }
        return userRepository.findByThirdPartyTypeAndThirdPartyId(thirdPartyType, thirdPartyId);
    }

    /**
     * 创建新用户
     */
    @Transactional
    @CacheEvict(value = "users", allEntries = true)
    public User createUser(String username, String password, String email, String nickname, User.ThirdPartyType thirdPartyType, String thirdPartyId) {
        // 验证输入参数
        validateUserInput(username, email, thirdPartyType, thirdPartyId);
        // 检查重复
        checkDuplicateUser(username, email, thirdPartyType, thirdPartyId);
        // 创建用户对象
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setNickname(StringUtils.hasText(nickname) ? nickname : username);
        user.setThirdPartyType(thirdPartyType);
        user.setThirdPartyId(thirdPartyId);
        user.setStatus(User.UserStatus.ACTIVE);
        // 处理密码（如果提供）
        if (StringUtils.hasText(password)) {
            user.setPasswordHash(passwordEncoder.encode(password));
        }
        // 保存用户
        User savedUser = userRepository.save(user);
        log.info("Created new user: id={}, username={}, thirdPartyType={}", savedUser.getId(), savedUser.getUsername(), savedUser.getThirdPartyType());
        return savedUser;
    }

    /**
     * 更新用户信息
     */
    @Transactional
    @CacheEvict(value = "users", key = "#userId")
    public User updateUser(Long userId, String nickname, String avatarUrl) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        if (StringUtils.hasText(nickname)) {
            user.setNickname(nickname);
        }
        if (StringUtils.hasText(avatarUrl)) {
            user.setAvatarUrl(avatarUrl);
        }
        User updatedUser = userRepository.save(user);
        log.info("Updated user: id={}, nickname={}, avatarUrl={}", userId, nickname, avatarUrl);
        return updatedUser;
    }

    /**
     * 更新用户密码
     */
    @Transactional
    @CacheEvict(value = "users", key = "#userId")
    public void updatePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        // 验证旧密码
        if (StringUtils.hasText(user.getPasswordHash()) && !passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid old password");
        }
        // 设置新密码
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Updated password for user: id={}", userId);
    }

    /**
     * 更新用户最后登录信息
     */
    @Transactional
    @CacheEvict(value = "users", key = "#userId")
    public void updateLastLoginInfo(Long userId, String loginIp) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        user.setLastLoginTime(LocalDateTime.now());
        user.setLastLoginIp(loginIp);
        userRepository.save(user);
        log.debug("Updated last login info for user: id={}, ip={}", userId, loginIp);
    }

    /**
     * 更新用户状态
     */
    @Transactional
    @CacheEvict(value = "users", key = "#userId")
    public void updateUserStatus(Long userId, User.UserStatus status) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        User.UserStatus oldStatus = user.getStatus();
        user.setStatus(status);
        userRepository.save(user);
        log.info("Updated user status: id={}, oldStatus={}, newStatus={}", userId, oldStatus, status);
    }

    /**
     * 验证用户密码
     */
    public boolean validatePassword(Long userId, String password) {
        if (!StringUtils.hasText(password)) {
            return false;
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || !StringUtils.hasText(user.getPasswordHash())) {
            return false;
        }
        return passwordEncoder.matches(password, user.getPasswordHash());
    }

    /**
     * 获取活跃用户列表
     */
    public List<User> getActiveUsers() {
        return userRepository.findByStatus(User.UserStatus.ACTIVE);
    }

    /**
     * 获取最近登录的用户
     */
    public List<User> getRecentlyLoggedInUsers(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return userRepository.findRecentlyLoggedInUsers(since);
    }

    /**
     * 获取用户统计信息
     */
    public UserStatistics getUserStatistics() {
        long totalUsers = userRepository.countByStatus(User.UserStatus.ACTIVE);
        long bannedUsers = userRepository.countByStatus(User.UserStatus.BANNED);
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        List<User> activeUsers = userRepository.findActiveUsers(weekAgo, User.UserStatus.ACTIVE);
        List<Object[]> platformStats = userRepository.countByThirdPartyTypeAndStatus(User.UserStatus.ACTIVE);
        return new UserStatistics(totalUsers, bannedUsers, activeUsers.size(), platformStats);
    }

    /**
     * 清理游客账号
     */
    @Transactional
    public int cleanupGuestAccounts(int daysThreshold) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysThreshold);
        List<User> guestAccounts = userRepository.findGuestAccountsToCleanup(User.ThirdPartyType.GUEST, cutoffDate);
        if (!guestAccounts.isEmpty()) {
            List<Long> userIds = guestAccounts.stream().map(User::getId).toList();
            userRepository.updateStatusBatch(userIds, User.UserStatus.DELETED);
            log.info("Cleaned up {} guest accounts older than {} days", guestAccounts.size(), daysThreshold);
        }
        return guestAccounts.size();
    }

    /**
     * 验证用户输入
     */
    private void validateUserInput(String username, String email, User.ThirdPartyType thirdPartyType, String thirdPartyId) {
        if (thirdPartyType == User.ThirdPartyType.GUEST) {
            // 游客登录只需要第三方ID
            if (!StringUtils.hasText(thirdPartyId)) {
                throw new IllegalArgumentException("Guest login requires thirdPartyId");
            }
        } else {
            // 其他登录方式需要用户名和第三方ID
            if (!StringUtils.hasText(username)) {
                throw new IllegalArgumentException("Username is required");
            }
            if (!StringUtils.hasText(thirdPartyId)) {
                throw new IllegalArgumentException("ThirdPartyId is required");
            }
        }
    }

    /**
     * 检查重复用户
     */
    private void checkDuplicateUser(String username, String email, User.ThirdPartyType thirdPartyType, String thirdPartyId) {
        // 检查用户名重复
        if (StringUtils.hasText(username) && userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists: " + username);
        }
        // 检查邮箱重复
        if (StringUtils.hasText(email) && userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists: " + email);
        }
        // 检查第三方登录信息重复
        if (thirdPartyType != null && StringUtils.hasText(thirdPartyId) && userRepository.existsByThirdPartyTypeAndThirdPartyId(thirdPartyType, thirdPartyId)) {
            throw new IllegalArgumentException("Third party account already exists: " + thirdPartyType + ":" + thirdPartyId);
        }
    }


    /**
     * 用户统计信息类
     */
    public static class UserStatistics {
        private final long totalUsers;
        private final long bannedUsers;
        private final long activeUsersLastWeek;
        private final List<Object[]> platformStatistics;

        public UserStatistics(long totalUsers, long bannedUsers, long activeUsersLastWeek, List<Object[]> platformStatistics) {
            this.totalUsers = totalUsers;
            this.bannedUsers = bannedUsers;
            this.activeUsersLastWeek = activeUsersLastWeek;
            this.platformStatistics = platformStatistics;
        }

        // Getters
        public long getTotalUsers() {
            return totalUsers;
        }

        public long getBannedUsers() {
            return bannedUsers;
        }

        public long getActiveUsersLastWeek() {
            return activeUsersLastWeek;
        }

        public List<Object[]> getPlatformStatistics() {
            return platformStatistics;
        }
    }

    @java.lang.SuppressWarnings("all")
    public UserService(final UserRepository userRepository, final BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
}
