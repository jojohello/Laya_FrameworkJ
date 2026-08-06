package com.jojohello_laya.login.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jojohello_laya.login.model.ThirdPartyAuthRequest;
import com.jojohello_laya.login.model.ThirdPartyAuthResult;
import com.jojohello_laya.login.service.ThirdPartyAuthService;
import com.jojohello_laya.login.service.WechatCode2SessionClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import jakarta.annotation.PostConstruct;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Base64;

/**
 * Verifies WeChat one-time login codes and, when supplied, decrypts profile data.
 * Profile data is presentation-only and never participates in authentication.
 * Raw codes, session keys and encrypted profile data must never cross this
 * adapter's logging boundary.
 */
@Service
public class WechatAuthServiceImpl implements ThirdPartyAuthService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(WechatAuthServiceImpl.class);
    private static final String DEVELOPER_CODE = "test_wechat_code";
    private static final String APP_ID_ENV = "WECHAT_APP_ID";
    private static final String APP_SECRET_ENV = "WECHAT_APP_SECRET";
    private static final String DEVELOPER_CODE_ENABLED_ENV = "WECHAT_DEVELOPER_CODE_ENABLED";

    private final WechatCode2SessionClient code2SessionClient;
    private final ObjectMapper objectMapper;

    @Value("${login.third-party.wechat.enabled:false}")
    private boolean enabled;

    private boolean developerCodeEnabled;

    private String appId = "";

    private String appSecret = "";

    public WechatAuthServiceImpl(WechatCode2SessionClient code2SessionClient, ObjectMapper objectMapper) {
        this.code2SessionClient = code2SessionClient;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void initializeConfiguration() {
        // Credentials deliberately bypass Spring's property-source precedence: command-line,
        // registry and config-file values must never become an alternate secret source.
        appId = readEnvironment(APP_ID_ENV);
        appSecret = readEnvironment(APP_SECRET_ENV);
        developerCodeEnabled = Boolean.parseBoolean(readEnvironment(DEVELOPER_CODE_ENABLED_ENV));
        if (enabled && !developerCodeEnabled
                && (!StringUtils.hasText(appId) || !StringUtils.hasText(appSecret))) {
            // Adapter availability is checked at the request boundary so a missing
            // WeChat secret cannot take unrelated login methods or the whole service down.
            log.warn("微信登录适配器缺少 WECHAT_APP_ID 或 WECHAT_APP_SECRET，真实微信请求将被拒绝");
        }
    }

    private String readEnvironment(String name) {
        String value = System.getenv(name);
        return value == null ? "" : value.trim();
    }

    @Override
    public ThirdPartyType getType() {
        return ThirdPartyType.WECHAT;
    }

    @Override
    public ThirdPartyAuthResult authenticate(ThirdPartyAuthRequest request) {
        if (developerCodeEnabled && DEVELOPER_CODE.equals(request.getAuthCode())) {
            return authenticateDeveloper(request);
        }
        if (!StringUtils.hasText(appId) || !StringUtils.hasText(appSecret)) {
            return ThirdPartyAuthResult.failure("WECHAT_CONFIG_MISSING", "微信登录服务尚未完成配置");
        }
        try {
            JsonNode session = code2SessionClient.exchange(appId, appSecret, request.getAuthCode());
            ThirdPartyAuthResult platformError = mapPlatformError(session);
            if (platformError != null) return platformError;

            String openId = text(session, "openid");
            String sessionKey = text(session, "session_key");
            if (!StringUtils.hasText(openId) || !StringUtils.hasText(sessionKey)) {
                log.warn("微信 code2Session 成功响应缺少身份字段");
                return ThirdPartyAuthResult.failure("WECHAT_UPSTREAM_ERROR", "微信登录服务响应异常，请重试");
            }

            ThirdPartyAuthResult.ThirdPartyAuthResultBuilder result = ThirdPartyAuthResult.builder()
                    .success(true)
                    .thirdPartyUserId(openId);
            if (StringUtils.hasText(request.getProfileEncryptedData())) {
                JsonNode profile = decryptProfile(request.getProfileEncryptedData(), request.getProfileIv(), sessionKey);
                ThirdPartyAuthResult profileError = validateProfile(profile, openId);
                if (profileError != null) return profileError;
                result.nickname(text(profile, "nickName"));
                result.avatar(text(profile, "avatarUrl"));
            }
            return result.build();
        } catch (RestClientException e) {
            log.warn("微信 code2Session 请求失败: {}", e.getClass().getSimpleName());
            return ThirdPartyAuthResult.failure("WECHAT_UPSTREAM_ERROR", "微信登录服务暂时不可用，请重试");
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            log.warn("微信用户资料解密失败: {}", e.getClass().getSimpleName());
            return ThirdPartyAuthResult.failure("WECHAT_PROFILE_INVALID", "微信用户资料校验失败，请重新授权");
        } catch (Exception e) {
            log.error("微信认证处理异常", e);
            return ThirdPartyAuthResult.failure("WECHAT_UPSTREAM_ERROR", "微信登录服务暂时不可用，请重试");
        }
    }

    private ThirdPartyAuthResult authenticateDeveloper(ThirdPartyAuthRequest request) {
        String account = request.getDeveloperAccount();
        if (!StringUtils.hasText(account) || !account.matches("^[a-zA-Z0-9_!@#$%^&*]{1,24}$")) {
            return ThirdPartyAuthResult.failure("INVALID_REQUEST", "开发账号格式无效");
        }
        return ThirdPartyAuthResult.builder()
                .success(true)
                .thirdPartyUserId("developer_" + account)
                .nickname("开发者_" + account)
                .avatar("developer-default-avatar")
                .build();
    }

    private ThirdPartyAuthResult mapPlatformError(JsonNode response) {
        int errorCode = response.path("errcode").asInt(0);
        if (errorCode != 0) {
            // Only the numeric provider code is safe to log. The raw response and
            // request URL may expose authentication material and must stay out of logs.
            log.warn("微信 code2Session 拒绝请求: errcode={}, category={}",
                    errorCode, platformErrorCategory(errorCode));
        }
        return switch (errorCode) {
            case 0 -> null;
            case 40013, 40125 -> ThirdPartyAuthResult.failure(
                    "WECHAT_CONFIG_MISSING", "微信登录服务配置无效，请检查 AppID 和 AppSecret");
            case 40029, 40163, 41008 -> ThirdPartyAuthResult.failure(
                    "WECHAT_CODE_INVALID", "微信登录凭据无效或已使用，请重试");
            case 40226 -> ThirdPartyAuthResult.failure("WECHAT_CODE_BLOCKED", "当前微信账号暂时无法登录");
            case 45011 -> ThirdPartyAuthResult.failure("WECHAT_RATE_LIMITED", "登录请求过于频繁，请稍后重试");
            default -> ThirdPartyAuthResult.failure("WECHAT_UPSTREAM_ERROR", "微信登录服务暂时不可用，请重试");
        };
    }

    private String platformErrorCategory(int errorCode) {
        return switch (errorCode) {
            case 40013, 40125 -> "server_config";
            case 40029, 40163, 41008 -> "client_code";
            case 40226 -> "account_blocked";
            case 45011 -> "rate_limited";
            default -> "upstream";
        };
    }

    private JsonNode decryptProfile(String encryptedData, String iv, String sessionKey)
            throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(sessionKey);
        byte[] ivBytes = Base64.getDecoder().decode(iv);
        byte[] encryptedBytes = Base64.getDecoder().decode(encryptedData);
        if (keyBytes.length != 16 || ivBytes.length != 16) {
            throw new GeneralSecurityException("invalid WeChat AES key or IV length");
        }

        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(keyBytes, "AES"), new IvParameterSpec(ivBytes));
        byte[] plaintext = cipher.doFinal(encryptedBytes);
        return objectMapper.readTree(new String(plaintext, StandardCharsets.UTF_8));
    }

    private ThirdPartyAuthResult validateProfile(JsonNode profile, String expectedOpenId) {
        String watermarkAppId = profile.path("watermark").path("appid").asText("");
        if (!appId.equals(watermarkAppId)) {
            return ThirdPartyAuthResult.failure("WECHAT_PROFILE_INVALID", "微信用户资料来源校验失败");
        }
        String profileOpenId = text(profile, "openId");
        if (StringUtils.hasText(profileOpenId) && !expectedOpenId.equals(profileOpenId)) {
            return ThirdPartyAuthResult.failure("WECHAT_PROFILE_INVALID", "微信用户身份校验失败");
        }
        String nickname = text(profile, "nickName");
        String avatar = text(profile, "avatarUrl");
        if (!StringUtils.hasText(nickname) || nickname.length() > 100
                || !StringUtils.hasText(avatar) || avatar.length() > 2048) {
            return ThirdPartyAuthResult.failure("WECHAT_PROFILE_INVALID", "微信昵称或头像资料无效");
        }
        return null;
    }

    private String text(JsonNode node, String field) {
        return node.path(field).asText("").trim();
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
