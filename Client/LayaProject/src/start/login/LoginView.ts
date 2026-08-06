import { LoginViewBase } from "./LoginView.generated";
import { LoginMgr } from "./LoginMgr";
import type { LoginResponse } from "./LoginPayloads.generated";
import { MyGameConfig, Platform } from "../MyGameConfig";

const { regClass } = Laya;

@regClass()
export class LoginView extends LoginViewBase {
    private readonly _loginMgr = LoginMgr.instance;
    private _loginMask: Laya.Sprite | null = null;
    private _loginMaskLabel: Laya.GTextField | null = null;
    private _autoLoginPanel: Laya.GBox | null = null;
    private _autoLoginStatus: Laya.GTextField | null = null;
    private _autoLoginProgressFill: Laya.GImage | null = null;
    private _autoLoginProgress = 0;
    private _isSubmitting = false;

    onEnable(): void {
        super.onEnable();
        this.initUI();
        Laya.stage.on(Laya.Event.RESIZE, this, this.handleResize);
        void this.startLoginFlow();
    }

    onDisable(): void {
        super.onDisable();
        this.removeEvents();
        Laya.stage.off(Laya.Event.RESIZE, this, this.handleResize);
        this._loginMgr.hideProfileAuthorizationButton();
        this.stopAutoLoginProgress();
        this.destroyLoginMask();
    }

    private get isAutoWechatLogin(): boolean {
        return MyGameConfig.platform === Platform.MINIGAME && !MyGameConfig.forceAccountLogin;
    }

    private get isAccountLogin(): boolean {
        return !this.isAutoWechatLogin;
    }

    private initUI(): void {
        this.setupInputRestrictions();
        this.resolveAutoLoginUI();
        this.bindEvents();
        this.applyLoginModeUI();
        if (this.isAccountLogin) this.setLastLoginAccount();
    }

    private applyLoginModeUI(): void {
        const inputBackground = this.loginPanel?.getChildByName("img") as Laya.GWidget | null;
        if (this.loginPanel) this.loginPanel.visible = this.isAccountLogin;
        if (this._autoLoginPanel) this._autoLoginPanel.visible = this.isAutoWechatLogin;
        if (this.input) this.input.visible = this.isAccountLogin;
        if (inputBackground) inputBackground.visible = this.isAccountLogin;
        this.setConfirmButtonText("登  录");
        this.setConfirmBtnEnabled(true);
    }

    private async startLoginFlow(): Promise<void> {
        if (!this.isAutoWechatLogin) return;
        await this.submitLogin(undefined, true);
    }

    private setupInputRestrictions(): void {
        if (!this.input) return;
        this.input.maxChars = 24;
        this.input.restrict = "a-zA-Z0-9_!@#$%^&*";
        this.input.on(Laya.Event.INPUT, this, this.onInputChange);
        this.input.prompt = "请输入账号";
    }

    private onInputChange(): void {
        if (!this.input) return;
        const value = this.input.text.replace(/\s/g, "");
        if (value !== this.input.text) this.input.text = value;
    }

    private bindEvents(): void {
        this.confirmBtn?.on(Laya.Event.CLICK, this, this.onConfirmClick);
    }

    private removeEvents(): void {
        this.confirmBtn?.off(Laya.Event.CLICK, this, this.onConfirmClick);
        this.input?.off(Laya.Event.INPUT, this, this.onInputChange);
    }

    private setLastLoginAccount(): void {
        const lastAccount = this._loginMgr.getLastLoginAccount();
        if (this.input && lastAccount) this.input.text = lastAccount;
    }

    private async onConfirmClick(): Promise<void> {
        if (this._isSubmitting) return;

        if (this.isAccountLogin) {
            const accountName = this.getInputText();
            if (!this.validateInput(accountName)) return;
            await this.submitLogin(accountName, false);
            return;
        }

        if (this.isAutoWechatLogin) await this.submitLogin(undefined, true);
    }

    private async submitLogin(accountName: string | undefined, automatic: boolean): Promise<void> {
        if (this._isSubmitting) return;
        this._isSubmitting = true;
        this._loginMgr.hideProfileAuthorizationButton();
        if (automatic) {
            this.showAutoLoginProgress();
        } else {
            this.showLoginMask("正在登录…");
        }
        let succeeded = false;
        try {
            const loginResult = automatic
                ? await this._loginMgr.autoLogin()
                : await this._loginMgr.login(accountName);
            succeeded = true;
            if (automatic) {
                this.completeAutoLoginProgress();
            } else {
                this.setLoginMaskText("登录成功，正在进入游戏…");
            }
            this.onLoginSuccess(loginResult);
        } catch (error) {
            this.onLoginFailed(error);
            this.setConfirmButtonText("重试登录");
            if (automatic) this.showAutoLoginRetry();
        } finally {
            this._isSubmitting = false;
            if (!succeeded && !automatic) this.hideLoginMask();
        }
    }

    private handleResize(): void {
        this.layoutLoginMask();
    }

    private resolveAutoLoginUI(): void {
        this._autoLoginPanel = this.getChildByName("autoLoginPanel") as Laya.GBox | null;
        this._autoLoginStatus = this._autoLoginPanel?.getChildByName("autoLoginStatus") as Laya.GTextField | null;
        this._autoLoginProgressFill = this._autoLoginPanel?.getChildByName("autoLoginProgressFill") as Laya.GImage | null;
    }

    private showAutoLoginProgress(): void {
        if (this.loginPanel) this.loginPanel.visible = false;
        if (this._autoLoginPanel) this._autoLoginPanel.visible = true;
        if (this._autoLoginStatus) this._autoLoginStatus.text = "正在登录…";
        this._autoLoginProgress = 0.08;
        this.renderAutoLoginProgress();
        this.stopAutoLoginProgress();
        Laya.timer.loop(120, this, this.advanceAutoLoginProgress);
    }

    private advanceAutoLoginProgress(): void {
        this._autoLoginProgress = Math.min(0.88, this._autoLoginProgress + Math.max(0.006, (0.88 - this._autoLoginProgress) * 0.08));
        this.renderAutoLoginProgress();
    }

    private completeAutoLoginProgress(): void {
        this.stopAutoLoginProgress();
        this._autoLoginProgress = 1;
        this.renderAutoLoginProgress();
        if (this._autoLoginStatus) this._autoLoginStatus.text = "登录成功，正在进入游戏…";
    }

    private showAutoLoginRetry(): void {
        this.stopAutoLoginProgress();
        if (this._autoLoginStatus) this._autoLoginStatus.text = "登录失败，请重试";
        if (this.loginPanel) this.loginPanel.visible = true;
        if (this.input) this.input.visible = false;
        const inputBackground = this.loginPanel?.getChildByName("img") as Laya.GWidget | null;
        if (inputBackground) inputBackground.visible = false;
    }

    private renderAutoLoginProgress(): void {
        if (this._autoLoginProgressFill) this._autoLoginProgressFill.width = Math.round(462 * this._autoLoginProgress);
    }

    private stopAutoLoginProgress(): void {
        Laya.timer.clear(this, this.advanceAutoLoginProgress);
    }

    private getInputText(): string {
        return this.input?.text.trim() || "";
    }

    private validateInput(accountName: string): boolean {
        if (!accountName) {
            this.showTip("账号不能为空");
            return false;
        }
        if (accountName.length > 24) {
            this.showTip("账号长度不能超过24个字符");
            return false;
        }
        if (!/^[a-zA-Z0-9_!@#$%^&*]+$/.test(accountName)) {
            this.showTip("账号只能包含字母、数字、下划线和特殊符号");
            return false;
        }
        return true;
    }

    private setConfirmBtnEnabled(enabled: boolean): void {
        if (!this.confirmBtn) return;
        this.confirmBtn.mouseEnabled = enabled;
        this.confirmBtn.alpha = enabled ? 1 : 0.5;
    }

    private setConfirmButtonText(text: string): void {
        const label = this.confirmBtn?.getChildByName("txt") as Laya.GTextField | null;
        if (label) label.text = text;
    }

    private showLoginMask(text: string): void {
        this._loginMgr.hideProfileAuthorizationButton();
        if (!this._loginMask) {
            const mask = new Laya.Sprite();
            mask.name = "loginProgressMask";
            mask.zOrder = 10000;
            mask.mouseEnabled = true;
            const label = new Laya.GTextField();
            label.name = "loginProgressText";
            label.fontSize = 32;
            label.bold = true;
            label.color = "#fff4cf";
            label.stroke = 4;
            label.strokeColor = "#29233f";
            label.align = "center";
            label.valign = "middle";
            mask.addChild(label);
            this.addChild(mask);
            this._loginMask = mask;
            this._loginMaskLabel = label;
        }
        this.setLoginMaskText(text);
        this.layoutLoginMask();
        this._loginMask.visible = true;
    }

    private layoutLoginMask(): void {
        if (!this._loginMask || !this._loginMaskLabel) return;
        const width = Math.max(this.width, Laya.stage.width);
        const height = Math.max(this.height, Laya.stage.height);
        this._loginMask.size(width, height);
        this._loginMask.hitArea = new Laya.Rectangle(0, 0, width, height);
        this._loginMask.graphics.clear();
        this._loginMask.graphics.drawRect(0, 0, width, height, "rgba(24, 25, 43, 0.72)");
        this._loginMaskLabel.pos(0, Math.max(0, height * 0.5 - 45));
        this._loginMaskLabel.size(width, 90);
    }

    private setLoginMaskText(text: string): void {
        if (this._loginMaskLabel) this._loginMaskLabel.text = text;
    }

    private hideLoginMask(): void {
        if (this._loginMask) this._loginMask.visible = false;
    }

    private destroyLoginMask(): void {
        this._loginMask?.destroy(true);
        this._loginMask = null;
        this._loginMaskLabel = null;
    }

    private showTip(message: string): void {
        console.warn(`LoginView: ${message}`);
    }

    private onLoginSuccess(loginResult: LoginResponse): void {
        try {
            this.saveNetworkInfo(loginResult);
            const startMain = (Laya.Browser.window as any).startMain;
            if (!startMain) throw new Error("StartMain 未初始化");
            Laya.timer.frameOnce(1, this, async () => {
                try {
                    await startMain.onLoginSuccess();
                } catch (error) {
                    console.error("[LoginView] 分包加载失败:", error);
                    this.hideLoginMask();
                    this.showTip("加载游戏资源失败，请重试");
                }
            });
        } catch (error) {
            this.hideLoginMask();
            this.onLoginFailed(error);
        }
    }

    private saveNetworkInfo(loginResult: LoginResponse): void {
        if (!loginResult.success || !loginResult.gatewayWsUrl || !loginResult.userId
                || !loginResult.token || loginResult.loginTimestamp === undefined) {
            throw new Error("服务器登录响应缺少连接信息");
        }
        const network = (Laya.Browser.window as any).network;
        if (!network) throw new Error("NetworkContext 未初始化");
        network.gatewayWsUrl = loginResult.gatewayWsUrl;
        network.userId = loginResult.userId;
        network.token = loginResult.token;
        network.loginTimestamp = loginResult.loginTimestamp;
    }

    private onLoginFailed(error: unknown): void {
        const message = error instanceof Error ? error.message : "登录失败，请重试";
        this.showTip(message.includes("超时") ? "登录请求超时，请检查网络连接后重试" : message);
    }
}
