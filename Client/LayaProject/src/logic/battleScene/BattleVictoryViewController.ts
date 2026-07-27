import { ItemViewController, ItemViewData } from "../ui/ItemViewController";

export interface BattleVictoryViewOpenParam {
    score?: number;
    rewards?: ItemViewData[];
    onConfirm?: () => void;
}

/** Owns the victory-only result layout and reward preview. */
export class BattleVictoryViewController {
    private readonly _mask: Laya.GBox;
    private readonly _score: Laya.GTextField;
    private readonly _rewardName: Laya.GTextField;
    private readonly _itemContainer: Laya.GBox;
    private readonly _confirmButton: Laya.GButton;
    private _itemView: ItemViewController | null = null;
    private _loadToken = 0;
    private _confirmed = false;
    private _param: BattleVictoryViewOpenParam | null = null;

    constructor(view: Laya.Scene) {
        this._mask = view.getChildByName("modalMask") as Laya.GBox;
        this._score = view.getChildByName("scoreText") as Laya.GTextField;
        const rewardPanel = view.getChildByName("rewardPanel") as Laya.GBox;
        this._rewardName = rewardPanel.getChildByName("rewardName") as Laya.GTextField;
        this._itemContainer = rewardPanel.getChildByName("itemContainer") as Laya.GBox;
        this._confirmButton = view.getChildByName("confirmButton") as Laya.GButton;
    }

    onOpened(param?: BattleVictoryViewOpenParam): void {
        this.unbindEvents();
        this._param = param || {};
        this._confirmed = false;
        this._loadToken++;

        this._mask.graphics.clear();
        this._mask.graphics.drawRect(0, 0, 750, 1334, "rgba(22, 38, 45, 0.72)");
        this._score.text = `战斗评分：${Math.max(0, Math.floor(this._param.score || 0))}`;
        this._confirmButton.on(Laya.Event.CLICK, this, this.onConfirm);
        void this.loadRewardItem(this._param.rewards?.[0]);
    }

    onClosed(): void {
        this._loadToken++;
        this.unbindEvents();
        this._itemView?.root.destroy();
        this._itemView = null;
        this._param = null;
    }

    private async loadRewardItem(data?: ItemViewData): Promise<void> {
        this._itemView?.root.destroy();
        this._itemView = null;
        this._rewardName.text = data?.name || "";
        if (!data) return;

        const token = this._loadToken;
        try {
            const prefab = await Laya.loader.load("ui/common/ItemView.lh") as Laya.Prefab;
            if (token !== this._loadToken || !prefab) return;

            const root = prefab.create() as Laya.GBox;
            if (!root) return;
            this._itemContainer.addChild(root);
            this._itemView = new ItemViewController(root);
            this._itemView.setData(data);
        } catch (error) {
            console.error("[BattleVictoryView] Failed to load ItemView", error);
        }
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
