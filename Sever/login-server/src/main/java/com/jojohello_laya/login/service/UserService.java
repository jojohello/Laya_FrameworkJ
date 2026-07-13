package com.jojohello_laya.login.service;

import com.jojohello_laya.login.entity.User;
import com.jojohello_laya.login.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * 用户服务
 * 
 * @author laya-game
 */
@Service
public class UserService {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(UserService.class);
    private final UserRepository userRepository;

    /**
     * 根据第三方信息查找或创建用户
     */
    @Transactional
    public User findOrCreateUser(String thirdPartyUserId, User.ThirdPartyType thirdPartyType, String deviceInfo, String platform, String version, String extraParams) {
        // 先查找现有用户
        Optional<User> existingUser = userRepository.findByThirdPartyTypeAndThirdPartyUserId(thirdPartyType, thirdPartyUserId);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            LocalDateTime oldLoginTime = user.getLastLoginTime();
            LocalDateTime newLoginTime = LocalDateTime.now();
            // 更新最后登录时间
            user.setLastLoginTime(newLoginTime);
            user.setDeviceInfo(deviceInfo);
            user.setPlatform(platform);
            user.setVersion(version);
            user.setExtraParams(extraParams);
            User savedUser = userRepository.save(user);
            log.info("更新现有用户: userId={}, thirdPartyType={}, oldLoginTime={}, newLoginTime={}", savedUser.getUserId(), thirdPartyType, oldLoginTime, newLoginTime);
            return savedUser;
        }
        // 创建新用户
        String userId = generateUserId(thirdPartyType);
        User newUser = User.builder().userId(userId).thirdPartyType(thirdPartyType).thirdPartyUserId(thirdPartyUserId).nickname(generateNickname(thirdPartyType, thirdPartyUserId)).deviceInfo(deviceInfo).platform(platform).version(version).extraParams(extraParams).lastLoginTime(LocalDateTime.now()).enabled(true).build();
        User savedUser = userRepository.save(newUser);
        log.info("创建新用户: userId={}, thirdPartyType={}, thirdPartyUserId={}", savedUser.getUserId(), thirdPartyType, thirdPartyUserId);
        return savedUser;
    }

    /**
     * 根据用户ID查找用户
     */
    public Optional<User> findByUserId(String userId) {
        return userRepository.findByUserId(userId);
    }

    /**
     * 根据第三方信息查找用户
     */
    public Optional<User> findByThirdPartyInfo(User.ThirdPartyType thirdPartyType, String thirdPartyUserId) {
        return userRepository.findByThirdPartyTypeAndThirdPartyUserId(thirdPartyType, thirdPartyUserId);
    }

    /**
     * 更新用户信息
     */
    @Transactional
    public User updateUser(User user) {
        return userRepository.save(user);
    }

    /**
     * 生成用户ID
     */
    private String generateUserId(User.ThirdPartyType thirdPartyType) {
        String prefix = thirdPartyType.getCode();
        long timestamp = System.currentTimeMillis();
        return prefix + "_" + timestamp;
    }

    /**
     * 生成用户昵称
     */
    private String generateNickname(User.ThirdPartyType thirdPartyType, String thirdPartyUserId) {
        String prefix = thirdPartyType.getDescription();
        String suffix = thirdPartyUserId.length() > 6 ? thirdPartyUserId.substring(thirdPartyUserId.length() - 6) : thirdPartyUserId;
        return prefix + "_" + suffix;
    }

    /**
     * 检查用户是否存在
     */
    public boolean existsByUserId(String userId) {
        return userRepository.existsByUserId(userId);
    }

    /**
     * 统计用户数量
     */
    public long countUsers() {
        return userRepository.count();
    }

    /**
     * 统计指定类型的用户数量
     */
    public long countUsersByType(User.ThirdPartyType type) {
        return userRepository.countByThirdPartyType(type);
    }

    @java.lang.SuppressWarnings("all")
    public UserService(final UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}
