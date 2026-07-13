/**
 * Item module primitive data.
 */

export interface ItemData {
    ID: number;
    Name: string;
    Type: string;
    Quality: number;
    MaxStack: number;
    UseAction: string;
    Desc: string;
}

export interface ItemCountData {
    ItemID: number;
    Count: number;
}
