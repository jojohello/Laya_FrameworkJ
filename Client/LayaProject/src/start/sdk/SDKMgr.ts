// jojohello 2025-07-29
// SDK管理器，根据不同平台提供不同的接口

import { ISDK, NativeAuthorizationButtonRect } from "./ISDK";
import { WebSDK } from "./WebSDK";
import { WechatMiniGameSDK } from "./WechatMiniGameSDK";
import { MyGameConfig, Platform } from "../MyGameConfig";
import type { LoginResponse } from "../login/LoginPayloads.generated";

export { Platform };
export type { LoginRequest, LoginResponse } from "../login/LoginPayloads.generated";

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
    
    private constructor() {
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
     * 获取当前平台
     */
    public getPlatform(): Platform {
        return this._currentSDK.getPlatform();
    }
    
    /**
     * 登录接口
     * @param accountName 账号名称（微信平台下此参数无效）
     */
    public async login(accountName?: string): Promise<LoginResponse> {
        return this._currentSDK.login(accountName);
    }

    public isProfileAuthorizationRequired(): Promise<boolean> {
        return this._currentSDK.isProfileAuthorizationRequired();
    }

    public showProfileAuthorizationButton(
        rect: NativeAuthorizationButtonRect,
        onAuthorized: () => void,
        onRejected: (error: Error) => void,
    ): void {
        this._currentSDK.showProfileAuthorizationButton(rect, onAuthorized, onRejected);
    }

    public hideProfileAuthorizationButton(): void {
        this._currentSDK.hideProfileAuthorizationButton();
    }
    
    /**
     * 检测是否微信环境
     */
    public isWechatEnvironment(): boolean {
        return this._currentSDK.getPlatform() === Platform.MINIGAME;
    }
}
