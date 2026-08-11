package com.jojohello_laya.login.service.impl;

import com.jojohello_laya.login.model.ThirdPartyAuthRequest;
import com.jojohello_laya.login.model.ThirdPartyAuthResult;
import com.jojohello_laya.login.service.ThirdPartyAuthService;
import org.springframework.stereotype.Service;
import java.util.UUID;

/**
 * 游客登录服务实现
 * 
 * @author laya-game
 */
@Service
public class GuestAuthServiceImpl implements ThirdPartyAuthService {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GuestAuthServiceImpl.class);

    @Override
    public ThirdPartyType getType() {
        return ThirdPartyType.GUEST;
    }

    @Override
    public ThirdPartyAuthResult authenticate(ThirdPartyAuthRequest request) {
        try {
            // 检查是否是开发模式
            boolean isDeveloperMode = request.getAuthCode().startsWith("dev_");
            String guestUserId;
            String nickname;
            if (isDeveloperMode) {
                // 开发模式：验证时间戳，但用户标识不包含时间戳
                String fullDeveloperName = request.getAuthCode().substring(4); // 去掉"dev_"前缀
                int timestampSeparator = fullDeveloperName.lastIndexOf('_');
                if (timestampSeparator > 0 && timestampSeparator < fullDeveloperName.length() - 1) {
                    String developerName = fullDeveloperName.substring(0, timestampSeparator);
                    String timestamp = fullDeveloperName.substring(timestampSeparator + 1);
                    if (!developerName.matches("^[a-zA-Z0-9_!@#$%^&*]{1,24}$")) {
                        return ThirdPartyAuthResult.failure("INVALID_FORMAT", "开发账号格式无效");
                    }
                    // 验证时间戳（可以添加时间有效性检查）
                    try {
                        long timestampValue = Long.parseLong(timestamp);
                        long currentTime = System.currentTimeMillis();
                        // 时间戳应该在合理范围内（比如24小时内）
                        if (Math.abs(currentTime - timestampValue) > 24 * 60 * 60 * 1000) {
                            return ThirdPartyAuthResult.failure("INVALID_TIMESTAMP", "时间戳无效");
                        }
                    } catch (NumberFormatException e) {
                        return ThirdPartyAuthResult.failure("INVALID_TIMESTAMP", "时间戳格式无效");
                    }
                    // 用户标识只使用开发者名称和设备信息，不包含时间戳
                    String deviceInfo = request.getDeviceInfo();
                    String deviceHash = deviceInfo != null ? String.valueOf(deviceInfo.hashCode()) : "unknown";
                    guestUserId = "dev_" + developerName + "_" + deviceHash;
                    nickname = "开发者_" + developerName;
                } else {
                    return ThirdPartyAuthResult.failure("INVALID_FORMAT", "开发模式格式无效");
                }
            } else {
                // 普通游客模式：使用设备信息生成固定ID
                String deviceInfo = request.getDeviceInfo();
                String deviceHash = deviceInfo != null ? String.valueOf(deviceInfo.hashCode()) : "unknown";
                guestUserId = "guest_" + deviceHash;
                nickname = "游客_" + deviceHash.substring(0, Math.min(6, deviceHash.length()));
            }
            // 为游客登录生成sessionKey
            String sessionKey = "guest_session_" + System.currentTimeMillis() + "_" + guestUserId;
            return ThirdPartyAuthResult.success(guestUserId, nickname, sessionKey);
        } catch (Exception e) {
            log.error("游客登录异常", e);
            return ThirdPartyAuthResult.failure("SYSTEM_ERROR", "系统异常");
        }
    }

    @Override
    public boolean isEnabled() {
        return true; // 游客登录始终启用
    }
}
