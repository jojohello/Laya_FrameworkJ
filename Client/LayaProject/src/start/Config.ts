// jojohello 2025-01-XX
// 配置文件 - 发布时根据平台手动修改

import { Platform } from "./sdk/SDKMgr";

export class Config {
    // ==================== 平台配置 ====================
    // 当前平台：发布时根据目标平台修改
    // Platform.WEB - Web平台
    // Platform.ANDROID - Android平台  
    // Platform.IOS - iOS平台
    // Platform.MINIGAME - 微信小游戏平台
    public static readonly CURRENT_PLATFORM: Platform = Platform.WEB;
    
    // ==================== 登录服务器URL配置 ====================
    // 各平台的登录服务器地址：发布时根据实际服务器地址修改
    public static readonly LOGIN_SERVER_URLS: { [key in Platform]: string } = {
        [Platform.WEB]: "http://localhost:8081/api",
        [Platform.ANDROID]: "http://localhost:8081/api", 
        [Platform.IOS]: "http://localhost:8081/api",
        [Platform.MINIGAME]: "http://localhost:8081/api"
    };
    
    // ==================== 获取配置的方法 ====================
    
    /**
     * 获取当前平台
     */
    public static getPlatform(): Platform {
        return Config.CURRENT_PLATFORM;
    }
    
    /**
     * 获取当前平台的登录服务器URL
     */
    public static getCurrentLoginServerUrl(): string {
        return Config.LOGIN_SERVER_URLS[Config.CURRENT_PLATFORM];
    }
    
    /**
     * 获取指定平台的登录服务器URL
     */
    public static getLoginServerUrl(platform: Platform): string {
        return Config.LOGIN_SERVER_URLS[platform];
    }
    
    /**
     * 获取所有平台的登录服务器URL配置
     */
    public static getAllLoginServerUrls(): { [key in Platform]: string } {
        return { ...Config.LOGIN_SERVER_URLS };
    }
    
    /**
     * 检测是否微信环境
     */
    public static isWechatEnvironment(): boolean {
        return Config.CURRENT_PLATFORM === Platform.MINIGAME;
    }
}
