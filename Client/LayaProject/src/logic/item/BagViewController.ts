import { ItemViewController, ItemViewData } from "../ui/ItemViewController";
import { BagItemData } from "./BagData";
import { BagMgr } from "./BagMgr";
import { BagType } from "./BagPayloads.generated";
import { ItemType } from "./ItemInfo";
import { ItemMgr } from "./ItemMgr";

type BagTab = "all" | "material" | "consumable" | "equipment";

interface BagTabDefinition {
    key: BagTab;
    buttonName: string;
}

export function splitBagItemStacks(item: BagItemData, maxStack: number): BagItemData[] {
    const safeMaxStack = Math.max(1, Math.floor(Number(maxStack) || 1));
    const stacks: BagItemData[] = [];
    let remaining = Math.max(0, Math.floor(Number(item.Count) || 0));
    while (remaining > 0) {
        const count = Math.min(safeMaxStack, remaining);
        stacks.push({ ItemID: item.ItemID, Count: count });
        remaining -= count;
    }
    return stacks;
}

export function calculateBagSlotCount(stackCount: number, visibleSlots: number,
                                      columnCount: number): number {
    const safeVisibleSlots = Math.max(1, Math.floor(visibleSlots));
    const safeColumnCount = Math.max(1, Math.floor(columnCount));
    const safeStackCount = Math.max(0, Math.floor(stackCount));
    return Math.max(safeVisibleSlots, Math.ceil(safeStackCount / safeColumnCount) * safeColumnCount);
}

export interface BagGridMetrics {
    columnCount: number;
    rowCount: number;
    visibleSlotCount: number;
}

export function calculateBagGridMetrics(viewWidth: number, viewHeight: number,
                                        itemWidth: number, itemHeight: number,
                                        columnGap: number, rowGap: number): BagGridMetrics {
    const safeItemWidth = Math.max(1, Number(itemWidth) || 1);
    const safeItemHeight = Math.max(1, Number(itemHeight) || 1);
    const safeColumnGap = Math.max(0, Number(columnGap) || 0);
    const safeRowGap = Math.max(0, Number(rowGap) || 0);
    const columnCount = Math.max(1, Math.floor(
        (Math.max(0, Number(viewWidth) || 0) + safeColumnGap) / (safeItemWidth + safeColumnGap)));
    const rowCount = Math.max(1, Math.floor(
        (Math.max(0, Number(viewHeight) || 0) + safeRowGap) / (safeItemHeight + safeRowGap)));
    return { columnCount, rowCount, visibleSlotCount: columnCount * rowCount };
}

/** Read-only main-scene bag page: category tabs and the authoritative local bag snapshot. */
export class BagViewController {
    private static readonly DEFAULT_ITEM_SIZE = 112;
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
    private _items: readonly (BagItemData | null)[] = [];

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
        this._itemList.on(Laya.Event.RESIZE, this, this.handleListResize);
        this._itemList.scroller?.setPosY(0, false);
        this.refresh(BagType.Main);
    }

    onClosed(): void {
        this._loadToken++;
        BagMgr.instance.removeChangeListener(this.refresh);
        this._itemList.off(Laya.Event.RESIZE, this, this.handleListResize);
        this.unbindEvents();
        this.clearItemViews();
        this._items = [];
    }

    private refresh = (bagType: BagType): void => {
        if (bagType !== BagType.Main) return;
        const stacks = BagMgr.instance.getItems(BagType.Main)
            .filter(item => this.matchesActiveTab(item))
            .sort((left, right) => left.ItemID - right.ItemID)
            .flatMap(item => this.splitIntoStacks(item));
        const grid = this.getGridMetrics();
        this._itemList.layout.columns = grid.columnCount;
        const slotCount = calculateBagSlotCount(stacks.length, grid.visibleSlotCount, grid.columnCount);
        this._items = Array.from({ length: slotCount }, (_, index) => stacks[index] || null);
        this._itemList.numItems = this._items.length;
        this._itemList.layout.refresh();
        const scroller = this._itemList.scroller;
        if (scroller) {
            const canScroll = slotCount > grid.visibleSlotCount;
            scroller.touchEffect = canScroll ? Laya.ScrollTouchEffect.On : Laya.ScrollTouchEffect.Off;
            scroller.bouncebackEffect = canScroll ? Laya.ScrollBounceBackEffect.On : Laya.ScrollBounceBackEffect.Off;
            if (!canScroll) scroller.setPosY(0, false);
        }
        this.updateTabVisuals();
    };

    private handleListResize = (): void => {
        this.refresh(BagType.Main);
    };

    private getGridMetrics(): BagGridMetrics {
        const layout = this._itemList.layout;
        const padding = layout.padding || [0, 0, 0, 0];
        const viewWidth = this._itemList.width - (padding[1] || 0) - (padding[3] || 0);
        const viewHeight = this._itemList.height - (padding[0] || 0) - (padding[2] || 0);
        const itemWidth = layout.itemSize?.x || BagViewController.DEFAULT_ITEM_SIZE;
        const itemHeight = layout.itemSize?.y || BagViewController.DEFAULT_ITEM_SIZE;
        return calculateBagGridMetrics(
            viewWidth, viewHeight, itemWidth, itemHeight, layout.columnGap, layout.rowGap);
    }

    private selectTab(tab: BagTab): void {
        if (this._activeTab === tab) return;
        this._activeTab = tab;
        this._itemList.scroller?.setPosY(0, false);
        this.refresh(BagType.Main);
    }

    private renderItem = (index: number, item: Laya.GWidget): void => {
        item.mouseEnabled = false;
        const container = item.getChildByName("itemContainer") as Laya.GBox;
        this._itemViews.get(item)?.root.destroy();
        this._itemViews.delete(item);
        const renderToken = (this._itemRenderTokens.get(item) || 0) + 1;
        this._itemRenderTokens.set(item, renderToken);
        const data = this.toItemViewData(this._items[index] || undefined);
        if (!container) return;
        void this.loadItemView(item, container, data, renderToken);
    };

    private async loadItemView(item: Laya.GWidget, container: Laya.GBox,
                               data: ItemViewData | null, renderToken: number): Promise<void> {
        const token = this._loadToken;
        try {
            const prefab = await Laya.loader.load("ui/common/ItemView.lh") as Laya.Prefab;
            if (token !== this._loadToken || this._itemRenderTokens.get(item) !== renderToken || !prefab) return;
            const root = prefab.create() as Laya.GBox;
            if (!root) return;
            container.addChild(root);
            const itemView = new ItemViewController(root);
            if (data) itemView.setData(data);
            else itemView.clear();
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
            iconPath: info?.iconPath || BagViewController.DEFAULT_ICON,
            quantity: item.Count,
            quality: Math.min(5, Math.max(1, Number(info?.data.Quality) || 1)) as ItemViewData["quality"],
        };
    }

    private splitIntoStacks(item: BagItemData): BagItemData[] {
        const maxStack = ItemMgr.instance.getItem(item.ItemID)?.maxStack || 1;
        return splitBagItemStacks(item, maxStack);
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
