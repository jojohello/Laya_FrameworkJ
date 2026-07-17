import { IManager } from "../core/IManager";
import { WalletInitData } from "../init/GameInitData";
import { normalizeNonNegativeInteger, toNonNegativeBigInt } from "../common/ExactInteger";

export class WalletMgr implements IManager {
    private static _instance: WalletMgr;
    static get instance(): WalletMgr {
        if (!this._instance) this._instance = new WalletMgr();
        return this._instance;
    }
    private readonly _balances = new Map<number, bigint>();
    private readonly _listeners = new Set<() => void>();
    private constructor() {}
    init(): void {}
    update(_dt: number): void {}
    reset(): void { this._balances.clear(); }
    release(): void { this._balances.clear(); this._listeners.clear(); }
    applyInit(data: WalletInitData): void {
        this._balances.clear();
        for (const [id, balance] of Object.entries(data?.balances || {})) {
            const currencyId = Number(id);
            if (Number.isInteger(currencyId) && currencyId > 0) {
                this._balances.set(currencyId, toNonNegativeBigInt(normalizeNonNegativeInteger(balance)));
            }
        }
        this.notifyChanged();
    }
    addListener(listener: () => void): void { this._listeners.add(listener); }
    removeListener(listener: () => void): void { this._listeners.delete(listener); }
    getBalance(currencyItemId: number): bigint { return this._balances.get(currencyItemId) || 0n; }
    private notifyChanged(): void { for (const listener of this._listeners) listener(); }
}
