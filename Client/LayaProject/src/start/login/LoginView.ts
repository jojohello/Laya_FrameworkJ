import { LoginViewBase } from "./LoginView.generated";
import { LoginMgr } from "./LoginMgr";

const { regClass } = Laya;

@regClass()
export class LoginView extends LoginViewBase {
    
    private _loginMgr: LoginMgr;
    
    constructor() {
        super();
        this._loginMgr = LoginMgr.instance;
    }
    
    onEnable(): void {
        super.onEnable();
        this.initUI();
    }
    
    onDisable(): void {
        super.onDisable();
        this.removeEvents();
    }
    
    /**
     * 初始化UI
     */
    private initUI(): void {
        // 设置输入框限制
        this.setupInputRestrictions();
        
        // 绑定按钮事件
        this.bindEvents();
        
        // 设置上次登录的账号（如果有）
        this.setLastLoginAccount();
    }
    
    /**
     * 设置输入框限制
     */
    private setupInputRestrictions(): void {
        if (this.input) {
            // 设置最大长度
            this.input.maxChars = 24;
            
            // 设置输入限制（只允许字母、数字、下划线和特殊符号）
            this.input.restrict = "a-zA-Z0-9_!@#$%^&*";
            
            // 监听输入事件，过滤空格
            this.input.on(Laya.Event.INPUT, this, this.onInputChange);
            
            // 设置占位符文本
            this.input.prompt = "请输入账号";
        }
    }
    
    /**
     * 输入框内容变化处理
     */
    private onInputChange(): void {
        if (this.input) {
            // 移除所有空格
            let value = this.input.text.replace(/\s/g, '');
            
            // 如果内容被修改了，更新输入框
            if (value !== this.input.text) {
                this.input.text = value;
            }
        }
    }
    
    /**
     * 绑定事件
     */
    private bindEvents(): void {
        if (this.confirmBtn) {
            this.confirmBtn.on(Laya.Event.CLICK, this, this.onConfirmClick);
        }
    }
    
    /**
     * 移除事件绑定
     */
    private removeEvents(): void {
        if (this.confirmBtn) {
            this.confirmBtn.off(Laya.Event.CLICK, this, this.onConfirmClick);
        }
        
        if (this.input) {
            this.input.off(Laya.Event.INPUT, this, this.onInputChange);
        }
    }
    
    /**
     * 设置上次登录的账号
     */
    private setLastLoginAccount(): void {
        if (this.input) {
            const lastAccount = this._loginMgr.getLastLoginAccount();
            if (lastAccount) {
                this.input.text = lastAccount;
            }
        }
    }
    
    /**
     * 确认按钮点击事件
     */
    private async onConfirmClick(): Promise<void> {
        // 获取输入内容
        const accountName = this.getInputText();
        
        // 验证输入
        if (!this.validateInput(accountName)) {
            return;
        }
        
        // 禁用按钮，防止重复点击
        this.setConfirmBtnEnabled(false);
        
        try {
            // 发起登录请求
            const loginResult = await this._loginMgr.login(accountName);

            // 登录成功后的处理
            this.onLoginSuccess(loginResult);
            
        } catch (error) {
            console.error("LoginView: 登录失败", error);
            this.onLoginFailed(error);
        } finally {
            // 重新启用按钮
            this.setConfirmBtnEnabled(true);
        }
    }
    
    /**
     * 获取输入框文本
     */
    private getInputText(): string {
        if (this.input) {
            return this.input.text.trim();
        }
        return "";
    }
    
    /**
     * 验证输入内容
     */
    private validateInput(accountName: string): boolean {
        // 检查是否为空
        if (!accountName || accountName.length === 0) {
            console.warn("LoginView: 账号不能为空");
            this.showTip("账号不能为空");
            return false;
        }
        
        // 检查长度
        if (accountName.length > 24) {
            console.warn("LoginView: 账号长度不能超过24个字符");
            this.showTip("账号长度不能超过24个字符");
            return false;
        }
        
        // 检查是否包含空格
        if (accountName.includes(' ')) {
            console.warn("LoginView: 账号不能包含空格");
            this.showTip("账号不能包含空格");
            return false;
        }
        
        // 检查字符是否合法（只允许字母、数字、下划线和特殊符号）
        const validPattern = /^[a-zA-Z0-9_!@#$%^&*]+$/;
        if (!validPattern.test(accountName)) {
            console.warn("LoginView: 账号只能包含字母、数字、下划线和特殊符号");
            this.showTip("账号只能包含字母、数字、下划线和特殊符号");
            return false;
        }
        
        return true;
    }
    
    /**
     * 设置确认按钮状态
     */
    private setConfirmBtnEnabled(enabled: boolean): void {
        if (this.confirmBtn) {
            this.confirmBtn.mouseEnabled = enabled;
            this.confirmBtn.alpha = enabled ? 1.0 : 0.5;
        }
    }
    
    /**
     * 显示提示信息
     */
    private showTip(message: string): void {
        // 这里可以集成你的提示系统
        // 暂时使用console.warn
        console.warn("LoginView: " + message);
        
        // 如果有提示系统，可以这样调用：
        // TipMgr.showTip(message);
    }
    
    /**
     * 登录成功处理（新架构：触发分包加载）
     */
    private async onLoginSuccess(loginResult: any): Promise<void> {
        try {
            // 1. 存储连接信息到 NetworkContext
            this.saveNetworkInfo(loginResult);

            // 2. 显示成功提示
            this.showTip("登录成功，正在加载游戏资源...");

            // 3. 触发 StartMain 的分包加载流程
            const startMain = (Laya.Browser.window as any).startMain;
            if (!startMain) {
                throw new Error("StartMain 未初始化");
            }

            // 延迟一帧，确保界面更新后再开始加载
            Laya.timer.frameOnce(1, this, async () => {
                try {
                    // 调用 StartMain 的登录成功回调（加载分包）
                    await startMain.onLoginSuccess();
                } catch (error: any) {
                    console.error("[LoginView] 分包加载失败:", error);
                    this.showTip("加载游戏资源失败，请重试");
                }
            });

        } catch (error: any) {
            console.error("[LoginView] 登录成功处理失败:", error);

            // 友好的错误提示
            let errorMessage = "登录失败，请重试";
            if (error && error.message) {
                errorMessage = error.message;
            }

            this.showTip(errorMessage);
        }
    }

    /**
     * 存储网络信息到 NetworkContext
     *
     * 新架构说明：
     * - start 包只负责存储信息，不建立 Gateway 连接
     * - logic 包启动时会从 window.network 获取信息并建立连接
     */
    private saveNetworkInfo(loginResult: any): void {
        // 检查是否有必要的连接信息
        if (!loginResult.gatewayWsUrl) {
            throw new Error("服务器未返回 Gateway 连接信息 (gatewayWsUrl)");
        }

        if (!loginResult.userId) {
            throw new Error("服务器未返回用户ID (userId)");
        }

        // 从 window 获取 NetworkContext
        const network = (Laya.Browser.window as any).network;
        if (!network) {
            throw new Error("NetworkContext 未初始化");
        }

        // 存储连接信息
        network.gatewayWsUrl = loginResult.gatewayWsUrl;
        network.userId = loginResult.userId;
        network.token = loginResult.token || "";
        network.loginTimestamp = loginResult.loginTimestamp || Date.now();
    }
    
    /**
     * 登录失败处理
     */
    private onLoginFailed(error: any): void {
        console.error("LoginView: 登录失败", error);
        
        // 显示错误信息
        let errorMessage = "登录失败";
        if (error && error.message) {
            errorMessage = error.message;
            
            // 特殊处理超时错误
            if (error.message.includes("超时")) {
                errorMessage = "登录请求超时，请检查网络连接后重试";
            }
        }
        
        this.showTip(errorMessage);
    }
    
}
