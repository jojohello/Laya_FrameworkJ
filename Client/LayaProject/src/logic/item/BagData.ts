/** Internal primitive view model retained for the existing UI. */
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
