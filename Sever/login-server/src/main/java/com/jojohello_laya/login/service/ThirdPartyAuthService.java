package com.jojohello_laya.login.service;

import com.jojohello_laya.login.model.ThirdPartyAuthRequest;
import com.jojohello_laya.login.model.ThirdPartyAuthResult;

/**
 * 第三方验证服务接口
 * 使用多态设计，支持多种第三方登录方式
 *
 * @author laya-game
 */
public interface ThirdPartyAuthService {

    /**
     * 获取第三方类型
     *
     * @return 第三方类型枚举
     */
    ThirdPartyType getType();

    /**
     * 验证第三方登录
     *
     * @param request 验证请求
     * @return 验证结果
     */
    ThirdPartyAuthResult authenticate(ThirdPartyAuthRequest request);

    /**
     * 检查服务是否启用
     *
     * @return true if enabled, false otherwise
     */
    boolean isEnabled();

    /**
     * 第三方类型枚举
     */
    enum ThirdPartyType {
        WECHAT("wechat", "微信"),
        QQ("qq", "QQ"),
        ALIPAY("alipay", "支付宝"),
        GUEST("guest", "游客"),
        DEVELOPER("developer", "开发者");  // 添加开发模式

        private final String code;
        private final String name;

        ThirdPartyType(String code, String name) {
            this.code = code;
            this.name = name;
        }

        public String getCode() {
            return code;
        }

        public String getName() {
            return name;
        }

        public static ThirdPartyType fromCode(String code) {
            for (ThirdPartyType type : values()) {
                if (type.code.equals(code)) {
                    return type;
                }
            }
            throw new IllegalArgumentException("Unknown third party type: " + code);
        }
    }
}
