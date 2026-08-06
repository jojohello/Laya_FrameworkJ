package com.jojohello_laya.login.model;

import com.jojohello_laya.login.service.ThirdPartyAuthService;

/**
 * Internal authentication input. It is deliberately separate from the generated
 * HTTP payload so transport fields cannot silently become trusted identity.
 */
public record ThirdPartyAuthRequest(
        ThirdPartyAuthService.ThirdPartyType type,
        String authCode,
        String clientIp,
        String deviceInfo,
        String platform,
        String version,
        String developerAccount,
        String profileEncryptedData,
        String profileIv) {

    public ThirdPartyAuthService.ThirdPartyType getType() {
        return type;
    }

    public String getAuthCode() {
        return authCode;
    }

    public String getClientIp() {
        return clientIp;
    }

    public String getDeviceInfo() {
        return deviceInfo;
    }

    public String getPlatform() {
        return platform;
    }

    public String getVersion() {
        return version;
    }

    public String getDeveloperAccount() {
        return developerAccount;
    }

    public String getProfileEncryptedData() {
        return profileEncryptedData;
    }

    public String getProfileIv() {
        return profileIv;
    }
}
