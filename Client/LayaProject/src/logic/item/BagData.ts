/** Bag data structures kept primitive for network and persistence use. */
export interface BagItemData {
    ItemID: number;
    Count: number;
}

export interface BagSnapshotData {
    Capacity: number;
    Items: BagItemData[];
}

export interface BagChangeData {
    ItemID: number;
    OldCount: number;
    NewCount: number;
    Delta: number;
    Reason: string;
}
