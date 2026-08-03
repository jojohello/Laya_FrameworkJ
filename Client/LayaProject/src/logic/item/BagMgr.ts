import { IManager } from "../core/IManager";
import { ItemMgr } from "./ItemMgr";
import { BagSnapshotData } from "./BagData";
import { BagInitData, BagSnapshot, BagType, isBagDelta, isBagInitData, isBagSnapshot, isBagSnapshotResponse } from "./BagPayloads.generated";
import { BagInfo } from "./BagInfo";
import { BagProtocol } from "./BagProtocol";
export type BagChangeListener = (bagType: BagType) => void;

interface BagRuntime {
    bag: BagInfo;
    version: bigint;
}

/** Public runtime entry point for the player bag. */
export class BagMgr implements IManager {
    private static _instance: BagMgr;
    static get instance(): BagMgr {
        if (!this._instance) this._instance = new BagMgr();
        return this._instance;
    }

    private readonly _bags = new Map<BagType, BagRuntime>();
    private readonly _changeListeners = new Set<BagChangeListener>();
    private _protocol: BagProtocol | null = null;
    private constructor() {}

    init(): void {
        this._protocol = new BagProtocol(this);
        this._protocol.init();
    }
    update(_dt: number): void {}
    reset(): void {
        const loadedTypes = Array.from(this._bags.keys());
        this._bags.clear();
        for (const type of loadedTypes) this.notifyChanged(type);
    }
    release(): void {
        this._protocol?.release();
        this._protocol = null;
        this.reset();
    }

    get capacity(): number { return this.getCapacity(); }
    get usedSlots(): number { return this.getUsedSlots(); }
    isLoaded(bagType: BagType = BagType.Main): boolean { return this._bags.has(bagType); }
    getCapacity(bagType: BagType = BagType.Main): number { return this._bags.get(bagType)?.bag.capacity ?? 0; }
    getUsedSlots(bagType: BagType = BagType.Main): number {
        return this._bags.get(bagType)?.bag.getUsedSlots(id => ItemMgr.instance.getItem(id)) ?? 0;
    }
    getCount(itemId: number, bagType: BagType = BagType.Main): number {
        return this._bags.get(bagType)?.bag.getCount(itemId) ?? 0;
    }
    hasItem(itemId: number, count: number = 1, bagType: BagType = BagType.Main): boolean {
        return this.getCount(itemId, bagType) >= BagMgr.normalizeCount(count);
    }

    getItems(bagType: BagType = BagType.Main) { return this._bags.get(bagType)?.bag.getItems() ?? []; }
    addChangeListener(listener: BagChangeListener): void { this._changeListeners.add(listener); }
    removeChangeListener(listener: BagChangeListener): void { this._changeListeners.delete(listener); }
    getSnapshot(bagType: BagType = BagType.Main): BagSnapshotData {
        return this._bags.get(bagType)?.bag.toSnapshot() ?? { Capacity: 0, Items: [] };
    }
    applyInit(value: unknown): boolean {
        if (!isBagInitData(value)) return this.rejectInit();
        const parsed = new Map<BagType, BagRuntime>();
        for (const snapshot of value.bags) {
            if (parsed.has(snapshot.bagType)) return this.rejectInit();
            const runtime = this.validateSnapshot(snapshot);
            if (!runtime) return this.rejectInit();
            parsed.set(snapshot.bagType, runtime);
        }
        if (!parsed.has(BagType.Main)) return this.rejectInit();
        const previousTypes = new Set(this._bags.keys());
        this._bags.clear();
        for (const [type, runtime] of parsed) this._bags.set(type, runtime);
        for (const type of parsed.keys()) this.notifyChanged(type);
        for (const type of previousTypes) if (!parsed.has(type)) this.notifyChanged(type);
        return true;
    }

    applySnapshot(snapshot: unknown): boolean {
        if (!isBagSnapshot(snapshot)) return false;
        const parsed = this.validateSnapshot(snapshot);
        if (!parsed) return false;
        this._bags.set(snapshot.bagType, parsed);
        this.notifyChanged(snapshot.bagType);
        return true;
    }

    applyDelta(value: unknown): boolean {
        if (!isBagDelta(value)) return this.rejectDelta(BagType.Main);
        const delta = value;
        const runtime = this._bags.get(delta.bagType);
        const baseVersion = BagMgr.parseVersion(delta.baseVersion);
        const nextVersion = BagMgr.parseVersion(delta.version);
        if (baseVersion === null || nextVersion === null) return this.rejectDelta(delta.bagType);
        if (runtime && nextVersion <= runtime.version) return true;
        if (!runtime || baseVersion !== runtime.version || nextVersion !== baseVersion + 1n) {
            return this.rejectDelta(delta.bagType);
        }

        const counts = new Map(runtime.bag.getItems().map(item => [item.ItemID, item.Count]));
        const seen = new Set<number>();
        for (const change of delta.changes) {
            if (!BagMgr.isPositiveInteger(change?.itemId) || seen.has(change.itemId)
                || !BagMgr.isSafeInteger(change?.delta) || change.delta === 0
                || !BagMgr.isNonNegativeSafeInteger(change?.count)) {
                return this.rejectDelta(delta.bagType);
            }
            seen.add(change.itemId);
            const oldCount = counts.get(change.itemId) || 0;
            if (oldCount + change.delta !== change.count) {
                return this.rejectDelta(delta.bagType);
            }
            if (change.count === 0) counts.delete(change.itemId);
            else counts.set(change.itemId, change.count);
        }
        if (seen.size === 0) {
            return this.rejectDelta(delta.bagType);
        }

        const parsed = this.validateSnapshot({
            bagType: delta.bagType,
            capacity: runtime.bag.capacity,
            version: nextVersion.toString(),
            items: Array.from(counts, ([itemId, count]) => ({ itemId, count }))
        });
        if (!parsed) {
            return this.rejectDelta(delta.bagType);
        }
        this._bags.set(delta.bagType, parsed);
        this.notifyChanged(delta.bagType);
        return true;
    }

    onSnapshotResponse(value: unknown): void {
        if (!isBagSnapshotResponse(value)) {
            console.warn("[BagMgr] malformed bag snapshot response");
            return;
        }
        const data = value;
        if (data?.success === true && data.snapshot && this.applySnapshot(data.snapshot)) return;
        console.warn(`[BagMgr] bag snapshot rejected, reason=${data?.reason || "invalid_payload"}`);
        if (data?.success === true && data.snapshot) this.requestSnapshot(data.snapshot.bagType);
    }

    requestSnapshot(bagType: BagType = BagType.Main): void {
        this._protocol?.requestSnapshot(bagType);
    }

    private rejectInit(): false {
        this.requestSnapshot(BagType.Main);
        return false;
    }
    private rejectDelta(bagType: BagType): false {
        this.requestSnapshot(bagType);
        return false;
    }
    private validateSnapshot(snapshot: BagSnapshot): BagRuntime | null {
        const version = BagMgr.parseVersion(snapshot?.version);
        if (version === null || !BagMgr.isPositiveInteger(snapshot?.capacity) || !Array.isArray(snapshot?.items)) return null;
        const seen = new Set<number>();
        const items = [];
        for (const item of snapshot.items) {
            if (!BagMgr.isPositiveInteger(item?.itemId) || seen.has(item.itemId)
                || !BagMgr.isPositiveSafeInteger(item?.count) || !ItemMgr.instance.getItem(item.itemId)) return null;
            seen.add(item.itemId);
            items.push({ ItemID: item.itemId, Count: item.count });
        }
        const data: BagSnapshotData = { Capacity: snapshot.capacity, Items: items };
        const candidate = new BagInfo();
        candidate.loadSnapshot(data);
        if (candidate.getUsedSlots(id => ItemMgr.instance.getItem(id)) > candidate.capacity) return null;
        return { version, bag: candidate };
    }

    private notifyChanged(bagType: BagType): void {
        for (const listener of this._changeListeners) listener(bagType);
    }
    private static parseVersion(value: unknown): bigint | null {
        return typeof value === "string" && /^(0|[1-9]\d*)$/.test(value) ? BigInt(value) : null;
    }
    private static isSafeInteger(value: unknown): value is number { return Number.isSafeInteger(value); }
    private static isPositiveInteger(value: unknown): value is number { return Number.isInteger(value) && Number(value) > 0; }
    private static isNonNegativeSafeInteger(value: unknown): value is number {
        return Number.isSafeInteger(value) && Number(value) >= 0;
    }
    private static isPositiveSafeInteger(value: unknown): value is number {
        return Number.isSafeInteger(value) && Number(value) > 0;
    }
    private static normalizeCount(value: number): number {
        return Math.max(1, Math.floor(Number(value) || 0));
    }
}
