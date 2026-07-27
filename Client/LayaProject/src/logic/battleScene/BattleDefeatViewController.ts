export interface BattleDefeatViewOpenParam {
    onConfirm?: () => void;
}

/** Owns the defeat-only result layout and return action. */
export class BattleDefeatViewController {
    private readonly _confirmButton: Laya.GButton;
    private _confirmed = false;
    private _param: BattleDefeatViewOpenParam | null = null;

    constructor(view: Laya.Scene) {
        this._confirmButton = view.getChildByName("confirmButton") as Laya.GButton;
    }

    onOpened(param?: BattleDefeatViewOpenParam): void {
        this.unbindEvents();
        this._param = param || {};
        this._confirmed = false;

        this._confirmButton.on(Laya.Event.CLICK, this, this.onConfirm);
    }

    onClosed(): void {
        this.unbindEvents();
        this._param = null;
    }

    private onConfirm(): void {
        if (this._confirmed) return;
        this._confirmed = true;
        this._confirmButton.mouseEnabled = false;
        this._param?.onConfirm?.();
    }

    private unbindEvents(): void {
        this._confirmButton.off(Laya.Event.CLICK, this, this.onConfirm);
        this._confirmButton.mouseEnabled = true;
    }
}
