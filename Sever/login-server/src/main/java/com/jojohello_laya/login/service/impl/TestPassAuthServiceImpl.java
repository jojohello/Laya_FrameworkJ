package com.jojohello_laya.login.service.impl;

import com.jojohello_laya.login.model.ThirdPartyAuthRequest;
import com.jojohello_laya.login.model.ThirdPartyAuthResult;
import com.jojohello_laya.login.service.AbstractThirdPartyAuthService;
import com.jojohello_laya.login.service.ThirdPartyAuthService;
import org.springframework.stereotype.Service;

@Service
public class TestPassAuthServiceImpl extends AbstractThirdPartyAuthService {
    @Override
    public ThirdPartyAuthService.ThirdPartyType getType() {
        // 这里用 GUEST 类型作为测试类型（如需自定义可扩展枚举）
        return ThirdPartyAuthService.ThirdPartyType.GUEST;
    }

    @Override
    public ThirdPartyAuthResult authenticate(ThirdPartyAuthRequest request) {
        // 直接返回成功，生成一个测试sessionKey
        String sessionKey = "test_session_" + System.currentTimeMillis();
        return ThirdPartyAuthResult.success("test_user_123", "测试用户", sessionKey);
    }
}
