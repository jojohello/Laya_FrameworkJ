package com.jojohello_laya.login.service;

import com.jojohello_laya.login.entity.LoginRecord;
import com.jojohello_laya.login.entity.User;
import com.jojohello_laya.login.model.ThirdPartyAuthRequest;
import com.jojohello_laya.login.model.ThirdPartyAuthResult;
import com.jojohello_laya.login.protocol.payload.login.LoginPayloads.LoginRequest;
import com.jojohello_laya.login.protocol.payload.login.LoginPayloads.LoginResponse;
import com.jojohello_laya.login.repository.LoginRecordRepository;
import com.jojohello_laya.login.util.JwtUtil;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Coordinates platform authentication, account resolution and session creation. */
@Service
public class LoginService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(LoginService.class);

    private final List<ThirdPartyAuthService> thirdPartyAuthServices;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final LoginRecordRepository loginRecordRepository;
    private final CentralDataService centralDataService;

    public LoginService(List<ThirdPartyAuthService> thirdPartyAuthServices, JwtUtil jwtUtil,
            UserService userService, LoginRecordRepository loginRecordRepository,
            CentralDataService centralDataService) {
        this.thirdPartyAuthServices = thirdPartyAuthServices;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
        this.loginRecordRepository = loginRecordRepository;
        this.centralDataService = centralDataService;
    }

    public LoginResponse login(LoginRequest request, String clientIp) {
        String validationError = validateRequest(request);
        if (validationError != null) return failure("INVALID_REQUEST", validationError);

        try {
            ThirdPartyAuthService.ThirdPartyType authType = ThirdPartyAuthService.ThirdPartyType.valueOf(request.type());
            ThirdPartyAuthResult authResult = authenticateThirdParty(request, clientIp, authType);
            if (!authResult.isSuccess()) {
                return failure(authResult.getErrorCode(), authResult.getErrorMessage());
            }

            User user = userService.findOrCreateUser(
                    authResult.getThirdPartyUserId(), convertThirdPartyType(authType),
                    request.deviceInfo(), request.platform(), request.version(), null,
                    authResult.getNickname(), authResult.getAvatar());

            long loginTimestamp = System.currentTimeMillis();
            String token = jwtUtil.generateToken(user.getUserId(), loginTimestamp);
            if (!storeLoginRecord(user, token, loginTimestamp, request, clientIp)) {
                return failure("CENTRAL_SESSION_FAILED", "登录会话注册失败，请重试");
            }

            String gatewayWsUrl = resolveGatewayWsUrl(user.getUserId());
            if (!StringUtils.hasText(gatewayWsUrl)) {
                return failure("GATEWAY_ASSIGNMENT_FAILED", "暂时无法分配游戏网关，请重试");
            }

            log.info("登录成功: userId={}, platform={}", user.getUserId(), request.platform());
            return new LoginResponse(true, null, null, token, user.getUserId(), loginTimestamp,
                    user.getNickname(), user.getAvatar(), gatewayWsUrl);
        } catch (IllegalArgumentException e) {
            return failure("INVALID_REQUEST", "不支持的登录方式");
        } catch (Exception e) {
            log.error("登录处理异常", e);
            return failure("SYSTEM_ERROR", "系统异常");
        }
    }

    private ThirdPartyAuthResult authenticateThirdParty(LoginRequest request, String clientIp,
            ThirdPartyAuthService.ThirdPartyType authType) {
        ThirdPartyAuthService authService = thirdPartyAuthServices.stream()
                .filter(service -> service.getType() == authType)
                .findFirst()
                .orElse(null);
        if (authService == null || !authService.isEnabled()) {
            return ThirdPartyAuthResult.failure("LOGIN_METHOD_DISABLED", "该登录方式暂未启用");
        }

        ThirdPartyAuthRequest authRequest = new ThirdPartyAuthRequest(
                authType, request.authCode(), clientIp, request.deviceInfo(), request.platform(),
                request.version(), request.developerAccount(), request.profileEncryptedData(), request.profileIv());
        return authService.authenticate(authRequest);
    }

    private String validateRequest(LoginRequest request) {
        if (request == null) return "登录请求不能为空";
        if (!List.of("GUEST", "WECHAT").contains(request.type())) return "登录方式无效";
        if (!lengthBetween(request.authCode(), 1, 512)) return "授权码格式无效";
        if (!lengthBetween(request.platform(), 1, 32)) return "平台字段格式无效";
        if (!lengthBetween(request.deviceInfo(), 1, 512)) return "设备信息格式无效";
        if (!lengthBetween(request.version(), 1, 64)) return "版本字段格式无效";
        if (request.developerAccount() != null
                && !request.developerAccount().matches("^[a-zA-Z0-9_!@#$%^&*]{1,24}$")) {
            return "开发账号格式无效";
        }
        boolean hasEncryptedData = StringUtils.hasText(request.profileEncryptedData());
        boolean hasIv = StringUtils.hasText(request.profileIv());
        if (hasEncryptedData != hasIv) return "微信用户资料字段必须成对提供";
        if (hasEncryptedData && request.profileEncryptedData().length() > 16384) return "微信用户资料过长";
        if (hasIv && request.profileIv().length() > 256) return "微信用户资料 IV 过长";
        return null;
    }

    private boolean lengthBetween(String value, int min, int max) {
        return value != null && value.length() >= min && value.length() <= max;
    }

    private User.ThirdPartyType convertThirdPartyType(ThirdPartyAuthService.ThirdPartyType type) {
        return switch (type) {
            case GUEST -> User.ThirdPartyType.GUEST;
            case WECHAT -> User.ThirdPartyType.WECHAT;
            case QQ -> User.ThirdPartyType.QQ;
            case ALIPAY -> User.ThirdPartyType.ALIPAY;
            case DEVELOPER -> throw new IllegalArgumentException("开发登录不得作为独立第三方身份类型");
        };
    }

    private boolean storeLoginRecord(User user, String token, long loginTimestamp,
            LoginRequest request, String clientIp) {
        LoginRecord loginRecord = LoginRecord.builder()
                .userId(user.getUserId())
                .token(token)
                .loginTimestamp(loginTimestamp)
                .loginTime(LocalDateTime.now())
                .thirdPartyType(user.getThirdPartyType())
                .deviceId(request.deviceInfo())
                .clientIp(clientIp)
                .deviceInfo(request.deviceInfo())
                .platform(request.platform())
                .version(request.version())
                .isActive(true)
                .expireTime(LocalDateTime.now().plusHours(24))
                .build();
        loginRecordRepository.save(loginRecord);
        try {
            return centralDataService.storeLoginRecord(loginRecord);
        } catch (Exception e) {
            log.error("同步登录记录到 Central 失败: userId={}, error={}", user.getUserId(), e.getMessage());
            return false;
        }
    }

    private String resolveGatewayWsUrl(String userId) {
        try {
            Map<String, Object> gatewayInfo = centralDataService.getGatewayAssignment(userId);
            if (gatewayInfo == null || gatewayInfo.containsKey("error")) return null;
            Object rawData = gatewayInfo.get("data");
            if (!(rawData instanceof Map<?, ?> data)) return null;
            Object rawIp = data.get("gatewayIp");
            Object rawPort = data.get("gatewayPort");
            if (!(rawIp instanceof String ip) || !(rawPort instanceof Number port)) return null;
            return "ws://" + ip + ":" + port.intValue() + "/ws/native";
        } catch (Exception e) {
            log.error("Gateway 分配失败: userId={}, error={}", userId, e.getMessage());
            return null;
        }
    }

    private LoginResponse failure(String errorCode, String errorMessage) {
        return new LoginResponse(false, errorCode, errorMessage, null, null, null, null, null, null);
    }
}
