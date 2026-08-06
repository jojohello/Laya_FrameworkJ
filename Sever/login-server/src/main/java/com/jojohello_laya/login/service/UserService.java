package com.jojohello_laya.login.service;

import com.jojohello_laya.login.entity.User;
import com.jojohello_laya.login.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

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
    private final TransactionTemplate transactionTemplate;

    /**
     * 根据第三方信息查找或创建用户
     */
    public User findOrCreateUser(String thirdPartyUserId, User.ThirdPartyType thirdPartyType, String deviceInfo, String platform, String version, String extraParams) {
        return findOrCreateUser(thirdPartyUserId, thirdPartyType, deviceInfo, platform, version, extraParams, null, null);
    }

    /**
     * Resolves a platform identity and refreshes only provider-verified profile
     * fields. Nickname and avatar never participate in account ownership.
     */
    public User findOrCreateUser(String thirdPartyUserId, User.ThirdPartyType thirdPartyType,
            String deviceInfo, String platform, String version, String extraParams,
            String verifiedNickname, String verifiedAvatar) {
        User existing = transactionTemplate.execute(status -> updateExistingUser(thirdPartyUserId,
                thirdPartyType, deviceInfo, platform, version, extraParams,
                verifiedNickname, verifiedAvatar).orElse(null));
        if (existing != null) return existing;

        try {
            // Creation has its own transaction so a unique-key conflict can roll back
            // before the winning account is read. Catching a flush failure inside the
            // same transaction would leave that transaction rollback-only.
            return transactionTemplate.execute(status -> createUser(thirdPartyUserId,
                    thirdPartyType, deviceInfo, platform, version, extraParams,
                    verifiedNickname, verifiedAvatar));
        } catch (DataIntegrityViolationException duplicateIdentity) {
            User winner = transactionTemplate.execute(status -> updateExistingUser(thirdPartyUserId,
                    thirdPartyType, deviceInfo, platform, version, extraParams,
                    verifiedNickname, verifiedAvatar).orElse(null));
            if (winner != null) {
                log.info("并发账号创建命中既有身份: userId={}, thirdPartyType={}",
                        winner.getUserId(), thirdPartyType);
                return winner;
            }
            throw duplicateIdentity;
        }
    }

    private Optional<User> updateExistingUser(String thirdPartyUserId, User.ThirdPartyType thirdPartyType,
            String deviceInfo, String platform, String version, String extraParams,
            String verifiedNickname, String verifiedAvatar) {
        Optional<User> existingUser = userRepository
                .findByThirdPartyTypeAndThirdPartyUserId(thirdPartyType, thirdPartyUserId);
        if (existingUser.isEmpty()) return Optional.empty();

        User user = existingUser.get();
        LocalDateTime newLoginTime = LocalDateTime.now();
        user.setLastLoginTime(newLoginTime);
        user.setDeviceInfo(deviceInfo);
        user.setPlatform(platform);
        user.setVersion(version);
        user.setExtraParams(extraParams);
        // A successful LoginResponse requires both profile fields to be non-empty.
        // Repair legacy rows here so existing accounts obey the same contract as new ones.
        if (StringUtils.hasText(verifiedNickname)) {
            user.setNickname(verifiedNickname);
        } else if (!StringUtils.hasText(user.getNickname())) {
            user.setNickname(generateNickname(thirdPartyType, thirdPartyUserId));
        }
        if (StringUtils.hasText(verifiedAvatar)) {
            user.setAvatar(verifiedAvatar);
        } else if (!StringUtils.hasText(user.getAvatar())) {
            user.setAvatar("default-avatar");
        }
        return Optional.of(userRepository.save(user));
    }

    private User createUser(String thirdPartyUserId, User.ThirdPartyType thirdPartyType,
            String deviceInfo, String platform, String version, String extraParams,
            String verifiedNickname, String verifiedAvatar) {
        String userId = generateUserId(thirdPartyType);
        String nickname = StringUtils.hasText(verifiedNickname)
                ? verifiedNickname : generateNickname(thirdPartyType, thirdPartyUserId);
        String avatar = StringUtils.hasText(verifiedAvatar) ? verifiedAvatar : "default-avatar";
        User newUser = User.builder().userId(userId).thirdPartyType(thirdPartyType)
                .thirdPartyUserId(thirdPartyUserId).nickname(nickname).avatar(avatar)
                .deviceInfo(deviceInfo).platform(platform).version(version).extraParams(extraParams)
                .lastLoginTime(LocalDateTime.now()).enabled(true).build();
        User savedUser = userRepository.saveAndFlush(newUser);
        log.info("创建新用户: userId={}, thirdPartyType={}", savedUser.getUserId(), thirdPartyType);
        return savedUser;
    }

    /**
     * 生成用户ID
     */
    private String generateUserId(User.ThirdPartyType thirdPartyType) {
        String prefix = thirdPartyType.getCode();
        return prefix + "_" + UUID.randomUUID().toString().replace("-", "");
    }

    /**
     * 生成用户昵称
     */
    private String generateNickname(User.ThirdPartyType thirdPartyType, String thirdPartyUserId) {
        String prefix = thirdPartyType.getDescription();
        String suffix = thirdPartyUserId.length() > 6 ? thirdPartyUserId.substring(thirdPartyUserId.length() - 6) : thirdPartyUserId;
        return prefix + "_" + suffix;
    }

    @java.lang.SuppressWarnings("all")
    public UserService(final UserRepository userRepository, final TransactionTemplate transactionTemplate) {
        this.userRepository = userRepository;
        this.transactionTemplate = transactionTemplate;
    }
}
