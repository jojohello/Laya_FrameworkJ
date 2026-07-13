package com.jojohello_laya.login.service;

/**
 * 抽象第三方认证服务类
 *
 * @author laya-game
 */
public abstract class AbstractThirdPartyAuthService implements ThirdPartyAuthService {
    @Override
    public boolean isEnabled() {
        return true; // 默认启用
    }
    // 子类需实现 getType() 和 authenticate()
}
