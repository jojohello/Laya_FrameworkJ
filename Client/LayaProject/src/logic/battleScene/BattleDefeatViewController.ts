export interface BattleDefeatViewOpenParam {
    suggestions?: readonly BattleDefeatSuggestion[];
    onConfirm?: () => void;
}

export interface BattleDefeatSuggestion {
    key: string;
    text: string;
}

/** Owns the defeat-only result layout and return action. */
export class BattleDefeatViewController {
    private readonly _suggestionList: Laya.GList;
    private readonly _confirmButton: Laya.GButton;
    private _confirmed = false;
    private _param: BattleDefeatViewOpenParam | null = null;
    private _suggestions: readonly BattleDefeatSuggestion[] = [];

    constructor(view: Laya.Scene) {
        const tips = view.getChildByName("defeatTips") as Laya.GBox;
        this._suggestionList = tips.getChildByName("suggestionList") as Laya.GList;
        this._confirmButton = view.getChildByName("confirmButton") as Laya.GButton;
    }

    onOpened(param?: BattleDefeatViewOpenParam): void {
        this.unbindEvents();
        this._param = param || {};
        this._confirmed = false;

        this._suggestions = this._param.suggestions?.length
            ? this._param.suggestions
            : BattleDefeatViewController.DEFAULT_SUGGESTIONS;
        this._suggestionList.itemRenderer = this.renderSuggestion;
        this._suggestionList.numItems = this._suggestions.length;
        this.enableSuggestionScrolling();

        this._confirmButton.on(Laya.Event.CLICK, this, this.onConfirm);
    }

    onClosed(): void {
        Laya.timer.clear(this, this.resetSuggestionScrollPosition);
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

    private renderSuggestion = (index: number, item: Laya.GWidget): void => {
        item.mouseEnabled = false;
        const text = item.getChildByName("text") as Laya.GTextField;
        if (text) text.text = this._suggestions[index]?.text || "";
    };

    private enableSuggestionScrolling(): void {
        this._suggestionList.layout.refresh();
        Laya.timer.clear(this, this.resetSuggestionScrollPosition);
        Laya.timer.callLater(this, this.resetSuggestionScrollPosition);
    }

    private resetSuggestionScrollPosition(): void {
        const scroller = this._suggestionList.scroller;
        this._suggestionList.layout.refresh();
        scroller.scrollTop(false);
    }

    private static readonly DEFAULT_SUGGESTIONS: readonly BattleDefeatSuggestion[] = [
        { key: "formation", text: "调整阵容与站位" },
        { key: "hero-level", text: "提高英雄等级" },
        { key: "equipment", text: "强化装备与技能" },
    ];
}
