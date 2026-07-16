import { LogicProtocol } from "../common/LogicProtocol";
import { MessageIds } from "../common/MessageIds";
import { FunctionOpenMgr } from "./FunctionOpenMgr";
import { PlayerMgr } from "../player/PlayerMgr";
import { WalletMgr } from "../wallet/WalletMgr";
import { BagMgr } from "../item/BagMgr";
import { GameInitData } from "../init/GameInitData";
import { GuideMgr } from "../guide/GuideMgr";

export class FunctionOpenProtocol extends LogicProtocol {
    public requestFullState(): void {
        this.sendMessage(MessageIds.GAME_INIT_REQUEST, {});
    }

    protected register(): void {
        this.registerMessage(MessageIds.GAME_INIT_RESPONSE, this.onGameInit.bind(this));
        this.registerMessage(MessageIds.FUNCTION_OPEN_STATES, this.onStates.bind(this));
        this.registerMessage(MessageIds.FUNCTION_OPEN_PUSH, this.onOpened.bind(this));
    }

    private onStates(data: any): void {
        const states = Array.isArray(data) ? data : data?.functionOpenStates;
        if (Array.isArray(states)) {
            FunctionOpenMgr.instance.refreshAll(states);
        }
    }

    private onGameInit(data: any): void {
        const init = data as GameInitData;
        if (init?.sections?.player) PlayerMgr.instance.applyInit(init.sections.player);
        if (init?.sections?.wallet) WalletMgr.instance.applyInit(init.sections.wallet);
        if (init?.sections?.bag) BagMgr.instance.applyInit(init.sections.bag);
        if (init?.sections?.guide) GuideMgr.instance.applyInit(init.sections.guide);
        const states = data?.sections?.functionOpen?.states;
        if (Array.isArray(states)) {
            FunctionOpenMgr.instance.refreshAll(states, Number(data?.snapshotVersion) || undefined);
        }
    }

    private onOpened(data: any): void {
        const state = data?.state ?? data;
        if (state && typeof state.id === "number") {
            FunctionOpenMgr.instance.applyOpened(state);
        }
    }
}
