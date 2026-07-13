// jojohello 2025-07-29
// Web平台SDK实现

import { ISDK } from "./ISDK";
import { Platform, LoginRequest, LoginResponse } from "./SDKMgr";
import { SDKUtils } from "./SDKUtils";

export class WebSDK implements ISDK {
    private _serverUrl: string = "http://localhost:8081/api";
    
    getPlatform(): Platform {
        return Platform.WEB;
    }
    
    setServerUrl(url: string): void {
        this._serverUrl = url;
    }
    
    async login(accountName: string = "jojohello"): Promise<LoginResponse> {
        try {
            const requestData: LoginRequest = {
                type: "GUEST",
                authCode: `dev_${accountName}_${Date.now()}`,
                platform: this.getPlatform(),
                deviceInfo: Laya.Browser.userAgent,
                version: "1.0.0",
                extraParams: JSON.stringify({
                    developer: accountName,
                    mode: "development"
                })
            };
            
            const response = await this.sendLoginRequest(requestData);
            return response;
            
        } catch (error) {
            console.error("WebSDK: 开发登录失败:", error);
            throw error;
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
            console.error("WebSDK: 登录请求失败", error);
            throw error;
        }
    }
} 
