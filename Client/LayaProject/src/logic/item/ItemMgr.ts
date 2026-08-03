import { ConfigMgr } from "../config/ConfigMgr";
import { IManager } from "../core/IManager";
import { ItemData } from "./ItemData";
import { ItemInfo } from "./ItemInfo";
import { ItemProtocol } from "./ItemProtocol";

export class ItemMgr implements IManager {
    private static _instance: ItemMgr;

    static get instance(): ItemMgr {
        if (!this._instance) this._instance = new ItemMgr();
        return this._instance;
    }

    private static readonly TABLE_ITEM = "Item";

    private readonly _configInfoCache: Map<number, ItemInfo> = new Map();
    private _protocol: ItemProtocol | null = null;

    private constructor() {}

    init(): void {
        this._protocol = new ItemProtocol();
        this._protocol.register();
    }

    update(_dt: number): void {
    }

    reset(): void {
    }

    release(): void {
        if (this._protocol) {
            this._protocol.release();
            this._protocol = null;
        }
        this._configInfoCache.clear();
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

}
