package com.jojohello_laya.login.protocol.payload.login;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.List;

/** Generated from Protocol/contracts/login/schema.json. Do not edit. */
public final class LoginPayloads {
    private LoginPayloads() {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record LoginRequest(String type, String authCode, String platform, String deviceInfo, String version, String developerAccount, String profileEncryptedData, String profileIv) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record LoginResponse(boolean success, String errorCode, String errorMessage, String token, String userId, Long loginTimestamp, String nickname, String avatar, String gatewayWsUrl) {}

}
