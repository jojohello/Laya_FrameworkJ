package com.jojohello_laya.login.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jojohello_laya.login.model.ThirdPartyAuthRequest;
import com.jojohello_laya.login.model.ThirdPartyAuthResult;
import com.jojohello_laya.login.service.ThirdPartyAuthService;
import com.jojohello_laya.login.service.WechatCode2SessionClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class WechatAuthServiceImplTest {
    private static final String APP_ID = "fixture-app-id";
    private static final byte[] KEY = "0123456789abcdef".getBytes(StandardCharsets.UTF_8);
    private static final byte[] IV = "abcdef0123456789".getBytes(StandardCharsets.UTF_8);

    private FakeCode2SessionClient code2SessionClient;
    private WechatAuthServiceImpl service;

    @BeforeEach
    void setUp() {
        code2SessionClient = new FakeCode2SessionClient(new ObjectMapper());
        service = new WechatAuthServiceImpl(code2SessionClient, new ObjectMapper());
        ReflectionTestUtils.setField(service, "enabled", true);
        ReflectionTestUtils.setField(service, "developerCodeEnabled", false);
        ReflectionTestUtils.setField(service, "appId", APP_ID);
        ReflectionTestUtils.setField(service, "appSecret", "fixture-secret");
    }

    @Test
    void authenticatesVerifiedWechatIdentityAndProfile() throws Exception {
        mockSession("fixture-openid", 0);
        String encrypted = encryptProfile(APP_ID, "fixture-openid", "微信玩家", "https://example.invalid/avatar.png");

        ThirdPartyAuthResult result = service.authenticate(request(encrypted));

        assertTrue(result.isSuccess());
        assertEquals("fixture-openid", result.getThirdPartyUserId());
        assertEquals("微信玩家", result.getNickname());
        assertEquals("https://example.invalid/avatar.png", result.getAvatar());
        assertNull(result.getSessionKey(), "session_key must not leave the WeChat adapter");
    }

    @Test
    void authenticatesWechatIdentityWithoutProfilePermission() {
        mockSession("fixture-openid", 0);

        ThirdPartyAuthResult result = service.authenticate(requestWithoutProfile());

        assertTrue(result.isSuccess());
        assertEquals("fixture-openid", result.getThirdPartyUserId());
        assertNull(result.getNickname());
        assertNull(result.getAvatar());
        assertNull(result.getSessionKey(), "session_key must not leave the WeChat adapter");
    }

    @Test
    void rejectsProfileFromAnotherApp() throws Exception {
        mockSession("fixture-openid", 0);
        String encrypted = encryptProfile("another-app", "fixture-openid", "微信玩家", "https://example.invalid/avatar.png");

        ThirdPartyAuthResult result = service.authenticate(request(encrypted));

        assertFalse(result.isSuccess());
        assertEquals("WECHAT_PROFILE_INVALID", result.getErrorCode());
    }

    @Test
    void rejectsProfileForAnotherOpenId() throws Exception {
        mockSession("fixture-openid", 0);
        String encrypted = encryptProfile(APP_ID, "another-openid", "微信玩家", "https://example.invalid/avatar.png");

        ThirdPartyAuthResult result = service.authenticate(request(encrypted));

        assertFalse(result.isSuccess());
        assertEquals("WECHAT_PROFILE_INVALID", result.getErrorCode());
    }

    @Test
    void mapsInvalidWechatCodeWithoutLeakingProviderMessage() throws Exception {
        mockSession("", 40029);

        ThirdPartyAuthResult result = service.authenticate(request("fixture-encrypted"));

        assertFalse(result.isSuccess());
        assertEquals("WECHAT_CODE_INVALID", result.getErrorCode());
        assertFalse(result.getErrorMessage().contains("provider-fixture-error"));
    }

    @Test
    void mapsInvalidWechatServerCredentialToConfigurationError() throws Exception {
        mockSession("", 40125);

        ThirdPartyAuthResult result = service.authenticate(requestWithoutProfile());

        assertFalse(result.isSuccess());
        assertEquals("WECHAT_CONFIG_MISSING", result.getErrorCode());
        assertTrue(result.getErrorMessage().contains("AppID"));
        assertFalse(result.getErrorMessage().contains("provider-fixture-error"));
    }

    @Test
    void rejectsMissingServerCredentialsBeforeNetworkCall() {
        ReflectionTestUtils.setField(service, "appSecret", "");

        ThirdPartyAuthResult result = service.authenticate(request("fixture-encrypted"));

        assertFalse(result.isSuccess());
        assertEquals("WECHAT_CONFIG_MISSING", result.getErrorCode());
        assertEquals(0, code2SessionClient.calls);
    }

    @Test
    void missingWechatCredentialsDoNotFailAdapterInitialization() {
        ReflectionTestUtils.setField(service, "appId", "");
        ReflectionTestUtils.setField(service, "appSecret", "");

        assertDoesNotThrow(service::initializeConfiguration);
    }

    @Test
    void springContextSelectsRuntimeConstructor() {
        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext()) {
            context.registerBean(ObjectMapper.class,
                    (java.util.function.Supplier<ObjectMapper>) ObjectMapper::new);
            context.registerBean(WechatCode2SessionClient.class,
                    () -> (appId, appSecret, code) -> new ObjectMapper().createObjectNode());
            context.register(WechatAuthServiceImpl.class);

            assertDoesNotThrow(context::refresh);
            assertNotNull(context.getBean(WechatAuthServiceImpl.class));
        }
    }

    @Test
    void developerCredentialRequiresExplicitServerSwitchAndAccount() {
        ReflectionTestUtils.setField(service, "developerCodeEnabled", true);
        ReflectionTestUtils.setField(service, "appId", "");
        ReflectionTestUtils.setField(service, "appSecret", "");
        ThirdPartyAuthRequest request = new ThirdPartyAuthRequest(
                ThirdPartyAuthService.ThirdPartyType.WECHAT, "test_wechat_code", "127.0.0.1",
                "fixture-device", "minigame", "1.0.0", "local_user", null, null);

        ThirdPartyAuthResult result = service.authenticate(request);

        assertTrue(result.isSuccess());
        assertEquals("developer_local_user", result.getThirdPartyUserId());
        assertEquals(0, code2SessionClient.calls);
    }

    private ThirdPartyAuthRequest request(String encryptedData) {
        return new ThirdPartyAuthRequest(
                ThirdPartyAuthService.ThirdPartyType.WECHAT, "fixture-code", "127.0.0.1",
                "fixture-device", "minigame", "1.0.0", null,
                encryptedData, Base64.getEncoder().encodeToString(IV));
    }

    private ThirdPartyAuthRequest requestWithoutProfile() {
        return new ThirdPartyAuthRequest(
                ThirdPartyAuthService.ThirdPartyType.WECHAT, "fixture-code", "127.0.0.1",
                "fixture-device", "minigame", "1.0.0", null, null, null);
    }

    private void mockSession(String openId, int errorCode) {
        String body = errorCode == 0
                ? "{\"openid\":\"" + openId + "\",\"session_key\":\""
                    + Base64.getEncoder().encodeToString(KEY) + "\"}"
                : "{\"errcode\":" + errorCode + ",\"errmsg\":\"provider-fixture-error\"}";
        code2SessionClient.responseBody = body;
    }

    private String encryptProfile(String watermarkAppId, String openId, String nickname, String avatar)
            throws Exception {
        String json = "{\"openId\":\"" + openId + "\",\"nickName\":\"" + nickname
                + "\",\"avatarUrl\":\"" + avatar + "\",\"watermark\":{\"appid\":\""
                + watermarkAppId + "\",\"timestamp\":1700000000}}";
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(KEY, "AES"), new IvParameterSpec(IV));
        return Base64.getEncoder().encodeToString(cipher.doFinal(json.getBytes(StandardCharsets.UTF_8)));
    }

    private static final class FakeCode2SessionClient implements WechatCode2SessionClient {
        private final ObjectMapper objectMapper;
        private String responseBody;
        private int calls;

        private FakeCode2SessionClient(ObjectMapper objectMapper) {
            this.objectMapper = objectMapper;
        }

        @Override
        public com.fasterxml.jackson.databind.JsonNode exchange(String appId, String appSecret, String code)
                throws Exception {
            calls++;
            return objectMapper.readTree(responseBody);
        }
    }
}
