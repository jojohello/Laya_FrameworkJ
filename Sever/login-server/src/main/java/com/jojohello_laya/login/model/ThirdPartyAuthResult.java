package com.jojohello_laya.login.model;

/**
 * 第三方验证结果模型
 * 
 * @author laya-game
 */
public class ThirdPartyAuthResult {
    /**
     * 验证是否成功
     */
    private boolean success;
    /**
     * 错误码
     */
    private String errorCode;
    /**
     * 错误信息
     */
    private String errorMessage;
    /**
     * 第三方用户ID
     */
    private String thirdPartyUserId;
    /**
     * 第三方用户昵称
     */
    private String nickname;
    /**
     * 第三方用户头像
     */
    private String avatar;
    /**
     * 第三方用户性别 (0:未知, 1:男, 2:女)
     */
    private Integer gender;
    /**
     * 第三方用户地区
     */
    private String region;
    /**
     * 第三方用户语言
     */
    private String language;
    /**
     * 额外信息 (JSON格式)
     */
    private String extraInfo;
    /**
     * 会话密钥
     */
    private String sessionKey;

    /**
     * 创建成功结果
     */
    public static ThirdPartyAuthResult success(String thirdPartyUserId, String nickname) {
        return ThirdPartyAuthResult.builder().success(true).thirdPartyUserId(thirdPartyUserId).nickname(nickname).build();
    }

    /**
     * 创建成功结果（带sessionKey）
     */
    public static ThirdPartyAuthResult success(String thirdPartyUserId, String nickname, String sessionKey) {
        return ThirdPartyAuthResult.builder().success(true).thirdPartyUserId(thirdPartyUserId).nickname(nickname).sessionKey(sessionKey).build();
    }

    /**
     * 创建失败结果
     */
    public static ThirdPartyAuthResult failure(String errorCode, String errorMessage) {
        return ThirdPartyAuthResult.builder().success(false).errorCode(errorCode).errorMessage(errorMessage).build();
    }


    @java.lang.SuppressWarnings("all")
    public static class ThirdPartyAuthResultBuilder {
        @java.lang.SuppressWarnings("all")
        private boolean success;
        @java.lang.SuppressWarnings("all")
        private String errorCode;
        @java.lang.SuppressWarnings("all")
        private String errorMessage;
        @java.lang.SuppressWarnings("all")
        private String thirdPartyUserId;
        @java.lang.SuppressWarnings("all")
        private String nickname;
        @java.lang.SuppressWarnings("all")
        private String avatar;
        @java.lang.SuppressWarnings("all")
        private Integer gender;
        @java.lang.SuppressWarnings("all")
        private String region;
        @java.lang.SuppressWarnings("all")
        private String language;
        @java.lang.SuppressWarnings("all")
        private String extraInfo;
        @java.lang.SuppressWarnings("all")
        private String sessionKey;

        @java.lang.SuppressWarnings("all")
        ThirdPartyAuthResultBuilder() {
        }

        /**
         * 验证是否成功
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthResult.ThirdPartyAuthResultBuilder success(final boolean success) {
            this.success = success;
            return this;
        }

        /**
         * 错误码
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthResult.ThirdPartyAuthResultBuilder errorCode(final String errorCode) {
            this.errorCode = errorCode;
            return this;
        }

        /**
         * 错误信息
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthResult.ThirdPartyAuthResultBuilder errorMessage(final String errorMessage) {
            this.errorMessage = errorMessage;
            return this;
        }

        /**
         * 第三方用户ID
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthResult.ThirdPartyAuthResultBuilder thirdPartyUserId(final String thirdPartyUserId) {
            this.thirdPartyUserId = thirdPartyUserId;
            return this;
        }

        /**
         * 第三方用户昵称
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthResult.ThirdPartyAuthResultBuilder nickname(final String nickname) {
            this.nickname = nickname;
            return this;
        }

        /**
         * 第三方用户头像
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthResult.ThirdPartyAuthResultBuilder avatar(final String avatar) {
            this.avatar = avatar;
            return this;
        }

        /**
         * 第三方用户性别 (0:未知, 1:男, 2:女)
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthResult.ThirdPartyAuthResultBuilder gender(final Integer gender) {
            this.gender = gender;
            return this;
        }

        /**
         * 第三方用户地区
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthResult.ThirdPartyAuthResultBuilder region(final String region) {
            this.region = region;
            return this;
        }

        /**
         * 第三方用户语言
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthResult.ThirdPartyAuthResultBuilder language(final String language) {
            this.language = language;
            return this;
        }

        /**
         * 额外信息 (JSON格式)
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthResult.ThirdPartyAuthResultBuilder extraInfo(final String extraInfo) {
            this.extraInfo = extraInfo;
            return this;
        }

        /**
         * 会话密钥
         * @return {@code this}.
         */
        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthResult.ThirdPartyAuthResultBuilder sessionKey(final String sessionKey) {
            this.sessionKey = sessionKey;
            return this;
        }

        @java.lang.SuppressWarnings("all")
        public ThirdPartyAuthResult build() {
            return new ThirdPartyAuthResult(this.success, this.errorCode, this.errorMessage, this.thirdPartyUserId, this.nickname, this.avatar, this.gender, this.region, this.language, this.extraInfo, this.sessionKey);
        }

        @java.lang.Override
        @java.lang.SuppressWarnings("all")
        public java.lang.String toString() {
            return "ThirdPartyAuthResult.ThirdPartyAuthResultBuilder(success=" + this.success + ", errorCode=" + this.errorCode + ", errorMessage=" + this.errorMessage + ", thirdPartyUserId=" + this.thirdPartyUserId + ", nickname=" + this.nickname + ", avatar=" + this.avatar + ", gender=" + this.gender + ", region=" + this.region + ", language=" + this.language + ", extraInfo=" + this.extraInfo + ", sessionKey=" + this.sessionKey + ")";
        }
    }

    @java.lang.SuppressWarnings("all")
    public static ThirdPartyAuthResult.ThirdPartyAuthResultBuilder builder() {
        return new ThirdPartyAuthResult.ThirdPartyAuthResultBuilder();
    }

    /**
     * 验证是否成功
     */
    @java.lang.SuppressWarnings("all")
    public boolean isSuccess() {
        return this.success;
    }

    /**
     * 错误码
     */
    @java.lang.SuppressWarnings("all")
    public String getErrorCode() {
        return this.errorCode;
    }

    /**
     * 错误信息
     */
    @java.lang.SuppressWarnings("all")
    public String getErrorMessage() {
        return this.errorMessage;
    }

    /**
     * 第三方用户ID
     */
    @java.lang.SuppressWarnings("all")
    public String getThirdPartyUserId() {
        return this.thirdPartyUserId;
    }

    /**
     * 第三方用户昵称
     */
    @java.lang.SuppressWarnings("all")
    public String getNickname() {
        return this.nickname;
    }

    /**
     * 第三方用户头像
     */
    @java.lang.SuppressWarnings("all")
    public String getAvatar() {
        return this.avatar;
    }

    /**
     * 第三方用户性别 (0:未知, 1:男, 2:女)
     */
    @java.lang.SuppressWarnings("all")
    public Integer getGender() {
        return this.gender;
    }

    /**
     * 第三方用户地区
     */
    @java.lang.SuppressWarnings("all")
    public String getRegion() {
        return this.region;
    }

    /**
     * 第三方用户语言
     */
    @java.lang.SuppressWarnings("all")
    public String getLanguage() {
        return this.language;
    }

    /**
     * 额外信息 (JSON格式)
     */
    @java.lang.SuppressWarnings("all")
    public String getExtraInfo() {
        return this.extraInfo;
    }

    /**
     * 会话密钥
     */
    @java.lang.SuppressWarnings("all")
    public String getSessionKey() {
        return this.sessionKey;
    }

    /**
     * 验证是否成功
     */
    @java.lang.SuppressWarnings("all")
    public void setSuccess(final boolean success) {
        this.success = success;
    }

    /**
     * 错误码
     */
    @java.lang.SuppressWarnings("all")
    public void setErrorCode(final String errorCode) {
        this.errorCode = errorCode;
    }

    /**
     * 错误信息
     */
    @java.lang.SuppressWarnings("all")
    public void setErrorMessage(final String errorMessage) {
        this.errorMessage = errorMessage;
    }

    /**
     * 第三方用户ID
     */
    @java.lang.SuppressWarnings("all")
    public void setThirdPartyUserId(final String thirdPartyUserId) {
        this.thirdPartyUserId = thirdPartyUserId;
    }

    /**
     * 第三方用户昵称
     */
    @java.lang.SuppressWarnings("all")
    public void setNickname(final String nickname) {
        this.nickname = nickname;
    }

    /**
     * 第三方用户头像
     */
    @java.lang.SuppressWarnings("all")
    public void setAvatar(final String avatar) {
        this.avatar = avatar;
    }

    /**
     * 第三方用户性别 (0:未知, 1:男, 2:女)
     */
    @java.lang.SuppressWarnings("all")
    public void setGender(final Integer gender) {
        this.gender = gender;
    }

    /**
     * 第三方用户地区
     */
    @java.lang.SuppressWarnings("all")
    public void setRegion(final String region) {
        this.region = region;
    }

    /**
     * 第三方用户语言
     */
    @java.lang.SuppressWarnings("all")
    public void setLanguage(final String language) {
        this.language = language;
    }

    /**
     * 额外信息 (JSON格式)
     */
    @java.lang.SuppressWarnings("all")
    public void setExtraInfo(final String extraInfo) {
        this.extraInfo = extraInfo;
    }

    /**
     * 会话密钥
     */
    @java.lang.SuppressWarnings("all")
    public void setSessionKey(final String sessionKey) {
        this.sessionKey = sessionKey;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public boolean equals(final java.lang.Object o) {
        if (o == this) return true;
        if (!(o instanceof ThirdPartyAuthResult)) return false;
        final ThirdPartyAuthResult other = (ThirdPartyAuthResult) o;
        if (!other.canEqual((java.lang.Object) this)) return false;
        if (this.isSuccess() != other.isSuccess()) return false;
        final java.lang.Object this$gender = this.getGender();
        final java.lang.Object other$gender = other.getGender();
        if (this$gender == null ? other$gender != null : !this$gender.equals(other$gender)) return false;
        final java.lang.Object this$errorCode = this.getErrorCode();
        final java.lang.Object other$errorCode = other.getErrorCode();
        if (this$errorCode == null ? other$errorCode != null : !this$errorCode.equals(other$errorCode)) return false;
        final java.lang.Object this$errorMessage = this.getErrorMessage();
        final java.lang.Object other$errorMessage = other.getErrorMessage();
        if (this$errorMessage == null ? other$errorMessage != null : !this$errorMessage.equals(other$errorMessage)) return false;
        final java.lang.Object this$thirdPartyUserId = this.getThirdPartyUserId();
        final java.lang.Object other$thirdPartyUserId = other.getThirdPartyUserId();
        if (this$thirdPartyUserId == null ? other$thirdPartyUserId != null : !this$thirdPartyUserId.equals(other$thirdPartyUserId)) return false;
        final java.lang.Object this$nickname = this.getNickname();
        final java.lang.Object other$nickname = other.getNickname();
        if (this$nickname == null ? other$nickname != null : !this$nickname.equals(other$nickname)) return false;
        final java.lang.Object this$avatar = this.getAvatar();
        final java.lang.Object other$avatar = other.getAvatar();
        if (this$avatar == null ? other$avatar != null : !this$avatar.equals(other$avatar)) return false;
        final java.lang.Object this$region = this.getRegion();
        final java.lang.Object other$region = other.getRegion();
        if (this$region == null ? other$region != null : !this$region.equals(other$region)) return false;
        final java.lang.Object this$language = this.getLanguage();
        final java.lang.Object other$language = other.getLanguage();
        if (this$language == null ? other$language != null : !this$language.equals(other$language)) return false;
        final java.lang.Object this$extraInfo = this.getExtraInfo();
        final java.lang.Object other$extraInfo = other.getExtraInfo();
        if (this$extraInfo == null ? other$extraInfo != null : !this$extraInfo.equals(other$extraInfo)) return false;
        final java.lang.Object this$sessionKey = this.getSessionKey();
        final java.lang.Object other$sessionKey = other.getSessionKey();
        if (this$sessionKey == null ? other$sessionKey != null : !this$sessionKey.equals(other$sessionKey)) return false;
        return true;
    }

    @java.lang.SuppressWarnings("all")
    protected boolean canEqual(final java.lang.Object other) {
        return other instanceof ThirdPartyAuthResult;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public int hashCode() {
        final int PRIME = 59;
        int result = 1;
        result = result * PRIME + (this.isSuccess() ? 79 : 97);
        final java.lang.Object $gender = this.getGender();
        result = result * PRIME + ($gender == null ? 43 : $gender.hashCode());
        final java.lang.Object $errorCode = this.getErrorCode();
        result = result * PRIME + ($errorCode == null ? 43 : $errorCode.hashCode());
        final java.lang.Object $errorMessage = this.getErrorMessage();
        result = result * PRIME + ($errorMessage == null ? 43 : $errorMessage.hashCode());
        final java.lang.Object $thirdPartyUserId = this.getThirdPartyUserId();
        result = result * PRIME + ($thirdPartyUserId == null ? 43 : $thirdPartyUserId.hashCode());
        final java.lang.Object $nickname = this.getNickname();
        result = result * PRIME + ($nickname == null ? 43 : $nickname.hashCode());
        final java.lang.Object $avatar = this.getAvatar();
        result = result * PRIME + ($avatar == null ? 43 : $avatar.hashCode());
        final java.lang.Object $region = this.getRegion();
        result = result * PRIME + ($region == null ? 43 : $region.hashCode());
        final java.lang.Object $language = this.getLanguage();
        result = result * PRIME + ($language == null ? 43 : $language.hashCode());
        final java.lang.Object $extraInfo = this.getExtraInfo();
        result = result * PRIME + ($extraInfo == null ? 43 : $extraInfo.hashCode());
        final java.lang.Object $sessionKey = this.getSessionKey();
        result = result * PRIME + ($sessionKey == null ? 43 : $sessionKey.hashCode());
        return result;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public java.lang.String toString() {
        return "ThirdPartyAuthResult(success=" + this.isSuccess() + ", errorCode=" + this.getErrorCode() + ", errorMessage=" + this.getErrorMessage() + ", thirdPartyUserId=" + this.getThirdPartyUserId() + ", nickname=" + this.getNickname() + ", avatar=" + this.getAvatar() + ", gender=" + this.getGender() + ", region=" + this.getRegion() + ", language=" + this.getLanguage() + ", extraInfo=" + this.getExtraInfo() + ", sessionKey=" + this.getSessionKey() + ")";
    }

    @java.lang.SuppressWarnings("all")
    public ThirdPartyAuthResult() {
    }

    @java.lang.SuppressWarnings("all")
    public ThirdPartyAuthResult(final boolean success, final String errorCode, final String errorMessage, final String thirdPartyUserId, final String nickname, final String avatar, final Integer gender, final String region, final String language, final String extraInfo, final String sessionKey) {
        this.success = success;
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.thirdPartyUserId = thirdPartyUserId;
        this.nickname = nickname;
        this.avatar = avatar;
        this.gender = gender;
        this.region = region;
        this.language = language;
        this.extraInfo = extraInfo;
        this.sessionKey = sessionKey;
    }
}
