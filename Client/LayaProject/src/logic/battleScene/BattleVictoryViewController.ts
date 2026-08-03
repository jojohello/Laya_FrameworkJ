import { ItemViewController, ItemViewData } from "../ui/ItemViewController";

export interface BattleVictoryViewOpenParam {
    score?: number;
    rewards?: ItemViewData[];
    onConfirm?: () => void;
}

/** Owns the victory-only result layout and reward preview. */
export class BattleVictoryViewController {
    private readonly _score: Laya.GTextField;
    private readonly _rewardList: Laya.GList;
    private readonly _confirmButton: Laya.GButton;
    private readonly _itemViews = new Map<Laya.GWidget, ItemViewController>();
    private readonly _itemRenderTokens = new Map<Laya.GWidget, number>();
    private _loadToken = 0;
    private _confirmed = false;
    private _param: BattleVictoryViewOpenParam | null = null;
    private _rewards: readonly ItemViewData[] = [];

    constructor(view: Laya.Scene) {
        this._score = view.getChildByName("scoreText") as Laya.GTextField;
        const rewardPanel = view.getChildByName("rewardPanel") as Laya.GBox;
        this._rewardList = rewardPanel.getChildByName("rewardList") as Laya.GList;
        this._confirmButton = view.getChildByName("confirmButton") as Laya.GButton;
    }

    onOpened(param?: BattleVictoryViewOpenParam): void {
        this.unbindEvents();
        this._param = param || {};
        this._confirmed = false;
        this._loadToken++;

        this._score.text = `战斗评分：${Math.max(0, Math.floor(this._param.score || 0))}`;
        this._rewards = this._param.rewards || [];
        this._rewardList.itemRenderer = this.renderRewardItem;
        this._rewardList.numItems = this._rewards.length;
        this.enableRewardScrolling();
        this._confirmButton.on(Laya.Event.CLICK, this, this.onConfirm);
    }

    onClosed(): void {
        this._loadToken++;
        Laya.timer.clear(this, this.resetRewardScrollPosition);
        this.unbindEvents();
        this.clearRewardItems();
        this._rewards = [];
        this._param = null;
    }

    private renderRewardItem = (index: number, item: Laya.GWidget): void => {
        item.mouseEnabled = false;
        const data = this._rewards[index];
        const container = item.getChildByName("itemContainer") as Laya.GBox;
        const previous = this._itemViews.get(item);
        previous?.root.destroy();
        this._itemViews.delete(item);
        const renderToken = (this._itemRenderTokens.get(item) || 0) + 1;
        this._itemRenderTokens.set(item, renderToken);
        if (!container || !data) return;
        void this.loadRewardItem(item, container, data, renderToken);
    };

    private async loadRewardItem(
        item: Laya.GWidget,
        container: Laya.GBox,
        data: ItemViewData,
        renderToken: number
    ): Promise<void> {
        const token = this._loadToken;
        try {
            const prefab = await Laya.loader.load("ui/common/ItemView.lh") as Laya.Prefab;
            if (token !== this._loadToken || this._itemRenderTokens.get(item) !== renderToken || !prefab) return;

            const root = prefab.create() as Laya.GBox;
            if (!root) return;
            container.addChild(root);
            const itemView = new ItemViewController(root);
            itemView.setData(data);
            this._itemViews.set(item, itemView);
        } catch (error) {
            console.error("[BattleVictoryView] Failed to load ItemView", error);
        }
    }

    private clearRewardItems(): void {
        for (const itemView of this._itemViews.values()) itemView.root.destroy();
        this._itemViews.clear();
        this._itemRenderTokens.clear();
    }

    private enableRewardScrolling(): void {
        this._rewardList.layout.refresh();
        Laya.timer.clear(this, this.resetRewardScrollPosition);
        Laya.timer.callLater(this, this.resetRewardScrollPosition);
    }

    private resetRewardScrollPosition(): void {
        const scroller = this._rewardList.scroller;
        this._rewardList.layout.refresh();
        scroller.setPosX(0, false);
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
