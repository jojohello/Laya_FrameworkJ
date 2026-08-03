import { BagMgr } from "../../src/logic/item/BagMgr";
import { ItemMgr } from "../../src/logic/item/ItemMgr";
import { BagType, isBagSnapshotResponse } from "../../src/logic/item/BagPayloads.generated";
import {
    calculateBagGridMetrics,
    calculateBagSlotCount,
    splitBagItemStacks,
} from "../../src/logic/item/BagViewController";

declare const require: (name: string) => any;
declare const process: { argv: string[] };

const fs = require("fs");
const path = require("path");

function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(`[BagSync.test] ${message}`);
}

const originalGetItem = ItemMgr.instance.getItem.bind(ItemMgr.instance);
(ItemMgr.instance as any).getItem = (itemId: number) =>
    itemId === 1001 || itemId === 1002 ? { id: itemId, maxStack: 10 } : null;

try {
    const gemStacks = splitBagItemStacks({ ItemID: 1101, Count: 23 }, 10);
    assert(gemStacks.map(item => item.Count).join(",") === "10,10,3", "visual stack splitting must honor MaxStack");
    const grid = calculateBagGridMetrics(608, 715, 112, 112, 12, 18);
    assert(grid.columnCount === 5 && grid.rowCount === 5 && grid.visibleSlotCount === 25,
        "bag viewport must derive a five-by-five visible grid from its current dimensions");
    const shorterGrid = calculateBagGridMetrics(608, 585, 112, 112, 12, 18);
    assert(shorterGrid.columnCount === 5 && shorterGrid.rowCount === 4,
        "visible rows must adapt when the list height changes");
    assert(calculateBagSlotCount(0, grid.visibleSlotCount, grid.columnCount) === 25
        && calculateBagSlotCount(25, grid.visibleSlotCount, grid.columnCount) === 25,
        "empty and one-page bags must render exactly 25 slots");
    assert(calculateBagSlotCount(26, grid.visibleSlotCount, grid.columnCount) === 30,
        "overflow must add a complete visible row");

    const fixtureRoot = process.argv[2];
    const snapshotResponse = JSON.parse(fs.readFileSync(path.join(fixtureRoot, "snapshot-response.json"), "utf8"));
    const canonicalDelta = JSON.parse(fs.readFileSync(path.join(fixtureRoot, "delta.json"), "utf8"));
    const errorResponse = JSON.parse(fs.readFileSync(path.join(fixtureRoot, "error-response.json"), "utf8"));
    const initData = JSON.parse(fs.readFileSync(path.join(fixtureRoot, "init-data.json"), "utf8"));
    assert(isBagSnapshotResponse(snapshotResponse), "generated guard must accept snapshot fixture");
    assert(isBagSnapshotResponse(errorResponse), "generated guard must accept error fixture");
    assert(!isBagSnapshotResponse({ success: false }), "failure response must require reason");
    assert(!isBagSnapshotResponse({ success: true, snapshot: snapshotResponse.snapshot, reason: "unexpected" }),
        "success response must reject failure reason");
    const bag = BagMgr.instance;
    bag.reset();
    assert(bag.applyInit(initData), "login init fixture must apply atomically");
    assert(bag.isLoaded(BagType.Main) && !bag.isLoaded(BagType.Warehouse), "login eagerly loads main bag only");
    assert(bag.applySnapshot(snapshotResponse.snapshot), "canonical snapshot fixture must apply");
    assert(bag.getCount(1001) === 3 && bag.usedSlots === 3, "snapshot state");

    assert(bag.applySnapshot({
        bagType: BagType.Main,
        capacity: 2,
        version: "7",
        items: [{ itemId: 1001, count: 11 }]
    }), "eleven items with max stack ten must fit exactly two slots");
    assert(bag.usedSlots === 2, "max-stack slot calculation");
    assert(bag.applySnapshot(snapshotResponse.snapshot), "canonical snapshot must restore test state");

    assert(bag.applyDelta(canonicalDelta), "canonical delta fixture must apply");
    assert(bag.getCount(1001) === 5 && bag.getCount(1002) === 0, "delta state");

    assert(bag.applyDelta({
        bagType: BagType.Main,
        baseVersion: "7",
        version: "8",
        changes: [{ itemId: 1001, delta: 2, count: 5 }]
    }), "duplicate delta must be ignored");
    assert(bag.getCount(1001) === 5, "duplicate must not mutate state");

    assert(!bag.applyDelta({
        bagType: BagType.Main,
        baseVersion: "9",
        version: "10",
        changes: [{ itemId: 1001, delta: 1, count: 6 }]
    }), "version gap must be rejected");
    assert(bag.getCount(1001) === 5, "version gap must not mutate state");

    assert(!bag.applySnapshot({
        bagType: BagType.Main,
        capacity: 1,
        version: "11",
        items: [{ itemId: 1001, count: 11 }]
    }), "over-capacity snapshot must be rejected atomically");
    assert(bag.getCount(1001) === 5, "invalid snapshot must preserve state");

    assert(bag.applySnapshot({
        bagType: BagType.Warehouse,
        capacity: 200,
        version: "2",
        items: [{ itemId: 1002, count: 4 }]
    }), "warehouse snapshot must create an independent container");
    assert(bag.getCount(1002, BagType.Warehouse) === 4, "warehouse state");
    assert(bag.getCount(1002, BagType.Main) === 0 && bag.getCount(1001, BagType.Main) === 5,
        "warehouse update must not mutate main bag");
} finally {
    (ItemMgr.instance as any).getItem = originalGetItem;
    BagMgr.instance.reset();
}

console.log("[BagSync.test] PASS");
