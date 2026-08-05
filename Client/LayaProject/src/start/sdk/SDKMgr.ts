// jojohello 2025-07-29
// SDK管理器，根据不同平台提供不同的接口

import { ISDK } from "./ISDK";
import { WebSDK } from "./WebSDK";
import { WechatMiniGameSDK } from "./WechatMiniGameSDK";
import { MyGameConfig, Platform } from "../MyGameConfig";

export { Platform };

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
        // 根据 MyGameConfig 的运行平台创建对应 SDK。
        this._currentSDK = this.createSDKByConfig();
    }
    
    /**
     * 根据 MyGameConfig 创建对应的 SDK。
     */
    private createSDKByConfig(): ISDK {
        const platform = MyGameConfig.platform;
        
        if (platform === Platform.MINIGAME) {
            const sdk = new WechatMiniGameSDK();
            // 设置服务器URL
            sdk.setServerUrl(MyGameConfig.loginApiBaseUrl);
            return sdk;
        } else {
            const sdk = new WebSDK();
            // 设置服务器URL
            sdk.setServerUrl(MyGameConfig.loginApiBaseUrl);
            return sdk;
        }
    }
    
    /**
     * 设置平台（手动指定）
     */
    public setPlatform(platform: Platform): void {
        const sdk = platform === Platform.MINIGAME ? new WechatMiniGameSDK() : new WebSDK();
        sdk.setServerUrl(MyGameConfig.loginApiBaseUrl);
        this._currentSDK = sdk;
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
        this._currentSDK.setServerUrl(url);
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
        return this._currentSDK.getPlatform() === Platform.MINIGAME;
    }
}
