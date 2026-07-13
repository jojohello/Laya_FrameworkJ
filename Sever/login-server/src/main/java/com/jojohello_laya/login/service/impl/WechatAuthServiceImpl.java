package com.jojohello_laya.login.service.impl;

import com.jojohello_laya.login.model.ThirdPartyAuthRequest;
import com.jojohello_laya.login.model.ThirdPartyAuthResult;
import com.jojohello_laya.login.service.ThirdPartyAuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * 微信验证服务实现
 * 目前为模拟实现，后续可接入真实微信API
 * 
 * @author laya-game
 */
@Service
public class WechatAuthServiceImpl implements ThirdPartyAuthService {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(WechatAuthServiceImpl.class);
    @Value("${login.third-party.wechat.enabled:false}")
    private boolean enabled;
    @Value("${login.third-party.wechat.app-id:}")
    private String appId;
    @Value("${login.third-party.wechat.app-secret:}")
    private String appSecret;

    @Override
    public ThirdPartyType getType() {
        return ThirdPartyType.WECHAT;
    }

    @Override
    public ThirdPartyAuthResult authenticate(ThirdPartyAuthRequest request) {
        log.info("微信验证开始，authCode: {}, clientIp: {}", request.getAuthCode(), request.getClientIp());
        // TODO: 接入真实微信API验证
        // 目前为模拟验证，直接返回成功
        try {
            // 模拟网络延迟
            Thread.sleep(100);
            // 模拟验证逻辑
            if ("test_wechat_code".equals(request.getAuthCode())) {
                String sessionKey = "wechat_session_" + System.currentTimeMillis();
                return ThirdPartyAuthResult.success("wx_user_123456", "微信用户_" + System.currentTimeMillis() % 1000, sessionKey);
            } else {
                return ThirdPartyAuthResult.failure("INVALID_CODE", "无效的微信授权码");
            }
        } catch (Exception e) {
            log.error("微信验证异常", e);
            return ThirdPartyAuthResult.failure("SYSTEM_ERROR", "系统异常");
        }
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
