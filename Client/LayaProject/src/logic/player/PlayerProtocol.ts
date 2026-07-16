import { LogicProtocol } from "../common/LogicProtocol";
import { MessageIds } from "../common/MessageIds";

export class PlayerProtocol extends LogicProtocol {
    constructor(private readonly _onLevelUp: (player: any) => void) {
        super();
    }

    protected register(): void {
        this.registerMessage(MessageIds.PLAYER_LEVEL_UP_RESPONSE, this.onLevelUp.bind(this));
    }

    requestLevelUp(): void {
        this.sendMessage(MessageIds.PLAYER_LEVEL_UP_REQUEST, {});
    }

    private onLevelUp(data: any): void {
        if (data?.success && data.player) {
            this._onLevelUp(data.player);
        }
    }
}
