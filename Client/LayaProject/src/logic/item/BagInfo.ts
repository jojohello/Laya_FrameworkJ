import { BagChangeData, BagItemData, BagSnapshotData } from "./BagData";
import { ItemInfo } from "./ItemInfo";

export type BagItemResolver = (itemId: number) => ItemInfo | null;

/** Runtime bag container. It owns counts and slot rules, not persistence or UI. */
export class BagInfo {
    private readonly _items: Map<number, number> = new Map();
    private _capacity: number;

    constructor(capacity: number = 40) {
        this._capacity = BagInfo.normalizeCapacity(capacity);
    }

    get capacity(): number { return this._capacity; }
    get itemCount(): number { return this._items.size; }

    setCapacity(capacity: number, resolver: BagItemResolver): boolean {
        const nextCapacity = BagInfo.normalizeCapacity(capacity);
        if (this.getUsedSlots(resolver) > nextCapacity) return false;
        this._capacity = nextCapacity;
        return true;
    }

    getCount(itemId: number): number { return this._items.get(itemId) || 0; }

    getItems(): BagItemData[] {
        return Array.from(this._items.entries()).map(([itemId, count]) => ({ ItemID: itemId, Count: count }));
    }

    getUsedSlots(resolver: BagItemResolver): number {
        let usedSlots = 0;
        for (const [itemId, count] of this._items) {
            const item = resolver(itemId);
            if (item && count > 0) usedSlots += Math.ceil(count / item.maxStack);
        }
        return usedSlots;
    }

    canAdd(item: ItemInfo, count: number, resolver: BagItemResolver): boolean {
        const addCount = BagInfo.normalizeCount(count);
        if (addCount <= 0) return false;
        const oldCount = this.getCount(item.id);
        const oldSlots = Math.ceil(oldCount / item.maxStack);
        const nextSlots = Math.ceil((oldCount + addCount) / item.maxStack);
        return this.getUsedSlots(resolver) - oldSlots + nextSlots <= this.capacity;
    }

    setCount(itemId: number, count: number): BagChangeData {
        const oldCount = this.getCount(itemId);
        const newCount = BagInfo.normalizeCount(count, true);
        if (newCount <= 0) this._items.delete(itemId);
        else this._items.set(itemId, newCount);
        return { ItemID: itemId, OldCount: oldCount, NewCount: newCount, Delta: newCount - oldCount, Reason: "" };
    }

    addCount(itemId: number, count: number): BagChangeData {
        return this.setCount(itemId, this.getCount(itemId) + BagInfo.normalizeCount(count));
    }

    removeCount(itemId: number, count: number): BagChangeData | null {
        const removeCount = BagInfo.normalizeCount(count);
        if (removeCount <= 0 || this.getCount(itemId) < removeCount) return null;
        return this.setCount(itemId, this.getCount(itemId) - removeCount);
    }

    clear(): void { this._items.clear(); }

    toSnapshot(): BagSnapshotData {
        return { Capacity: this.capacity, Items: this.getItems() };
    }

    loadSnapshot(snapshot: BagSnapshotData): void {
        this._capacity = BagInfo.normalizeCapacity(snapshot?.Capacity);
        this._items.clear();
        for (const item of snapshot?.Items || []) {
            const itemId = Math.floor(Number(item.ItemID) || 0);
            const count = BagInfo.normalizeCount(item.Count);
            if (itemId > 0 && count > 0) this._items.set(itemId, count);
        }
    }

    private static normalizeCapacity(value: number): number {
        return Math.max(1, Math.floor(Number(value) || 1));
    }

    private static normalizeCount(value: number, allowZero: boolean = false): number {
        const min = allowZero ? 0 : 0;
        return Math.max(min, Math.floor(Number(value) || 0));
    }
}
