// jojohello 2025-07-29
// SDK管理器，根据不同平台提供不同的接口

import { ISDK } from "./ISDK";
import { WebSDK } from "./WebSDK";
import { WechatMiniGameSDK } from "./WechatMiniGameSDK";
import { Config } from "../Config";

export enum Platform {
    WEB = "web",
    ANDROID = "android", 
    IOS = "ios",
    MINIGAME = "minigame"  // 微信小游戏
}

export interface LoginRequest {
    type: "GUEST" | "WECHAT";
    authCode: string;
    platform: string;
    deviceInfo: string;
    version: string;
    extraParams: string;
}

export interface LoginResponse {
    success: boolean;
    errorCode?: string;
    errorMessage?: string;
    token: string;
    userId: string;
    loginTimestamp: number;
    nickname?: string;
    avatar?: string;
    // Gateway 连接信息
    gatewayIp: string;           // Gateway IP 地址
    gatewayPort: number;         // Gateway 端口
    gatewayWsUrl: string;        // 完整的 WebSocket URL（推荐使用）
}

// 主SDK管理器
export class SDKMgr {
    private static _instance: SDKMgr;
    private _currentSDK: ISDK;
    
    public static get instance(): SDKMgr {
        if (!SDKMgr._instance) {
            SDKMgr._instance = new SDKMgr();
        }
        return SDKMgr._instance;
    }
    
    constructor() {
        // 根据Config配置创建对应的SDK
        this._currentSDK = this.createSDKByConfig();
    }
    
    /**
     * 根据Config配置创建对应的SDK
     */
    private createSDKByConfig(): ISDK {
        const platform = Config.getPlatform();
        
        if (platform === Platform.MINIGAME) {
            const sdk = new WechatMiniGameSDK();
            // 设置服务器URL
            sdk.setServerUrl(Config.getCurrentLoginServerUrl());
            return sdk;
        } else {
            const sdk = new WebSDK();
            // 设置服务器URL
            sdk.setServerUrl(Config.getCurrentLoginServerUrl());
            return sdk;
        }
    }
    
    /**
     * 设置平台（手动指定）
     */
    public setPlatform(platform: Platform): void {
        // 注意：Config中的平台是静态配置，无法动态修改
        // 此方法仅用于重新创建SDK实例
        this._currentSDK = this.createSDKByConfig();
    }
    
    /**
     * 获取当前平台
     */
    public getPlatform(): Platform {
        return this._currentSDK.getPlatform();
    }
    
    /**
     * 设置服务器地址
     */
    public setServerUrl(url: string): void {
        // 注意：Config中的URL是静态配置，无法动态修改
        // 此方法仅用于重新创建SDK实例
        this._currentSDK = this.createSDKByConfig();
    }
    
    /**
     * 登录接口
     * @param accountName 账号名称（微信平台下此参数无效）
     */
    public async login(accountName?: string): Promise<LoginResponse> {
        return this._currentSDK.login(accountName);
    }
    
    /**
     * 检测是否微信环境
     */
    public isWechatEnvironment(): boolean {
        return Config.getPlatform() === Platform.MINIGAME;
    }
}
