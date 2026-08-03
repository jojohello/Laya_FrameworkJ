import { LogicProtocol } from "../common/LogicProtocol";
import { MessageIds } from "../common/MessageIds";
import type { BagMgr } from "./BagMgr";
import { BagType } from "./BagPayloads.generated";

/** Network boundary for the server-authoritative bag snapshot contract. */
export class BagProtocol extends LogicProtocol {
    constructor(private readonly owner: BagMgr) { super(); }

    protected register(): void {
        this.registerMessage(MessageIds.BAG_SNAPSHOT_RESPONSE,
            this.owner.onSnapshotResponse.bind(this.owner));
    }

    requestSnapshot(bagType: BagType): void {
        this.sendMessage(MessageIds.BAG_SNAPSHOT_REQUEST, { bagType });
    }
}
