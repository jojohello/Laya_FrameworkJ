/** Generated from Protocol/contracts/bag/schema.json. Do not edit. */

function isRecord(value: unknown): value is Record<string, any> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, any>, keys: readonly string[]): boolean {
    return Object.keys(value).every(key => keys.includes(key));
}

export enum BagType {
    Main = "main",
    Warehouse = "warehouse",
}

export function isBagType(value: unknown): value is BagType {
    return typeof value === "string" && ["main","warehouse"].includes(value);
}

export interface BagSnapshotRequest {
    bagType: BagType;
}

export function isBagSnapshotRequest(value: unknown): value is BagSnapshotRequest {
    return isRecord(value)
        && hasOnlyKeys(value, ["bagType"])
        && isBagType(value.bagType);
}

export interface BagItem {
    itemId: number;
    count: number;
}

export function isBagItem(value: unknown): value is BagItem {
    return isRecord(value)
        && hasOnlyKeys(value, ["itemId","count"])
        && Number.isSafeInteger(value.itemId) && value.itemId >= 1 && value.itemId <= 2147483647
        && Number.isSafeInteger(value.count) && value.count >= 1 && value.count <= 9007199254740991;
}

export interface BagSnapshot {
    bagType: BagType;
    capacity: number;
    version: string;
    items: BagItem[];
}

export function isBagSnapshot(value: unknown): value is BagSnapshot {
    return isRecord(value)
        && hasOnlyKeys(value, ["bagType","capacity","version","items"])
        && isBagType(value.bagType)
        && Number.isSafeInteger(value.capacity) && value.capacity >= 1 && value.capacity <= 2147483647
        && typeof value.version === "string" && new RegExp("^(0|[1-9]\\d*)$").test(value.version)
        && Array.isArray(value.items) && value.items.every(item => isBagItem(item));
}

export interface BagChange {
    itemId: number;
    delta: number;
    count: number;
}

export function isBagChange(value: unknown): value is BagChange {
    return isRecord(value)
        && hasOnlyKeys(value, ["itemId","delta","count"])
        && Number.isSafeInteger(value.itemId) && value.itemId >= 1 && value.itemId <= 2147483647
        && Number.isSafeInteger(value.delta) && value.delta >= -9007199254740991 && value.delta <= 9007199254740991 && value.delta !== 0
        && Number.isSafeInteger(value.count) && value.count >= 0 && value.count <= 9007199254740991;
}

export interface BagDelta {
    bagType: BagType;
    baseVersion: string;
    version: string;
    changes: BagChange[];
}

export function isBagDelta(value: unknown): value is BagDelta {
    return isRecord(value)
        && hasOnlyKeys(value, ["bagType","baseVersion","version","changes"])
        && isBagType(value.bagType)
        && typeof value.baseVersion === "string" && new RegExp("^(0|[1-9]\\d*)$").test(value.baseVersion)
        && typeof value.version === "string" && new RegExp("^(0|[1-9]\\d*)$").test(value.version)
        && Array.isArray(value.changes) && value.changes.length >= 1 && value.changes.every(item => isBagChange(item));
}

export interface BagSnapshotResponse {
    success: boolean;
    snapshot?: BagSnapshot;
    reason?: string;
}

export function isBagSnapshotResponse(value: unknown): value is BagSnapshotResponse {
    return isRecord(value)
        && hasOnlyKeys(value, ["success","snapshot","reason"])
        && typeof value.success === "boolean"
        && (value.snapshot === undefined || (isBagSnapshot(value.snapshot)))
        && (value.reason === undefined || (typeof value.reason === "string" && value.reason.length >= 1))
        && (value.success !== true || (value.snapshot !== undefined && value.reason === undefined))
        && (value.success !== false || (value.reason !== undefined && value.snapshot === undefined));
}

export interface BagInitData {
    bags: BagSnapshot[];
}

export function isBagInitData(value: unknown): value is BagInitData {
    return isRecord(value)
        && hasOnlyKeys(value, ["bags"])
        && Array.isArray(value.bags) && value.bags.length >= 1 && value.bags.every(item => isBagSnapshot(item));
}

