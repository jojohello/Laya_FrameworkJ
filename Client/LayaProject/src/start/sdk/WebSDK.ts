// jojohello 2025-07-29
// Web平台SDK实现

import { ISDK } from "./ISDK";
import { Platform } from "../MyGameConfig";
import type { LoginRequest, LoginResponse } from "../login/LoginPayloads.generated";
import { isLoginResponse } from "../login/LoginPayloads.generated";
import { SDKUtils } from "./SDKUtils";

export class WebSDK implements ISDK {
    private _serverUrl: string = "";
    
    getPlatform(): Platform {
        return Platform.WEB;
    }
    
    setServerUrl(url: string): void {
        this._serverUrl = url;
    }
    
    async login(accountName: string = "jojohello"): Promise<LoginResponse> {
        const requestData: LoginRequest = {
            type: "GUEST",
            authCode: `dev_${accountName}_${Date.now()}`,
            platform: this.getPlatform(),
            deviceInfo: Laya.Browser.userAgent,
            version: "1.0.0"
        };
        return this.sendLoginRequest(requestData);
    }

    async isProfileAuthorizationRequired(): Promise<boolean> {
        return false;
    }

    showProfileAuthorizationButton(): void {
        // Web/desktop developer login uses the Laya account input.
    }

    hideProfileAuthorizationButton(): void {
        // No native platform control exists on Web.
    }
    
    private async sendLoginRequest(requestData: LoginRequest): Promise<LoginResponse> {
        const response = await SDKUtils.post<LoginResponse>(
            `${this._serverUrl}/login`,
            requestData,
            3000
        );
        if (!isLoginResponse(response)) {
            throw new Error("登录服务器响应结构无效");
        }
        if (!response.success) throw new Error(response.errorMessage || "登录失败");
        return response;
    }
} 
