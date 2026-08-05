// jojohello 2025-07-29
// 微信小游戏平台SDK实现

import { ISDK } from "./ISDK";
import type { LoginRequest, LoginResponse } from "./SDKMgr";
import { SDKUtils } from "./SDKUtils";
import { LoginMode, MyGameConfig, Platform } from "../MyGameConfig";

export class WechatMiniGameSDK implements ISDK {
    private _serverUrl: string = "";
    
    getPlatform(): Platform {
        return Platform.MINIGAME;
    }
    
    setServerUrl(url: string): void {
        this._serverUrl = url;
    }
    
    async login(accountName?: string): Promise<LoginResponse> {
        try {
            // Local only: the checked-in Login Server currently exposes a fixed
            // development credential. Test/Production must use the real wx.login code.
            const isDeveloperLogin = MyGameConfig.loginMode === LoginMode.Developer;
            const wechatCode = isDeveloperLogin
                ? this.getDeveloperWechatCode()
                : await this.getWechatCode();
            
            // 获取微信用户信息（可选）
            const userInfo = await this.getWechatUserInfo();
            
            // 构建登录请求
            const requestData: LoginRequest = {
                type: "WECHAT",
                authCode: wechatCode,
                platform: this.getPlatform(),
                deviceInfo: "WeChat MiniGame",
                version: "1.0.0",
                extraParams: JSON.stringify({
                    userInfo: userInfo || {},
                    openId: userInfo?.openId || "",
                    unionId: userInfo?.unionId || "",
                    mode: MyGameConfig.loginMode,
                    developer: accountName?.trim() || ""
                })
            };
            
            const response = await this.sendLoginRequest(requestData);
            return response;
            
        } catch (error) {
            console.error("WechatMiniGameSDK: 微信登录失败:", error);
            throw error;
        }
    }

    private getDeveloperWechatCode(): string {
        if (!MyGameConfig.isLocalEnvironment) {
            throw new Error("开发微信登录凭据只能用于 Local 环境");
        }
        return "test_wechat_code";
    }
    
    /**
     * 获取微信授权码
     */
    private async getWechatCode(): Promise<string> {
        const result = await SDKUtils.wxApiCall<any>((success, fail) => {
            (window as any).wx.login({
                success: success,
                fail: fail
            });
        }, 3000); // 3秒超时
        
        return result.code;
    }
    
    /**
     * 获取微信用户信息
     */
    private async getWechatUserInfo(): Promise<any> {
        try {
            const result = await SDKUtils.wxApiCall<any>((success, fail) => {
                (window as any).wx.getUserInfo({
                    success: success,
                    fail: fail
                });
            }, 3000); // 3秒超时
            
            return result.userInfo;
        } catch (error) {
            // 用户拒绝授权或超时，返回空对象
            console.warn("WechatMiniGameSDK: 获取微信用户信息失败，返回空对象", error);
            return {};
        }
    }
    
    private async sendLoginRequest(requestData: LoginRequest): Promise<LoginResponse> {
        try {
            const response = await SDKUtils.post<LoginResponse>(
                `${this._serverUrl}/login`,
                requestData,
                3000 // 3秒超时
            );
            
            if (response.success) {
                return response;
            } else {
                throw new Error(response.errorMessage || "登录失败");
            }
        } catch (error) {
            console.error("WechatMiniGameSDK: 登录请求失败", error);
            throw error;
        }
    }
} 
