package com.jojohello_laya.login.model;

import com.jojohello_laya.login.service.ThirdPartyAuthService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 第三方验证请求模型
 * 
 * @author laya-game
 */
public class ThirdPartyAuthRequest {
    /**
     * 第三方类型
     */
    @NotNull(message = "第三方类型不能为空")
    private ThirdPartyAuthService.ThirdPartyType type;
    /**
     * 第三方授权码或Token
     */
    @NotBlank(message = "授权码不能为空")
    private String authCode;
    /**
     * 客户端IP地址
     */
    private String clientIp;
    /**
     * 设备信息
     */
    private String deviceInfo;
    /**
     * 平台信息 (android, ios, web, miniprogram)
     */
    private String platform;
    /**
     * 版本号
     */
    private String version;
    /**
     * 额外参数 (JSON格式)
     */
    private String extraParams;


    @java.lang.SuppressWarnings("all")
    public static class ThirdPartyAuthRequestBuilder {
        @java.lang.SuppressWarnings("all")
        private ThirdPartyAuthService.ThirdPartyType type;
        @java.lang.SuppressWarnings("all")
        private String authCode;
        @java.lang.SuppressWarnings("all")
        private String clientIp;
        @java.lang.SuppressWarnings("all")
        private String deviceInfo;
        @java.lang.SuppressWarnings("all")
        private String platform;
        @java.lang.SuppressWarnings("all")
        private String version;
        @java.lang.SuppressWarnings("all")
        private String extraParams;

        @java.lang.SuppressWarnings("all")
        ThirdPartyAuthRequestBuilder() {
        }

        /**
         * 第三方类型
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthRequest.ThirdPartyAuthRequestBuilder type(final ThirdPartyAuthService.ThirdPartyType type) {
            this.type = type;
            return this;
        }

        /**
         * 第三方授权码或Token
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthRequest.ThirdPartyAuthRequestBuilder authCode(final String authCode) {
            this.authCode = authCode;
            return this;
        }

        /**
         * 客户端IP地址
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthRequest.ThirdPartyAuthRequestBuilder clientIp(final String clientIp) {
            this.clientIp = clientIp;
            return this;
        }

        /**
         * 设备信息
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthRequest.ThirdPartyAuthRequestBuilder deviceInfo(final String deviceInfo) {
            this.deviceInfo = deviceInfo;
            return this;
        }

        /**
         * 平台信息 (android, ios, web, miniprogram)
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthRequest.ThirdPartyAuthRequestBuilder platform(final String platform) {
            this.platform = platform;
            return this;
        }

        /**
         * 版本号
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthRequest.ThirdPartyAuthRequestBuilder version(final String version) {
            this.version = version;
            return this;
        }

        /**
         * 额外参数 (JSON格式)
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthRequest.ThirdPartyAuthRequestBuilder extraParams(final String extraParams) {
            this.extraParams = extraParams;
            return this;
        }

        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthRequest build() {
            return new ThirdPartyAuthRequest(this.type, this.authCode, this.clientIp, this.deviceInfo, this.platform, this.version, this.extraParams);
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("all")
        public java.lang.String toString() {
            return "ThirdPartyAuthRequest.ThirdPartyAuthRequestBuilder(type=" + this.type + ", authCode=" + this.authCode + ", clientIp=" + this.clientIp + ", deviceInfo=" + this.deviceInfo + ", platform=" + this.platform + ", version=" + this.version + ", extraParams=" + this.extraParams + ")";
        }
    }

    @java.lang.SuppressWarnings("all")
    public static ThirdPartyAuthRequest.ThirdPartyAuthRequestBuilder builder() {
        return new ThirdPartyAuthRequest.ThirdPartyAuthRequestBuilder();
    }

    /**
     * 第三方类型
     */
    @java.lang.SuppressWarnings("all")
    public ThirdPartyAuthService.ThirdPartyType getType() {
        return this.type;
    }

    /**
     * 第三方授权码或Token
     */
    @java.lang.SuppressWarnings("all")
    public String getAuthCode() {
        return this.authCode;
    }

    /**
     * 客户端IP地址
     */
    @java.lang.SuppressWarnings("all")
    public String getClientIp() {
        return this.clientIp;
    }

    /**
     * 设备信息
     */
    @java.lang.SuppressWarnings("all")
    public String getDeviceInfo() {
        return this.deviceInfo;
    }

    /**
     * 平台信息 (android, ios, web, miniprogram)
     */
    @java.lang.SuppressWarnings("all")
    public String getPlatform() {
        return this.platform;
    }

    /**
     * 版本号
     */
    @java.lang.SuppressWarnings("all")
    public String getVersion() {
        return this.version;
    }

    /**
     * 额外参数 (JSON格式)
     */
    @java.lang.SuppressWarnings("all")
    public String getExtraParams() {
        return this.extraParams;
    }

    /**
     * 第三方类型
     */
    @java.lang.SuppressWarnings("all")
    public void setType(final ThirdPartyAuthService.ThirdPartyType type) {
        this.type = type;
    }

    /**
     * 第三方授权码或Token
     */
    @java.lang.SuppressWarnings("all")
    public void setAuthCode(final String authCode) {
        this.authCode = authCode;
    }

    /**
     * 客户端IP地址
     */
    @java.lang.SuppressWarnings("all")
    public void setClientIp(final String clientIp) {
        this.clientIp = clientIp;
    }

    /**
     * 设备信息
     */
    @java.lang.SuppressWarnings("all")
    public void setDeviceInfo(final String deviceInfo) {
        this.deviceInfo = deviceInfo;
    }

    /**
     * 平台信息 (android, ios, web, miniprogram)
     */
    @java.lang.SuppressWarnings("all")
    public void setPlatform(final String platform) {
        this.platform = platform;
    }

    /**
     * 版本号
     */
    @java.lang.SuppressWarnings("all")
    public void setVersion(final String version) {
        this.version = version;
    }

    /**
     * 额外参数 (JSON格式)
     */
    @java.lang.SuppressWarnings("all")
    public void setExtraParams(final String extraParams) {
        this.extraParams = extraParams;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public boolean equals(final java.lang.Object o) {
        if (o == this) return true;
        if (!(o instanceof ThirdPartyAuthRequest)) return false;
        final ThirdPartyAuthRequest other = (ThirdPartyAuthRequest) o;
        if (!other.canEqual((java.lang.Object) this)) return false;
        final java.lang.Object this$type = this.getType();
        final java.lang.Object other$type = other.getType();
        if (this$type == null ? other$type != null : !this$type.equals(other$type)) return false;
        final java.lang.Object this$authCode = this.getAuthCode();
        final java.lang.Object other$authCode = other.getAuthCode();
        if (this$authCode == null ? other$authCode != null : !this$authCode.equals(other$authCode)) return false;
        final java.lang.Object this$clientIp = this.getClientIp();
        final java.lang.Object other$clientIp = other.getClientIp();
        if (this$clientIp == null ? other$clientIp != null : !this$clientIp.equals(other$clientIp)) return false;
        final java.lang.Object this$deviceInfo = this.getDeviceInfo();
        final java.lang.Object other$deviceInfo = other.getDeviceInfo();
        if (this$deviceInfo == null ? other$deviceInfo != null : !this$deviceInfo.equals(other$deviceInfo)) return false;
        final java.lang.Object this$platform = this.getPlatform();
        final java.lang.Object other$platform = other.getPlatform();
        if (this$platform == null ? other$platform != null : !this$platform.equals(other$platform)) return false;
        final java.lang.Object this$version = this.getVersion();
        final java.lang.Object other$version = other.getVersion();
        if (this$version == null ? other$version != null : !this$version.equals(other$version)) return false;
        final java.lang.Object this$extraParams = this.getExtraParams();
        final java.lang.Object other$extraParams = other.getExtraParams();
        if (this$extraParams == null ? other$extraParams != null : !this$extraParams.equals(other$extraParams)) return false;
        return true;
    }

    @java.lang.SuppressWarnings("all")
    protected boolean canEqual(final java.lang.Object other) {
        return other instanceof ThirdPartyAuthRequest;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public int hashCode() {
        final int PRIME = 59;
        int result = 1;
        final java.lang.Object $type = this.getType();
        result = result * PRIME + ($type == null ? 43 : $type.hashCode());
        final java.lang.Object $authCode = this.getAuthCode();
        result = result * PRIME + ($authCode == null ? 43 : $authCode.hashCode());
        final java.lang.Object $clientIp = this.getClientIp();
        result = result * PRIME + ($clientIp == null ? 43 : $clientIp.hashCode());
        final java.lang.Object $deviceInfo = this.getDeviceInfo();
        result = result * PRIME + ($deviceInfo == null ? 43 : $deviceInfo.hashCode());
        final java.lang.Object $platform = this.getPlatform();
        result = result * PRIME + ($platform == null ? 43 : $platform.hashCode());
        final java.lang.Object $version = this.getVersion();
        result = result * PRIME + ($version == null ? 43 : $version.hashCode());
        final java.lang.Object $extraParams = this.getExtraParams();
        result = result * PRIME + ($extraParams == null ? 43 : $extraParams.hashCode());
        return result;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public java.lang.String toString() {
        return "ThirdPartyAuthRequest(type=" + this.getType() + ", authCode=" + this.getAuthCode() + ", clientIp=" + this.getClientIp() + ", deviceInfo=" + this.getDeviceInfo() + ", platform=" + this.getPlatform() + ", version=" + this.getVersion() + ", extraParams=" + this.getExtraParams() + ")";
    }

    @java.lang.SuppressWarnings("all")
    public ThirdPartyAuthRequest() {
    }

    @java.lang.SuppressWarnings("all")
    public ThirdPartyAuthRequest(final ThirdPartyAuthService.ThirdPartyType type, final String authCode, final String clientIp, final String deviceInfo, final String platform, final String version, final String extraParams) {
        this.type = type;
        this.authCode = authCode;
        this.clientIp = clientIp;
        this.deviceInfo = deviceInfo;
        this.platform = platform;
        this.version = version;
        this.extraParams = extraParams;
    }
}
