// jojohello 2025-01-XX
// SDK接口定义

import { Platform, LoginResponse } from "./SDKMgr";

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
    
    /**
     * 设置服务器地址
     */
    setServerUrl(url: string): void;
}
