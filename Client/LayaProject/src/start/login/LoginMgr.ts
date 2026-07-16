// jojohello 2025-01-XX
// 登录管理器，通过SDKMgr调用登录接口

import { SDKMgr, Platform, LoginResponse } from "../sdk/SDKMgr";
import { Config } from "../Config";
import { LoginProtocol } from "./LoginProtocol";

export class LoginMgr {
    public onGameLoginSuccess: (() => void) | null = null;
    private static _instance: LoginMgr;
    private _sdkMgr: SDKMgr;
    private _isLoggedIn: boolean = false;
    private _loginInfo: LoginResponse | null = null;
    private _protocol: LoginProtocol | null = null;
    private _pendingGameLogin: {
        resolve: () => void;
        reject: (error: Error) => void;
        timer: ReturnType<typeof setTimeout>;
    } | null = null;

    public static get instance(): LoginMgr {
        if (!LoginMgr._instance) {
            LoginMgr._instance = new LoginMgr();
        }
        return LoginMgr._instance;
    }

    private constructor() {
        // 私有构造函数，单例模式
        this._sdkMgr = SDKMgr.instance;
        // 注意：不在构造函数中调用 init()，而是通过 ManagerHub.init() 调用
    }

    // ========== IManager 接口实现 ==========

    /**
     * 设置 Protocol（由外部注入）
     */
    setProtocol(protocol: LoginProtocol): void {
        this._protocol = protocol;
    }

    /**
     * 初始化登录管理器
     */
    init(): void {
        // 检查本地存储的登录信息
        this.checkLocalLoginInfo();
    }

    /**
     * 每帧更新
     *
     * LoginMgr 不需要每帧更新，实现为空方法
     */
    update(dt: number): void {
        // LoginMgr 不需要 update
    }

    /**
     * 重置状态
     *
     * 清除登录信息
     */
    reset(): void {
        this.clearLocalLoginInfo();
    }

    /**
     * 释放资源
     *
     * 清除登录信息
     */
    release(): void {
        // 注意：Protocol 由外部管理生命周期，这里只清空引用
        this._protocol = null;

        this.clearLocalLoginInfo();
    }
    
    /**
     * 检查本地存储的登录信息
     */
    private checkLocalLoginInfo(): void {
        try {
            const lastLoginAccount = Laya.LocalStorage.getItem("lastLoginAccount");
            
            if (lastLoginAccount) {
                // 只记录账号，不自动登录，需要用户手动重新登录
            }
        } catch (error) {
            console.error("LoginMgr: 检查本地登录信息失败:", error);
            this.clearLocalLoginInfo();
        }
    }
    
    /**
     * 清除本地登录信息
     */
    private clearLocalLoginInfo(): void {
        if (this._pendingGameLogin) {
            clearTimeout(this._pendingGameLogin.timer);
            this._pendingGameLogin.reject(new Error("Game login cancelled"));
            this._pendingGameLogin = null;
        }
        Laya.LocalStorage.removeItem("lastLoginAccount");
        this._isLoggedIn = false;
        this._loginInfo = null;
    }
    
    /**
     * 保存登录信息到本地
     */
    private saveLoginInfo(response: LoginResponse, inputAccountName?: string): void {
        // 记录用户输入的账号名称，如果没有则使用服务器返回的userId
        const accountToSave = inputAccountName || response.userId;
        Laya.LocalStorage.setItem("lastLoginAccount", accountToSave);
        
        this._isLoggedIn = true;
        this._loginInfo = response;
        
    }
    
    /**
     * 检查是否已登录
     */
    public isLoggedIn(): boolean {
        return this._isLoggedIn;
    }
    
    /**
     * 获取登录信息
     */
    public getLoginInfo(): LoginResponse | null {
        return this._loginInfo;
    }
    
    /**
     * 自动登录（根据环境选择合适的登录方式）
     */
    public async autoLogin(): Promise<LoginResponse> {
        // 如果已经登录，直接返回
        if (this._isLoggedIn && this._loginInfo) {
            return this._loginInfo;
        }
        
        try {
            // 使用统一的登录接口
            const response = await this._sdkMgr.login();
            
            // 保存登录信息（自动登录时没有用户输入的账号名称）
            this.saveLoginInfo(response);
            
            return response;
            
        } catch (error) {
            console.error("LoginMgr: 自动登录失败:", error);
            throw error;
        }
    }
    
    /**
     * 登录接口
     * @param accountName 账号名称（微信平台下此参数无效）
     */
    public async login(accountName?: string): Promise<LoginResponse> {
        try {
            const response = await this._sdkMgr.login(accountName);
            
            // 保存登录信息，传入用户输入的账号名称
            this.saveLoginInfo(response, accountName);
            
            return response;
        } catch (error) {
            console.error("LoginMgr: 登录失败:", error);
            throw error;
        }
    }
    
    /**
     * 登出
     */
    public logout(): void {
        this.clearLocalLoginInfo();
    }
    
    /**
     * 设置服务器地址
     */
    public setServerUrl(url: string): void {
        // 注意：Config中的URL是静态配置，无法动态修改
        // 如需修改URL，请直接修改Config.ts文件中的LOGIN_SERVER_URLS配置
        console.warn("LoginMgr: 如需修改登录 URL，请修改 Config.ts 文件");
    }
    
    /**
     * 获取当前平台
     */
    public getPlatform(): Platform {
        return Config.getPlatform();
    }
    
    /**
     * 获取上次登录的账号
     */
    public getLastLoginAccount(): string | null {
        return Laya.LocalStorage.getItem("lastLoginAccount");
    }

    // ========== Protocol 消息处理回调 ==========

    /**
     * 处理登录成功（由 LoginProtocol 调用）
     *
     * @param data 服务器返回的数据
     */
    public async handleLoginSuccess(data: any): Promise<void> {
        this._isLoggedIn = true;
        const pending = this._pendingGameLogin;
        if (pending) {
            clearTimeout(pending.timer);
            this._pendingGameLogin = null;
            pending.resolve();
        }
        this.onGameLoginSuccess?.();
    }

    /**
     * 处理登录失败（由 LoginProtocol 调用）
     *
     * @param data 服务器返回的数据（包含 reason）
     */
    public handleLoginFailed(data: any): void {
        const pending = this._pendingGameLogin;
        if (pending) {
            clearTimeout(pending.timer);
            this._pendingGameLogin = null;
            pending.reject(new Error(String(data?.reason || "Unknown game login error")));
        }
        console.error("[LoginMgr] 处理登录失败:", data);

        const reason = data?.reason || "未知错误";

        // TODO: 显示错误提示
        // TODO: 停留在登录界面
        console.warn(`[LoginMgr] 登录失败原因: ${reason}`);
    }

    /**
     * 发送游戏登录请求（登录到 Game Server）
     *
     * 注意：这是登录到游戏服务器，不是 Login Server
     * Login Server 登录由 SDKMgr.login() 完成
     *
     * @param userId 用户ID（从 Login Server 返回）
     */
    public sendGameLogin(userId: string): void {
        if (!this._protocol) {
            console.error("[LoginMgr] Protocol 未初始化");
            return;
        }

        const timestamp = Date.now();
        this._protocol.sendLogin(userId, timestamp);
    }

    public loginToGame(userId: string): Promise<void> {
        if (this._pendingGameLogin) {
            clearTimeout(this._pendingGameLogin.timer);
            this._pendingGameLogin.reject(new Error("Game login superseded"));
            this._pendingGameLogin = null;
        }
        return new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => {
                if (!this._pendingGameLogin) return;
                this._pendingGameLogin = null;
                reject(new Error("Game login timed out"));
            }, 10000);
            this._pendingGameLogin = { resolve, reject, timer };
            this.sendGameLogin(userId);
        });
    }
}
