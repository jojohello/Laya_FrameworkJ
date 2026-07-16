import { AUTH, AUTH_FAILED, AUTH_SUCCESS, ERROR } from "./MessageIds";
import { Protocol } from "./Protocol";

export const SERVER_ERROR_EVENT = "serverError";

export interface ServerErrorInfo {
    reason: string;
    code?: string | number;
    details: any;
}

/** 处理启动期与游戏期都可能收到的全局系统协议。 */
export class SystemProtocol extends Protocol {
    private _pendingAuth: {
        resolve: () => void;
        reject: (error: Error) => void;
        timer: ReturnType<typeof setTimeout>;
    } | null = null;

    protected register(): void {
        this.registerMessage(ERROR, this.onServerError.bind(this));
        this.registerMessage(AUTH_SUCCESS, this.onAuthSuccess.bind(this));
        this.registerMessage(AUTH_FAILED, this.onAuthFailed.bind(this));
    }

    authenticate(userId: string, loginTimestamp: number, token: string): Promise<void> {
        this.rejectPendingAuth(new Error("Gateway authentication superseded"));
        return new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => {
                if (!this._pendingAuth) return;
                this._pendingAuth = null;
                reject(new Error("Gateway authentication timed out"));
            }, 10000);
            this._pendingAuth = { resolve, reject, timer };
            this.sendMessage(AUTH, { userId, loginTimestamp, token });
        });
    }

    release(): void {
        this.rejectPendingAuth(new Error("Gateway authentication cancelled"));
        super.release();
    }

    private onServerError(data: any): void {
        const info: ServerErrorInfo = {
            reason: String(data?.reason || data?.message || "服务器返回未知错误"),
            code: data?.code,
            details: data,
        };
        console.error(`[ServerError] ${info.reason}`, info);
        const globalWindow = Laya.Browser.window as any;
        globalWindow.eventDispatcher?.event(SERVER_ERROR_EVENT, info);
    }

    private onAuthSuccess(): void {
        const pending = this._pendingAuth;
        if (!pending) return;
        clearTimeout(pending.timer);
        this._pendingAuth = null;
        pending.resolve();
    }

    private onAuthFailed(data: any): void {
        this.rejectPendingAuth(new Error(String(data?.reason || data?.message || "Gateway authentication failed")));
    }

    private rejectPendingAuth(error: Error): void {
        const pending = this._pendingAuth;
        if (!pending) return;
        clearTimeout(pending.timer);
        this._pendingAuth = null;
        pending.reject(error);
    }
}
