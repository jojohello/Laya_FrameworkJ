import { IManager } from "../core/IManager";
import { PlayerInitData } from "../init/GameInitData";
import { PlayerProtocol } from "./PlayerProtocol";

export class PlayerMgr implements IManager {
    private static _instance: PlayerMgr;
    static get instance(): PlayerMgr {
        if (!this._instance) this._instance = new PlayerMgr();
        return this._instance;
    }
    private _data: PlayerInitData | null = null;
    private _protocol: PlayerProtocol | null = null;
    private readonly _listeners = new Set<(data: PlayerInitData) => void>();
    private constructor() {}
    init(): void {
        this._protocol = new PlayerProtocol((player) => {
            this.applyInit(player);
        });
        this._protocol.init();
    }
    update(_dt: number): void {}
    reset(): void { this._data = null; }
    release(): void { this._protocol?.release(); this._protocol = null; this._data = null; this._listeners.clear(); }
    applyInit(data: PlayerInitData): void {
        if (!data?.playerId) return;
        this._data = { ...data };
        this.notifyChanged();
    }
    levelUp(): void { this._protocol?.requestLevelUp(); }
    addListener(listener: (data: PlayerInitData) => void): void { this._listeners.add(listener); }
    removeListener(listener: (data: PlayerInitData) => void): void { this._listeners.delete(listener); }
    notifyChanged(): void { if (this._data) for (const listener of this._listeners) listener(this._data); }
    get data(): PlayerInitData | null { return this._data; }
}
