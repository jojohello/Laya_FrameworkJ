import { ActionInfo } from "./ActionInfo";
import { ActionContext } from "./ActionRuntime";

export abstract class BaseAction {
    protected _info: ActionInfo | null = null;

    init(info: ActionInfo): void {
        this._info = info;
    }

    get delaySeconds(): number {
        return this._info ? this._info.delaySeconds : 0;
    }

    /**
     * Executes the action.
     * @returns Duration in scene logic seconds that extends the owning skill from
     * the action's planned executeTime. Non-duration actions return 0.
     */
    abstract execute(context: ActionContext): number;

    protected get info(): ActionInfo {
        if (!this._info) {
            throw new Error(`[${this.constructor.name}] action is not initialized`);
        }
        return this._info;
    }
}
