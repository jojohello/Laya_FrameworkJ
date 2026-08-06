// jojohello 2025-01-XX
// SDK接口定义

import { Platform } from "../MyGameConfig";
import type { LoginResponse } from "../login/LoginPayloads.generated";

export interface NativeAuthorizationButtonRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

// 基础SDK接口
export interface ISDK {
    /**
     * 获取平台类型
     */
    getPlatform(): Platform;
    
    /**
     * 登录接口
     * @param accountName 账号名称（微信平台下此参数无效）
     * @returns 登录响应
     */
    login(accountName?: string): Promise<LoginResponse>;

    /** Whether this platform still needs an explicit native profile authorization gesture. */
    isProfileAuthorizationRequired(): Promise<boolean>;

    showProfileAuthorizationButton(
        rect: NativeAuthorizationButtonRect,
        onAuthorized: () => void,
        onRejected: (error: Error) => void,
    ): void;

    hideProfileAuthorizationButton(): void;
    
    /**
     * 设置服务器地址
     */
    setServerUrl(url: string): void;
}
