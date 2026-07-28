import { IManager } from "../core/IManager";
import { LogicProtocol } from "../common/LogicProtocol";
import { MessageIds } from "../common/MessageIds";
import { WalletMgr } from "../wallet/WalletMgr";
import { WalletInitData } from "../init/GameInitData";

export interface BattleRewardData {
    itemId: number;
    quantity: number;
}

export interface BattleEnterResult {
    success: boolean;
    battleSessionId?: string;
    stageId?: number;
    reason?: string;
}

export interface BattleCompleteResult {
    success: boolean;
    victory: boolean;
    rewarded: boolean;
    rewards: BattleRewardData[];
    reason?: string;
}

/** Bridges the battle scene to the server-owned battle-session settlement contract. */
export class BattleSettlementMgr implements IManager {
    private static _instance: BattleSettlementMgr;
    static get instance(): BattleSettlementMgr {
        if (!this._instance) this._instance = new BattleSettlementMgr();
        return this._instance;
    }

    private _protocol: BattleSettlementProtocol | null = null;
    private _enterResolve: ((result: BattleEnterResult) => void) | null = null;
    private _completeResolve: ((result: BattleCompleteResult) => void) | null = null;
    private constructor() {}

    init(): void {
        this._protocol = new BattleSettlementProtocol(this);
        this._protocol.init();
    }
    update(_dt: number): void {}
    reset(): void { this.resolvePendingAsFailed("reset"); }
    release(): void {
        this.resolvePendingAsFailed("released");
        this._protocol?.release();
        this._protocol = null;
    }

    requestEnter(stageId: number): Promise<BattleEnterResult> {
        if (!this._protocol || this._enterResolve) return Promise.resolve({ success: false, reason: "battle_enter_busy" });
        if (!(Laya.Browser.window as any).networkManager?.connected) {
            return Promise.resolve({ success: false, reason: "network_not_connected" });
        }
        return new Promise(resolve => {
            this._enterResolve = resolve;
            this._protocol!.sendEnter(stageId);
        });
    }

    requestComplete(battleSessionId: string, result: "victory" | "defeat"): Promise<BattleCompleteResult> {
        if (!this._protocol || this._completeResolve || !battleSessionId) {
            return Promise.resolve({ success: false, victory: false, rewarded: false, rewards: [], reason: "battle_complete_invalid" });
        }
        if (!(Laya.Browser.window as any).networkManager?.connected) {
            return Promise.resolve({ success: false, victory: false, rewarded: false, rewards: [], reason: "network_not_connected" });
        }
        return new Promise(resolve => {
            this._completeResolve = resolve;
            this._protocol!.sendComplete(battleSessionId, result);
        });
    }

    onEnterResponse(data: any): void {
        const resolve = this._enterResolve;
        this._enterResolve = null;
        resolve?.({
            success: data?.success === true,
            battleSessionId: typeof data?.battleSessionId === "string" ? data.battleSessionId : undefined,
            stageId: Number.isInteger(data?.stageId) ? data.stageId : undefined,
            reason: typeof data?.reason === "string" ? data.reason : undefined,
        });
    }

    onCompleteResponse(data: any): void {
        const resolve = this._completeResolve;
        this._completeResolve = null;
        if (data?.wallet) WalletMgr.instance.applyInit(data.wallet as WalletInitData);
        const rewards = Array.isArray(data?.rewards)
            ? data.rewards.map((reward: any) => ({
                itemId: Math.max(0, Math.floor(Number(reward?.itemId) || 0)),
                quantity: Math.max(0, Math.floor(Number(reward?.quantity) || 0)),
            })).filter((reward: BattleRewardData) => reward.itemId > 0 && reward.quantity > 0)
            : [];
        resolve?.({
            success: data?.success === true,
            victory: data?.victory === true,
            rewarded: data?.rewarded === true,
            rewards,
            reason: typeof data?.reason === "string" ? data.reason : undefined,
        });
    }

    private resolvePendingAsFailed(reason: string): void {
        const enter = this._enterResolve;
        this._enterResolve = null;
        enter?.({ success: false, reason });
        const complete = this._completeResolve;
        this._completeResolve = null;
        complete?.({ success: false, victory: false, rewarded: false, rewards: [], reason });
    }
}

class BattleSettlementProtocol extends LogicProtocol {
    constructor(private readonly owner: BattleSettlementMgr) { super(); }
    protected register(): void {
        this.registerMessage(MessageIds.BATTLE_ENTER_RESPONSE, this.owner.onEnterResponse.bind(this.owner));
        this.registerMessage(MessageIds.BATTLE_COMPLETE_RESPONSE, this.owner.onCompleteResponse.bind(this.owner));
    }
    sendEnter(stageId: number): void { this.sendMessage(MessageIds.BATTLE_ENTER_REQUEST, { stageId }); }
    sendComplete(battleSessionId: string, result: "victory" | "defeat"): void {
        this.sendMessage(MessageIds.BATTLE_COMPLETE_REQUEST, { battleSessionId, result });
    }
}
