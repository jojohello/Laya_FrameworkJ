import { ItemViewController, ItemViewData } from "../ui/ItemViewController";
import { BagItemData } from "./BagData";
import { BagMgr } from "./BagMgr";
import { ItemType } from "./ItemInfo";
import { ItemMgr } from "./ItemMgr";

type BagTab = "all" | "material" | "consumable" | "equipment";

interface BagTabDefinition {
    key: BagTab;
    buttonName: string;
}

/** Read-only main-scene bag page: category tabs and the authoritative local bag snapshot. */
export class BagViewController {
    private static readonly DEFAULT_ICON = "ui/mainscene/imgs/icon-box.png";
    private static readonly ACTIVE_TAB_BACKGROUND = "ui/bag/imgs/tab-selected.png";
    private static readonly NORMAL_TAB_BACKGROUND = "ui/bag/imgs/tab-normal.png";
    private static readonly TABS: readonly BagTabDefinition[] = [
        { key: "all", buttonName: "allTab" },
        { key: "material", buttonName: "materialTab" },
        { key: "consumable", buttonName: "consumableTab" },
        { key: "equipment", buttonName: "equipmentTab" },
    ];

    private readonly _itemList: Laya.GList;
    private readonly _tabButtons = new Map<BagTab, Laya.GButton>();
    private readonly _itemViews = new Map<Laya.GWidget, ItemViewController>();
    private readonly _itemRenderTokens = new Map<Laya.GWidget, number>();
    private _loadToken = 0;
    private _activeTab: BagTab = "all";
    private _items: readonly BagItemData[] = [];

    constructor(view: Laya.Scene) {
        this._itemList = view.getChildByName("itemList") as Laya.GList;
        for (const tab of BagViewController.TABS) {
            this._tabButtons.set(tab.key, view.getChildByName(tab.buttonName) as Laya.GButton);
        }
    }

    onOpened(): void {
        this.unbindEvents();
        this._loadToken++;
        this._itemList.itemRenderer = this.renderItem;
        for (const tab of BagViewController.TABS) {
            this._tabButtons.get(tab.key)?.on(Laya.Event.CLICK, this, () => this.selectTab(tab.key));
        }
        BagMgr.instance.addChangeListener(this.refresh);
        this.refresh();
    }

    onClosed(): void {
        this._loadToken++;
        BagMgr.instance.removeChangeListener(this.refresh);
        this.unbindEvents();
        this.clearItemViews();
        this._items = [];
    }

    private refresh = (): void => {
        this._items = BagMgr.instance.getItems()
            .filter(item => this.matchesActiveTab(item))
            .sort((left, right) => left.ItemID - right.ItemID);
        this._itemList.numItems = this._items.length;
        this._itemList.layout.refresh();
        this._itemList.scroller?.setPosY(0, false);
        this.updateTabVisuals();
    };

    private selectTab(tab: BagTab): void {
        if (this._activeTab === tab) return;
        this._activeTab = tab;
        this.refresh();
    }

    private renderItem = (index: number, item: Laya.GWidget): void => {
        item.mouseEnabled = false;
        const container = item.getChildByName("itemContainer") as Laya.GBox;
        this._itemViews.get(item)?.root.destroy();
        this._itemViews.delete(item);
        const renderToken = (this._itemRenderTokens.get(item) || 0) + 1;
        this._itemRenderTokens.set(item, renderToken);
        const data = this.toItemViewData(this._items[index]);
        if (!container || !data) return;
        void this.loadItemView(item, container, data, renderToken);
    };

    private async loadItemView(item: Laya.GWidget, container: Laya.GBox, data: ItemViewData, renderToken: number): Promise<void> {
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
            console.error("[BagView] Failed to load ItemView", error);
        }
    }

    private toItemViewData(item: BagItemData | undefined): ItemViewData | null {
        if (!item) return null;
        const info = ItemMgr.instance.getItem(item.ItemID);
        return {
            name: info?.data.Name || `Item ${item.ItemID}`,
            iconPath: BagViewController.DEFAULT_ICON,
            quantity: item.Count,
            quality: Math.min(5, Math.max(1, Number(info?.data.Quality) || 1)) as ItemViewData["quality"],
        };
    }

    private matchesActiveTab(item: BagItemData): boolean {
        if (this._activeTab === "all") return true;
        const type = ItemMgr.instance.getItem(item.ItemID)?.data.Type;
        return (this._activeTab === "material" && type === ItemType.Material)
            || (this._activeTab === "consumable" && type === ItemType.Consumable)
            || (this._activeTab === "equipment" && type === ItemType.Equipment);
    }

    private updateTabVisuals(): void {
        for (const tab of BagViewController.TABS) {
            const selected = tab.key === this._activeTab;
            const button = this._tabButtons.get(tab.key);
            if (!button) continue;
            button.selected = selected;
            // Category changes must not move the tab strip; selection is communicated by the embedded-page art only.
            button.scaleX = 1;
            button.scaleY = 1;
            button.y = 218;
            const activeBackground = button.getChildByName("activeBackground") as Laya.GLoader;
            const normalBackground = button.getChildByName("normalBackground") as Laya.GLoader;
            if (activeBackground) {
                activeBackground.src = BagViewController.ACTIVE_TAB_BACKGROUND;
                activeBackground.visible = selected;
            }
            if (normalBackground) {
                normalBackground.src = BagViewController.NORMAL_TAB_BACKGROUND;
                normalBackground.visible = !selected;
            }
        }
    }

    private clearItemViews(): void {
        for (const itemView of this._itemViews.values()) itemView.root.destroy();
        this._itemViews.clear();
        this._itemRenderTokens.clear();
    }

    private unbindEvents(): void {
        for (const tab of BagViewController.TABS) this._tabButtons.get(tab.key)?.offAllCaller(this);
    }
}
