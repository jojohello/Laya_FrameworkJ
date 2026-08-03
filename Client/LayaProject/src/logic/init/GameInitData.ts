import { IntegerString } from "../common/ExactInteger";
import type { BagInitData } from "../item/BagPayloads.generated";

export interface PlayerInitData {
    playerId: string;
    name: string;
    level: number;
    exp: IntegerString;
    stamina: number;
}

export interface WalletInitData {
    balances: Record<string, IntegerString>;
}

export interface GameInitData {
    snapshotVersion: number;
    sections: {
        player?: PlayerInitData;
        wallet?: WalletInitData;
        bag?: BagInitData;
        functionOpen?: { states: Array<{ id: number; opened: boolean; openedAt?: number; version?: number }> };
        guide?: import("../guide/GuideTypes").GuideInitData;
    };
    errors?: string[];
}
