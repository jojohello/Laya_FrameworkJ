import { ActionInfo } from "./ActionInfo";
import { ActionContext } from "./ActionRuntime";

export abstract class BaseAction {
    protected _info: ActionInfo | null = null;

    init(info: ActionInfo): void {
        this._info = info;
    }

    get delayMs(): number {
        return this._info ? this._info.delayMs : 0;
    }

    abstract execute(context: ActionContext): void;

    protected get info(): ActionInfo {
        if (!this._info) {
            throw new Error(`[${this.constructor.name}] action is not initialized`);
        }
        return this._info;
    }
}
