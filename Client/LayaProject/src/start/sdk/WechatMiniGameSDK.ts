import { ISDK, NativeAuthorizationButtonRect } from "./ISDK";
import { SDKUtils } from "./SDKUtils";
import { GameEnvironment, MyGameConfig, Platform } from "../MyGameConfig";
import {
    isLoginResponse,
    type LoginRequest,
    type LoginResponse,
} from "../login/LoginPayloads.generated";

/** WeChat client adapter. Account ownership is resolved only by Login Server. */
export class WechatMiniGameSDK implements ISDK {
    private _serverUrl = "";
    private _userInfoButton: any | null = null;

    getPlatform(): Platform {
        return Platform.MINIGAME;
    }

    setServerUrl(url: string): void {
        this._serverUrl = url;
    }

    async login(accountName?: string): Promise<LoginResponse> {
        const isDeveloperLogin = MyGameConfig.forceAccountLogin;
        let requestData: LoginRequest;

        if (isDeveloperLogin) {
            if (MyGameConfig.environment === GameEnvironment.Production) {
                throw new Error("账号登录不能用于 Production 环境");
            }
            const developerAccount = accountName?.trim();
            if (!developerAccount) throw new Error("请输入开发测试账号");
            requestData = {
                type: "WECHAT",
                authCode: "test_wechat_code",
                platform: this.getPlatform(),
                deviceInfo: this.getDeviceInfo(),
                version: "1.0.0",
                developerAccount,
            };
        } else {
            // Account authentication depends only on the short-lived wx.login code.
            // Profile permission is optional and must never block account login.
            const authCode = await this.getWechatCode();
            requestData = {
                type: "WECHAT",
                authCode,
                platform: this.getPlatform(),
                deviceInfo: this.getDeviceInfo(),
                version: "1.0.0",
            };
            const profile = await this.tryGetAuthorizedWechatUserInfo();
            if (profile?.encryptedData && profile?.iv) {
                requestData.profileEncryptedData = profile.encryptedData;
                requestData.profileIv = profile.iv;
            }
        }

        return this.sendLoginRequest(requestData);
    }

    async isProfileAuthorizationRequired(): Promise<boolean> {
        if (MyGameConfig.forceAccountLogin) return false;
        const wx = this.getWx();
        if (typeof wx.getSetting !== "function") return true;
        try {
            const result = await SDKUtils.wxApiCall<any>((success, fail) => {
                wx.getSetting({ success, fail });
            }, 5000);
            return result?.authSetting?.["scope.userInfo"] !== true;
        } catch {
            // Failing closed still gives the user a native authorization/retry entry.
            return true;
        }
    }

    showProfileAuthorizationButton(
        rect: NativeAuthorizationButtonRect,
        onAuthorized: () => void,
        onRejected: (error: Error) => void,
    ): void {
        this.hideProfileAuthorizationButton();
        const wx = this.getWx();
        if (typeof wx.createUserInfoButton !== "function") {
            onRejected(new Error("当前微信版本不支持用户信息授权按钮"));
            return;
        }

        const button = wx.createUserInfoButton({
            type: "text",
            text: "微信授权登录",
            withCredentials: true,
            lang: "zh_CN",
            style: {
                left: Math.round(rect.left),
                top: Math.round(rect.top),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                lineHeight: Math.round(rect.height),
                backgroundColor: "#f7e7bd",
                color: "#292980",
                textAlign: "center",
                fontSize: Math.max(14, Math.round(rect.height * 0.38)),
            },
        });
        this._userInfoButton = button;
        button.onTap((result: any) => {
            const authorized = result?.errMsg === "getUserInfo:ok" || !!result?.userInfo;
            this.hideProfileAuthorizationButton();
            if (authorized) onAuthorized();
            else onRejected(new Error("未授权微信昵称和头像"));
        });
    }

    hideProfileAuthorizationButton(): void {
        if (!this._userInfoButton) return;
        try {
            this._userInfoButton.destroy();
        } finally {
            this._userInfoButton = null;
        }
    }

    private async getWechatCode(): Promise<string> {
        const wx = this.getWx();
        try {
            const result = await SDKUtils.wxApiCall<any>((success, fail) => {
                wx.login({ timeout: 5000, success, fail });
            }, 6000);
            if (!result?.code) throw new Error("missing code");
            return result.code;
        } catch {
            throw new Error("获取微信登录凭证失败，请重试");
        }
    }

    private async getWechatUserInfo(): Promise<any> {
        const wx = this.getWx();
        try {
            return await SDKUtils.wxApiCall<any>((success, fail) => {
                wx.getUserInfo({ withCredentials: true, lang: "zh_CN", success, fail });
            }, 6000);
        } catch {
            throw new Error("获取微信昵称头像失败，请重新授权");
        }
    }

    private async tryGetAuthorizedWechatUserInfo(): Promise<any | null> {
        if (await this.isProfileAuthorizationRequired()) return null;
        try {
            return await this.getWechatUserInfo();
        } catch {
            // Profile is presentation-only. A stale permission or profile API failure
            // must not turn a valid wx.login identity into a login failure.
            return null;
        }
    }

    private async sendLoginRequest(requestData: LoginRequest): Promise<LoginResponse> {
        const response = await SDKUtils.post<unknown>(
            `${this._serverUrl}/login`,
            requestData,
            8000,
        );
        if (!isLoginResponse(response)) {
            throw new Error("登录服务器响应结构无效");
        }
        if (!response.success) {
            throw new Error(response.errorMessage || "微信登录失败");
        }
        return response;
    }

    private getDeviceInfo(): string {
        return JSON.stringify(SDKUtils.getDeviceInfo()).slice(0, 512);
    }

    private getWx(): any {
        const wx = (Laya.Browser.window as any).wx;
        if (!wx) throw new Error("当前环境不是微信小游戏");
        return wx;
    }
}
