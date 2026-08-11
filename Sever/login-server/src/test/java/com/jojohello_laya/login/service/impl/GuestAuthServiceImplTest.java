package com.jojohello_laya.login.service.impl;

import com.jojohello_laya.login.model.ThirdPartyAuthRequest;
import com.jojohello_laya.login.model.ThirdPartyAuthResult;
import com.jojohello_laya.login.service.ThirdPartyAuthService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GuestAuthServiceImplTest {
    private final GuestAuthServiceImpl service = new GuestAuthServiceImpl();

    @Test
    void acceptsMiniGameDeveloperAccountWithoutWechatCredentialSwitch() {
        ThirdPartyAuthResult result = service.authenticate(request(
                "dev_local_user_" + System.currentTimeMillis()));

        assertTrue(result.isSuccess());
        assertTrue(result.getThirdPartyUserId().startsWith("dev_local_user_"));
        assertEquals("开发者_local_user", result.getNickname());
    }

    @Test
    void rejectsExpiredDeveloperCredential() {
        ThirdPartyAuthResult result = service.authenticate(request("dev_local_user_1"));

        assertFalse(result.isSuccess());
        assertEquals("INVALID_TIMESTAMP", result.getErrorCode());
    }

    @Test
    void rejectsMalformedDeveloperAccount() {
        ThirdPartyAuthResult result = service.authenticate(request(
                "dev_invalid-account_" + System.currentTimeMillis()));

        assertFalse(result.isSuccess());
        assertEquals("INVALID_FORMAT", result.getErrorCode());
    }

    private ThirdPartyAuthRequest request(String authCode) {
        return new ThirdPartyAuthRequest(
                ThirdPartyAuthService.ThirdPartyType.GUEST,
                authCode,
                "127.0.0.1",
                "fixture-device",
                "minigame",
                "1.0.0",
                null,
                null,
                null);
    }
}
