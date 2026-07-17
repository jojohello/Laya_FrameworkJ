import { IntegerString } from "../common/ExactInteger";

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

export interface BagInitData {
    capacity: number;
    items: Array<{ itemId: number; count: number }>;
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
