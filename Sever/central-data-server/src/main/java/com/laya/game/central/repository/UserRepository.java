package com.laya.game.central.repository;

import com.laya.game.central.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.Set;
import java.util.ArrayList;

/**
 * 用户数据访问层
 * 
 * 提供用户相关的Redis操作
 * 
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@Repository
public class UserRepository {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String USER_KEY_PREFIX = "user:";
    private static final String USERNAME_KEY_PREFIX = "username:";
    private static final String EMAIL_KEY_PREFIX = "email:";
    private static final String PHONE_KEY_PREFIX = "phone:";
    private static final String THIRDPARTY_KEY_PREFIX = "thirdparty:";
    private static final String ALL_USERS_KEY = "all_users";
    private static final long DEFAULT_TIMEOUT = 7 * 24; // 7天

    /**
     * 保存用户
     */
    public User save(User user) {
        String userKey = USER_KEY_PREFIX + user.getId();
        String usernameKey = USERNAME_KEY_PREFIX + user.getUsername();
        String emailKey = EMAIL_KEY_PREFIX + user.getEmail();
        
        // 保存用户对象
        redisTemplate.opsForValue().set(userKey, user, DEFAULT_TIMEOUT, TimeUnit.HOURS);
        
        // 建立用户名到用户ID的映射
        redisTemplate.opsForValue().set(usernameKey, user.getId(), DEFAULT_TIMEOUT, TimeUnit.HOURS);
        
        // 建立邮箱到用户ID的映射
        if (user.getEmail() != null && !user.getEmail().isEmpty()) {
            redisTemplate.opsForValue().set(emailKey, user.getId(), DEFAULT_TIMEOUT, TimeUnit.HOURS);
        }
        
        // 建立手机号到用户ID的映射
        if (user.getPhone() != null && !user.getPhone().isEmpty()) {
            String phoneKey = PHONE_KEY_PREFIX + user.getPhone();
            redisTemplate.opsForValue().set(phoneKey, user.getId(), DEFAULT_TIMEOUT, TimeUnit.HOURS);
        }
        
        if (user.getThirdPartyType() != null && user.getThirdPartyId() != null) {
            String thirdPartyKey = THIRDPARTY_KEY_PREFIX + user.getThirdPartyType() + ":" + user.getThirdPartyId();
            redisTemplate.opsForValue().set(thirdPartyKey, user.getId(), DEFAULT_TIMEOUT, TimeUnit.HOURS);
        }
        
        // 添加到所有用户集合
        redisTemplate.opsForSet().add(ALL_USERS_KEY, user.getId());
        
        return user;
    }

    /**
     * 根据用户ID查找用户
     */
    public Optional<User> findById(Long id) {
        String userKey = USER_KEY_PREFIX + id;
        User user = (User) redisTemplate.opsForValue().get(userKey);
        return Optional.ofNullable(user);
    }

    /**
     * 根据用户名查找用户
     */
    public Optional<User> findByUsername(String username) {
        String usernameKey = USERNAME_KEY_PREFIX + username;
        Long userId = (Long) redisTemplate.opsForValue().get(usernameKey);
        
        if (userId == null) {
            return Optional.empty();
        }
        
        return findById(userId);
    }

    /**
     * 根据邮箱查找用户
     */
    public Optional<User> findByEmail(String email) {
        String emailKey = EMAIL_KEY_PREFIX + email;
        Long userId = (Long) redisTemplate.opsForValue().get(emailKey);
        
        if (userId == null) {
            return Optional.empty();
        }
        
        return findById(userId);
    }

    /**
     * 根据手机号查找用户
     */
    public Optional<User> findByPhone(String phone) {
        String phoneKey = PHONE_KEY_PREFIX + phone;
        Long userId = (Long) redisTemplate.opsForValue().get(phoneKey);
        
        if (userId == null) {
            return Optional.empty();
        }
        
        return findById(userId);
    }

    /**
     * 查找最近登录的用户
     */
    public List<User> findRecentlyLoggedInUsers(LocalDateTime since) {
        Set<Object> userIds = redisTemplate.opsForSet().members(ALL_USERS_KEY);
        
        if (userIds == null || userIds.isEmpty()) {
            return new ArrayList<>();
        }
        
        return userIds.stream()
                .map(userId -> findById((Long) userId))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .filter(user -> user.getLastLoginTime() != null && user.getLastLoginTime().isAfter(since))
                .collect(Collectors.toList());
    }

    /**
     * 查找指定状态的用户
     */
    public List<User> findByStatus(User.UserStatus status) {
        Set<Object> userIds = redisTemplate.opsForSet().members(ALL_USERS_KEY);
        
        if (userIds == null || userIds.isEmpty()) {
            return new ArrayList<>();
        }
        
        return userIds.stream()
                .map(userId -> findById((Long) userId))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .filter(user -> user.getStatus() == status)
                .collect(Collectors.toList());
    }

    /**
     * 检查用户名是否存在
     */
    public boolean existsByUsername(String username) {
        String usernameKey = USERNAME_KEY_PREFIX + username;
        return Boolean.TRUE.equals(redisTemplate.hasKey(usernameKey));
    }

    /**
     * 检查邮箱是否存在
     */
    public boolean existsByEmail(String email) {
        String emailKey = EMAIL_KEY_PREFIX + email;
        return Boolean.TRUE.equals(redisTemplate.hasKey(emailKey));
    }

    /**
     * 检查手机号是否存在
     */
    public boolean existsByPhone(String phone) {
        String phoneKey = PHONE_KEY_PREFIX + phone;
        return Boolean.TRUE.equals(redisTemplate.hasKey(phoneKey));
    }

    /**
     * 删除用户
     */
    public void delete(User user) {
        String userKey = USER_KEY_PREFIX + user.getId();
        String usernameKey = USERNAME_KEY_PREFIX + user.getUsername();
        String emailKey = EMAIL_KEY_PREFIX + user.getEmail();
        
        redisTemplate.delete(userKey);
        redisTemplate.delete(usernameKey);
        
        if (user.getEmail() != null && !user.getEmail().isEmpty()) {
            redisTemplate.delete(emailKey);
        }
        
        if (user.getPhone() != null && !user.getPhone().isEmpty()) {
            String phoneKey = PHONE_KEY_PREFIX + user.getPhone();
            redisTemplate.delete(phoneKey);
        }
        
        if (user.getThirdPartyType() != null && user.getThirdPartyId() != null) {
            String thirdPartyKey = THIRDPARTY_KEY_PREFIX + user.getThirdPartyType() + ":" + user.getThirdPartyId();
            redisTemplate.delete(thirdPartyKey);
        }
        
        redisTemplate.opsForSet().remove(ALL_USERS_KEY, user.getId());
    }

    /**
     * 根据用户ID删除
     */
    public void deleteById(Long id) {
        Optional<User> userOpt = findById(id);
        if (userOpt.isPresent()) {
            delete(userOpt.get());
        }
    }

    /**
     * 检查用户是否存在
     */
    public boolean existsById(Long id) {
        String userKey = USER_KEY_PREFIX + id;
        return Boolean.TRUE.equals(redisTemplate.hasKey(userKey));
    }

    /**
     * 统计用户总数
     */
    public long count() {
        Long size = redisTemplate.opsForSet().size(ALL_USERS_KEY);
        return size != null ? size : 0;
    }

    public Optional<User> findByThirdPartyTypeAndThirdPartyId(User.ThirdPartyType thirdPartyType, String thirdPartyId) {
        String thirdPartyKey = THIRDPARTY_KEY_PREFIX + thirdPartyType + ":" + thirdPartyId;
        Long userId = (Long) redisTemplate.opsForValue().get(thirdPartyKey);
        if (userId == null) {
            return Optional.empty();
        }
        return findById(userId);
    }

    public boolean existsByThirdPartyTypeAndThirdPartyId(User.ThirdPartyType thirdPartyType, String thirdPartyId) {
        String thirdPartyKey = THIRDPARTY_KEY_PREFIX + thirdPartyType + ":" + thirdPartyId;
        return Boolean.TRUE.equals(redisTemplate.hasKey(thirdPartyKey));
    }

    public List<User> findGuestAccountsToCleanup(User.ThirdPartyType thirdPartyType, LocalDateTime cutoffDate) {
        Set<Object> userIds = redisTemplate.opsForSet().members(ALL_USERS_KEY);
        if (userIds == null || userIds.isEmpty()) {
            return new ArrayList<>();
        }
        return userIds.stream()
                .map(userId -> findById((Long) userId))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .filter(user -> user.getThirdPartyType() == thirdPartyType &&
                        (user.getLastLoginTime() == null || user.getLastLoginTime().isBefore(cutoffDate)))
                .collect(Collectors.toList());
    }

    public void updateStatusBatch(List<Long> userIds, User.UserStatus status) {
        for (Long userId : userIds) {
            findById(userId).ifPresent(user -> {
                user.setStatus(status);
                save(user);
            });
        }
    }

    public long countByStatus(User.UserStatus status) {
        Set<Object> userIds = redisTemplate.opsForSet().members(ALL_USERS_KEY);
        if (userIds == null || userIds.isEmpty()) {
            return 0;
        }
        return userIds.stream()
                .map(userId -> findById((Long) userId))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .filter(user -> user.getStatus() == status)
                .count();
    }

    public List<User> findActiveUsers(LocalDateTime since, User.UserStatus status) {
        Set<Object> userIds = redisTemplate.opsForSet().members(ALL_USERS_KEY);
        if (userIds == null || userIds.isEmpty()) {
            return new ArrayList<>();
        }
        return userIds.stream()
                .map(userId -> findById((Long) userId))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .filter(user -> user.getStatus() == status && user.getLastLoginTime() != null && user.getLastLoginTime().isAfter(since))
                .collect(Collectors.toList());
    }

    public List<Object[]> countByThirdPartyTypeAndStatus(User.UserStatus status) {
        Set<Object> userIds = redisTemplate.opsForSet().members(ALL_USERS_KEY);
        if (userIds == null || userIds.isEmpty()) {
            return new ArrayList<>();
        }
        return userIds.stream()
                .map(userId -> findById((Long) userId))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .filter(user -> user.getStatus() == status && user.getThirdPartyType() != null)
                .collect(Collectors.groupingBy(User::getThirdPartyType, Collectors.counting()))
                .entrySet().stream()
                .map(entry -> new Object[]{entry.getKey(), entry.getValue()})
                .collect(Collectors.toList());
    }
}
