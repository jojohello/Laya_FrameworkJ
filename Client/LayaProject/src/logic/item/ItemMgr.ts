import { ConfigMgr } from "../config/ConfigMgr";
import { IManager } from "../core/IManager";
import { ItemData, ItemCountData } from "./ItemData";
import { ItemInfo, ItemCountInfo } from "./ItemInfo";
import { ItemProtocol } from "./ItemProtocol";

export class ItemMgr implements IManager {
    private static _instance: ItemMgr;

    static get instance(): ItemMgr {
        if (!this._instance) this._instance = new ItemMgr();
        return this._instance;
    }

    private static readonly TABLE_ITEM = "Item";

    private readonly _configInfoCache: Map<number, ItemInfo> = new Map();
    private readonly _countInfoMap: Map<number, ItemCountInfo> = new Map();
    private _protocol: ItemProtocol | null = null;

    private constructor() {}

    init(): void {
        this._protocol = new ItemProtocol();
        this._protocol.register();
    }

    update(_dt: number): void {
    }

    reset(): void {
        this._countInfoMap.clear();
    }

    release(): void {
        if (this._protocol) {
            this._protocol.release();
            this._protocol = null;
        }
        this._configInfoCache.clear();
        this._countInfoMap.clear();
    }

    getItem(itemId: number): ItemInfo | null {
        const cached = this._configInfoCache.get(itemId);
        if (cached) return cached;

        const data = ConfigMgr.instance.getConfig<ItemData>(ItemMgr.TABLE_ITEM, itemId);
        if (!data) return null;

        const info = new ItemInfo(data);
        this._configInfoCache.set(itemId, info);
        return info;
    }

    getCount(itemId: number): number {
        return this._countInfoMap.get(itemId)?.count || 0;
    }

    hasItem(itemId: number, count: number = 1): boolean {
        return this.getCount(itemId) >= Math.max(1, Math.floor(Number(count) || 0));
    }

    addItem(itemId: number, count: number, reason: string = ""): boolean {
        if (!this.validateItemChange(itemId, count)) return false;

        const info = this.getOrCreateCountInfo(itemId);
        info.addCount(count);
        this.onItemChanged(itemId, info.count, count, reason);
        return true;
    }

    consumeItem(itemId: number, count: number, reason: string = ""): boolean {
        const consumeCount = Math.max(1, Math.floor(Number(count) || 0));
        if (!this.hasItem(itemId, consumeCount)) return false;

        const info = this.getOrCreateCountInfo(itemId);
        info.addCount(-consumeCount);
        if (info.count <= 0) {
            this._countInfoMap.delete(itemId);
        }

        this.onItemChanged(itemId, this.getCount(itemId), -consumeCount, reason);
        return true;
    }

    setItemCount(itemId: number, count: number, reason: string = ""): boolean {
        if (!this.getItem(itemId)) return false;

        const nextCount = Math.max(0, Math.floor(Number(count) || 0));
        const oldCount = this.getCount(itemId);
        if (nextCount <= 0) {
            this._countInfoMap.delete(itemId);
            this.onItemChanged(itemId, 0, -oldCount, reason);
            return true;
        }

        const info = this.getOrCreateCountInfo(itemId);
        info.setCount(nextCount);
        this.onItemChanged(itemId, info.count, info.count - oldCount, reason);
        return true;
    }

    getAllItems(): ItemCountInfo[] {
        return Array.from(this._countInfoMap.values()).filter(info => info.count > 0);
    }

    private validateItemChange(itemId: number, count: number): boolean {
        if (!this.getItem(itemId)) return false;
        return Math.floor(Number(count) || 0) > 0;
    }

    private getOrCreateCountInfo(itemId: number): ItemCountInfo {
        let info = this._countInfoMap.get(itemId);
        if (!info) {
            const data: ItemCountData = {
                ItemID: itemId,
                Count: 0,
            };
            info = new ItemCountInfo(data);
            this._countInfoMap.set(itemId, info);
        }
        return info;
    }

    private onItemChanged(itemId: number, count: number, delta: number, reason: string): void {
        console.log(`[ItemMgr] item changed itemId=${itemId}, count=${count}, delta=${delta}, reason=${reason}`);
    }
}
