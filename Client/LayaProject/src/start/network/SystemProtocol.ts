import { ERROR } from "./MessageIds";
import { Protocol } from "./Protocol";

export const SERVER_ERROR_EVENT = "serverError";

export interface ServerErrorInfo {
    reason: string;
    code?: string | number;
    details: any;
}

/** 处理启动期与游戏期都可能收到的全局系统协议。 */
export class SystemProtocol extends Protocol {
    protected register(): void {
        this.registerMessage(ERROR, this.onServerError.bind(this));
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
}
