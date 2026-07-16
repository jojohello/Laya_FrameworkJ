import { IManager } from "../core/IManager";
import { ItemMgr } from "./ItemMgr";
import { BagChangeData, BagSnapshotData } from "./BagData";
import { BagInfo } from "./BagInfo";
import { BagProtocol } from "./BagProtocol";
import { BagInitData } from "../init/GameInitData";

/** Public runtime entry point for the player bag. */
export class BagMgr implements IManager {
    private static _instance: BagMgr;
    static get instance(): BagMgr {
        if (!this._instance) this._instance = new BagMgr();
        return this._instance;
    }

    private readonly _bag = new BagInfo();
    private _protocol: BagProtocol | null = null;
    private constructor() {}

    init(): void {
        this._protocol = new BagProtocol();
        this._protocol.register();
    }
    update(_dt: number): void {}
    reset(): void { this._bag.clear(); }
    release(): void {
        this._protocol?.release();
        this._protocol = null;
        this._bag.clear();
    }

    get capacity(): number { return this._bag.capacity; }
    get usedSlots(): number { return this._bag.getUsedSlots(id => ItemMgr.instance.getItem(id)); }
    getCount(itemId: number): number { return this._bag.getCount(itemId); }
    hasItem(itemId: number, count: number = 1): boolean { return this.getCount(itemId) >= BagMgr.normalizeCount(count); }

    addItem(itemId: number, count: number, reason: string = ""): boolean {
        const item = ItemMgr.instance.getItem(itemId);
        const addCount = BagMgr.normalizeCount(count);
        if (!item || !this._bag.canAdd(item, addCount, id => ItemMgr.instance.getItem(id))) return false;
        this.emitChange(this._bag.addCount(itemId, addCount), reason);
        return true;
    }

    removeItem(itemId: number, count: number, reason: string = ""): boolean {
        const change = this._bag.removeCount(itemId, count);
        if (!change) return false;
        this.emitChange(change, reason);
        return true;
    }

    setItemCount(itemId: number, count: number, reason: string = ""): boolean {
        const item = ItemMgr.instance.getItem(itemId);
        const nextCount = BagMgr.normalizeCount(count, true);
        const oldCount = this.getCount(itemId);
        if (!item || (nextCount > oldCount && !this._bag.canAdd(item, nextCount - oldCount, id => ItemMgr.instance.getItem(id)))) return false;
        this.emitChange(this._bag.setCount(itemId, nextCount), reason);
        return true;
    }

    getItems() { return this._bag.getItems(); }
    getSnapshot(): BagSnapshotData { return this._bag.toSnapshot(); }
    loadSnapshot(snapshot: BagSnapshotData): boolean {
        if (!snapshot) return false;
        this._bag.loadSnapshot(snapshot);
        return this.usedSlots <= this.capacity;
    }
    applyInit(data: BagInitData): boolean {
        return this.loadSnapshot({
            Capacity: data?.capacity ?? 40,
            Items: (data?.items || []).map(item => ({ ItemID: item.itemId, Count: item.count }))
        });
    }
    setCapacity(capacity: number): boolean { return this._bag.setCapacity(capacity, id => ItemMgr.instance.getItem(id)); }

    private emitChange(change: BagChangeData, reason: string): void {
        console.log(`[BagMgr] item changed itemId=${change.ItemID}, count=${change.NewCount}, delta=${change.Delta}, reason=${reason}`);
    }
    private static normalizeCount(value: number, allowZero: boolean = false): number {
        return Math.max(allowZero ? 0 : 1, Math.floor(Number(value) || 0));
    }
}
