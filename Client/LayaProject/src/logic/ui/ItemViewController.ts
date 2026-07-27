export type ItemQuality = 1 | 2 | 3 | 4 | 5;

export interface ItemViewData {
    name?: string;
    iconPath: string;
    quantity: number;
    quality?: ItemQuality;
    showRedPoint?: boolean;
    selected?: boolean;
}

/** Reusable layered item slot used by rewards, inventory and shop views. */
export class ItemViewController {
    private readonly _root: Laya.GBox;
    private readonly _qualityBackground: Laya.GBox;
    private readonly _icon: Laya.GLoader;
    private readonly _countText: Laya.GTextField;
    private readonly _redPoint: Laya.GImage;
    private readonly _selectedFrame: Laya.GBox;

    constructor(root: Laya.GBox) {
        this._root = root;
        this._qualityBackground = root.getChildByName("qualityBackground") as Laya.GBox;
        this._icon = root.getChildByName("icon") as Laya.GLoader;
        this._countText = root.getChildByName("countText") as Laya.GTextField;
        this._redPoint = root.getChildByName("redPoint") as Laya.GImage;
        this._selectedFrame = root.getChildByName("selectedFrame") as Laya.GBox;
    }

    setData(data: ItemViewData): void {
        this.drawQuality(data.quality || 1);
        this._icon.url = data.iconPath || "";
        this._countText.visible = data.quantity > 1;
        this._countText.text = this.formatQuantity(data.quantity);
        this._redPoint.visible = !!data.showRedPoint;
        this.setSelected(!!data.selected);
    }

    clear(): void {
        this._icon.url = "";
        this._countText.text = "";
        this._countText.visible = false;
        this._redPoint.visible = false;
        this.setSelected(false);
        this.drawQuality(1);
    }

    get root(): Laya.GBox {
        return this._root;
    }

    private drawQuality(quality: ItemQuality): void {
        const colors: Record<ItemQuality, string> = {
            1: "#4c6370",
            2: "#4f8a68",
            3: "#3f7fa8",
            4: "#7657a8",
            5: "#b47a32",
        };
        this._qualityBackground.graphics.clear();
        this._qualityBackground.graphics.drawRect(0, 0, 92, 92, colors[quality]);
    }

    private setSelected(selected: boolean): void {
        this._selectedFrame.visible = selected;
        this._selectedFrame.graphics.clear();
        if (!selected) return;

        this._selectedFrame.graphics.drawRect(1, 1, 110, 110, null, "#7de5ef", 4);
        this._selectedFrame.graphics.drawRect(6, 6, 100, 100, null, "#ffe6a8", 2);
    }

    private formatQuantity(quantity: number): string {
        const safeQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
        if (safeQuantity >= 1000000) return `${Math.floor(safeQuantity / 100000) / 10}m`;
        if (safeQuantity >= 10000) return `${Math.floor(safeQuantity / 1000)}k`;
        return String(safeQuantity);
    }
}
