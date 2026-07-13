package com.jojohello_laya.login.service;

import com.jojohello_laya.login.entity.LoginRecord;
import com.jojohello_laya.login.entity.User;
import com.jojohello_laya.login.model.LoginRequest;
import com.jojohello_laya.login.model.LoginResponse;
import com.jojohello_laya.login.model.ThirdPartyAuthRequest;
import com.jojohello_laya.login.model.ThirdPartyAuthResult;
import com.jojohello_laya.login.repository.LoginRecordRepository;
import com.jojohello_laya.login.util.JwtUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 登录服务
 *
 * @author laya-game
 */
@Service
public class LoginService {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(LoginService.class);
    private final List<ThirdPartyAuthService> thirdPartyAuthServices;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final LoginRecordRepository loginRecordRepository;
    private final CentralDataService centralDataService;
    private final CentralWebSocketClient webSocketClient;

    /**
     * 处理登录请求
     *
     * @param request 登录请求
     * @return 登录响应
     */
    public LoginResponse login(LoginRequest request) {
        log.info("处理登录请求: {}", request);
        try {
            // 1. 第三方验证
            ThirdPartyAuthResult authResult = authenticateThirdParty(request);
            if (!authResult.isSuccess()) {
                return LoginResponse.failure(authResult.getErrorCode(), authResult.getErrorMessage());
            }
            // 2. 获取或创建用户
            User user = getOrCreateUser(authResult.getThirdPartyUserId(), request.getType(), request.getDeviceInfo(), request.getPlatform(), request.getVersion(), request.getExtraParams());
            // 3. 生成登录时间戳
            long loginTimestamp = System.currentTimeMillis();
            // 4. 生成JWT Token
            String token = jwtUtil.generateToken(user.getUserId(), loginTimestamp);
            // 5. 存储登录记录到数据库
            storeLoginRecord(user, token, loginTimestamp, request);
            // 6. 向中心服务器发送账号验证信息和获取网关分配
            Map<String, Object> gatewayInfo = handleCentralServerCommunication(user, token, authResult.getSessionKey());
            log.info("登录成功，userId: {}, loginTimestamp: {}", user.getUserId(), loginTimestamp);
            // 创建LoginResponse，包含网关信息
            LoginResponse response;
            if (gatewayInfo.containsKey("error")) {
                // 网关分配失败，但登录成功
                response = LoginResponse.success(token, user.getUserId(), loginTimestamp);
                log.warn("网关分配失败，返回不完整的登录信息: {}", gatewayInfo.get("error"));
            } else if (gatewayInfo.containsKey("data")) {
                // 从响应中提取网关信息
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) gatewayInfo.get("data");
                if (data != null && data.containsKey("gatewayIp") && data.containsKey("gatewayPort")) {
                    String gatewayIp = (String) data.get("gatewayIp");
                    Integer gatewayPort = (Integer) data.get("gatewayPort");
                    response = LoginResponse.success(token, user.getUserId(), loginTimestamp, gatewayIp, gatewayPort);
                    log.info("登录成功，包含网关信息: {}:{}", gatewayIp, gatewayPort);
                } else {
                    response = LoginResponse.success(token, user.getUserId(), loginTimestamp);
                    log.warn("网关分配响应格式异常，缺少gatewayIp或gatewayPort字段");
                }
            } else {
                response = LoginResponse.success(token, user.getUserId(), loginTimestamp);
                log.warn("网关分配响应格式异常，缺少data字段");
            }
            response.setNickname(user.getNickname());
            response.setAvatar(user.getAvatar());
            return response;
        } catch (Exception e) {
            log.error("登录处理异常", e);
            return LoginResponse.failure("SYSTEM_ERROR", "系统异常");
        }
    }

    /**
     * 第三方验证
     */
    private ThirdPartyAuthResult authenticateThirdParty(LoginRequest request) {
        // 查找对应的第三方验证服务
        ThirdPartyAuthService authService = thirdPartyAuthServices.stream().filter(service -> service.getType() == request.getType()).findFirst().orElseThrow(() -> new RuntimeException("不支持的第三方类型: " + request.getType()));
        // 检查服务是否启用
        if (!authService.isEnabled()) {
            return ThirdPartyAuthResult.failure("SERVICE_DISABLED", "该登录方式暂未启用");
        }
        // 构建验证请求
        ThirdPartyAuthRequest authRequest = ThirdPartyAuthRequest.builder().type(request.getType()).authCode(request.getAuthCode()).clientIp(request.getClientIp()).deviceInfo(request.getDeviceInfo()).platform(request.getPlatform()).version(request.getVersion()).extraParams(request.getExtraParams()).build();
        // 执行验证
        return authService.authenticate(authRequest);
    }

    /**
     * 获取或创建用户
     */
    @Transactional
    private User getOrCreateUser(String thirdPartyUserId, ThirdPartyAuthService.ThirdPartyType type, String deviceInfo, String platform, String version, String extraParams) {
        // 转换第三方类型
        User.ThirdPartyType userType = convertThirdPartyType(type);
        // 查找或创建用户
        return userService.findOrCreateUser(thirdPartyUserId, userType, deviceInfo, platform, version, extraParams);
    }

    /**
     * 转换第三方类型
     */
    private User.ThirdPartyType convertThirdPartyType(ThirdPartyAuthService.ThirdPartyType type) {
        switch (type) {
        case GUEST:
            return User.ThirdPartyType.GUEST;
        case WECHAT:
            return User.ThirdPartyType.WECHAT;
        case QQ:
            return User.ThirdPartyType.QQ;
        case ALIPAY:
            return User.ThirdPartyType.ALIPAY;
        default:
            throw new IllegalArgumentException("不支持的第三方类型: " + type);
        }
    }

    /**
     * 存储登录记录
     */
    @Transactional
    private void storeLoginRecord(User user, String token, long loginTimestamp, LoginRequest request) {
        LoginRecord loginRecord =  // 简化处理，实际应该提取设备ID
        // Token 24小时过期
        LoginRecord.builder().userId(user.getUserId()).token(token).loginTimestamp(loginTimestamp).loginTime(LocalDateTime.now()).thirdPartyType(user.getThirdPartyType()).deviceId(request.getDeviceInfo()).clientIp(request.getClientIp()).deviceInfo(request.getDeviceInfo()).platform(request.getPlatform()).version(request.getVersion()).isActive(true).expireTime(LocalDateTime.now().plusHours(24)).build();
        loginRecordRepository.save(loginRecord);
        log.info("存储登录记录: userId={}, loginTimestamp={}", user.getUserId(), loginTimestamp);
        // 同步到中心数据服务器
        try {
            boolean success = centralDataService.storeLoginRecord(loginRecord);
            if (success) {
                log.info("登录记录已同步到中心服务器: userId={}", user.getUserId());
            } else {
                log.warn("登录记录同步到中心服务器失败: userId={}", user.getUserId());
            }
        } catch (Exception e) {
            log.error("同步登录记录到中心服务器异常: userId={}, error={}", user.getUserId(), e.getMessage());
        }
    }

    /**
     * 处理中心服务器通信
     */
    private Map<String, Object> handleCentralServerCommunication(User user, String token, String sessionKey) {
        try {
            // 向中心服务器发送账号验证信息
            boolean authSuccess = centralDataService.sendAccountVerification(user.getUserId(), token, sessionKey != null ? sessionKey : "");
            if (authSuccess) {
                log.info("账号验证信息已发送到中心服务器: userId={}", user.getUserId());
            } else {
                log.warn("账号验证信息发送失败: userId={}", user.getUserId());
            }
            // 获取网关分配信息
            Map<String, Object> gatewayInfo = centralDataService.getGatewayAssignment(user.getUserId());
            log.info("网关分配信息: userId={}, gateway={}", user.getUserId(), gatewayInfo);
            return gatewayInfo;
        } catch (Exception e) {
            log.error("中心服务器通信异常: userId={}, error={}", user.getUserId(), e.getMessage());
            return Map.of("error", "中心服务器通信异常: " + e.getMessage());
        }
    }

    @java.lang.SuppressWarnings("all")
    public LoginService(final List<ThirdPartyAuthService> thirdPartyAuthServices, final JwtUtil jwtUtil, final UserService userService, final LoginRecordRepository loginRecordRepository, final CentralDataService centralDataService, final CentralWebSocketClient webSocketClient) {
        this.thirdPartyAuthServices = thirdPartyAuthServices;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
        this.loginRecordRepository = loginRecordRepository;
        this.centralDataService = centralDataService;
        this.webSocketClient = webSocketClient;
    }
}
